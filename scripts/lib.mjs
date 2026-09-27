import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { parse } from "yaml";

export const ROOT = new URL("..", import.meta.url).pathname;
export const SKILLS_DIR = `${ROOT}skills`;
export const MIRROR_PATH = `${ROOT}mirror.json`;

/** agentskills.io spec: 1-64 chars, lowercase alphanumerics and single hyphens. */
export const NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function sha256(content) {
  return "sha256:" + createHash("sha256").update(content).digest("hex");
}

/**
 * Splits a SKILL.md into its parsed frontmatter and body. Parses with a real
 * YAML engine so a description like "When to use: x" fails here the same way
 * it fails in strict clients (the skills CLI silently drops such skills).
 */
export function parseSkill(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) throw new Error("missing YAML frontmatter block");
  const frontmatter = parse(match[1]);
  if (!frontmatter || typeof frontmatter !== "object" || Array.isArray(frontmatter)) {
    throw new Error("frontmatter is not a YAML mapping");
  }
  return { frontmatter, body: match[2] };
}

export function readMirror() {
  return JSON.parse(readFileSync(MIRROR_PATH, "utf8"));
}
