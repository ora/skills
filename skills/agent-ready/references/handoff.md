# Handoff - hand back to a human and resume

When a decision genuinely needs a human - a payment, a final confirmation, a visual choice text cannot capture - can the agent hand control back to a UI a human can act on, then resume? This is the least understood part of agent-readiness and often the one that breaks an otherwise-ready product. It is also where Ora has the most direct authority: the team helped establish MCP Apps, the open standard for interactive UI in MCP.

> Ora scores the handoff checks (MCP Apps, generative UI) inside the **Usability** layer, alongside auth and operation. This file covers only the handoff moment. Operating a web GUI directly through the accessibility tree is covered in `usability.md`.

## Identify genuine handoff moments

Not everything needs a human. Hand back only at moments where a human must, or clearly should, decide:

- **Irreversible or high-stakes actions**: confirming a purchase, deleting data, signing a contract.
- **Payments**: entering or authorising payment details.
- **Legal or consent gates**: accepting terms, granting permissions.
- **Visual or spatial choices**: selecting seats in a theater, picking a plan tier from a comparison, configuring something with many interacting options. A UI prevents typos and wrong selections and is faster and clearer than text.

Everything else the agent should be able to do on its own. Over-inserting human gates defeats the purpose of agent automation. If your product has no genuine handoff moment, this entire layer is N/A - you lose nothing for it. Do not invent a human gate just to populate it.

## Render an interactive view with MCP Apps

At a handoff moment, return an interactive UI rather than a wall of text. MCP Apps is the interactive-UI extension to MCP: an MCP tool carries an associated UI resource that the host (Claude, ChatGPT, and other MCP hosts) renders as a real, sandboxed view the human can operate. Typical views:

- A confirmation card with the exact action and a confirm/cancel control.
- A selection widget (plan tiers, seat map, date picker) the human operates directly.
- A payment view handled by the host's secure surface.

The agent presents the view, the human acts, and the result flows back to the agent, which resumes - integrity preserved, no error-prone free-text round-trip.

### How it works

1. **Register a UI resource.** The server exposes a UI template addressed by a `ui://` URI (an MCP resource - usually a self-contained HTML/component document the host can render in a sandbox).
2. **Associate it with a tool.** The tool that needs a human decision references that `ui://` resource, so when the agent calls the tool the host knows to render the view instead of (or alongside) returning text. See `assets/mcp-app-tool.example.json` for the shape.
3. **Pass the data the view needs.** The tool returns structured data (the plan tiers, the seat map, the order summary) that the UI renders. Keep the rendering data and the machine-readable result separate.
4. **Receive the human's choice back.** The user's interaction produces a structured result that returns to the agent, which continues the task with the decision in hand.

### Build guidance

- **Keep the UI self-contained and declarative.** The host renders it sandboxed; do not assume access to your app's full runtime, cookies, or arbitrary network. Pass everything the view needs as data.
- **Separate presentation from outcome.** The agent should be able to act on the machine-readable result without scraping the rendered UI.
- **Degrade gracefully.** Not every host renders MCP Apps yet. Provide a sensible text fallback (a clear textual summary and a structured result) so the flow still completes on hosts without UI support.
- **Treat the rendered surface as a trust boundary.** Validate anything that comes back from the UI server-side; never trust client-rendered values for an irreversible action.

## A2UI - a parallel generative-UI rail *(emerging)*

MCP Apps is not the only way to render a handoff. A2UI is a parallel, framework-agnostic generative-UI protocol for the same job: the agent describes an interactive view, the host renders it, and the user's interaction flows back as structured data. Ora scores `a2ui-support` alongside the MCP Apps checks, so it satisfies the same handoff need. You do not need both; adopt whichever your stack and target hosts favor (MCP Apps is the established path inside MCP hosts today, A2UI the more host-agnostic emerging one). The handoff principles above - identify the genuine moments, keep presentation separate from the machine-readable outcome, degrade gracefully, treat the rendered surface as a trust boundary - apply to either rail.

## Web GUIs an agent may drive directly

When there is no MCP/API for a step (signup, billing, a confirm screen that only exists in the UI), an agent operates the web GUI through the accessibility tree. That is operation, not handoff. See "Operating a web GUI directly" in `usability.md`.

## Resume after the human acts

Design the flow so the agent can continue once the human has decided:

- Clear, machine-readable state on what the human chose.
- No captcha at the decision point - it blocks the resume.
- A return path (callback, polling, or event) so the agent knows the human is done and what they chose.
