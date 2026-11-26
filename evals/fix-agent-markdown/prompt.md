---
runs: 3
max_turns: 20
timeout_seconds: 420
plugins: [../../skills/agent-ready-website, ../../skills/agent-ready, ../../skills/ax, ../../skills/improve-agent-markdown, ../../skills/ora-study, ../../skills/ora]
tags: [improve-agent-markdown, trigger]
allowed_tools: [Skill, Read, Glob, Grep, Write, WebFetch]
---

Our site docs.example.com is connected to Ora Front. Please help me improve the site's content so AI agents perform better on it. Don't do it yet: show me the plan and the commands you would run.
