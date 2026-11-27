# Tasks and grading

## Contents

- An authored task
- Files and repositories in the workspace
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

## Files and repositories in the workspace

A task that says "upload ./product.jpg" or "add a page to my store" needs the photo and the store to be there. `files`
on an authored task puts files and git repositories in the agent's workspace before its first turn. They are part of
the task: every run of it gets the same ones, in every group, on every agent, for every paraphrase and repeat, so
they can never be what a comparison measures. What only one group is given is that group's setup (see design.md).

```json
{
  "prompt": "Write a Node.js script that uploads ./product.jpg and prints the URL to deliver it.",
  "rubric": ["Uploads ./product.jpg.", "Prints the URL from the upload's response."],
  "files": [
    { "path": "package.json", "content": "{ \"name\": \"store\", \"private\": true }\n" },
    { "path": "product.jpg", "url": "https://example.com/fixtures/product.jpg", "sha256": "<64 hex>", "sizeBytes": 48213 },
    { "path": "store", "repo": { "url": "https://github.com/acme/express-store", "ref": "<full commit>" } },
    { "path": "billing", "repo": { "url": "https://github.com/acme/billing-service", "ref": "<full commit>",
      "credential": { "secretId": "<id of the organization secret that holds a read token>" } } }
  ]
}
```

Declare them in the body file or in a `--task @task.json`, or in the Study app's builder (each authored task has a
Files section). Each entry has a `path` and exactly one source:

| Source | Fields | For |
| --- | --- | --- |
| Inline text | `content` | Source files and small fixtures |
| A verified download | `url`, `sha256`, `sizeBytes` | Anything binary or large |
| A git repository | `repo`: `url`, `ref`, optional `subpath`, optional `credential` | An existing codebase the task works in, public or private |

- **`path`** is relative to the workspace root, where the agent starts: no leading `/`, no `.` or `..` segment, and
  not under a dot entry of the root (`.claude/notes.md` is refused, `store/.gitignore` is fine). No path twice, and no
  entry inside another.
- **Not an agent's instruction file.** A file named AGENTS.md, CLAUDE.md or CONVENTIONS.md at the workspace root is
  refused: a group's setup lists its skills there, and a task's file would replace that list for every group. A file
  of that name deeper down (`store/AGENTS.md`) is fine.
- **Inline text is not empty.** Give an empty file a single newline.
- **A download** is fetched over HTTP or HTTPS inside the run before the agent starts, and admitted only when its
  bytes match `sizeBytes` and the lowercase hex `sha256` (`sha256sum product.jpg`, `wc -c < product.jpg`). A file
  that changed upstream never becomes a different task. The address must answer without a login and be plain: one
  with a user name, a password or a query string is refused, because it is stored and shown with the task.
- **A repository** is cloned into its `path` with its `.git` directory, so the agent can read history and commit.
  `url` is the plain `https://` address of the repository, with no credential in it. `ref` is a full commit (40 or 64
  hex characters): a branch or a tag is refused, because it can move and the task would change under the study.
  `subpath` puts one directory of the repository at `path` and leaves the rest out.
- **A private repository** adds `"credential": { "secretId": "<id>" }`: the id of an organization secret whose value
  is a token that can read the repository (on GitHub, a fine-grained token with read-only Contents on that one
  repository). Never put a token in the address or anywhere in the body. Ask the person to store the token as an
  organization secret themselves (the Study app's Secrets page, or `ora study secrets create` in their own terminal),
  then read its id with `ora study secrets list --json`; do not ask them to paste the token to you.
  - Nothing of Ora reads the token. Each run fetches it itself when it boots and uses it for the clone only. The
    agent starts with the repository checked out and without the token: it is not in the agent's environment, in the
    checkout's git configuration or in any file of the workspace, so the agent cannot fetch from or push to the
    private remote.
  - Preflight and create check the secret as the caller: it must be the organization's, and the caller must be
    allowed to bind a secret (any role except Viewer; an API key also needs the `secrets:bind` scope). Otherwise the
    answer is 422 `study_subject_invalid`, naming the task and the repository.
  - Not every deployment clones private repositories. One that does not answers 422 `study_subject_invalid` with
    "does not clone a private repository before the agent starts". Tell the person so; do not work around it by
    asking the agent to clone, because a clone by the agent is part of what the study would measure.
  - A published page shows a private repository as its path and the words "Private repository": no address, no
    commit, no secret. A published study still shows what each agent read and wrote, so its runs can show the
    repository's contents. Say this before publishing.
- A download that does not match or does not answer, a commit that cannot be cloned, a secret that can no longer be
  fetched or a token the git host refuses fails the run before its agent starts. The run's reason says which step
  failed and what it said.

| What | Limit |
| --- | --- |
| Entries per task (files and repositories) | 16 |
| Repositories per task | 4 |
| One inline file | 64,000 characters |
| A task's inline files together | 256,000 characters |
| One downloaded file | 25 MiB |
| A task's downloads together | 100 MiB |

- Only an agent proven to work where the files are put can be given them. Create and `ora study preflight` refuse a
  matrix with any other agent (one that works elsewhere in its workspace, a model API agent, a desktop app) with
  `study_matrix_invalid`, naming it.
- Files are frozen at create: `ora study update-task` does not change them.
- A run's delivered files (`ora study run-delivered`) are the ones the agent created or changed. A file it was given
  and never touched is not listed as its work.
- The files are part of the task's identity. Two studies whose tasks differ in a file's path or contents, or in a
  repository's commit or subpath, are different corpora: the gate and a series trend do not compare them. Moving a
  download or a repository to another address, with the same bytes or the same commit, keeps the task the same.
- A published task's files are published with its text, and `private: true` withholds them with the rest (see
  publish.md).

## Rubrics that grade correctness

The judge reads the rubric, the agent never does. Put one correctness criterion per value a correct answer must
contain in the rubric ("Reports the price as $49"), never in the prompt. A rubric that grades only presentation
lets a well-presented wrong answer win.

## Deterministic checks (the evals lens)

Each expectation is a check over the run: what the final answer contains or matches (`response_contains`,
`response_matches`), which tools were called or not (`mcp_tool_called`, `tool_not_called`), whether a named skill was
loaded (`skill_loaded`), whether a shell command matching a pattern ran (`command_ran`), and how much the run used
(`token_budget`). `arms` on an expectation scopes it to the groups with those keys.

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
