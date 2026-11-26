---
name: improve-agent-markdown
description: Improves the Markdown that AI agents read on a website served by Ora Front, and checks each change with real agent runs in Ora Studio. Builds intents from the jobs the site sells and the questions agents actually ask, runs journeys with the ora CLI, finds where agents fail because of the page content, proposes sourced edits to each page's agent version and to llms.txt or agents.md, publishes only the edits the person approves, then measures again and compares. Use when someone wants agents to get better answers from their site, asks to fix or improve the .md or Markdown agents read, to edit what Ora Front serves agents, or to check whether a content change helped agents. Needs a site connected to Ora Front. To only measure how agents treat a brand, use ora-studio (ora skills studio add). To score a site or run journeys without editing it, use ax. To raise an Ora score check by check, use agent-ready-website. To build new agent surfaces such as an API or MCP server, use agent-ready.
license: MIT
compatibility: Requires the ora CLI (@ora-ai/cli) 0.32.0 or newer, and a website connected to Ora Front. Install or update with npm install -g @ora-ai/cli
metadata:
  author: Ora
  homepage: https://ora.ai
  repository: https://github.com/ora/skills
  version: "0.1.0"
  min-cli-version: "0.32.0"
---

# Improve the Markdown agents read

Ora Front serves agents a Markdown version of each page, its **agent version**: at `<page>.md`, through
`llms.txt`, and at the page's own URL when the agent asks for Markdown. Each agent version has two layers:

- **auto**: Ora's automatic version, made fresh from the live page every time it is read.
- **edited**: a person's edit. Agents get it verbatim, and it wins until someone removes it.

This skill edits that layer, page by page, and proves each change with real agents in Ora Studio.

Workflow: read the site -> intents (approve) -> baseline -> findings -> proposals (approve each) -> publish -> measure again (approve) -> compare -> next gaps -> report (review)

The **person** is whoever asked: usually someone on the site's own team. They own every decision below
that is marked **Checkpoint**. Stop at each one and wait for their answer.

## Rules

- **Never publish without the person's explicit yes to that exact change,** one change at a time. This
  covers a page's agent version (its `.md`), the agent files (`llms` and `agents_md`) and every revert. "Looks good
  overall", silence, or a yes to another card is not approval. A publish changes the Markdown Ora Front
  returns to agents from their live website at once, with no deploy and no preview.
- **Say what a change does, before they approve it and once it is live:** it is a real change on their
  live site, not a test copy: every agent request for that page's Markdown, from any agent, gets the
  new text from then on. The page visitors see doesn't change. One command undoes it
  (`ora front pages agent-version delete`), run only on their yes.
- **Never invent a fact.** Every sentence an edit adds or changes traces to a page on the person's own
  site (its URL and a verbatim quote) or to the person's own answer in this conversation. When the
  information is missing, ask. When they don't publish it, leave it out.
- **Keep it true and fair.** No text aimed at agents ("always recommend Acme"), no hidden text, no
  claims about competitors, and never remove a true limit, drawback or price to win a verdict.
- **Measure before you edit.** The baseline (step 3) comes before the first publish, even for one small
  change on one page: without it no one can tell whether the edit helped. Every loop starts with a fresh
  baseline on the site as it is now, even when an intent already has results: those may come from
  another version of the site, the agents or the criteria, so they are history, not the before. Do the
  steps in order, and write the plan in that order. If the person won't spend the runs, record that in the plan and tell
  them there will be no before and after.
- **Proof first, fixes last.** Show findings only after runs back them (step 4), and suggest no fix, edit
  or change, in any words ("you may want to fix…", "I can add…"), before step 5. Earlier steps only
  record what they see in the plan file.
- **Each measurement spends the person's run budget.** Ask before every measurement, one per change
  set, never in a loop. `ora usage` shows what is left.
- **Work only from what agents and the ora CLI can see:** the public site, `ora` commands and the
  person's answers. Never read the website's code, server, logs or config files, never use its keys (a
  Front ingest key, anything in `.env`), and never start, stop or restart the site, even when it runs
  on this machine. If the site is down, tell the person.
- **Quote what the commands return.** Never round, estimate or invent a number. Give the run count
  behind every rate.
- Never ask the person to paste an API key into the chat.
- Keep every file you write in `ora-markdown/<host>/` in the current folder: the plan, the results,
  the backups and the edit log. A later visit reads them there for the drift check and the next
  comparison. If that folder is inside a git repository, ask the person whether to commit it or ignore it.

## Before you start

