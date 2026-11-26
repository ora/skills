# Publish, check, log and revert

## Contents

- Page ids
- Before you publish
- Publish a page edit
- Check what agents get
- The edit log
- Agent files
- Revert
- Drift check on a later visit

## Page ids

A page's id is its path on the website, base64url encoded with no padding: `/pricing` is `L3ByaWNpbmc`.
`ora front pages list <site> --path /pricing` returns it, and finds any path, listed or not. Every
command below that takes `<pageId>` takes this value.

## Before you publish

1. Read the page: `ora front pages get <site> <pageId> --json`. Under `agentVersion`:
   - `content`: what agents get now (the edit if there is one, else the automatic version)
   - `generatedContent`: Ora's automatic version, made from the live page for this answer
   - `source`: `auto` or `edited`, and `editedAt` when it is an edit
2. If `source` is `edited`, someone already edited this page. Show the person that edit and ask before
   you replace it.
3. Save `content` as `ora-markdown/<host>/edits/<path-slug>.before.md`. This is the backup.
4. Write the new Markdown as `ora-markdown/<host>/edits/<path-slug>.after.md`, starting from `content`
   and changing only what the approved cards say.
5. Show the person the diff between the two files if the cards did not already show it word for word.

## Publish a page edit

The text goes in a JSON body. Build it from the file so quotes and new lines survive:

```bash
node -e 'const fs=require("fs");fs.writeFileSync(process.argv[2],JSON.stringify({content:fs.readFileSync(process.argv[1],"utf8")}))' \
  ora-markdown/example.com/edits/docs-retention.after.md ora-markdown/example.com/edits/docs-retention.body.json
ora front pages agent-version update example.com L2RvY3MvcmV0ZW50aW9u \
  --file ora-markdown/example.com/edits/docs-retention.body.json --json
```

Agents get the edit verbatim wherever the site serves the page's Markdown, even when the site's Markdown
setting is off, as long as serving is in `autopilot`. The answer carries the edit, not the automatic
version.

## Check what agents get

1. `ora front pages get <site> <pageId> --json`: `source` is `edited`, and `content` equals your `.after.md`.
   This is the first check: it shows what Front stored.
2. Wait `propagationSeconds` from `ora front serving get <site>`, then fetch what an agent fetches, as
   an agent. Front may serve Markdown only to requests that identify as an agent: a plain `curl` can get
   the normal HTML page, or a 404 for the `.md`, while agents get the edit.

```bash
curl -s -A 'Claude-User/1.0' https://example.com/docs/retention.md
curl -s -A 'Claude-User/1.0' -H 'Accept: text/markdown' https://example.com/docs/retention
```

The first is the page's `.md` address. The second asks the page's own URL for Markdown, which works
while negotiation is on. For the home page, try `/index.md`, or use the second form.

If either still shows the old text after the wait, say so. Don't publish again: read
`ora front serving get <site>` and tell the person what it says.

## The edit log

Append one entry per published edit to `ora-markdown/<host>/edits.json`:

```json
{
  "published_at": "2026-11-25T14:05:00Z",
  "path": "/docs/retention",
  "page_id": "L2RvY3MvcmV0ZW50aW9u",
  "cards": ["C2"],
  "findings": ["F1"],
  "kinds": ["restructure"],
  "approved": "the person, in this conversation, 2026-11-25",
  "before": "edits/docs-retention.before.md",
  "after": "edits/docs-retention.after.md",
  "sources": ["https://example.com/docs/retention"],
  "revert": "ora front pages agent-version delete example.com L2RvY3MvcmV0ZW50aW9u"
}
```

`kinds` holds the kind of each approved card, in the same order as `cards`, as the card named it. The
report shows them as logged, so don't relabel an add as a restructure.

The log is how the comparison in `evaluate.md` knows which criterion each change targeted, and how a
later visit knows what to check.

## Agent files

- `ora front agent-files list <site>` lists the files and which layer agents get. The kinds this skill
  edits are `llms` (`/llms.txt`) and `agents_md` (`/agents.md`).
- `ora front agent-files get <site> <kind> --json` returns both layers. Back it up the same way.
- `ora front agent-files update <site> <kind> --file body.json` with `{"content": "..."}` publishes it
  at once. Ora checks the text first and refuses a file that would harm the site (400, the problem in
  `errors`): read the refusal and fix the text, don't work around it.

## Revert

- A page: `ora front pages agent-version delete <site> <pageId>`. Agents get the automatic version
  again. Nothing is lost: it was kept fresh the whole time.
- An agent file: `ora front agent-files delete <site> <kind>`.
- Revert only with the person's yes, and log it in `edits.json` with its date and reason.
- `ora front pages agent-version regenerate` only refreshes the automatic version. It never removes an
  edit, so it is not a revert.

## Drift check on a later visit

An edit does not follow the live page. When the person changes the page, agents keep getting the edit.
On every visit after the first, for each entry in `edits.json`:

1. `ora front pages get <site> <pageId> --json` and compare `generatedContent` with the `.before.md`
   the edit was based on.
2. Fetch each URL in `sources` and check that each quote is still there.
3. When something changed, show the person what, and propose one of: update the edit from the new live
   text (a new card, same checklist), or revert it so agents follow the live page again.
