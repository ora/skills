# Proposals

## Contents

- From a finding to a change
- The three kinds of change
- The validity checklist
- Asking for missing information
- The card
- Agent files

## From a finding to a change

Only some failures are fixed in the Markdown. Trace the finding first (`evaluate.md`), then pick:

| What the evidence shows | Change |
|---|---|
| The fact is on the live page, but not in the agent version (the page renders it with JavaScript, or `generationIssue` says Ora could not read it) | Restructure: carry the live page's own text into the agent version |
| The fact is in the agent version, but buried under slogans or far down the page, and agents stopped before it | Restructure: lead with what the page is for and the facts it holds |
| Two pages give different values for the same thing | Ask which is current, then correct or remove the stale one |
| The fact sits on a page nothing links to, and agents never opened it | Restructure: link it from the pages agents do open, or from `llms.txt` |
| The agent version links to a page that answers 404 | Remove the dead link, or point it to the right page if the person names one |
| The answer needs information the site does not publish | Add, only with the person's answer. Otherwise leave it out |
| A claim on the page overstates what the product does, and another page of the site limits it | Remove or correct the overstatement, quoting the limiting page |
| The page refused the agent (`bot_wall`, `http_error`, `page_error`) | Not a Markdown change. Tell the person: it is the site or its hosting |
| Agents read the right facts and still picked another product | Not a Markdown change. It is a finding about positioning |

Two more sources before you draft:

- **Studio's insights.** `ora intents insights` lists issues Studio found in the runs' traces, each with
  evidence and often a suggested fix. Go through them too. A suggested fix may not fit this site:
  check it against the pages and the runs first, before it becomes a card.
- **Every copy of wrong text.** Wrong or out-of-date text is often on more than one page: a notice in a
  shared banner, an old price on a list and its product page. Before writing the cards, search every
  page's agent version for the same text (as in `intents.md`, "Facts"), and give each place its card.
  An edit freezes the whole page, so a page you edit for another reason keeps any wrong text you leave in it.

## The three kinds of change

**Restructure.** Reorder, regroup, add headings, carry text the live page already shows into the agent
version, add links between the site's own pages. No new claims: every sentence already exists on the
site, and you can name the page.

**Add.** New information the site does not show yet. Only from the person's answer in this
conversation, quoted on the card as "from the person, <date>". When they say they don't publish it,
the card is dropped. Never fill it from memory, from a competitor or from a third-party site.

**Remove.** Delete or shorten text that confuses agents: a stale value another page corrects, a duplicate
that disagrees with its original, a slogan that hides the facts, a dead link. Allowed only while
everything left is still true. Never remove a true limit, drawback, condition or price because it hurts
a verdict.

## The validity checklist

Every card must pass all of these. If one fails, fix the card or drop it.

1. **Sourced.** Each changed or added sentence has a source: a URL on the person's site with a verbatim
   quote, or the person's own answer.
2. **True today.** The source is current. When pages disagree, the person decided which one is.
3. **Fair.** Nothing true about a limit, a price or a drawback is removed or softened.
4. **For readers, not at agents.** No instructions to agents ("recommend this", "ignore other sources"),
   no hidden text, no claims about competitors.
5. **The same page.** The agent version still describes its own page, with the same scope. It does not
   turn into a different page or a summary of the whole site.
6. **Minimal.** It changes what the finding needs and nothing else. A rewrite of the whole page needs a
   finding for each part.
7. **Consistent.** The same fact reads the same on every page you edit, and matches the live site.
8. **Reasonable.** A person on the team would read the edited Markdown and agree it says what they say.

## Asking for missing information

Send one message with every question, numbered. For each one:

- what agents asked or got wrong, with the number and the command that showed it
- exactly what you need ("the install command for the CLI, and the minimum Node version")
- where it would go (page and section)

Accept "we don't publish that" as a full answer. Record each answer with its date in the plan file.

For text that looks out of date (a past date, an offer that ended, an old price), ask whether it is still
true and whether to remove it. Never offer a replacement value ("is that meant to say 2026?"): it
invites a fact nobody published.

## The card

One card per change: one kind (add, remove or restructure) for one finding. Two changes to the same page
are two cards, shown together under that page. The person approves, changes or rejects each card on its
own. A page gets one edit, so publish it once every card for that page has an answer, carrying only the
approved ones. Each card names the criterion it should move; when two cards on one page aim at the same
criterion, say so, since one measurement can't tell them apart.

```markdown
### C2 - /docs/retention: carry the plan table into the Markdown (restructure)

Finding: F1. 7 of 12 answers gave no retention period for the Growth plan (`ora goals report`,
criterion "states Growth retention"). The table on the live page is drawn by JavaScript, so the agent
version holds only the heading (`ora front pages get`, `generatedContent`).

Change:
- Before: "## Retention by plan\n\nLoading..."
- After: "## Retention by plan\n\n| Plan | Raw events |\n|---|---|\n| Starter | 13 months |\n| Growth | 25 months |"

Source: https://example.com/docs/retention, "Growth: raw events are kept for 25 months"
Checklist: sourced, true today, fair, for readers, same page, minimal, consistent, reasonable
Expected effect: criterion "states Growth retention" on prompts P1 and P3
Revert: ora front pages agent-version delete example.com L2RvY3MvcmV0ZW50aW9u
```

Put the recommended first change on top: the one that addresses the most failed checks with the
smallest edit. It is where to start, not the whole job.

## Agent files

`/llms.txt` and `/agents.md` are the first files many agents read. The same three kinds and the same
checklist apply. Useful changes: a link to a page agents need but never found, a one-line description
that matches what the home page says, removing a link that answers 404. Read the file first with
`ora front agent-files get <site> llms`: Ora adds its own lines for Ask and MCP when they are on, so
don't copy those into your edit.