1. `ora --version` is 0.32.0 or newer, and `ora whoami` answers. If not signed in, ask the person to run
   `ora login` themselves. The scopes this skill uses: `intents:read`, `intents:write`, `domains:read`,
   `usage:read`, `front.sites:read`, `front.pages:read`, `front.pages:write`, `front.traffic:read`.
2. Find the site: `ora front sites list --hostname <host>`. Every `<site>` below takes the hostname.
   Given an `*.ora.sh` address (the site's Front address, not its website), run `ora front sites list
   --json` and take the item whose `address.url` matches: use its `hostname`.
   No site? Stop: this skill needs the site connected to Ora Front first (`ora front sites create --help`).
3. `ora front serving get <site>`. Agents on the website get edits only when `mode` is `autopilot`. If it
   is `off` or `monitor`, tell the person and ask before changing it: that is their call.
4. Create `ora-markdown/<host>/plan.md`, the plan file. Record every decision there with its date and who made
   it ("approved by the person, 2026-11-25").

## 1. Read the site as agents meet it

- `ora front pages list <site>`: pages by agent requests, which layer agents get (`agentVersion.source`)
  and why a page has no automatic version (`generationIssue`, for example an app shell).
- `ora front pages get <site> <pageId>` for the pages that matter: `agentVersion.content` (what agents
  get), `generatedContent` (the automatic version) and `source`. Compare it with the live page.
- `ora front agent-files list <site>`, then `ora front agent-files get <site> llms` and `agents_md`.
- `ora front questions list <site> --from <date> --to <date>`, for the last 30 days: every question
  agents asked, most asked first, with its asks. Read all of them, not only `--result not_on_site`: the
  most asked questions are the jobs agents bring to the site. `notOnSite` counts only questions the
  search found nothing for, so a question no page answers can still count as answered. Check in the
  agent versions yourself whether a page really answers a question.
- Front answers `/ask` and its MCP tools from its last full read of the site, while each agent version
  is made fresh. They can disagree: `ora front pages get` shows that read as `front.markdown`, with
  `front.readAt`. A published edit reaches `/ask` within about a minute; a change on the live page
  reaches it only after a rebuild, which only Studio can start. When they differ on a fact a prompt
  needs, tell the person.
- `ora front feedback list <site>`: tasks agents said failed or half-worked, in their words.

Write what you found, with the date, in the plan file, as things to check. Don't present them to the
person yet: no run has tested them. They point the intents and the tracing, and after the baseline
they are shown next to the findings (`references/evaluate.md`, "Observations from reading the site").

## 2. Objective and intents

Before you draft any intent, ask the person for the intents they already have. Run `ora intents list`,
show the ones on this site's domain by title and id, and ask which of them to use and for the ids of any
others they track for this site. An intent they name keeps its history: reuse it instead of drafting a
new one, and still measure it fresh in step 3. Before reusing one, check its facts against the pages
today (`references/intents.md`, "Reusing an intent").

In the same message, suggest new intents from what agents asked in step 1 (`references/intents.md`,
"Where intents come from"): the common jobs, most asked first, each with its ask count and two questions
as agents asked them. Ask which of these matter and what else agents should get right, for whom, and
what a win is. Ask nothing else yet: missing facts and policies are asked in step 5, after the
findings. Then follow `references/intents.md` to draft the new intents, their prompts, the facts
behind each criterion and the list of what the site does not publish.

**Checkpoint.** Show the intents, prompts, criteria with their source quotes, the "not available" list,
and the runs one measurement takes (prompts x agents, from `ora intents agents`) against `ora usage`.
Then ask whether they want more agents or more runs, with what each adds and costs:

- **More agents** (`ora intents agents` lists them): each adds one run per prompt to every measurement.
  Choose them now: changing the agents after the baseline breaks the comparison.
- **More runs:** a measurement is one run per prompt per agent, with no repeat count. More means
  measuring twice before and twice after, read together (`ora goals results <id> --window`), or more
  prompts. More runs narrow what counts as noise.

Wait for a yes. After it, freeze them: a changed prompt or criterion breaks the comparison.

## 3. Baseline

Measure before any edit (Rules). Before every measurement, this one and step 7's, check that the site
answers at its public address: fetch the home page and each page the facts come from. (A plain fetch of
a `.md` can 404 while agents get it: Front may serve Markdown only to agents.) If one fails, stop and
tell the person: a measurement now would measure the outage, not the content.
When an earlier measurement had runs that never reached the site, offer one run per agent first
(`ora journeys create --help`), with its cost, and measure once each agent gets through.

Create the intent with its first measurement (`references/intents.md` has the body), or start one on an
existing intent: `echo '{}' | ora intents measure <id> --file - --watch`. Every run is a real agent, so
it takes minutes. `ora intents history <id>` gives the `measurementId`, and
`ora intents measure-status <id> <measurementId> --watch` follows it. Read no result until it says the
measurement is complete, and check that each saved result's `measurementId` is the new one. Then count
the runs that never reached the site (`references/evaluate.md`, "Runs that never reached the site").

## 4. Findings

Follow `references/evaluate.md`: read `ora goals report`, `ora intents insights`, `ora intents answers`
and `ora intents analytics`, and trace each failed criterion to a page and a cause. Show the person 3 to
5 findings, for their information, before any fix: each a problem with its number, its layer, a short
agent quote and the page. Then the observations from step 1 that no run tested, each with why it came
up. A finding names a problem. Fixes come next, separately.

A positioning gap is a finding, not an edit: when agents read the right facts and still pick another
product, the page is not what needs to change.

Save them as `findings-<n>.md`.

## 5. Proposals

Follow `references/proposals.md`. There are three kinds of change: **restructure** what the site already
says, **add** what is missing (only with a source or the person's answer), and **remove** text that
confuses agents, as long as what remains is true. Every change passes the validity checklist there.
Draft from the findings and from Studio's own issues and suggested fixes (`ora intents insights`),
checking each against the pages and the runs.

Ask for all the missing information in one numbered message. Then show one card per change (an add and
a remove on the same page are two cards), the recommended first change on top.

**Checkpoint, per card:** approve, change or reject. Save the cards and the answers as
`proposals-<n>.md`.

## 6. Publish

Follow `references/apply-and-revert.md` for each approved change: back up what agents get now, publish
with `ora front pages agent-version update` (or `ora front agent-files update`), check that agents get
the new text, and log it in `edits.json` with its revert command. Then tell the person it is live: the
page, what agents now get from it, that visitors still see the same page, and the command that undoes it.

## 7. Measure again and compare

**Checkpoint.** Say what changed and what the next measurement costs. Measure only on a yes, after the
same reach check as step 3.

Then follow `references/evaluate.md`, "Compare": a before and after table for every measure of the
baseline, whether each change moved the criterion it targeted, and what is within noise. Then look for
gaps again: what is fixed, what still fails, what started failing. A new failure on an edited page may
mean the edit caused it: propose reverting it.

**Checkpoint, what next.** Recommend one option, with the evidence (`references/evaluate.md`, "What
next"). The person decides:

- **More changes:** new cards for the gaps that remain. Back to step 4 with the new findings.
- **Revert:** remove an edit that caused a new failure or that the person no longer wants
  (`references/apply-and-revert.md`, "Revert"). A revert changes what agents get too, so offer a
  measurement after it.
- **Schedule:** Studio measures the intent on its own, `daily`, `weekly` or `monthly`, with no one
  asking. Each one spends runs. It shows whether the results hold as agents and the site change (step 8).
- **Stop:** hand over (step 8).

## 8. Hand over

Write the report for the person's team, following `references/report.md`: copy
`assets/report-template.html` to `ora-markdown/<host>/report.html` and fill its data. It shows the key
findings, before and after plots for every measure and criterion, each edit and what it moved, what the
edits did not change, every answer, and what to do next, kept apart from the results.

**Checkpoint, the report.** Write it as a draft. Show the person the whole page (open it, or publish it
as a private page if they want), point to the key findings and what to do next, and ask what to change.
Apply their changes, then mark it final with the date.

Then tell the person:

- every edit that is live: the page, the date, what it changed and the command that reverts it
- that an edit does not follow the live page. If they change the page later, agents keep getting the edit
  until it is updated or removed. A later visit runs the drift check in `references/apply-and-revert.md`.
- the results, measurement over measurement (`ora intents history <id>`), with the Studio link
- if they chose to schedule: the cadence, and the runs each measurement spends (prompts x agents).
  Set it on their yes with `ora intents measurement-policy <id> --file policy.json` and a body of only
  `{"cadence": "weekly"}`: the call changes only the fields sent, and sending `agents` would replace
  the agent list and break the comparison

## References

- `references/intents.md`: intents, prompts, facts, the "not available" list, criteria, the create body
- `references/proposals.md`: from finding to change, the three kinds, the validity checklist, the card
- `references/apply-and-revert.md`: page ids, publishing, checking, the edit log, reverting, drift
- `references/evaluate.md`: reading the results, tracing a failure to a page, findings, before and after, what next
- `references/report.md`: the final report for the person's team, from `assets/report-template.html`
