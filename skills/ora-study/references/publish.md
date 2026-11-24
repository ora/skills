# Publishing a study

## Contents

- Before you publish
- Publishing
- What a published page never shows
- Private tasks
- Re-publishing and correcting a page

## Before you publish

- The study must be settled (`ora study settlement <id>` answers `settled`): figures and the summary change until
  then.
- Re-run what infrastructure lost first (`ora study rerun-infra-failures <id> --dry-run`, see launch-and-wait.md):
  a published study must be unpublished before anything is re-run.
- Read the exact public page: `ora study preview <id> --json` is the payload readers will get. Published tasks
  reveal their rubrics and checks, and their `files` (inline contents, and the addresses of downloads and
  repositories), so check those texts are fit to publish.
- Ask the person before publishing.

## Publishing

`ora study publish <id> --visibility public` lists the study in the public catalog; `--visibility link` publishes it
unlisted, opened only through the share link in the answer. `--visibility` is required on a first publication.
`--slug <slug>` names its URL (lowercase letters, digits and hyphens); without it the study keeps its own.

A different slug moves the study. Its report link has been stated since launch (`study.links.report`), and every
copy of the earlier one stops opening: the one you gave the person, and any their organization shared. Pass `--slug`
only when the person asks for a different address, then hand over the new `study.links.report` from the publish
answer and say the earlier link no longer opens.

Without `--slug`, the published page is the study's report at the same address as before publishing:
`study.links.report`. That link carries no share token. For an unlisted study, the link an outside reader needs is
`shareUrl` in the publish answer, which does; hand that one only to the readers the person chose.

`--skill-names named` shows each group's skills by name on the page; `withheld` (the default, and what every publish
that does not say otherwise sets) replaces them with an alias everywhere a reader can see, including the text you wrote
in the description. Measured values keep their values.

`ora study set-visibility <id>` changes the mode later; `ora study unpublish <id>` takes the page down.

## What a published page never shows

- The names of MCP servers the study's add-ons attached, and the names of their tools: a reader sees each server as
  `mcp` and its tools as numbered aliases. Ora's own add-ons are published by name.
- The names of the packages a group was given: the page says "preinstalled packages" and names none.
- Organization ids, user ids, keys and secrets.
- `taskHealth`, which is for the study's own maintainers.

## Private tasks

A task with `"private": true` keeps its text, its `files`, and the agents' journeys through it, off the open page. On
a `public` study, signed-in readers of an organization that accepted Ora's data terms can still read it. To keep a
task away from everyone outside your organization, publish the study as `link`.

## Re-publishing and correcting a page

- To refresh a published page after a regrade or a new summary, publish again with `--expect-published`: if the
  study was unpublished meanwhile, the call answers 409 `study_unpublished_meanwhile` and writes nothing. A re-publish
  states `--skill-names` again (omitted means `withheld`).
- `ora study update-details <id>` changes the name and the description at any status. The slug, the publication date
  and the share link stay. The public page picks the change up within a few minutes.
- `ora study regenerate-summary <id>` rewrites the summary of an unpublished study; on a published one, the new text
  waits as a draft until the next publish.
