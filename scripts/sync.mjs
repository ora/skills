// Mirrors two kinds of published skill into skills/<name>/, and records what
// it wrote in mirror.json so validate.mjs can reject hand edits:
//
// - the skills ora.ai publishes at /.well-known/agent-skills/ (`source`). They
//   are generated from ora's check registry, so ora.ai stays the source of
//   truth: every file is written byte-for-byte after its sha256 matches the
//   published index digest.
// - the skills an Ora product hands out at its own door (`products`): a list at
//   <door> and each skill's files at <door>/<name>, written as served, with
//   each file's sha256. The product's repository is their source of truth.
//
// Usage: npm run sync

import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { MIRROR_PATH, NAME_PATTERN, SKILLS_DIR, parseSkill, productSkillsOf, readMirror, sha256 } from "./lib.mjs";

const mirror = readMirror();
const indexUrl = new URL(mirror.source);

async function fetchText(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

function handWrittenSkills() {
  const productSkills = productSkillsOf(mirror);
  return new Set(
    readdirSync(SKILLS_DIR, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !(entry.name in mirror.skills) && !(entry.name in productSkills))
      .map((entry) => entry.name),
  );
}

/** A file path a product hands out stays inside its skill: no absolute path, no `..`, no NUL. */
const safePath = (path) => typeof path === "string" && path !== "" && !path.startsWith("/") && !path.includes("\\") && !path.includes("\0") && !path.split("/").includes("..");

function warn(message) {
  console.log(process.env.GITHUB_ACTIONS ? `::warning::${message}` : `warning: ${message}`);
}

const index = JSON.parse((await fetchText(indexUrl)).toString("utf8"));
if (!Array.isArray(index.skills)) throw new Error(`${indexUrl} has no skills[] array`);

const handWritten = handWrittenSkills();
const next = {};

for (const entry of index.skills) {
  const { name, digest } = entry;
  if (typeof name !== "string" || !NAME_PATTERN.test(name) || name.length > 64) {
    warn(`skipping index entry with invalid name ${JSON.stringify(name)}`);
    continue;
  }
  if (handWritten.has(name)) {
    warn(`skipping ${name}: a hand-written skill already owns skills/${name}/`);
    continue;
  }
  // A skipped skill keeps its last verified copy rather than disappearing.
  const keepPrevious = (reason) => {
    warn(`skipping ${name}: ${reason}`);
    if (mirror.skills[name]) next[name] = mirror.skills[name];
  };

  const url = new URL(entry.url, indexUrl);
  if (url.origin !== indexUrl.origin) {
    keepPrevious(`${url} is outside ${indexUrl.origin}`);
    continue;
  }

  const bytes = await fetchText(url);
  const actual = sha256(bytes);
  if (actual !== digest) {
    keepPrevious(`digest mismatch (index ${digest}, served ${actual})`);
    continue;
  }

  try {
    const { frontmatter } = parseSkill(bytes.toString("utf8"));
    if (frontmatter.name !== name) throw new Error(`frontmatter name is ${JSON.stringify(frontmatter.name)}`);
  } catch (error) {
    keepPrevious(`SKILL.md does not parse as strict YAML (${error.message})`);
    continue;
  }

  const dir = `${SKILLS_DIR}/${name}`;
  mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}/SKILL.md`, bytes);
  next[name] = { url: url.href, digest };
  console.log(`${mirror.skills[name]?.digest === digest ? "unchanged" : "updated"} ${name}`);
}

for (const name of Object.keys(mirror.skills)) {
  if (name in next) continue;
  const dir = `${SKILLS_DIR}/${name}`;
  if (existsSync(dir)) rmSync(dir, { recursive: true });
  console.log(`removed ${name} (no longer published)`);
}

/**
 * One product's door: every skill it lists, each written as served. A door that does not answer keeps the copies it
 * last handed out, so an outage never empties the repo; a skill it stops listing is removed.
 */
async function syncProductDoor(door, previous) {
  let listed;
  try {
    listed = JSON.parse((await fetchText(door)).toString("utf8"));
    if (!Array.isArray(listed.skills)) throw new Error("no skills[] array");
  } catch (error) {
    warn(`keeping what ${door} handed out last: ${error.message}`);
    return previous;
  }
  const kept = {};
  for (const { name } of listed.skills) {
    if (typeof name !== "string" || !NAME_PATTERN.test(name) || name.length > 64) {
      warn(`skipping ${door} entry with invalid name ${JSON.stringify(name)}`);
      continue;
    }
    if (handWritten.has(name) || name in next) {
      warn(`skipping ${name}: another source already owns skills/${name}/`);
      continue;
    }
    const keepPrevious = (reason) => {
      warn(`skipping ${name}: ${reason}`);
      if (previous[name]) kept[name] = previous[name];
    };
    let skill;
    try {
      skill = JSON.parse((await fetchText(`${door}/${encodeURIComponent(name)}`)).toString("utf8"));
    } catch (error) {
      keepPrevious(error.message);
      continue;
    }
    const files = Array.isArray(skill.files) ? skill.files : [];
    const unsafe = files.find((file) => !safePath(file?.path) || typeof file?.content !== "string");
    const entry = files.find((file) => file.path === "SKILL.md");
    if (unsafe || !entry) {
      keepPrevious(unsafe ? `unsafe file ${JSON.stringify(unsafe?.path)}` : "no SKILL.md");
      continue;
    }
    try {
      const { frontmatter } = parseSkill(entry.content);
      if (frontmatter.name !== name) throw new Error(`frontmatter name is ${JSON.stringify(frontmatter.name)}`);
    } catch (error) {
      keepPrevious(`SKILL.md does not parse as strict YAML (${error.message})`);
      continue;
    }
    const dir = `${SKILLS_DIR}/${name}`;
    rmSync(dir, { recursive: true, force: true });
    for (const file of files) {
      mkdirSync(dirname(`${dir}/${file.path}`), { recursive: true });
      writeFileSync(`${dir}/${file.path}`, file.content);
    }
    const digests = Object.fromEntries(files.map((file) => [file.path, sha256(Buffer.from(file.content, "utf8"))]).sort(([a], [b]) => (a < b ? -1 : 1)));
    kept[name] = { version: skill.version ?? null, files: digests };
    const changed = JSON.stringify(previous[name]?.files) !== JSON.stringify(digests);
    console.log(`${changed ? "updated" : "unchanged"} ${name} (${door})`);
  }
  for (const name of Object.keys(previous)) {
    if (name in kept) continue;
    rmSync(`${SKILLS_DIR}/${name}`, { recursive: true, force: true });
    console.log(`removed ${name} (no longer handed out by ${door})`);
  }
  return kept;
}

const products = {};
for (const [door, previous] of Object.entries(mirror.products ?? {})) products[door] = await syncProductDoor(door, previous ?? {});

writeFileSync(MIRROR_PATH, JSON.stringify({ ...mirror, skills: next, ...(mirror.products ? { products } : {}) }, null, 2) + "\n");
