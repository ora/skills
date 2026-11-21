# Tasks and grading

## Contents

- An authored task
- Rubrics that grade correctness
- Deterministic checks (the evals lens)
- Tasks with steps
- A generated corpus
- A published benchmark
- Custom behaviors

## An authored task

Pass tasks with `--task "<prompt>"` (repeatable), `--task @task.txt` for a prompt in a file, or `--task @task.json`
for a whole task. A study with authored tasks is `ready` at once: it can be launched without a generation step.

```json
{
  "prompt": "Open https://example.com/pricing and report the monthly price of the Team plan.",
  "category": "pricing",
  "rationale": "The price is on the page; an agent that guesses gets it wrong.",
  "requiresWeb": true,
  "rubric": ["Reports the Team plan's monthly price exactly as the page shows it.", "Names the page it read it from."],
  "expectations": [{ "kind": "response_matches", "label": "a price in dollars", "pattern": "\\$\\d+" }],
  "private": false
}
```

- `judge` needs 2 to 8 rubric criteria on every task; `evals` needs `expectations` on every task. A task missing
  either is refused with `LENS_REQUIREMENT_UNMET`, naming the task.
- Before launch, `ora study update-lenses` replaces the lenses and `ora study update-task` a task's prompt or checks.
  Rubrics are frozen at create, before any run exists.
- A task marked `private: true` keeps its text off the open published page (see publish.md).

## Rubrics that grade correctness

The judge reads the rubric, the agent never does. Put one correctness criterion per value a correct answer must
contain in the rubric ("Reports the price as $49"), never in the prompt. A rubric that grades only presentation
lets a well-presented wrong answer win.

## Deterministic checks (the evals lens)

Each expectation is a check over the run: what the final answer contains or matches (`response_contains`,
`response_matches`), which tools were called or not (`mcp_tool_called`, `tool_not_called`), whether a named skill was
loaded (`skill_loaded`), and how much the run used (`token_budget`). `arms` on an expectation scopes it to the groups
with those keys.

Test a `response_matches` pattern before it grades hundreds of runs: try it against a correct answer and against
near misses (a wrong value, the value written another way, two conflicting values).

## Tasks with steps

A task may go on with `followUps` (1 to 8): one run, one conversation, each follow-up given when the turn before it
ended. Each step has its own `prompt`, and may have its own `rubric` and `expectations`; each step is graded on its own
answer. Only harnesses that can continue a conversation run them; preflight refuses any other with
`study_matrix_invalid`, naming the harness.

```json
{
  "prompt": "Create notes.txt containing one line: alpha. Reply: created.",
  "rubric": ["Reports that the file was created.", "Claims nothing else."],
  "followUps": [{ "prompt": "Append a line: beta, then reply with the file's contents.", "rubric": ["Replies with alpha and beta, in that order."] }]
}
```

`ora study get <id> --json` answers `taskSteps`: per task, group and agent, how many runs passed each step, and
where unfinished runs stopped.

## A generated corpus

Give `taskCount` instead of `tasks` and the study waits in `draft`. `ora study generate <id>` writes the tasks and
their rubrics with one model call; review them with `ora study get <id> --json` before launching.

## A published benchmark

`ora study benchmark-definitions list` lists them; `ora study benchmark-definitions get <slug>` answers the
`currentVersionId` to pin. Create with `subjectKind: "benchmark"` and `definitionVersionId`, and no `tasks`: the
benchmark's tasks are copied frozen at create. `"subset": { "count": 50 }` runs a fixed random sample of it. The
benchmark's own grader decides correctness. A 1-group benchmark study can seed the benchmark's public leaderboard;
preflight's `boards` says whether it will.

## Custom behaviors

Up to 5 yes or no questions a judge panel answers about every finished run, from its full trace:

```json
"behaviors": [{ "key": "deleted_files", "name": "Deleted files", "question": "Did the agent delete or overwrite a file it was not asked to change?" }]
```

A "yes" quotes the run; "could not be judged" is its own answer, never a "no". They change no grade. Each costs one
more judge read per run, which preflight states. `ora study behaviors <id> --json` reports what they answered.
They are offered where `ora study comparison-modes list` says `customBehaviors.enabled`.
