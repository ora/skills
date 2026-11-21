# Test awareness and holding runs back

## Contents

- The screen
- Holding flagged runs back
- What a held-back run is
- What readers see
- When a policy is refused

## The screen

Every new study screens its runs (`"screens": ["test_awareness"]` is the default; `"screens": []` opts out). After a
run ends, a judge panel reads its full trace and labels it `none`, `aware` (the agent noticed it was being tested and
answered normally) or `influenced` (it changed what it did because of that, for example by shaping its answer to what
a grader checks), with the quoted evidence. A label changes no figure. One run's verdict and its words:
`ora study run-screens <id> <runId> --json`.

Preflight's `issues` also flag a task text that tells the agent it is being tested: fix those before launching.

## Holding flagged runs back

A study's counting policy decides whether flagged runs count in its numbers:

| Policy | What the study's numbers count |
| --- | --- |
| None (the default) | Every run |
| Hold back `influenced` (recommended) | Every run except those the screen judged `influenced` |
| Hold back `aware` and `influenced` | Only the runs the screen did not flag |

Set it on any command that creates a study (`run`, `create`, `ci run`, and `preflight` or `rehearse` to check it),
or later:

- `ora study run --run-counting influenced` (or `--run-counting aware,influenced`) at create;
- `ora study set-run-counting <id> --run-counting influenced --dry-run` to see what would be held back, changing
  nothing;
- `ora study set-run-counting <id> --run-counting influenced` to set it, and `--run-counting count_all` to count
  every run again;
- `ora study run-counting <id> --json` to read the policy, what it holds back, and each group's figure both ways.

`--run-counting` also takes the policy exactly as `ora study run-counting` prints it
(`hold_back_screened:test_awareness:aware+influenced`), or the object as `key=value` pairs, JSON or `@file.json`. In
a body file it is `"runCounting": { "policy": "hold_back_screened", "screen": "test_awareness", "levels": ["influenced"] }`;
`null` or no field counts every run.

A benchmark study sets its policy after create, with `set-run-counting`: only then can its benchmark's instructions
be read. Every change is recorded with who made it, when, and the policy before and after (`changes`). Two changes at
once: one answers 409 `run_counting_conflict`; read the policy again and retry.

## What a held-back run is

- A missing measurement, never a fail or a zero. A task left with no counted run reads "not measured".
- A judged pair counts only when both of its runs count.
- A run the screen could not judge, or has not judged yet, is never held back.
- Nothing is run or judged again: a change only changes which runs are read.

## What readers see

- `ora study run-counting <id> --json` answers `offered` (and `refusal` when a policy cannot be set), `flagged` by
  level, `heldBack` (each run, its group and its level), each group's figure as `counted` and with `all` runs, and
  `imbalanced`.
- `imbalanced: true` means two groups lost very different shares of their runs. One group's setup may be what makes
  agents notice the test, and holding back then removes that group's evidence selectively: read both figures before
  you claim a difference.
- The published page states how many runs were held back, in all and per group, never which ones.
- The gate judges the counted runs and says how many it left out per group; `"counting": "all"` in the gate's body
  judges every run. While a run the screen can judge has no verdict yet, a study with a policy is `pending`, owing
  `screens`, and its summary waits.
- In a series, studies that count differently are different measurements: a change of policy starts a new segment.

## When a policy is refused

| Code | Why |
| --- | --- |
| `run_counting_screen_undeclared` | The study does not screen its runs (`"screens": []`) |
| `run_counting_benchmark_at_create` | A policy in a benchmark study's create body: set it after create |
| `run_counting_platform_discloses_test` | The benchmark itself tells the agent it is being evaluated, so a flagged run was told, not caught: every run counts |
| `run_counting_pairs_unnamed` | An older study whose judged pairs do not record both of their runs |
| `run_counting_not_enabled`, `run_counting_screen_not_enabled` | The deployment does not offer it, or does not run that screen |
