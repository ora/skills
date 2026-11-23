# Checking and rehearsing a design

## Contents

- Preflight: what create would answer, for free
- A model's review of the texts
- Rehearsal: one real run per group
- Rehearsing every agent
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
not start. `--tasks 3` rehearses up to 3 tasks, and `--agents all` every agent of each group (below).

Each group's checks:

- `runs_finished`, `no_infra_failure`, `agent_finished`, `graded`;
- `setup_used`: did the group's own add-on or skill get used, read from the trace. A group whose run finished
  without using its setup is `not_ready`: that is the failure a rehearsal exists to catch. `unknown` means the trace
  cannot answer for that agent: prove that group by hand (below).
- `setup_used` for a group whose only add-on is web access left on (`web-access`, `open` or a host list): did the
  agent use its own web tools. A step counts when it carries a page's address or a search query and was made by the
  agent's web tools, its shell or its script tools. A call to an MCP server the group attached and a request to a
  loopback address do not count. A group that also has an MCP server or a pointer-delivered skill is answered for
  those. `unknown` here means this agent's trace is not proven to show every way it reaches the web.
- `setup_used` for a group that carries preinstalled packages (the `packages` add-on): did the agent run one of the
  packages' commands. A command run behind `sudo` or `timeout`, inside a loop, or inside the shell an agent wraps its
  commands in (`bash -lc "..."`) counts. A run that only looked for the tool (`which cld`), named it in a message or
  installed it again does not. When nothing ran, the answer is `fail` only if every package of the group names its
  `commands`; otherwise it is `unknown`, because a library provides no command at all. A group that also has an MCP
  server or a pointer-delivered skill is answered for those.
- `web_tools_off`, asked of a group that runs with web tools off (the `web-access` add-on, `"mode": "off"`): `fail`
  when a rehearsed run reached the web anyway (the detail names the run and the step), `pass` when none did and a
  rehearsed task needs the web (`"requiresWeb": true`), `unknown` otherwise. A task that needs no web cannot show the
  tools were off, so put a task that needs the web first. A `fail` is not a broken setup: the switch is on the
  agent's own tools, not on the network, and the agent reached the web another way. Such a group is not asked
  `setup_used`, unless it also carries another add-on.

The runs are real and counted. A rehearsal cannot be published: delete it when done (`ora study delete <id>`).
`--mode setup` boots each group's environment without starting an agent, and `--mode mock` also grades a fixed
answer, where the deployment offers them. Neither can show that a setup was used; rehearse `live` before launching.
Tasks still to be generated cannot be rehearsed (`study_rehearsal_unsupported`).

## Rehearsing every agent

By default a rehearsal runs one agent per group: the first of the `matrix`, or the first of the group's own `cells`.
That proves the group's setup on that agent and on no other. A setup attaches per agent, so a group that works on one
harness can still be broken on another, and with one agent rehearsed that is found only after the full study.

`ora study ci rehearse --file study.json --agents all` runs every agent each group runs, on the rehearsed tasks, with
one variant and one repeat. Groups that share the `matrix` each run the whole matrix; groups that list their own
`cells` each run their own.

- Each agent is a real, counted run. The run count is the rehearsed tasks times the sum of the groups' agents: 2
  groups sharing 3 agents on 1 task are 6 runs, where the default is 2.
- `setup_used` is asked of each agent, and the group passes only when every rehearsed agent used the setup. When one
  did not, the check fails and its sentence names that agent, then the agents that passed. The group's answer is the
  weakest of its agents': `fail`, else `pending`, else `unknown`, else `pass`.
- The other checks hold every run to the same rule and do not name the agent: the rehearsal's own runs say which one
  it was (`ora study get <rehearsalId> --json`).
- `--agents` combines with `--tasks` and `--mode`. With `--mode setup` or `--mode mock` every agent's environment is
  booted, so an agent that has none of its own (a model API agent) is refused wherever it stands in the matrix
  (`study_rehearsal_unsupported`).
- The answer says what ran: `agents` is `first` or `all`. `ora study ci rehearse` stops with exit 3 when it asked for
  `all` and another selection was started. Delete that rehearsal: its "ready" speaks for one agent per group.
- `ora study rehearse`, which starts a rehearsal without waiting for it, takes the same flag; its answer names the
  `agents` it started, and `ora study rehearsal-report <id> --json` reads the report.
- `--agents` is newer than CLI 0.30.0. `ora study ci rehearse --help` lists `--agents` when your CLI has it. When the
  command answers that `--agents` is an unknown option, update the CLI (`npm install -g @ora-ai/cli`) and look again.
  Until your CLI has it, a rehearsal proves the first agent of each group only: prove the others by hand (below).

## Proving a setup by hand

When a check answers `unknown`, create the same body over one or two tasks, launch it, and for every group that
carries an add-on read a run's trace: `ora study run-trajectory <id> <runId> --json`. Its steps must show a real tool
call from that add-on (`steps[].mcp`), and the tool's answer must hold data, not an error or an empty list. A run that
succeeded with no call proves the add-on never attached. Runs carry their group's key in `runs[].arm`. A web access
group attaches no server: look for a step with `url_host` or `search_query` that is the agent's own (no `mcp` on it,
and not a loopback address).

`ora study delete <id>` archives a study: it leaves the default list and every public page, and is read-only until
`ora study restore <id>` brings it back.
