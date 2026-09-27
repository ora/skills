---
name: agent-ready
description: Builds products that AI agents can find, read, use, and pay, following the Ora agent-readiness standard. Use when designing or changing any surface an agent might use on a user's behalf - a public API or OpenAPI spec, API keys or OAuth, an MCP server or MCP App, llms.txt, structured data, developer docs, pricing, or checkout. Triggers include make this agent-ready, build an API agents can use, add an MCP server, render UI in Claude or ChatGPT, write an llms.txt, agent checkout, agentic payments, expose this to AI agents. To raise an existing website's Ora score check by check, prefer the agent-ready-website skill. Not for general SEO, human-only UX, or internal infrastructure with no agent-facing surface.
license: MIT
metadata:
  author: Ora
  homepage: https://ora.ai
  repository: https://github.com/ora/skills
---

# Agent-ready: build for the agentic web

Agents now choose and act on a user's behalf: booking, buying, integrating, configuring. An agent does not show a list of options for a human to pick from. It picks one product and uses it end to end. A product an agent cannot find, read, operate, or pay is invisible to that decision and fails silently.

This skill is a build-time companion. Bake the plumbing in while you write the code, so the product works the first time an agent arrives instead of being retrofitted later. Each layer has a reference file with the full build patterns. **Read the reference for the layer you are working on before writing code.**

**Division of labor with Ora's live API.** This skill holds the durable part: build patterns, templates, and the habit of thinking about agents while you code. Greenfield work needs that before any URL exists to scan. The live part lives in Ora's MCP server and API: the current check catalog, the exact fix for each check, and the score impact on a deployed product. Build with this skill, then scan for what is actually broken. The skill deliberately does not copy the catalog, so it cannot go stale against it.

## When to use

Load this skill when the task touches any public-facing or integration surface of a product an agent might use:

- Designing or adding an API (REST or GraphQL), SDK, or CLI
- Building or changing auth (sign-up, API keys, OAuth, token scopes)
- Building an MCP server, or an MCP App that renders UI for a human inside the agent
- Building checkout, billing, subscriptions, or any flow where money changes hands
- Writing or restructuring developer docs, a landing page, or pricing
- Adding `llms.txt`, structured data, or a `/.well-known/` file
- Any request to "make this agent-ready" or "expose this to AI agents"

Do not apply it to general SEO, human-only UX, or internal infrastructure (CI, backups) that no external agent will touch. If unsure, ask: "would an agent ever do this on a user's behalf?" If yes, this skill applies.

## Two modes

**Building (greenfield or a new surface).** Start with the greenfield quick start below, build each relevant layer in order, then verify with Ora once deployed.

**Improving (existing product).** Scan with Ora first (`scripts/verify-with-ora.sh` or the `scan_domain` MCP tool). Rank the `fail` and `warning` checks by `estScoreGain`, then open the reference file for each failing check's layer. Fix a batch, rescan, repeat. See `references/verify-with-ora.md`.

## The four layers

Ora scores agent-readiness in four layers that follow the agent journey: find, read, act, pay. Each layer gates the next. The layer ids below are the ids the Ora API returns, and each maps to a reference file.

1. **Discovery (`discovery`) - find you.** Get into the registries, indexes, and searches an agent checks before it ever reaches your site: `/llms.txt`, `sitemap.xml`, an explicit AI-crawler policy in `robots.txt`, MCP and package registries. See `references/discovery.md`.
2. **Accessibility (`accessibility`) - read and understand you.** Answer "what is this and when should I use it?" from machine-readable signals alone. Serve real HTML instead of a JS shell, let agent crawlers through your WAF, add `SoftwareApplication` JSON-LD, publish an OpenAPI spec, and write explicit when-to-use guidance. See `references/accessibility.md`.
3. **Usability (`usability`) - access and operate you.** Let an agent get credentials with zero human steps, then drive the product end to end: self-serve API keys or OAuth `client_credentials`, clear MCP tools, JSON errors, idempotency keys, rate-limit headers, and an operable accessibility tree for steps that only exist in a web GUI. See `references/usability.md`. The one deliberate exception, handing a decision back to a human through an MCP App and then resuming, also scores here. See `references/handoff.md`.
4. **Payments (`payments`) - pay you, only where relevant.** Complete a transaction on agent-native rails instead of a human-only checkout: a machine-completable path plus at least one agent payment protocol (x402, ACP, UCP, AP2, MPP) and machine-readable pricing. Products with nothing to buy are exempt. See `references/payments.md`.

> Mnemonic: can agents **find** you, **read** you, **use** you, and **pay** you, handing back to a human only when a decision genuinely needs one.

Templates to copy and fill in live in `assets/`: `llms.txt.template`, `robots.txt.template`, `openapi.skeleton.json`, `mcp-server-card.template.json`, `mcp-app-tool.example.json`, `agent-card.template.json`.

## Two rules that apply to every layer

