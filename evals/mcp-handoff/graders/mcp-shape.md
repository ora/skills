The plan in `docs/mcp-plan.md` specifies:

- Streamable HTTP transport (not legacy SSE alone).
- Descriptive tool names, each with a description and a typed input schema listing required fields.
- `readOnlyHint` on the search tool and `destructiveHint` (or an equivalent side-effect annotation) on tools that hold seats or charge money.
- Structured JSON-RPC errors for invalid calls.
- A discoverable server card at `/.well-known/mcp/server-card.json`.

Score 1 if all five are present, 0.5 if three or four are, 0 otherwise.
