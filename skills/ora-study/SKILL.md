---
name: ora-study
description: Runs benchmark studies of AI agents with Ora Study and the ora CLI. It compares agents (Claude Code, Codex, OpenCode and others, each on a chosen model) and their setups (a skill, an MCP server, tools, add-ons) on the person's own tasks or a published benchmark, graded by a blind judge panel and deterministic checks, then reads, gates and publishes the results. Use when someone wants to prove that a skill or MCP server makes agents better, find which agent or model does their tasks best, rank agents on a benchmark, catch a change that makes agents worse in CI, or publish a study. To make a website or API itself agent-ready, use agent-ready or agent-ready-website instead.
license: MIT
compatibility: Requires the ora CLI (@ora-ai/cli) 0.30.0 or newer and an Ora Study API key. Install or update with npm install -g @ora-ai/cli
metadata:
  version: "1.0.1"
  min-cli-version: "0.30.0"
---

# Ora Study playbook

Workflow: question -> design -> check -> rehearse -> launch -> wait -> read -> publish -> gate

Ora Study runs one set of tasks over named groups of agents and grades every run the same way, so the groups can be
compared fairly. You drive it with the `ora` CLI. Add `--json` to a command to read its full answer.

## Before you start

- `ora whoami` must answer. If it fails, ask the person for an API key with the scopes `study.studies:read`,
  `study.studies:write` and `study.addons:read` (Study -> Settings -> API keys), then run `ora login --api-key`.
  Add `skills:read` and `skills:write` when the study tests a skill of their own.
- Every field of a study's body is a flag. `ora study create --help` lists each one, the keys an object takes and the
  values each key allows. A body can also go in a JSON file (`--file body.json`); a flag wins over the same field of
  the file. `--print-body` shows the body and sends nothing.
- Keep every file you write (bodies, saved answers) in the current folder.

## 1. Ask what the study must show

Ask the person, in one short message:

- what is compared: agents against each other, or one setup against another (with and without a skill, two MCP
  servers, a tool on or off);
- the claim, in one sentence: "With our docs MCP server, agents answer billing questions correctly more often";
- the tasks: their own prompts, each with what a correct answer must contain, or a published benchmark;
- the agents, and how many runs they are willing to spend.

The number of groups decides the form:

| Groups | Form | What it answers |
| --- | --- | --- |
| 1 | Leaderboard | The agents ranked against each other under one setup |
| 2 | One comparison | Group B against group A when A has `role=reference`, else the two by name |
| 3 to 6 | Planned contrasts | Every group against the reference, or every pair (at most 4 groups) |

## 2. Design the study

[references/design.md](references/design.md) covers groups, setups (add-ons, skills, MCP servers, tools) and agents.
[references/tasks-and-grading.md](references/tasks-and-grading.md) covers tasks, rubrics, checks and benchmarks.

- Pick the agents from `ora study catalog`: each is a harness and a model, `--agent <harness>/<model>`.
- Each group is a `--group` flag: its label, then what sets it apart. A group with nothing after its label runs the
  agents as published.
- Each task is a `--task` flag: its prompt, or `@task.json` for a task with its rubric and checks.
- Grade with `--lenses judge` (a blind judge panel against each task's rubric), and add `evals` for deterministic
  checks.

## 3. Check the design (free)

Run `ora study preflight` with the same flags or file. It answers what create would, creates nothing and spends
nothing. Read `form` and `label` (the form you meant), `arms` (what each group really runs), `plannedRunCount`,
`comparisons` and `issues`. Fix every issue that says the design cannot answer the question.
[references/check-and-rehearse.md](references/check-and-rehearse.md) explains each field.

Tell the person the planned run count before anything runs: every run is a real agent and counts against their plan.

## 4. Rehearse every group that carries a setup

A group whose add-on or skill never reached the agent still finishes its runs, so the study looks fine and compares
the wrong thing. `ora study ci rehearse --file study.json` runs one task per group as a small study of its own and
answers ready (exit 0), not ready (1), still pending (2) or could not start (3), with each group's checks. Fix a
group that is not ready before the real study.

## 5. Launch and wait

- One command: `ora study run` with the same flags creates, launches, waits until grading has settled and prints
  the study (exit 0; 2 when `--timeout` ran out first, while the study keeps running; 3 on an error).
- Or step by step: `ora study create`, `ora study launch <id>`, then `ora study settlement <id>` until it says
  `settled`.
- Runs that Ora's own infrastructure lost are re-run in place: `ora study rerun-infra-failures <id> --dry-run` shows
  them, the same command without `--dry-run` re-runs them. Never cancel a run to redo it.
- [references/launch-and-wait.md](references/launch-and-wait.md) covers pacing, adding agents and stopping.

## 6. Read the results

`ora study get <id> --json` holds the study, its runs and `aggregate`, the readout. Read it in this order:

1. `study.executiveSummary`: written once grading has settled.
2. `aggregate`: each group's figures, each comparison with its difference and interval, or the leaderboard.
3. `runs`: each run's group, agent, outcome and grades. Open one with `ora study run-trajectory <id> <runId>`.

[references/reading-results.md](references/reading-results.md) explains the readout, what a comparison may claim,
and asking the runs a question. Tell the person the result in the numbers the study returned, with the study link,
and say what it does not show.

## 7. Hold back test-aware runs (optional)

Every new study screens each run for whether the agent noticed it was being tested. To leave the runs where the
agent changed what it did because of that out of the numbers, add `--run-counting influenced` at create, or later
run `ora study set-run-counting <id> --run-counting influenced`. See
[references/test-awareness.md](references/test-awareness.md).

## 8. Publish

Read the exact public page first with `ora study preview <id> --json`. Then publish with
`ora study publish <id> --visibility public` (listed) or `--visibility link` (unlisted). Published tasks show their
rubrics. [references/publish.md](references/publish.md) covers what stays private and how to correct a page.

## 9. Gate changes in CI (optional)

`ora study ci run --file study.json --gate gate.json` runs a whole study and answers a gate: exit 0 pass, 1 fail,
2 undecided. [references/ci-gate.md](references/ci-gate.md) covers series, baselines and carrying runs over.

## Rules

- Quote the numbers and words the commands return. Never round them up or invent one.
- A comparison claims only what its basis allows: read each comparison's `basis` before writing a sentence about it.
- Every run spends the person's plan. Check with preflight first, rehearse before a large study, and never launch in
  a loop.
- Ask before launching, publishing, or changing anything the person has already published.
- A refusal names its code: [references/troubleshooting.md](references/troubleshooting.md) says what each means.
