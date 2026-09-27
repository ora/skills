# Eval suite

Cases for `claude plugin eval` (early access), in the same format as [`ora/webmcp`](https://github.com/ora/webmcp/tree/main/evals). Run from the repo root:

```
claude plugin eval . --no-publish
```

Each case is a directory with `prompt.md` (the user request), `case.yaml` (runs and limits), and `graders/*.md` rubrics scored by an LLM judge. The runner adds a baseline arm with no skills loaded, so a score is the uplift a skill gives over the model alone. A `tool_used: Skill` grader is the "skill fired" indicator for that arm.

CI runs the suite through `.github/workflows/evals.yml` on manual dispatch and on PRs that touch `skills/` or `evals/`. It skips cleanly when the `ANTHROPIC_API_KEY` secret is absent, and the account behind the key needs eval early access.

Cases:

- `build-api/` - `agent-ready` fires for a new public API and applies its patterns: JSON errors, an OpenAPI spec, idempotency, rate-limit headers.
- `mcp-handoff/` - `agent-ready` fires for an MCP server with a payment step, annotates tools, and hands the payment to a human through an MCP App.
- `raise-score/` - raising a live site's Ora score routes to the audit loop: scan first, work `topFixes` in order, rescan.
- `no-trigger-seo/` - a plain SEO request does not pull in agent-readiness work.

When you change a skill's description or its core instructions, run the suite and compare against the previous result before merging.
