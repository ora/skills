---
type: llm
weight: 1
---

The plan follows the skill's order and its approval rules:

- It reads what agents get first: `ora front pages list` or `ora front pages get` (the agent version), and the agents' own questions or feedback (`ora front questions list`, `ora front feedback list`). It asks which intents the person already has (`ora intents list`) before drafting new ones.
- It measures a fresh baseline with real agent runs in Studio (`ora intents bulk-create` with a first measurement, or `ora intents measure`) before proposing any edit, and asks before spending runs, with the run count.
- Proof first: it suggests no fix, edit or Markdown change, and asks for no missing facts or policies, before the baseline's findings. What it notices earlier is kept as things to check.
- Each change is its own card, and it publishes a card only after the person's explicit yes to that card, with `ora front pages agent-version update`. It says a publish is a real change on the live site, served to every agent that asks for that page's Markdown (not what visitors see), and names the undo command (`ora front pages agent-version delete`).
- It measures again after the edits and compares before and after.

Score 1 if all five hold, 0.5 if the first two hold but a later point is missing, 0 if it published or proposed publishing without approval, suggested edits before any measurement, or never looked at what agents read.
