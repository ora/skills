# Gating changes in CI

## Contents

- A series, and where a study was taken
- The gate
- One command for CI
- Running only what could have changed
- Signing in from CI

## A series, and where a study was taken

Studies that ask the same question at different moments (every pull request of a repository) share a `series`
(lowercase letters, digits, `.`, `_`, `-` and `/`, up to 120 characters). `ref` records where each was taken:

```json
"series": "checkout-cli/pr-gate",
"ref": { "commit": "abc123", "branch": "main", "pr": 42 }
```

Both are frozen at create.

## The gate

`ora study gate <id> --file gate.json --json` answers `pass`, `fail` or `undecided` from a finished study, and stores
nothing:

```json
{ "floor": { "rate": 0.8 }, "maxDrop": { "pp": 5 }, "baseline": { "series": { "branch": "main" } } }
```

- `floor`: the least the group's figure may be (`rate` from 0 to 1, or `points` from 0 to 100).
- `maxDrop`: how far it may fall below the baseline (`pp` or `points`).
- `baseline.series`: the newest settled earlier study of the series on that branch.
- `undecided` is an answer, not an error: `gate.refusedBy` names the rule that could not decide (`settled`,
  `infra_clean`, `enough_evidence`, `comparable_baseline`, `floor`, `max_drop`) and `gate.reason` the numbers. A
  clean small sample does not pass: size the study for the floor.

## One command for CI

`ora study ci run --file study.json --gate gate.json --series <key> --param ref=<commit>` runs preflight, create,
launch, the wait, one in-place re-run of infrastructure failures, the settle wait and the gate. Exit 0 pass, 1 fail,
2 undecided, 3 error. `${name}` in any string of the body is filled by `--param name=value`; an unfilled placeholder
and an unused parameter are both errors. The key needs `study.studies:read` and `study.studies:write`.

## Running only what could have changed

A series study created with `"carry": { "from": "series", "maxAgeDays": 7 }` takes the runs of its unchanged jobs
(same task, setup, agent, variant and repeat, a run that succeeded within `maxAgeDays`) from the series' newest
completed study instead of running them again. Each carried run says so.

- `ora study carry-plan <id>` says, before launch, how many jobs would be carried, from which study, and why each
  other one runs. It writes nothing.
- `ora study set-carry <id> --carry null` turns carrying off before launch; `ora study ci run --no-carry` does the same
  for one CI run.
- The gate does not decide a group that shares runs with its baseline: launch that study with carrying off. A study
  with carried runs is not entered on a public board.

## Signing in from CI

Give the job the key as a secret in `ORA_API_KEY`. The CLI reads it on every command; never write it to a file the
job uploads.
