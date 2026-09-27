// Mirrors the skills ora.ai publishes at /.well-known/agent-skills/ into
// skills/<name>/. Those skills are generated from ora's check registry, so
// ora.ai stays the source of truth: every file is written byte-for-byte after
// its sha256 matches the published index digest, and mirror.json records the
// digest so validate.mjs can reject hand edits.
//
// Usage: npm run sync

import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { MIRROR_PATH, NAME_PATTERN, SKILLS_DIR, parseSkill, readMirror, sha256 } from "./lib.mjs";

const mirror = readMirror();
const indexUrl = new URL(mirror.source);

async function fetchText(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

function handWrittenSkills() {
  return new Set(
    readdirSync(SKILLS_DIR, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !(entry.name in mirror.skills))
      .map((entry) => entry.name),
  );
}

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

writeFileSync(MIRROR_PATH, JSON.stringify({ ...mirror, skills: next }, null, 2) + "\n");
