# Checking and rehearsing a design

## Contents

- Preflight: what create would answer, for free
- A model's review of the texts
- Rehearsal: one real run per group
- Proving a setup by hand

## Preflight: what create would answer, for free

`ora study preflight --file study.json --json` (or the same flags as create) answers exactly what create would,
refusals included, and creates nothing. Read, in order:

- `form` and `label`: the form you meant (a leaderboard, one comparison, planned contrasts).
- `arms`: each group's `key`, `role` and the setup it will really run (`payload`, and `cells`). Check every group
  carries what you meant: a skill list is stored sorted, and two groups that differ only in how a skill is delivered
  can collapse into one.
- `plannedRunCount` (tasks x variants x repeats x the agents of every group), `plannedJudgeComparisons` and
  `judgePerComparison`.
- `comparisons`: for each, `reference` and `subject`, whether it is `oriented`, its `basis` (`matched` or
  `whole_setup`) and the agents it leaves out (`excluded`).
- `boards` (benchmark studies), `issues` (findings that do not refuse the study), `quota` (`remaining`, `allowed`).
- `pacing`, when declared: how many runs start together, and the fewest minutes the starts take.

`issues` includes free design lints: a prompt, variant or follow-up that tells the agent it is being tested, or
repeats its own rubric. Fix those: they change what the agents do. Preflight is rate-limited per organization; it
checks the design only, never whether an add-on really attaches.

## A model's review of the texts

`ora study preflight --file study.json --depth full --review model --json` adds a model's opinion of the task texts
to `issues` (each starting "A model's opinion"). `review.status` says whether a model was asked: `reviewed`,
`nothing_to_review` or `unavailable`. It costs one model call and never refuses a study.

## Rehearsal: one real run per group

`ora study ci rehearse --file study.json` takes the body the study will be created from, runs its first task with one
agent per group and one repeat as a study of its own, and waits. Exit 0 ready, 1 not ready, 2 still pending, 3 could
not start. `--tasks 3` rehearses up to 3 tasks.

Each group's checks:

- `runs_finished`, `no_infra_failure`, `agent_finished`, `graded`;
- `setup_used`: did the group's own add-on or skill get used, read from the trace. A group whose run finished
  without using its setup is `not_ready`: that is the failure a rehearsal exists to catch. `unknown` means the trace
  cannot answer for that agent: prove that group by hand (below).

The runs are real and counted. A rehearsal cannot be published: delete it when done (`ora study delete <id>`).
`--mode setup` boots each group's environment without starting an agent, and `--mode mock` also grades a fixed
answer, where the deployment offers them. Neither can show that a setup was used; rehearse `live` before launching.
Tasks still to be generated cannot be rehearsed (`study_rehearsal_unsupported`).

## Proving a setup by hand

When a check answers `unknown`, create the same body over one or two tasks, launch it, and for every group that
carries an add-on read a run's trace: `ora study run-trajectory <id> <runId> --json`. Its steps must show a real tool
call from that add-on (`steps[].mcp`), and the tool's answer must hold data, not an error or an empty list. A run that
succeeded with no call proves the add-on never attached. Runs carry their group's key in `runs[].arm`.

`ora study delete <id>` archives a study: it leaves the default list and every public page, and is read-only until
`ora study restore <id>` brings it back.
