# The report

## Contents

- What it is
- Build it from the template
- What stays out
- Sections and their data
- Copy
- Before you hand it over
- Draft, review, final

## What it is

One standalone page, `ora-markdown/<host>/report.html`, written at hand over. Its readers are the
person's team, who did not follow the conversation. It shows what agents got from the site before the
edits and after them, what the edits changed, and what still goes wrong.

It names results and problems, with the evidence and plots, and ends with what to do next. It is the
person's own report, so it can advise, but only in that last section: the findings, plots and numbers
carry no advice, so a reader can trust them on their own.

A short report with three real findings beats a long one. Leave out a section that only repeats
another.

## Build it from the template

1. Copy `assets/report-template.html` to `ora-markdown/<host>/report.html`.
2. Replace only the JSON in `<script id="report-data">`. The page draws everything from it: the hero,
   the plots, the edit cards and the answer list. Don't edit the HTML, CSS or script.
3. Every value comes from the saved results in `results-<n>/`, `edits.json` and `facts.json`. Text
   fields are plain text, and `**bold**` is the only markup they take.
4. Write the JSON with a serializer, never by hand, and turn every `<` into `\u003c`
   (`JSON.stringify(data, null, 1).replace(/</g, "\\u003c")`). An agent answer that holds
   `</script>` would otherwise end the data block and break the page.
5. Remove every `{placeholder}`. An empty list hides its section.

The page has a dark Ora theme and reads at 600px. It opens offline: only the fonts load from Google Fonts, with system fonts as the fallback.

## What stays out

- How the loop ran: commands, file names, page ids, the order of the steps. Measurement ids and
  dates go in Method only, and the revert commands under Method's "Undo a live edit".
- Advice, next steps and "should" anywhere but "What to do next".
- A number that is not in the saved results.
- A claim about why agents fail that no run shows (`evaluate.md`, "Check the claim before it goes in").

## Sections and their data

**Hero** (`site`, `month`, `status`, `title`, `lede`, `keyFindings`, `method`).
- `status`: `{"state": "draft", "date": "2026-11-26"}` until the person approves the report, then
  `"final"` with that date. The page shows it at the top.
- `title`: neutral, naming the site and both conditions: "What AI agents get from example.com, before
  and after the Markdown edits".
- `lede`: one sentence on what was measured: "We asked **4 agents 3 questions** about example.com on
  2026-11-20 and again on 2026-11-25, 12 runs each time, before and after 2 edits to the Markdown
  agents read."
- `keyFindings`: 4 to 6, each a bold `lead` plus at most a short `clause`.
  - One per Overview plot, in the same order and with the same number, then the findings with no plot
    behind them. A useful order: outcome, cause, then what did not change.
  - Each one stands alone: what was counted, out of what, before and after. Not "retention improved"
    but "Answers that gave the Growth plan's 25-month retention went from 5 of 12 to 10 of 12".
  - Say where the edits did not help as clearly as where they did. Within noise is not a gain.
- `method`: runs, agents with their models, the noise note, the prompts as sent, each criterion with
  its fact, source URL and quote, and the date the intents were frozen.

**Overview** (`measurements`, `overview`, `layer`, `criteria`).
- `measurements`: one per measurement in the loop, oldest first. The last one is drawn strong, the
  ones before it dim.
- `overview.measures`: every measure from the baseline, including the ones that did not move. A value
  is `{"n": 10, "of": 12}` for a count, or `{"value": 58, "max": 100, "runs": 12}` for a score, where
  `runs` is how many runs the score averages. Without `runs` the page can't tell a real move from
  noise, so it tags no gain or loss. `note` is the denominator, only when it changes how the number
  reads.
- `criteria`: every criterion, with `before` (the first measurement) and `after` (the last). The page
  draws them as dots on one 0 to 100% axis, sorted by the change, and each row opens to the full
  statement.
- `layer`: only when the evidence makes it clear (`discovery`, `access`, `use`). Otherwise delete it.
- After more than one loop, the page adds a plot over time, with each edit marked at its date.

**What changed** (`edits`). One entry per entry in `edits.json`: `kind`, `what` in one line, the
`finding` it answered, the `criterion` its card expected to move (the same `label` as in `criteria`),
the Markdown `before` and `after`, and `revert`. A reverted edit keeps its entry with
`"status": "reverted"` and a `reason`.

**What did not change** (`unchanged`). Findings that hold before and after: positioning, refused pages,
and what the site does not publish (the "not available" list, and whether agents guessed it). These
are findings about the site, not results of the edits. One short agent `quote` where it helps.

**What to do next** (`next`). The advice, and the only place for it. Each item: `action` (one line,
what to do), `why` (the finding or observation it answers, with its number), and `where` (the page, the
live site or Studio). Typical items: changes on the live site that Markdown can't make (a fact only a
script shows, a page agents get as HTML), cards still open or rejected that the evidence supports,
what to measure next and when. Recommend, don't order: the person decides. Empty hides the section.

**Agents** (`agents`, optional). One entry per agent and measure, with `values` per measurement. Only
when the agents differ in a way the Overview does not show.

**Answers** (`answers`). Every answer from `ora intents answers`, for every measurement: the prompt id,
the agent, a short verbatim line, and each criterion's `result` and the judge's `reason`.

The page tags every change it draws: **gain** or **loss**, **no change**, or **within noise** when a
count moves by one or two runs, or a score by no more than two runs could move it (2 x max / runs).

## Copy

- Literal. Say what happened, with the number and its denominator. No metaphors and no marketing
  words.
- Explain a term on first use: "the agent version, the Markdown Ora serves agents for a page".
- Say each fact once. The lede doesn't repeat the title, and Method doesn't repeat the lede.
- Quote agents verbatim and briefly, with the agent named and the question it answered. One quote per
  point, and only when it shows something the numbers can't.

## Before you hand it over

- Recount every number from `results-<n>/`. A number in a key finding matches its plot.
- Read each key finding alone. It needs no other bullet and no footnote.
- No `{placeholder}` is left, and advice appears only in "What to do next".
- Each edit's `kind` is the kind its card had (`edits.json`).
- Open the page in a browser if you can, and check it at 600px wide.

## Draft, review, final

1. Write the report with `"status": {"state": "draft"}` and today's date.
2. Show the person the whole page: open it in their browser, or publish it as a private page if they
   want one. Not only a summary in the chat.
3. Point to the key findings and "What to do next", and ask what to change: a wrong number, a missing
   open item, wording for their team.
4. Apply their changes, recount anything they touched, and show the changed parts.
5. On their approval, set `"state": "final"` with the date. It is a file in their folder: who sees it
   is their decision.
