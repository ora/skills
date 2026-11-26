# Read, trace, report and compare

## Contents

- Reading the results
- Runs that never reached the site
- Tracing a failure to a page
- Check the claim before it goes in
- Findings (and observations from reading the site)
- Compare
- Noise
- Look for gaps again
- What next

## Reading the results

Every command answers `{ "success": true, "data": { ... } }`. Read them in this order and save each
answer as `ora-markdown/<host>/results-<n>/<command>.json`, where `<n>` is the measurement's place in
the loop (1 for the baseline).

1. `ora goals report <id>`: the answer score, each criterion as `passed` of `judged` (`criteria.criteria[]`,
   with `byAgent`), and the prompt x agent `grid`. `criteria.latest` and `criteria.previous` are the last
   two measurements.
2. `ora intents insights <id>`: `change` (against the measurement before, with `newFailures`, `fixed`
   and `flipped`), ranked `issues[]` with evidence and quotes, `failedPages[]` with a `cause`
   (`page_not_found`, `page_error`, `http_error`, `bot_wall`, `js_rendered_shell`), and per prompt what
   each agent said, with `failedChecks[]`.
3. `ora intents answers <id>`: every answer with each criterion's `result` (`met`, `partly`, `not_met`,
   `not_applicable`, `couldnt_measure`), the judge's `reason` and a `quote`.
4. `ora intents analytics <id>`: layers (`discovery`, `access`, `use`), positioning, each agent, and the
   `sources` agents cited (`ownership: "own"` is the person's site).
5. `ora intents history <id>`: every measurement, newest first.

Read positioning over `yes + depends + no` only. `none` means the question did not ask for a pick, which
is right for a how-to question.

## Runs that never reached the site

Before tracing anything, set apart the runs whose agent never got the site's pages: the answer says the
site timed out or could not be reached, the site's own pages fail in `failedPages[]` with `http_error`
or `page_error` across most runs at once, or the run opened no page of the site and the judge marks its
criteria `couldnt_measure`. These runs measure an outage, not the Markdown.

- Count them per agent and measurement, and report them as their own finding: "12 of 14 ChatGPT runs
  could not reach the site".
- Leave them out of content findings, and never credit or blame an edit for them. When their number
  differs between two measurements, say the comparison is not like for like, and offer to measure again
  once the site answers (`SKILL.md`, step 3).

## Tracing a failure to a page

For each criterion that failed in more than one run:

1. Read the judge's `reason` and `quote` in `ora intents answers`, and the agent's words in `insights`.
2. Find the page that holds the fact: the `source_url` in `facts.json`.
3. Did agents open it? Look in `failedPages[]`, the cited `sources`, and the page's agent requests in
   `ora front pages list`.
4. Read what agents get there: `ora front pages get <site> <pageId>`, `agentVersion.content`.

Then the cause is one of:

| What you see | Cause |
|---|---|
| The page failed with `bot_wall`, `http_error` or `page_error` | The site refused or broke. Not Markdown |
| The page failed with `js_rendered_shell`, or the fact is on the live page but not in `content` | The agent version misses the fact |
| The fact is in `content`, but far down, under slogans, or another page contradicts it | The agent version hides or confuses the fact |
| Agents never opened the page, and nothing they opened links to it | Agents cannot find the page |
| An answer gives a value the page no longer shows, taken from `/ask` or the MCP tools | Front's last read is older than the page (`front.readAt` in `ora front pages get`). Not the Markdown: a rebuild in Studio fixes it |
| The fact is nowhere on the site | The site does not publish it: a "not available" entry, or a question |
| Agents read the fact and still chose another product | Positioning. Not Markdown |

## Check the claim before it goes in

A sentence about why agents fail needs the runs that show it. Count them: how many runs, agents and
pages. When the evidence is thin (one agent, two runs, one page), narrow the sentence to what was seen,
or leave it out. Mark your own conclusions as yours ("we think", "likely"), and the judge's as the
judge's.

## Findings

Show the person 3 to 5 findings, for their information, before any proposal. Each one:

- a title a reader understands alone, with the number: "7 of 12 answers gave no retention period for the
  Growth plan", not "Retention gap"
- the layer, when the evidence makes it clear: `discovery` (was the brand put forward), `access` (did
  the agent get a full answer from the site's own pages), `use` (MCP or API calls)
- one short agent quote, with the agent named, when it explains the finding
- the page or pages involved
- the denominator: "of the 12 answers to the 3 pricing prompts". Count over the prompts that ask for
  the fact, not every prompt the criterion was judged on: when only 2 of 5 prompts ask about returns,
  it's "0 of 4 answers", not "0 of 10" (`intents.md`, "Criteria")

Findings name problems. No fixes, advice or "should" in them: the cards come next. Save them as
`findings-<n>.md`.

### Observations from reading the site

What step 1 noted while reading the site, and no run has tested yet, is shown after the findings, under
its own heading. It can still be worth the person's time even when no run supports it: a stale date, a
question agents ask that no page answers, a fact that differs between two places. For each one, say
why it came up and what backs it: "seen on the home page: 'order by 18 December 2025'. No prompt asked
about Christmas, so no run tested it." Never count one as a finding, and when a run later confirms it,
move it up to the findings with its numbers.

## Compare

After every measurement past the baseline, show one table with the same measures as the baseline,
before and after, with the run counts. The before is this loop's fresh baseline, never a result from
before the loop began:

| Measure | Before (measurement 1) | After (measurement 2) |
|---|---|---|
| Answer score | 41 | 58 |
| States Growth retention | 5 of 12 | 10 of 12 |
| Pages that failed | 3 | 1 |

Take every number from the saved answers: `criteria.latest` and `criteria.previous` in `ora goals
report`, `change` in `ora intents insights`, the rows of `ora intents history`. Then, for each edit in
`edits.json`, say whether the criterion its card expected to move did move, and quote `flipped[]` for
the answers that went from not met to met, or back.

Before you credit an edit, check that nothing else changed: the agents (`ora intents get <id>`), the
criteria and prompts (frozen), and the live page (`generatedContent` against `.before.md`). Say so when
something did.

Save it as `compare-<n>.md`.

## Noise

A measurement is one run per prompt per agent, and agents answer differently from run to run. A
criterion that moves by one or two runs is within noise: say so plainly, and don't call it a gain or a
loss. When the person needs more confidence, offer one more measurement, or `ora goals results <id>
--window 7d` over several measurements, and say what it costs. Never start it without a yes.

## Look for gaps again

After the comparison, go back to "Tracing a failure to a page" with the new results:

- what is fixed: say which edit it follows
- what still fails: trace it again, the cause may differ now
- what started failing (`change.newFailures`, `flipped` from met to not met): when it is on a page you
  edited, the edit may have caused it. Propose reverting that edit, with the evidence

These become the next `findings-<n>.md`, and the loop goes on from the proposals, with the person's
yes at every checkpoint.

## What next

Recommend one option, with the numbers behind it. The person decides.

- **More changes**, when a failure that remains traces to the Markdown and a card for it can pass the
  validity checklist.
- **Revert**, when an edit is followed by a new failure on the page it changed, in more than one run.
  An edit whose criterion did not move, or moved within noise, can stay while it is true: say that it
  showed no effect, and let the person choose.
- **Schedule**, when the person wants to see whether the results hold over time.
- **Stop**, when the criteria pass, when what still fails is not in the Markdown (positioning, a
  refused page, information the site does not publish), or when the next measurement would cost more
  than the person wants to spend.
