# Agents

Rules for any coding agent (or person) changing this repo. Run `npm run validate` before every commit; CI runs it plus a skills CLI discovery check.

## Layout

- `skills/<name>/SKILL.md` - one directory per skill. The directory name equals the frontmatter `name`.
- `skills/<name>/references/`, `assets/`, `scripts/` - loaded on demand. Keep references one level deep from `SKILL.md`.
- `mirror.json` - skills mirrored from ora.ai, with the sha256 digest each file must match.
- `skills.sh.json` - how the skills.sh repo page groups skills. Add every new skill to a group.
- `scripts/` - `validate.mjs` (the checks CI runs) and `sync.mjs` (the ora.ai mirror).
- `evals/` - trigger and behaviour cases for `claude plugin eval`.

## Mirrored skills are read-only here

A skill listed in `mirror.json` is generated in Ora's product repo and published at `https://ora.ai/.well-known/agent-skills/`. Never edit it in this repo; the validator rejects any byte change. Change it at its source, deploy ora.ai, then run `npm run sync` (or wait for the daily sync PR). The sync refuses a file whose digest does not match the published index, or whose frontmatter is not strict YAML, and keeps the last good copy instead.

## Writing a skill

- **Spec.** Follow [agentskills.io](https://agentskills.io/specification): `name` is 1-64 lowercase letters, digits, and single hyphens; `description` is 1-1024 chars. Allowed frontmatter keys are `name`, `description`, `license`, `compatibility`, `metadata`, and `allowed-tools`.
- **Strict YAML.** Frontmatter must parse with a real YAML engine. An unquoted `: ` inside a plain value (for example `When to use: ...`) breaks the parse, and strict clients like the skills CLI then drop the skill without an error. The validator catches this.
- **Description.** Third person. Say what the skill does and when to use it, with the phrases a user would actually type. The description is the only text an agent sees before choosing a skill, so make it distinct from every sibling skill here and name the sibling to use instead when triggers overlap.
- **Body.** Under 500 lines and 5000 tokens; the validator fails a hand-written skill over either. Put detail in `references/` and point to it from `SKILL.md`. Assume the agent is capable; cut explanations it does not need.
- **References.** Keep each file focused on one layer or task. A reference over 100 lines starts with a `## Contents` section, so an agent that previews the file sees its full scope.
- **Evals.** Every skill has cases in `evals/`: at least one prompt where it must fire, and one near miss where it must not. A description change is a behaviour change, so run the suite (see `evals/README.md`) and compare before merging.
- **Layer names.** Ora scores four layers, and the API returns these ids: `discovery`, `accessibility`, `usability`, `payments`. Skills that map checks to files must use these ids. If Ora changes its layers, update `agent-ready`'s references and the mapping in `references/verify-with-ora.md` in the same change.
- **Do not copy the check catalog.** Hand-written skills teach durable patterns. The current per-check fixes come from Ora's API or from the mirrored `agent-ready-website`, so they cannot drift.
- **Scripts.** Keep them small, validate every argument before it reaches a URL or request body, never require secrets, and call only Ora's public API. skills.sh audits them.

## Style

- No em dashes or en dashes anywhere. Use a hyphen with spaces (` - `).
- Sentence case in headings. Short, active sentences.
- Say "agents" when the context is clear. Descriptions may say "AI agents" because users search with that phrase.
- Lowercase `ora` only in code and URLs; "Ora" in prose.
- No hype words, and no numbers you have not verified against Ora's live API.

## Before you open a PR

1. `npm run validate` passes.
2. `npx skills add . --list` lists every skill directory.
3. For a new skill: it is in `skills.sh.json` and the README table, it has eval cases, and its description does not compete with an existing skill's triggers.
4. For a description or instruction change: the eval suite ran and did not regress.
