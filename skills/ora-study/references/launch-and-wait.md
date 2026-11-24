# Launching and waiting

## Contents

- One command, or step by step
- The report link
- The launch record
- When the numbers are final
- Re-running what infrastructure lost
- Adding agents to a launched study
- Stopping a study
- Pacing the starts

## One command, or step by step

`ora study run` takes the same flags or `--file` as create, then creates, launches and waits until the study is
settled, and prints it: exit 0 settled, 2 when `--timeout` (minutes, default 60) ran out first (the study keeps
running), 3 on an error. `--param name=value` fills a `${name}` placeholder of the file.

Step by step: `ora study create` (a study with authored tasks is `ready`), `ora study launch <id>` (`--watch` follows
it), then `ora study get <id> --json` or `ora study stream <id>` to follow it.

## The report link

Every answer that carries a study (create, launch, get, publish, a visibility change) states where it opens:

- `study.links.manage`: the page the study is managed from, for a signed-in member of its organization. Stated
  from the start.
- `study.links.report`: the study's full report, at the study's own address. Stated from launch: while the study is
  preparing or running, the report will open there when it completes. `study.reportOpen` says whether it is open
  yet.

A study with no report to speak of states no `links.report`: one that has not launched, one that failed, and a
rehearsal. Read the answer, not the status: when the link is absent, promise no report.

Everyone in the study's organization can open the report once it is open, with no publishing; who else can is the
study's `visibility` (see publish.md). The report link never carries a share token.

The link is the study's current address. It changes only if the study is published under a different slug
(`ora study publish --slug`), and the earlier link then stops opening (see publish.md).

Give the person the report link when you launch, and again with the results. Before the study completes, say that
it opens when the study completes. A CLI newer than 0.30.0 ends `ora study launch`, `run`, `get` and `publish` with
the link on a line of its own: `Report: <url>`, or `Report (opens when the study completes): <url>` until then. With
`--json` the line is not printed and the link is read from the answer.

## The launch record

`study.launch` in `ora study get <id> --json` says how the launch went: `state` (`fanning_out`, then `settled`),
`planned` and `created`. When `launch.missing.retryable` is above 0, planned runs were not created; when
`study.relaunchable` is true, `ora study launch <id>` again creates exactly the missing runs, never a duplicate. Ora
also retries a launch that left runs missing on its own, and records it in `launch.recovery`; after its last attempt it
stops (`needs_attention`) and waits for you.

A study whose environment needs building first waits in `preparing` (`study.preparation`) before its runs start.

## When the numbers are final

`completed` means every run ended, often before the judge has finished. The numbers are final when the study is
settled: `ora study settlement <id>` answers `state` (`settled` or `pending`) and what is still `owed` (`runs`,
`grading`, `screens`). `study.executiveSummary` is written by itself once grading has settled. Do not report figures,
and do not publish, before that.

## Re-running what infrastructure lost

`ora study rerun-infra-failures <id> --dry-run` lists the jobs whose run Ora's own infrastructure killed, plus jobs the
launch never created. The same command without `--dry-run` re-runs exactly those, each in its job's place; `--limit`
bounds one call. At most 2 re-runs per job; a published study must be unpublished first. `byGroup` counts them per
group, so the two sides of a comparison read apart. `ora study rerun-attempts <id>` lists every re-run.

A run the agent itself failed is a result, not an infrastructure failure: never cancel a run to redo it.

## Adding agents to a launched study

`ora study add-agents <id> --file add.json --dry-run` with `{ "group": "<key>", "agents": [{ "harness": "...", "model": "..." }] }`
answers the plan and writes nothing: the agents added, those already present, the runs to create, and every
comparison before and after. `group` is required when each group runs its own agents. A comparison may only gain
agents; a change of basis is refused. Without `--dry-run` it creates exactly those runs in the same study; a completed
study re-opens and completes again by itself.

## Stopping a study

`ora study stop <id>` starts no more runs, cancels the unfinished ones and completes the study with the runs that had
finished. It cannot be undone. To stop a study, stop it: never cancel its runs one by one.

## Pacing the starts

Every run of a study starts within minutes of launch. When a group calls a rate-limited service, declare how fast the
study may start runs:

```json
"pacing": { "maxInFlight": 4, "startsPerMinute": 6 }
```

`maxInFlight` caps the runs unfinished at once, `startsPerMinute` the runs started in any minute; either, or both.
Runs start in waves of whole comparison units, so a comparison is never split across time: each value must be at
least the number of groups that run one agent (`study_pacing_invalid` otherwise). Pacing is frozen at create.
`rerun-infra-failures` is not paced: pass `--limit`.
