# Reading the results

## Contents

- Where the results are
- What a comparison may claim
- One run, in full
- Asking the runs a question
- Behaviors and screens
- A series as a trend

## Where the results are

`ora study get <id> --json` answers `study`, `tasks` (next to `study`, not inside it), `runs`, `aggregate`,
`taskHealth` and `warnings`.

- `study.executiveSummary`: the summary, written once grading settled.
- `aggregate`: the readout. In a groups study, `arms` holds each group's figures, `contrasts` each comparison (its
  `referenceArm` and `subjectArm`, whether it is `oriented`, its `basis`, and its `summary`: the difference and how
  sure the study is of it), `board` the leaderboard of a 1-group study, and `perTask` the figures by task.
- `runs`: one per run, with its group (`arm`), agent, status, outcome and grades (`rubricResults`, `evalResults`).
- `taskHealth`: floor tasks (no setup passed), ceiling tasks (every setup passed) and the rubric criteria the judge
  panel split on most. For the study's maintainers; it is never published.
- `warnings`: findings that limit what the readout can measure, recomputed on every read.

The study is read in the Study app too, at the study's own page.

## What a comparison may claim

- Report a difference with its interval. A difference whose interval spans zero is not a difference the study
  found.
- A comparison's `basis` limits the claim. `matched`: groups compared on the agents both ran, so the difference is
  the setup's. `whole_setup`: groups with no agent in common, so the claim is "setup A against setup B", never the
  effect of one agent inside a set.
- A small sample reads wide: 5 of 5 tasks passed is consistent with a true rate far below 100%. Size a study for the
  claim before launching, not after reading it.
- A floor task (no setup passed) may be a broken task, not a hard one: read `taskHealth` and its runs before reporting it.
- When the study holds back test-aware runs, the readout's `runCounting` says how many per group (see
  test-awareness.md).

## One run, in full

- `ora study run-trajectory <id> <runId> --json`: the steps the agent took, with each tool call and its answer.
- `ora study run-spans <id> <runId> --json`: the stored model and tool calls with their usage; `--categories tool,error`
  narrows them.
- `ora study run-delivered <id> <runId> --json`: the files and images the run delivered. Of a task's own `files`,
  only those the agent changed are listed.
- `ora study run-screens <id> <runId> --json`: the screens' verdicts on the run, with their quoted evidence.

## Asking the runs a question

`ora study query-vocabulary <id> --json` lists what the runs can be split by and measured on. Then
`ora study query <id> --file question.json --json` with `{ "metrics": [...], "groupBy": [...], "filters": [{ "field": "...", "in": [...] }] }`.
The answer describes the matched runs (shares, means, medians, totals, each with the number of runs it stands on). It
is not the study's estimate, which weighs every task equally: for a claim, read `aggregate` or `ora study gate`.
`ora study save-view <id> --file view.json` keeps a question; `ora study views <id>` lists them.

To compare groups on how many turns their runs took, ask for `turns` (the median over the runs) and `turns_total`
(their total): `{ "metrics": ["runs", "turns", "turns_total"], "groupBy": ["group"] }`. A turn is a model call that got
a response, counted the same way for every agent; where the calls were not measured, the count is read from the run's
trace. Both figures stand on the runs that ended and carry a turn count: a run with none is left out of the figure
and of its `n`, never counted as 0. Turns describe these runs and nothing more. They are not in the study's
comparison table (`aggregate`), so a difference in turns between two groups has no interval, and no claim, gate or
summary reads it.

## Behaviors and screens

`ora study behaviors <id> --json` reports each custom behavior: how often the panel answered yes, no, or could not
judge, and how far reviewed answers held up. `null` means nobody has reviewed one yet, never 0.

## A series as a trend

Studies that ask the same question at different moments share a `series`. `ora study series --json` lists them;
`ora study series-trend --series <key> --json` gives each study's figure per group, oldest first. `segments` are runs
of comparable studies, and `differsFromPrevious` says what changed at a boundary (corpus, lenses, graders, agents,
counting policy). A study's change is against the previous study of its own segment.
