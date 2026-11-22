# Designing a study

## Contents

- The body
- Groups
- Setups: add-ons, skills, MCP servers, tools
- Agents: one set for every group, or each group its own
- A whole body, as flags and as a file

## The body

A study is created with `"comparisonMode": "multi_arm"` (the default; send it anyway). The fields a person sets:

| Field | What it is |
| --- | --- |
| `name`, `description` | What a reader sees. Say what the tasks are, what the groups are, and how runs are graded |
| `subjectKind` | `custom` (the default), or `benchmark` with `definitionVersionId` (see tasks-and-grading.md) |
| `subjectName`, `promise` | What is under test and the claim, in one sentence. Required for `custom` |
| `arms` | The groups, 1 to 6 (`--group`) |
| `contrasts` | Which pairs are compared when there are 3 or more groups: `vs_reference` or `all_pairs` |
| `matrix` | The agents every group runs (`--agent`), 1 to 48 |
| `lenses` | How runs are graded: `judge`, `evals` |
| `tasks` | An authored corpus (`--task`), or `taskCount` for a generated one |
| `variantsPerTask`, `repeats` | Paraphrases of each task, and identical re-runs of each condition |

`ora study create --help` describes every other field (pacing, screens, behaviors, series, and more), with the
values each takes.

## Groups

Each group in `arms`:

| Field | Rule |
| --- | --- |
| `label` | Required, up to 80 characters, unique in the study. Never shown to the judge |
| `key` | Optional: a lowercase letter, then letters, digits or dashes, up to 10 characters. Defaults to `g1`, `g2`, ... A check can be scoped to a group by its key |
| `role` | `reference` on at most one group, never on a 1-group study. Every other group is a peer |
| `config` | What the group runs: `addons` and/or `tools`. `{}` is the agent as published |
| `cells` | The group's own agents (below) |

As a flag: `--group "As published,role=reference"`, `--group "With docs,config.addons.<id>=<json or @file.json>"`.
A label alone runs as published.

- With 2 groups and one reference, the comparison is oriented: B against A. With no reference, the two are peers.
- With 3 to 6 groups, `vs_reference` compares every group with the reference (the default when one is marked) and
  `all_pairs` compares every pair (the default otherwise, at most 4 groups). 5 or 6 groups therefore need a
  reference.
- Two groups with the same configuration on the same agents are refused: they would measure noise.

## Setups: add-ons, skills, MCP servers, tools

A group's `config.addons` maps an add-on id to its settings. `ora study addons list --harness <harness> --surface run --json`
lists the add-ons a harness can run and what each takes.

- **A skill** rides the `skills` add-on: `"skills": { "skills": ["custom:<id>"], "delivery": "pointer" }`. Refs are
  `builtin:<id>`, `custom:<id>` (from `ora study skills list`) or a git-imported skill. `ora study skills create`
  adds one of the person's own. `delivery: "pointer"` makes reading the skill a step of its own in the trace, so
  "did the agent load it" can be answered.
- **An MCP server** is the `mcp` add-on, one server per entry, keyed `mcp#<label>`:
  `"mcp#docs": { "name": "docs", "transport": "http", "url": "https://docs.example.com/mcp" }`. `stdio` needs an
  exact-pinned `package`. Headers and environment values can be bound to the org's secrets (`envBindings`), never
  written into the body.
- **Tools** (`"tools": "default" | "none" | {"tools": [...]}`) apply to model-API agents only: a harness brings its own
  tools, so two groups that differ only in `tools` on a harness-only study are refused.
- A group may carry several add-ons and skills at once.

Every tool of an attached MCP server can be called. When a study must not write anything, say so in the prompt and
add a `tool_not_called` check for each tool that writes, so a run that called one is flagged.

## Agents: one set for every group, or each group its own

By default every group runs the whole `matrix`. To give groups agents of their own, every group lists `cells` (all
groups or none), and the groups' sets must not all be the same. Each comparison then has a **basis**, which preflight
prints:

- `matched`: the groups share agents. They are compared agent by agent, on the agents both ran.
- `whole_setup`: they share none. Each group's figure averages its own agents; the study may claim "setup A against
  setup B", never the effect of one agent inside a set.

As a flag, a group's own agent is `agent=<harness>/<model>` inside its `--group` value.

## A whole body, as flags and as a file

Flags (each `--agent` adds to `matrix`, each `--group` to `arms`, each `--task` to `tasks`):

```sh
ora study preflight --name "Docs MCP for billing questions" --subject-name "Docs MCP server" \
  --promise "With the docs MCP server, agents answer billing questions correctly more often" \
  --agent <harness>/<model> --agent <harness>/<model> \
  --group "As published,role=reference" --group "With docs,config.addons.mcp#docs=@docs-mcp.json" \
  --task @task-1.json --task @task-2.json --lenses judge,evals --repeats 3 --json
```

The same study as a file (`--file study.json`):

```json
{
  "name": "Docs MCP for billing questions",
  "subjectKind": "custom",
  "subjectName": "Docs MCP server",
  "promise": "With the docs MCP server, agents answer billing questions correctly more often",
  "comparisonMode": "multi_arm",
  "arms": [
    { "key": "bare", "label": "As published", "role": "reference", "config": {} },
    { "key": "docs", "label": "With docs", "config": { "addons": { "mcp#docs": { "name": "docs", "transport": "http", "url": "https://docs.example.com/mcp" } } } }
  ],
  "matrix": [{ "harness": "<harness>", "model": "<model>" }],
  "lenses": ["judge", "evals"],
  "repeats": 3,
  "tasks": [
    {
      "prompt": "How do I get a refund for an annual plan cancelled in the first month?",
      "rubric": ["States the refund window for annual plans.", "Says how to request the refund."],
      "expectations": [{ "kind": "mcp_tool_called", "label": "used the docs", "tool": "search_docs", "arms": ["docs"] }]
    }
  ]
}
```

The `arms` on an expectation scopes it to the group with that key: it is reported as that group's adoption rate and
never enters the comparison.
