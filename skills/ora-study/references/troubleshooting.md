# Troubleshooting

## Contents

- Refusals from preflight and create
- Refusals from the doors after launch
- Signing in
- Common mistakes

## Refusals from preflight and create

| Answer | What to do |
| --- | --- |
| 422 `comparison_mode_removed` | The body uses an older study design. Write it as groups (`arms`), with `comparisonMode: "multi_arm"` |
| `... cannot have role 'reference'` | A 1-group study has no reference: remove the role |
| `... at most one group is the reference` | Mark one reference group at most |
| `contrasts: ... 'all_pairs' over at most 4 groups` | With 5 or 6 groups, mark a reference and compare against it |
| `... have the same configuration` | Two groups run the same setup on the same agents: change one, or remove it |
| `study_subject_invalid` (only in their tools policy) | Groups that differ only in `tools` on harness agents: harnesses bring their own tools |
| `... names no cells while group ... does` | Give every group `cells`, or none |
| `every group runs the same agents` | Send those agents as `matrix` instead of `cells` |
| 422 `LENS_REQUIREMENT_UNMET` | A task lacks what a lens needs: 2 to 8 rubric criteria for `judge`, `expectations` for `evals` |
| 422 `study_matrix_invalid` | An agent that is not in the catalog, or a harness that cannot run tasks with steps |
| 422 `study_pacing_invalid` | A pacing value below the number of groups that run one agent |
| 422 `run_screen_unsupported` | A screen this deployment does not run |
| 422 `study_behaviors_unsupported` | Custom behaviors are not offered here (`ora study comparison-modes list`) |
| 422 `study_rehearsal_unsupported` | A rehearsal of tasks still to be generated, or a mode this deployment does not offer |
| 429 `study_preflight_rate_limited` | Too many checks in a minute: wait and check again |

## Refusals from the doors after launch

| Answer | What to do |
| --- | --- |
| 409 `study_published` | Unpublish the study before re-running or adding agents |
| 409 `study_rerun_in_progress` | One re-run at a time per study: wait for it |
| 409 `study_invalid_state` | The study is not in the state the command needs (`ora study get <id>` says which it is) |
| 409 `study_archived` | The study is archived: `ora study restore <id>` |
| 422 `study_extend_rebases_contrast` | Adding those agents would change a comparison's basis: add agents every compared group runs |
| `study_extend_blocked` | A re-run or a launch holds the study, or it changed during the call: retry |
| 422 `gate_unit_mismatch`, `gate_group_unknown`, `gate_series_required` | A threshold in the wrong unit, a group the study does not have (or none named among several), or a series baseline on a study with no `series` |

## Signing in

| Answer | What to do |
| --- | --- |
| 401, `Not signed in` | `ora login`, or set `ORA_API_KEY` |
| 403 missing scope | The key lacks a scope the command names: create a key with it |
| `EXCHANGE_FAILED` | The CLI is pointed at an app address instead of the API: unset `ORA_API_URL`, or set it to the API |

## Common mistakes

- `tasks` is next to `study` in `ora study get <id> --json`, not inside it: reading `study.tasks` finds none.
- A body field's flag is kebab-case: `--dry-run`, never `--dryRun`.
- A comma separates the parts of an object flag: write `\,` for a comma inside a value, and give a list key once per
  item (`levels=aware,levels=influenced`).
- Reporting figures before the study is settled: they change while grading finishes.
- A vendor's concurrency limit (a remote browser plan, an API's rate limit) collides with a wide fan-out and fails one
  group's runs only: size the agents to the limit, or declare `pacing`.
- A claim about every harness needs every harness in the study, each run at least once.
