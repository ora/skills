---
name: ax
description: Drive ax, ora's command line client (npm package ax), to score a site's agent readiness, send real AI agents through a site, and run a set of journeys that shows where agents get lost. Use when asked to audit a site or localhost from a terminal or CI, fail a build below a score, run an agent journey, compare agents or levels of help on a site's goals, or read ax output such as Next lines, --json and exit codes.
---

# ax, ora's CLI

ax is the open source command line client for ora (https://ora.ai). It scores a site's agent readiness, sends real AI agents through a site, and runs sets of journeys. ora does the work: it scans the site, runs the agents, grades every run and counts the grades. ax asks, waits and prints what ora sent. Quote its numbers as they are; never recompute a score, a verdict or a rate from its output.

## Run it

Every command below pins the release line it was written for:

```bash
npx ax@0.12 <command>
```

Signing in and sets of journeys arrived in ax 0.12, so those commands pin `npx ax@0.12`. An older ax has neither, so never drop or lower a pin. Where npx cannot run at all, use ora's MCP server (`https://ora.ai/api/mcp`) or its REST API (listed at `https://ora.ai/llms.txt`) instead.

## Pick the command

| The task | Command | Needs |
|---|---|---|
| Score a site and list what to fix | `npx ax@0.12 audit <url>` | nothing |
| Fail a CI step below a score | `npx ax@0.12 audit <url> --min-score 70` | nothing |
| Audit a local dev server | `npx ax@0.12 audit localhost:3000 --tunnel-cmd '<command that prints a public https URL>'` | a tunnel tool |
| Send a real agent at a site on one of ora's curated tasks | `npx ax@0.12 journey --domain <site> [--intent <id>]` | nothing |
| The same on a goal of your own, on ora's platform | `npx ax@0.12 journey "<goal>" --domain <site>` | a sign-in (`npx ax@0.12 login`), or `ORA_API_KEY` with `runs:read` and `runs:write` |
| The same on a goal of your own, on ora's public journeys | `npx ax@0.12 journey "<goal>" --domain <site> --api-key <partner key>` | an ora partner key |
| Find where a site loses agents: several goals, agents, levels of help or repeats | `npx ax@0.12 journey "<goal>" --domain <site> --agents claude-code,codex --levels --watch` | a sign-in, on ora Study |
| Draft the files agents look for (llms.txt, ard.json, poppy.json, ...) | `npx ax@0.12 generate-files <domain> --out public` | nothing |
| Install one of ora's skills | `npx ax@0.12 skill <name> --install` | nothing |
| Audit a page's WebMCP tools in a real browser | `npx ax@0.12 webmcp-audit <url>` | Chrome installed |
| Print the audit and journey workflow from ora's own skill | `npx ax@0.12 learn` | nothing |

Every result and every error ends with a `Next:` line: the one call to make next. Follow it rather than guessing.

## Score a site

`npx ax@0.12 audit <url>` runs ora's audit and prints the score out of 100, the grade, each layer, and the Top fixes, ranked by ora. Present the Top fixes in ora's order; every `≈ +N pts` is an estimate. `--json` prints ora's audit payload as it was served. Results come from a freshness cache: `--force` rescans and spends a stricter budget (6 forced scans a day per IP, beside the 30 ordinary ones), so keep it for checking a fix you just deployed. To fix what fails, follow the `agent-ready-website` skill (`npx ax@0.12 skill agent-ready-website`).

Exit codes: `0` done (and at or above `--min-score` when given) · `1` below `--min-score` · `2` usage, such as a local target without a tunnel · `3` ora unreachable or rate limited. An MCP server that needs auth answers `MCP_AUTH_REQUIRED` with no score; ax prints that, skips `--min-score` and exits `0`.

## Send a real agent through a site

`npx ax@0.12 journey --domain <site>` runs one of ora's curated tasks (`pricing`, `signup`, `api-docs`, ...; `--intent <id>` picks one, `GET https://ora.ai/api/journey/intents` lists them) with a real agent, streams its path, and prints ora's verdict, the step count and the insight. It needs no key: 20 runs a day per IP, and a target at its cap answers with its most recent run. A goal of your own on this path needs an ora partner key, passed with `--api-key`, which picks this path even when the user is signed in. `ax deep-journey <url>` is the older name and still works.

Exit codes: `0` the run finished (any verdict) · `1` the run failed · `2` usage · `3` ora unreachable or rate limited.

A goal of your own also runs on ora's platform, in the user's organization: `npx ax@0.12 journey "<goal>" --domain <site>`, signed in with `npx ax@0.12 login` or with `ORA_API_KEY` set to a platform key with `runs:read` and `runs:write`. It starts one run straight away, with no preview (`--harness` and `--model` pick the agent), and the live view shows its path. If ora refuses that run because the organization runs journeys only as sets (a new sign-up's organization is on ora Study), ax prints "Your organization runs journeys as sets on ora. Running this goal as a set of one." and runs the goal as a set of one, followed live; nothing is asked. Exit codes on ora's platform: `0` the run succeeded · `1` it finished without success · `2` error; a set of one exits as a set does (below).

## A set of journeys (ax 0.12)

One journey is one agent, one goal, one run. A set runs your goals on one site with several agents, several times, at up to four levels of help, and shows the level at which agents start to succeed: that is where the site loses them. ax runs a set when it gets more than one goal or any of `--agents`, `--levels`, `--brand`, `--docs`, `--exact`, `--repeat`, `--yes`, `--wait`, `--watch`.

### Sign in first

A set runs on ora's platform, in the user's organization, which needs ora Study. A person signs in once with `npx ax@0.12 login`: it prints a link and a code and waits while they approve in their browser. It asks for every scope ax uses on ora's platform, so the approval page lists six permissions: `ax.sets:read` and `ax.sets:write` for sets, `runs:read` and `runs:write` for a journey on a goal of your own, and `tunnels:write` and `tunnels:connect` for ora's own tunnel (`npx ax@0.12 audit localhost:3000 --tunnel ora`). A viewer, whose role cannot write, hands over only the two read scopes, so their sign-in can list and view sets but not start one. Ask the user to run it; never approve a sign-in you did not start. Signing up on the way creates the organization on ora Study's free plan, which runs every agent, gives a one-time allowance of 200 runs, and lets one set start at most 100 runs. For an organization that exists already, an owner or admin adds ora Study on the sign-in's approval page. Where no person is at the terminal (CI), set `ORA_API_KEY` to an ora platform key with the `ax.sets:write` and `ax.sets:read` scopes; `ax.sets:read` alone can list and view.

### Preview, then ask before launching

A set spends the organization's runs, so preview it and get the user's go-ahead:

1. Run the set command without `--yes`. ax prints the preview on stderr: the goals, the brand, each level with the sentence it adds, the agents (the default is marked "chosen for you"), the repeats, the run count with the limit that applies ("a set may start at most N"), and the runs the plan has left. Where there is no terminal to ask on (your shell tool, CI, a pipe), ax stops there, exits `2` and starts nothing.
2. Show the user the preview. An agent the plan does not include, a set larger than the plan allows, or too few runs left is refused at this step, with the reason.
3. Only once the user agrees, run the same command with `--yes`. With `--watch`, ax follows the runs live over ora's stream until the report.

### Levels of help

Each level adds one fixed sentence after the goal; no model rewrites a prompt.

| Level | What the agent is told | Turned on by |
|---|---|---|
| Need only | The goal as written | `--levels`; skipped when the goal already names the brand or the domain |
| Brand named | The goal, then `Use <brand>.` | `--levels` |
| Docs linked | The goal, then `Use <brand>. Its documentation is at <url>.` | `--docs <url>` |
| Exact target | The goal, then `Start at <url>.` | `--exact <url>` |

`--brand`, `--docs` and `--exact` each turn levels on. The brand defaults to the domain's name (`linear.app` gives `Linear`). A set takes 1 to 5 goals (each quoted), up to 4 levels, 1 to 4 agents in `--agents` (each `harness` or `harness/model`), 1 to 10 `--repeat`, and at most 200 runs.

### Read the report

ax prints the report once every run has ended and been graded. A real one:

```text
linear.app  set 593eea5e-c76d-4394-8dd7-dc52c6fbb61d

Goal 1: Find how to create an issue from the API
  Level         claude-code/claude-haiku-4-5-20251001  codex/gpt-5.4-mini
  Need only     0 of 1                                 0 of 1
    claude-code/claude-haiku-4-5-20251001: 1 never visited your site
    codex/gpt-5.4-mini: 1 never visited your site
  Brand named   0 of 1                                 1 of 1
    codex/gpt-5.4-mini: 1 never visited your site
  Exact target  0 of 1                                 1 of 1

Goal 2: Find how to receive a webhook from Linear when an issue is updated.
  Level         claude-code/claude-haiku-4-5-20251001  codex/gpt-5.4-mini
  Brand named   1 of 1                                 1 of 1
  Exact target  1 of 1                                 1 of 1

  linear.app loses agents at the Discovery layer: 0 of 2 runs satisfied at Need only, 3 of 4 at Brand named. An early signal: not enough runs to decide.
  Goal 2: The goal names Linear, so the need level is skipped. Write the goal without it to include that level.
  No --docs URL, so the docs level is skipped. Add --docs <url> to include it.
  At the need level the prompt does not name your site, so an agent can reach the goal without using it.
Next: ax audit linear.app
```

- A cell is the runs that satisfied the goal out of the graded runs, for one goal, level and agent. From 5 graded runs it also shows the rate, as `60% (3 of 5)`; one run per cell is a first look, so suggest `--repeat 5` when the user wants a measurement.
- A run satisfies the goal when a panel of judge models finds the answer specific and usable, about the product, and supported by a page of the site the agent opened.
- Under a cell, the runs to look at again: `never visited your site` (it answered without opening a page of the site), `blocked by your site` (the site refused it), `excluded` (lost to ora's own infrastructure, never counted against the site) and `still running`.
- The closing line names the layer. Agents that fail at Need only and succeed once the brand or the docs are named did not find the site: a Discovery gap. Agents that fail until handed the exact page found the site and could not get the answer out of it: an Access and Usability gap. "An early signal: not enough runs to decide." means the direction shows and the evidence is thin; say so when you report it.

### Come back to a set

The runs go on at ora whether or not ax is watching. A set is kept in the organization, found again by its id:

```bash
npx ax@0.12 journey list                    # the organization's sets, newest first
npx ax@0.12 journey view <id> --watch       # follow the set live over ora's stream
npx ax@0.12 journey view <id> --wait 30     # the set as it stands; watch up to 30 more minutes
npx ax@0.12 journey cancel <id>             # stop the runs still going; finished runs keep their results
```

`--watch`, on a set or on `journey view`, follows the set over ora's live stream and prints what moves as it moves: the state, then each level and agent as its runs are graded. Without it ax reads the set every few seconds; if the stream is not available, ax says so and reads instead. `--wait <minutes>` (default 60) bounds how long ax watches; when it runs out ax prints the set as it stands and exits `0`. `--json` puts the set on stdout exactly as ora served it, with the preview and progress on stderr. On a set with no run still going, `journey cancel` leaves it as it is, prints what ora says about it and exits `0`.

Exit codes: `0` a report was printed, or the user answered no · `2` usage, or ora refused the set before launch (too few runs left, an agent the plan does not include, a missing scope, no terminal and no `--yes`) · `3` ora's platform failed · `130` Ctrl-C, which only stops watching.

## Rules

- Never add `--yes` to a set before the user has seen the preview and agreed: it spends their organization's runs.
- A goal of your own on ora's platform starts a run in the user's organization with no preview, even when ax runs it as a set of one: tell the user before you run it.
- Report ora's numbers as printed. Do not add cells together, average across goals or levels, or turn a count into a rate ax did not print.
- A journey verdict says what one agent did once. Before telling the user a site fails agents, run a set with repeats.
- Keep keys in environment variables or CI secrets, never in files you commit.
