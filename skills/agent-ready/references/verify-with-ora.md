# Verify and improve with Ora

Ora ([ora.ai](https://ora.ai)) scores how ready a product is to be used by agents, across the same surfaces this skill builds toward. It is not just a pass/fail at the end - it is the **improve loop**: scan, read the failing checks and their fixes, change the code, rescan, repeat until the score moves. Use it to close the loop after you ship a public surface, and to drive iteration when the task *is* raising agent-readiness.

No auth is required to scan or read scores. There are two interfaces, and for the improve loop **both now return everything you need to act** - stable check ids, per-check fix recommendations, and per-layer scores:

- **REST API** - quickest for scripts and CI. Returns the full result as JSON.
- **MCP server** - agent-native. Returns the same data as typed `structuredContent`, plus a curated "Top fixes" block in the text response, and renders interactive cards in MCP Apps hosts.

## The improve loop

1. **Scan.** `POST /api/scan` (REST) or `scan_domain` (MCP) for a fresh run; `GET /api/score/{domain}` or `get_score` for the cached result.
2. **Check it finished.** If `analysisStatus` is `partial` or `stuck` (or `pendingChecks` is non-empty), the deep checks are still running - re-scan and wait for `complete` before acting. Acting on a partial result means "fixing" checks that simply had not resolved yet. The response carries a `next_action` / `nextAction` telling you exactly what to call.
3. **Triage by `estScoreGain`.** Each actionable check carries `estScoreGain` - the estimated points it would add to the overall 0-100 score if fixed, already normalized to the layer weight. **Rank fixes by this, biggest first.** Do *not* rank by the raw `maxScore − score` gap: a check's `score`/`maxScore` are points *within its layer*, and each layer is normalized to a weight before it counts, so a raw 7-point gap in a big layer can be worth only ~2 points of actual uplift. `estScoreGain` is that real number, already computed for you.
4. **Fix a batch, not one check.** Take the top `fail` / `warning` checks by `estScoreGain` and fix them together, then rescan once - one before/after measurement over a batch of high-impact fixes is cleaner than a rescan per change. Each check carries a `recommendation` (what to change) and `details` (what the scan saw); act on the `recommendation`. For depth, the check's **layer id maps to a reference file in this skill**: `discovery` to `discovery.md`, `accessibility` to `accessibility.md`, `usability` to `usability.md` (or `handoff.md` for MCP Apps and generative-UI checks), and `payments` to `payments.md`. Open that file for the full pattern. Skip `na` (those surfaces do not apply and are not deductions); treat `bonus` checks as upside-only and `maturity: "emerging"` as low-priority forward bets. **When displaying failing checks to the user, annotate these explicitly.** Append `(bonus)` after the check name for bonus checks and `(emerging)` for checks with `maturity: "emerging"`, so the user knows they are upside-only or forward-looking, not core failures to address.
5. **Rescan, then re-read - don't add up.** `estScoreGain` is a per-fix *priority* signal, not a budget: the values do not sum cleanly across a batch, because fixing checks shifts the layer denominators. Trust the rescanned score for ground truth, not the sum of the gains you targeted. Re-run, wait for `complete`, confirm the score moved, then re-rank from the new `estScoreGain` values and go again.
6. **Stop when** you reach the grade or score you need, or the top remaining `estScoreGain` is too small to be worth the change. What is left at that point is usually `bonus` surfaces you would only build if the product genuinely needs them, and `emerging` forward bets - neither is worth chasing for the score alone.

## What the scan returns

Both interfaces expose the same shape (REST as the JSON body; MCP as `structuredContent`):

**Top level**

| Field | Meaning |
|---|---|
| `score` / `grade` | 0-100 and a letter grade (`A+`, `A`, `B`, `C`, `D`, `F`). |
| `analysisStatus` | `complete` \| `partial` \| `stuck`. Only act on `complete`. |
| `pendingChecks` | Ids of checks still resolving (empty when complete). |
| `next_action` (REST) / `nextAction` (MCP) | Machine-readable "what to call next" when the result is incomplete or the domain was never scanned. |
| `layers[]` | One entry per layer (below). |

**Per layer**: `id` (`discovery`, `accessibility`, `usability`, `payments`), `name`, `score`, `maxScore`. Older stored scans can carry retired ids (`identity`, `access`, `experience`); a rescan returns the current ones.

For CI and scripted loops, add `?format=audit` to either REST call. It returns a versioned contract (`contractVersion`) with a server-ranked `topFixes` list; work it top to bottom instead of re-ranking.

**Per check**, the part you fix against:

| Field | Use |
|---|---|
| `id` | Stable identifier (e.g. `api-error-model`, `oauth-support`, `llms-txt-content`). Route fixes and dedupe by this, not by name. |
| `status` | `pass` \| `fail` \| `warning` \| `error` \| `pending` \| `na`. Act on `fail`/`warning`; skip `na`. |
| `score` / `maxScore` | Points earned vs available **within the layer** - how complete the check is. Not 0-100 points; do not read the gap as score uplift. |
| `estScoreGain` | Estimated uplift to the overall 0-100 score if fixed (normalized to the layer weight). The uplift signal - **rank fixes by this**. Present on `fail`/`warning` checks; an estimate, not exact. |
| `recommendation` | The concrete fix. The primary thing to act on. |
| `details` | What the scan observed (the evidence behind the status). |
| `bonus` | Upside-only: passing raises the score, failing never lowers it. |
| `maturity` | `verified` (counts toward the score) or `emerging` (excluded from the denominator - a forward bet). |
| `naReason` | Why a check is `na` for this product - confirms it is correctly skipped. |

> The MCP tools also fold the highest-impact fixes into the text response as a **"Top fixes"** list (already sorted by `estScoreGain`, with the estimated uplift shown per line), so an agent reading only the text content - not the structured payload - still gets an actionable, prioritized list.

## REST API

| Call | What it does |
|---|---|
| `GET https://ora.ai/api/score/{domain}` | Cached result with the full per-layer / per-check breakdown. Fast. Returns 404 + a `next_action` if never scanned. |
| `POST https://ora.ai/api/scan` body `{"url":"{domain}"}` | Runs a fresh scan and returns the full result. Use when there is no cached score, after you ship a change, or when a cached result is `partial`/`stuck`. |
| `GET https://ora.ai/api/discover?intent={task}&limit=5` | Finds the most agent-ready products for a described need. |
| `GET https://ora.ai/api/feedback/{domain}` | Agent feedback for a product - success rate, recommendation rate, notable entries. Read before integrating a third party. |

> **Human-readable report URL:** when presenting results to a user, link to `https://ora.ai/score/{domain}` (e.g. `https://ora.ai/score/example.com`). This is the interactive web report.

Example - verify after shipping:

```bash
curl https://ora.ai/api/score/yourdomain.com \
  || curl -X POST https://ora.ai/api/scan -H "Content-Type: application/json" -d '{"url":"yourdomain.com"}'
```

The convenience wrapper `scripts/verify-with-ora.sh` does exactly this (cached score, falling back to a fresh scan).

## MCP server

Connect to `https://ora.ai/api/mcp` over Streamable HTTP. In an MCP Apps host (Claude, ChatGPT, and other MCP hosts) the results render as interactive cards and tables.

| Tool | Use |
|---|---|
| `scan_domain` (`url`, optional `mcpUrl`) | Run a fresh scan (optionally testing a specific MCP server). Returns the full per-check breakdown + a prioritized "Top fixes" summary. |
| `get_score` (`domain`) | Look up the cached result, same enriched shape. |
| `list_checks` | The full check catalog: every check id with its layer, max score, applicability, tier, and maturity. |
| `run_checks` (`url`, `checkIds`) | Re-run only the checks you just fixed, live. Faster than a full rescan; spends one unit of the same daily scan budget. |
| `discover_products` (`intent`, optional `limit`) | Find the most agent-ready products for a need. |
| `get_leaderboard` (optional `category`, `limit`) | The ranking by agent-readiness. |
| `get_feedback` (`domain`, optional `limit`) | Read agent feedback for a product. |
| `get_verification_challenge` / `submit_feedback` | Submit your own agent feedback after using a product. Agent-only, gated by a reverse-CAPTCHA challenge; rate-limited. |
| `submit_check_feedback` | Report that a specific check's result looks wrong for a domain (the check id plus a reason). Same challenge-gated, agent-only path. |

## Using Ora inside the build loop

- **After shipping a public surface**, scan your domain and run the improve loop above - the failing checks map directly to the steps in this skill. Fix, redeploy, rescan.
- **Before integrating a third-party product** your code will call, check its score and read its agent feedback (`get_feedback`) - a low score or repeated friction is a signal to pick a more agent-ready alternative.
- **When choosing among options** for a capability, use `discover_products` / `get_leaderboard` to compare agent-readiness, not just human-facing marketing.

For the full methodology and what each layer measures, see [ora.ai](https://ora.ai).