**Build only the surfaces your product genuinely has.** Every check is gated on the surface it measures. If a surface does not exist, its checks are skipped, never counted as failures. **Never add a surface just to satisfy a check.** An absent surface was already free. OpenAPI, error models, idempotency, and pagination apply only if you expose an API. MCP tools, annotations, and a server card apply only if you ship an MCP server. Payment rails apply only if you sell. MCP Apps apply only if you have a real human-handoff moment. Accessibility-tree operability applies only to a step that lives solely in a web GUI.

**Do established signals first, emerging ones as a forward bet.** Established signals are proven and broadly relied on, so do them first. Emerging signals (newer `.well-known` files, nascent protocols, draft standards) are worth adopting when cheap or strategically important, but may not count toward the score yet. A recommendation tagged *(emerging)* in the references is useful, not load-bearing. Never block a launch on one.

## Greenfield quick start

The highest-leverage, lowest-cost moves. Do these first, then go deeper in each layer's reference:

1. **Serve raw, readable content.** AI crawlers do not execute JS. Render meaningful HTML on the server, or offer a markdown fallback. See `references/accessibility.md`.
2. **Publish `/llms.txt`.** A lean navigation index of what you are and where the important pages live. Copy `assets/llms.txt.template`. See `references/discovery.md`.
3. **Add `SoftwareApplication` and `Organization` JSON-LD** to the homepage with `name`, `description`, `url`, `offers`, and `sameAs`. See `references/accessibility.md`.
4. **Publish an OpenAPI spec** at `/openapi.json` if you have any API. Copy `assets/openapi.skeleton.json`. See `references/accessibility.md`.
5. **Document machine auth.** A self-serve path to an API key or an OAuth client-credentials flow that an agent can finish with no human. See `references/usability.md`.
6. **Ship an MCP server** if agents will take actions, not just read. Expose it at a discoverable path and add `assets/mcp-server-card.template.json`. See `references/usability.md`.
7. **Return JSON errors, not HTML,** from every API path, including unknown paths and auth failures. See `references/usability.md`.
8. **If you sell, expose an agent-payable path.** A machine-completable checkout plus at least one agent payment protocol. See `references/payments.md`.
9. **When a decision needs a human, render a UI, not a wall of text.** Use an MCP App for that confirm, select, or authorize moment. See `references/handoff.md`.

## Verify and improve with Ora

Ora scans these same surfaces at run time. Treat it as a loop, not a one-shot check: **scan, triage the failing checks by impact, fix, rescan.** Both interfaces return stable check ids, a per-check `recommendation`, and per-layer scores.

```bash
# Cached result with the full per-layer and per-check breakdown (fast)
curl https://ora.ai/api/score/yourdomain.com
# Or run a fresh scan
curl -X POST https://ora.ai/api/scan -H "Content-Type: application/json" -d '{"url":"yourdomain.com"}'
```

`scripts/verify-with-ora.sh` wraps both calls. For agents, connect to Ora's MCP server at `https://ora.ai/api/mcp` (Streamable HTTP). `scan_domain` and `get_score` return the breakdown plus a prioritized "Top fixes" summary.

**The improve loop.** Rank `fail` and `warning` checks by `estScoreGain`, the estimated uplift to the 0-100 score that the response already carries. Do not rank by the raw `maxScore - score` gap, which overstates it. Fix a batch of the biggest using each check's `recommendation`. Skip `na` checks, and treat `bonus` checks as upside only. Then rescan once and confirm the score moved: `estScoreGain` ranks fixes but does not add up, so trust the rescan. Before acting, confirm `analysisStatus` is `complete`, since a `partial` or `stuck` result is still running. Stop at the target grade, or when the top remaining gain is too small to matter.

Full response shape and the endpoint and tool reference: `references/verify-with-ora.md`.

## Anti-patterns to avoid

- **Client-only rendering with no fallback.** AI crawlers see an empty shell.
- **HTML error pages from API routes.** An agent expecting JSON gets an unparseable page and gives up.
- **Human-only onboarding.** A sales call to get a key, a captcha wall, or manual approval stops an agent cold.
- **A captcha at the checkout or confirm step.** It blocks the one moment an agent most needs to finish.
- **A text-only handoff for a visual decision.** Relaying seat numbers or plan tiers as free text invites errors that a simple UI would prevent.
- **A marketing homepage served as `llms.txt`.** It must be a real, lean navigation index.
- **An MCP server with vague, undescribed tools.** An agent cannot tell what a tool does or how to call it.
- **Naming a backend vendor in agent-facing copy.** Describe the capability, not the implementation.
- **Treating agent-readiness as a one-time checkbox.** Protocols evolve, so re-verify whenever you ship a public-surface change.

## How to apply this skill in a build task

1. Identify which layer the task touches. An API change is Usability, a docs or JSON-LD change is Accessibility, a confirm screen is the handoff part of Usability, and a checkout is Payments.
2. Apply the two rules: confirm the product genuinely has that surface (if not, the layer is N/A, so skip it), and do established signals before any *(emerging)* ones.
3. Read that layer's reference file before writing code, and copy any relevant template from `assets/`.
4. Cross-check against the anti-patterns above.
5. If the surface is public, verify with an Ora scan once deployed. If the goal is a higher score, run the improve loop.
