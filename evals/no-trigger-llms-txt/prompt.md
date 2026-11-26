---
runs: 3
max_turns: 15
timeout_seconds: 300
plugins: [../../skills/agent-ready-website, ../../skills/agent-ready, ../../skills/ax, ../../skills/improve-agent-markdown, ../../skills/ora-study, ../../skills/ora]
tags: [negative]
allowed_tools: [Skill, Read, Glob, Grep, Write, Edit]
---

Add an llms.txt to our open-source library's GitHub repo so AI coding agents understand how to use it. Save it as llms.txt at the repo root. Here is our README:

```markdown
# tinyqueue-js

A small in-memory job queue for Node.js with retries and concurrency limits.

## Install

npm install tinyqueue-js

## Usage

const { Queue } = require("tinyqueue-js");
const q = new Queue({ concurrency: 2, retries: 3 });
q.add(async () => fetchReport());
await q.drain();

## API

- `new Queue({ concurrency, retries })`: create a queue. Defaults: concurrency 1, retries 0.
- `q.add(fn)`: add an async job; returns a promise for its result.
- `q.drain()`: resolves when every job is done.
- `q.pause()` / `q.resume()`: stop and restart taking new jobs.

## Docs

Full docs: docs/guide.md and docs/api.md in this repo.
```
