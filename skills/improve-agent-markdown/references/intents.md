# Intents, facts and criteria

## Contents

- Where intents come from
- Prompts
- Facts
- The "not available" list
- Criteria
- Creating the intent
- Freezing

## Where intents come from

An intent is one job a real user brings to the site ("choose an analytics tool that keeps data for two
years"). Before drafting any, ask the person for the ids of the intents they already have for the site
(`ora intents list` shows them by domain). One they name is used as it is and keeps its history, but
its earlier results are not the before: the loop's baseline is always a fresh measurement. Take
new ones from, in this order:

1. What agents actually asked or failed at: `ora front questions list` with every result, and
   `ora front feedback list`.
   - Group the questions that ask for the same job into one candidate intent ("find a travel book
     under a price"). Keep its total asks and a few questions verbatim.
   - The most asked questions are the common jobs, whatever their result. `notOnSite` counts only
     questions the search found nothing for, so a question no page answers can still count as
     answered.
   - Check each candidate against the agent versions yourself: does a page actually say it? A common
     question no page answers is a gap, and the strongest candidate for an **add**. `notOnSite` (the
     search found nothing) marks a sure gap.
2. The jobs the site sells: its home page, pricing and docs, in its own words.
3. What the person said they want agents to get right.

Suggest the candidates to the person in step 2, most asked first, each with its asks, two questions
verbatim, the pages it touches, and whether those pages answer it, from your own check. Recommend one to
three. When the window holds only a few questions, say so: they show what agents ask, not how often,
so lean on 2 and 3 as well.

### Reusing an intent

Before reusing an intent from an earlier loop, read its prompts and criteria (`ora intents get <id>`)
and check each fact behind them against the pages today. A site changes: "no travel book under £20"
turns false the day a page says £19.99. When one is false now, tell the person which and why. Its
criteria can't change without breaking its history, so offer a new intent for the job instead.

One to three intents is enough for a loop. Each one should touch pages whose Markdown can change: an
intent about something the site never covers measures the gap, not the content.

## Prompts

- 3 to 6 prompts per intent, each a different way a real buyer or engineer would ask.
- Start from the questions agents asked for the intent: their wording is how real users ask. Turn each
  one into a full prompt with the rules below.
- Write them with concrete constraints ("a 12-person team, 3 million events a month, data kept in
  Canada"). Constraints make an answer checkable.
- Research posture: the prompt asks the agent to find out and explain. It never asks it to sign up,
  log in, buy or book. Those measure the wall, not the content.
- `branding`: `organic` prompts describe the need without the brand, `named` prompts name it. Keep them
  in separate intents: a named prompt hands the agent the brand and lifts the organic rates.
- Tag each prompt in the plan file, before any run, by what a complete answer needs: **easy** (one or two
  product pages), **medium** (several pages, pricing or a judgement against the constraints), **hard**
  (docs-level detail: steps, limits, configuration). Weak answers on easy prompts point to the main
  pages; weak answers on hard prompts point to the docs.

## Facts

Each criterion rests on facts captured from the person's own site. Keep them in `facts.json`:

```json
{
  "captured_at": "2026-11-25",
  "facts": [
    {
      "id": "F1",
      "prompts": ["P1", "P3"],
      "text": "The Growth plan keeps raw events for 25 months.",
      "source_url": "https://example.com/docs/retention",
      "quote": "Growth: raw events are kept for 25 months"
    }
  ],
  "not_available": [
    { "id": "N1", "prompts": ["P1"], "question": "Price above 10 million events a month", "note": "Pricing stops at 10 million" }
  ]
}
```

- Facts come from the person's own pages, never from memory or third-party sites.
- `quote` is verbatim. Fetch `source_url` and check that the quote is on it before you use the fact.
- When two pages disagree, record both quotes and ask the person which is current. Don't pick one.
- Before a fact or criterion that says something is **not** on a page, search for the exact words with
  a plain fixed-string search, on the live page and on the agent version
  (`curl -s <url> | grep -c -F '<exact words>'`, and the same for the `.md` fetched as an agent).
  A search for other words, or a pattern that needs text around the match, can miss it. When you tell
  the person something is not there, show the command and its count.
- Aim for at least 3 facts per prompt, at the depth the prompt asks for.

## The "not available" list

What a complete answer would need that the site does not publish (a price above the largest published
tier, a limit the docs never state). An agent cannot know these from the site, so they are not facts. They
have two uses:

- Questions for the person in step 5: "agents keep asking for X. Do you publish it, and where?"
- A criterion that the answer says X is not published instead of guessing it.

## Criteria

A criterion is one pass or fail check a judge makes from the answer or the run's trace. Write them from
the facts:

- At most 300 characters, one objective check. Name the brand the way the person does.
- 1 to 8 per intent. Each run is graded on the criteria that exist when it starts.
- `category` says what it checks. The useful ones here: `informed` (the answer gives the specific facts
  the person needs), `accurate` (nothing said about the brand is wrong or stale), `real_steps`
  (commands, packages and URLs are real), and `recommended` only when the objective is to be picked.
- `types` says which prompts it is checked on (`discover`, `choose`, `verify`, `inform`, `guide`,
  `act`). Leave it out to check every prompt. A pick-only check fails on a how-to question, so tag it.
- A criterion is judged on every prompt its `types` allow, and prompts on one topic often share a type,
  so `types` can't keep a returns check off a delivery prompt. Keep each intent to one topic, and make
  every prompt ask what each of its criteria checks. Otherwise the counts mislead: "0 of 10 gave the
  returns terms" when only 4 of the 10 prompts asked. A "does not invent X" check can stay on every
  prompt.

Examples, each from a fact or a "not available" entry:

```json
{ "statement": "The answer says the Growth plan keeps raw events for 25 months.", "category": "informed" }
{ "statement": "The answer gives no retention period for the Growth plan other than 25 months.", "category": "accurate" }
{ "statement": "The answer says pricing above 10 million events is not published, or gives none.", "category": "accurate" }
```

## Creating the intent

1. `ora domains list` gives the site's `domainId`. Missing? `ora domains add --file domain.json` with `domain`.
2. The audience: `ora icps create --file icp.json` with `domainId` and a `description` (who, market, language).
3. `ora intents agents` lists the agents the organization can measure with. Keep the same set for the
   whole loop.
4. Create the intent, its criteria and its prompts, and start the first measurement, in one call:

```json
{
  "domainId": "<domainId>",
  "icpId": "<icpId>",
  "firstMeasurement": "intent",
  "intents": [
    {
      "title": "Choose a plan for long data retention",
      "layer": "access",
      "persona": "Head of data at a 12-person company",
      "criteria": [
        { "statement": "The answer says the Growth plan keeps raw events for 25 months.", "category": "informed" }
      ],
      "prompts": [
        { "text": "We need two years of raw event history for 3 million events a month. Which Example Analytics plan fits, and what does it cost?", "branding": "named" }
      ]
    }
  ]
}
```

`ora intents bulk-create --file intents.json`. Without `firstMeasurement`, the prompts still run but
outside any measurement, and those runs never show in `ora intents history` or the report. A 402 means
the measurement would exceed the run quota: nothing was written.

Then `ora intents get <id>`: a prompt marked `no_criterion_for_type` is left out of the measurements you
start. Add a criterion for its type with `ora goals create <id> --file goal.json`.

Check `measurementPolicy.cadence` in the same answer. A new intent takes the organization's default,
which can be a schedule. If it is not `manual`, tell the person: Studio would measure on its own
between your edits, spending runs and adding measurements to the comparison. Ask whether to set it to
`manual` for the loop (`ora intents measurement-policy <id>` with only `{"cadence": "manual"}`).

## Freezing

Once the person approves, set `frozen: <date>` in the plan file. From then on a changed prompt is a new
intent, and the criteria stay as they are until the loop ends. Otherwise the before and after numbers
measure different things.
