// Validates every skill under skills/ against the agentskills.io spec plus the
// rules in AGENTS.md. Exits non-zero on any error; warnings do not fail.
//
// Usage: npm run validate

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { NAME_PATTERN, ROOT, SKILLS_DIR, parseSkill, readMirror, sha256 } from "./lib.mjs";

const ALLOWED_KEYS = new Set(["name", "description", "license", "compatibility", "metadata", "allowed-tools"]);
const MAX_BODY_LINES = 500;
const BODY_TOKEN_BUDGET = 5000;
const TOC_THRESHOLD_LINES = 100;
// Backticked relative file references: `references/x.md`, `assets/y.json`, `usability.md`.
const FILE_REF = /`((?:references|assets|scripts)\/[\w./-]+|[\w-]+\.md)`/g;

const errors = [];
const warnings = [];
const mirror = readMirror();

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

function checkFrontmatter(name, frontmatter, report) {
  for (const key of Object.keys(frontmatter)) {
    if (!ALLOWED_KEYS.has(key)) report(`unknown frontmatter key "${key}"`);
  }
  if (frontmatter.name !== name) report(`name "${frontmatter.name}" must match directory "${name}"`);
  if (!NAME_PATTERN.test(name) || name.length > 64) report("name must be 1-64 lowercase letters, digits, single hyphens");

  const { description } = frontmatter;
  if (typeof description !== "string" || description.trim() === "") {
    report("description is required");
  } else {
    if (description.length > 1024) report(`description is ${description.length} chars (max 1024)`);
    if (/<[^>]+>/.test(description)) report("description must not contain XML tags");
    if (/\b(I can|you can)\b/i.test(description)) warnings.push(`${name}: description should be third person`);
  }
  if (frontmatter.compatibility !== undefined && String(frontmatter.compatibility).length > 500) {
    report("compatibility must be at most 500 chars");
  }
  if (frontmatter.metadata !== undefined) {
    const values = Object.values(frontmatter.metadata ?? {});
    if (typeof frontmatter.metadata !== "object" || values.some((v) => typeof v !== "string")) {
      report("metadata must map string keys to string values");
    }
  }
}

function checkFiles(name, skillDir, report) {
  for (const file of walk(skillDir)) {
    const text = readFileSync(file, "utf8");
    const rel = relative(ROOT, file);
    if (/[\u2013\u2014]/.test(text)) report(`${rel} contains an em or en dash (use " - ")`);
    if (!file.endsWith(".md")) continue;
    const isReference = file.startsWith(join(skillDir, "references"));
    if (isReference && text.split("\n").length > TOC_THRESHOLD_LINES && !/^## Contents$/m.test(text)) {
      report(`${rel} is over ${TOC_THRESHOLD_LINES} lines and needs a "## Contents" section near the top`);
    }
    for (const [, ref] of text.matchAll(FILE_REF)) {
      const candidates = [join(dirname(file), ref), join(skillDir, ref)];
      if (!candidates.some((path) => existsSync(path))) report(`${rel} references missing file ${ref}`);
    }
  }
}

function checkMirrored(name, skillDir, report) {
  const files = walk(skillDir).map((path) => relative(skillDir, path));
  if (files.length !== 1 || files[0] !== "SKILL.md") report("mirrored skills contain only SKILL.md");
  const digest = sha256(readFileSync(join(skillDir, "SKILL.md")));
  if (digest !== mirror.skills[name].digest) {
    report("SKILL.md differs from the ora.ai digest in mirror.json. Edit it in ora's registry, then run npm run sync");
  }
}

const names = readdirSync(SKILLS_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

for (const name of names) {
  const skillDir = join(SKILLS_DIR, name);
  const report = (message) => errors.push(`${name}: ${message}`);
  const entry = join(skillDir, "SKILL.md");
  if (!existsSync(entry)) {
    report("missing SKILL.md");
    continue;
  }

  let parsed;
  try {
    parsed = parseSkill(readFileSync(entry, "utf8"));
  } catch (error) {
    report(`invalid frontmatter: ${error.message}`);
    continue;
  }
  checkFrontmatter(name, parsed.frontmatter, report);

  const lines = parsed.body.split("\n").length;
  if (lines > MAX_BODY_LINES) report(`SKILL.md body is ${lines} lines (max ${MAX_BODY_LINES})`);
  const mirrored = name in mirror.skills;
  const tokens = Math.round(parsed.body.length / 4);
  if (tokens > BODY_TOKEN_BUDGET) {
    const message = `SKILL.md body is ~${tokens} tokens (budget ${BODY_TOKEN_BUDGET}); move detail into references/`;
    // A mirrored skill can only be fixed at its source, so it must not block the sync.
    if (mirrored) warnings.push(`${name}: ${message}`);
    else report(message);
  }

  if (mirrored) checkMirrored(name, skillDir, report);
  else checkFiles(name, skillDir, report);
}

for (const name of Object.keys(mirror.skills)) {
  if (!names.includes(name)) errors.push(`mirror.json lists ${name} but skills/${name}/ is missing`);
}

const layout = JSON.parse(readFileSync(join(ROOT, "skills.sh.json"), "utf8"));
for (const group of layout.groupings) {
  for (const skill of group.skills) {
    if (!names.includes(skill)) errors.push(`skills.sh.json group "${group.title}" lists unknown skill ${skill}`);
  }
}

for (const warning of warnings) console.log(`warning: ${warning}`);
for (const error of errors) console.log(`error: ${error}`);
console.log(`${names.length} skill(s), ${errors.length} error(s), ${warnings.length} warning(s)`);
process.exit(errors.length ? 1 : 0);
