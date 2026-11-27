# Designing a study

## Contents

- The body
- Groups
- Setups: add-ons, skills, MCP servers, tools
- Preinstalled packages
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
- **An organization secret** (a key the agents use, an MCP server's header, a token for a private repository) is
  stored once and named in the body by its id. With a CLI newer than 0.32.0: `ora study secrets list --json` lists
  each secret's name and id (never a value: none can be read back), `ora study secrets create` stores one and answers
  its id, and `ora study secrets delete <id>` removes one. Older CLIs: the person adds it in the Study app (Secrets).
  A Viewer lists names only and can neither create nor delete. Never ask the person to paste a secret's value to you:
  they create it themselves, or you create it from a file they keep (`.env`) without printing it, for example
  `jq -n '{name: "MY_KEY", value: env.MY_KEY}' | ora study secrets create --file - --json`.
- **Tools** (`"tools": "default" | "none" | {"tools": [...]}`) apply to model-API agents only: a harness brings its own
  tools, so two groups that differ only in `tools` on a harness-only study are refused.
- **Web tools off** is the `web-access` add-on: `"web-access": { "mode": "off" }` switches off the agent's own web
  search and page fetch on Claude Code, Codex and the desktop apps. Use it, not `tools`, to compare a harness agent
  with and without its web tools. It does not block the network: an agent that can run a command can still reach the
  web that way. So every run of that group is checked for web use, a run that reached the web is labelled "Reached
  the web", and the report's "Web tools off" section counts those runs per group. Never describe such a group as
  offline. `"mode": "hosts"` with a `hosts` list holds a desktop app to those hosts; Claude Code and Codex refuse it.
- **A command-line tool or a library** the group should already have is the `packages` add-on (next section).
- A group may carry several add-ons and skills at once.

Every tool of an attached MCP server can be called. When a study must not write anything, say so in the prompt and
add a `tool_not_called` check for each tool that writes, so a run that called one is flagged.

## Preinstalled packages

A study that compares "the agent with our CLI" with "the agent as published" needs the CLI to be there, the way it is
on a developer's machine. The `packages` add-on installs exact-pinned public packages into a group's runs before the
agent starts and puts their commands on its PATH. The install is setup: it costs the agent no time, tokens or turns,
and nothing tells the agent the tool is there. Whether the agent finds and uses it is what the study observes.

```json
"packages": { "packages": [{ "manager": "pip", "name": "cloudinary-cli", "version": "1.18.0", "commands": "cld" }] }
```

| Field | Rule |
| --- | --- |
| `manager` | `pip` (PyPI) or `npm` |
| `name` | The package's name in its registry. A name only: no version, no extras, no URL |
| `version` | One exact version. A range, a specifier (`>=`, `~=`, `^`, `*`) or a tag such as `latest` is refused |
| `commands` | Optional. The command names the package puts on PATH, separated by spaces: `cloudinary-cli` provides `cld` |
| `integrity` | Optional. Verified at install: an npm SRI hash (`sha512-...`) or a pip digest (`sha256:...`) |

- **Name `commands` for every package that provides one.** The study reads "did the agent use the package" from
  those names. With them it can say the agent did not use the package. Without them it tries the package's own name
  and can only say that the agent did: when nothing ran, the answer is "not measured", never "not used".
- One entry lists 1 to 8 packages, from either manager. The add-on can be attached more than once
  (`packages#cli`, `packages#lint`), each with its own list. A run takes at most 16 installs in all, counting what
  other add-ons install.
- The same package twice in one list is refused at create. Two entries that install it at different versions are
  refused at launch (`addon_conflict`).
- The order of a list means nothing: two groups whose lists differ only in order are the same setup, and two groups
  with the same setup are refused.
- It is offered only on agents proven to install from that manager and run the result.
  `ora study addons list --harness <harness> --surface run` lists `packages` for those. Create refuses a group whose
  package needs a manager one of its agents is not proven for, naming the agent and the manager.
- Public packages only. It runs no setup script and writes no config file. A credential the tool needs rides the
  `secrets` add-on with `exposeToShell: true`, so the tool can read it.
- The prompt is the same for every group, so do not use it to tell the agent about the tool.
- Set `integrity` on a pip package only when it has no dependencies: once one package carries a hash, pip wants one
  for every dependency too.

Rehearse the group before the study (see check-and-rehearse.md). To report how often the agent used the tool, add a
check scoped to the group: `{ "kind": "command_ran", "label": "used cld", "pattern": "(^|[\\s;&|(])cld\\s", "arms": ["cli"] }`.
The Study app's builder can fill this add-on in too.

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
