# Ora skills

Agent skills from [Ora](https://ora.ai), the standard for how agents choose who to work with. They teach a coding agent to build products that other agents can find, read, use, and pay, and to measure the result against the same checks Ora scores.

[![skills.sh](https://skills.sh/b/ora/skills)](https://skills.sh/ora/skills)

## Install

```bash
npx skills add ora/skills
```

The [skills CLI](https://github.com/vercel-labs/skills) installs into Claude Code, Cursor, Codex, Gemini CLI, GitHub Copilot, Windsurf, and many other agents. Useful variants:

```bash
npx skills add ora/skills --skill agent-ready   # one skill
npx skills add ora/skills -g -y                 # every project on this machine
npx skills add ora/skills --list                # see what is in the repo
```

## Skills

| Skill | Use it when |
| --- | --- |
| [`agent-ready`](skills/agent-ready/SKILL.md) | You are building or changing a surface agents will use: an API, auth, an MCP server or MCP App, `llms.txt`, docs, pricing, or checkout. |
| [`agent-ready-website`](skills/agent-ready-website/SKILL.md) | You want to raise a live website's Ora score. It runs an audit, applies the top-ranked fix, and re-audits. |

`agent-ready` holds the durable build patterns, with a reference file per scoring layer and templates for `llms.txt`, `robots.txt`, OpenAPI, an MCP server card, and an MCP App tool. `agent-ready-website` carries the current fix for every Ora check, generated from Ora's live check registry.

## More from Ora

- [`ora/webmcp`](https://github.com/ora/webmcp) adds WebMCP tools to a website and verifies them in a real browser. It installs as a Claude Code, Codex, or Cursor plugin, or with `npx skills add ora/webmcp`.
- [`ax`](https://github.com/ora/ax) scores any site from your terminal or CI: `npx ax audit https://yoursite.com`.
- Ora's MCP server at `https://ora.ai/api/mcp` scans domains, lists checks, and serves these skills through `list_skills` and `get_skill`.

## How this repo is maintained

There are two kinds of skill here.

- **Written here.** `agent-ready` is authored in this repo. Edit it directly and open a pull request.
- **Mirrored from ora.ai.** `agent-ready-website` is generated from Ora's check registry and published at [`ora.ai/.well-known/agent-skills/`](https://ora.ai/.well-known/agent-skills/index.json). A daily workflow copies it here after checking each file against its published sha256 digest, and CI rejects edits made in this repo. The same skills install straight from the site with `npx skills add https://ora.ai`.

## Contributing

```bash
npm install
npm run validate                      # spec, links, style, and mirror integrity
npx skills add . --list               # confirm the skills CLI discovers every skill
```

Rules for writing and changing skills are in [AGENTS.md](AGENTS.md). Found a check result that looks wrong? Report it through Ora's `submit_check_feedback` MCP tool, or open an issue here.

## Security

skills.sh runs third-party security audits on every published skill. The only script in this repo, [`verify-with-ora.sh`](skills/agent-ready/scripts/verify-with-ora.sh), sends a single domain name to Ora's public API and needs no credentials. Report security issues privately through [GitHub security advisories](https://github.com/ora/skills/security/advisories/new).

## License

[MIT](LICENSE)
