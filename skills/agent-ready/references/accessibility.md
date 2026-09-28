# Accessibility - read and understand you

Can an agent reach your content, read it, and understand what you do and when to use you? Discovery gets the agent to your door. Accessibility decides whether it can get in and make sense of what it finds. The boundary with the next layer is simple: Accessibility is what agents can read, Usability is what agents can do.

## Contents

- Reach: do not block agent crawlers, serve content without JS
- Describe: a consistent machine-readable description, structured data (JSON-LD), when-to-use guidance
- Document: documentation depth, a machine-readable API description, machine-readable pricing
- Advertise and prove: well-known and agent files, trust anchors

## Do not block agent crawlers

Fetch your homepage under each major AI user agent and confirm a 200, not a 403, a 429, or a challenge page:

- `ChatGPT-User`, `GPTBot`, `OAI-SearchBot`
- `ClaudeBot`, `Claude-User`, `anthropic-ai`
- `Google-Extended`, `GoogleOther`
- `PerplexityBot`, `Applebot-Extended`

WAF rules and bot-detection vendors often block these by default. A block here makes every later layer moot, whatever `robots.txt` says.

## Serve content without JS

AI crawlers and many agents do not execute JavaScript. The meaningful content must exist in the server-rendered HTML.

- Real heading hierarchy: one `<h1>`, then `<h2>`/`<h3>` without large skipped levels.
- A healthy content-to-markup ratio. If readable text is under ~1% of the HTML bytes, an agent burns its budget parsing markup.
- If the app is client-rendered, provide a fallback: server-render the key pages (the load-bearing fix), or - *(emerging)* - support markdown content negotiation (`GET /` with `Accept: text/markdown`, ideally with a `Vary: Accept` header) and/or `.md` URL variants (`/index.md`, `/docs/page.md`).

## Consistent, machine-readable description

The same description should appear across:

- `<title>` and `<meta name="description">`
- Open Graph tags (`og:title`, `og:description`, `og:image`, `og:type`)
- JSON-LD

Inconsistency makes entity resolution ambiguous - the agent is not sure all these refer to the same product.

## Structured data (JSON-LD)

Add JSON-LD to the homepage. Minimum useful shape:

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Your Product",
  "description": "One clear sentence on what it does and who it is for.",
  "url": "https://yourdomain.com",
  "applicationCategory": "BusinessApplication",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
  "sameAs": [
    "https://en.wikipedia.org/wiki/Your_Product",
    "https://www.wikidata.org/wiki/Q...",
    "https://github.com/yourorg",
    "https://www.linkedin.com/company/yourorg"
  ]
}
```

- Add an `Organization` type with `contactPoint` and `address` - fields AI systems use to verify legitimacy.
- `sameAs` links disambiguate your entity across sources.
- Where they fit, richer types (`FAQPage`, `Service`, `AggregateRating`, `Offer`) let agents answer more question types.

## Documentation depth

Docs are the primary identity surface for a developer-facing product. Include, and link from the homepage:

- A quickstart and an auth walkthrough
- A full API reference (ideally generated from your OpenAPI spec)
- Runnable code examples
- SDK install instructions

Make docs reachable without JS and linked with real `<a href>` anchors from the homepage.

## A machine-readable API description

If you expose any API, publish an OpenAPI spec at `/openapi.json` (or `/swagger.json`), valid against a known schema version. This one file lets an agent understand every operation, type, and auth scheme without guessing, and it unlocks most of the Usability layer. Template: `assets/openapi.skeleton.json`.

- An API behind a key still counts as public as long as the spec is published or the endpoint returns a clean 401. The point is discoverability, not anonymity.
- For GraphQL, an introspectable schema with descriptions plays the same role.
- *(emerging)* `/.well-known/api-catalog` (RFC 9727) advertises your API surfaces from a predictable path.

How the API behaves once an agent calls it (errors, rate limits, idempotency, pagination) is covered in `usability.md`.

## Machine-readable pricing

- A `/pricing` (or `/plans`) page with `schema.org/Offer` JSON-LD.
- Optionally `/pricing.md` or `/.well-known/pricing.md` *(emerging)*: a machine-readable file with plan tiers and costs an agent can read directly. The `/pricing` page above is the load-bearing signal; this `.md` convention is a forward bet.

## When-to-use guidance

State explicitly when an agent should choose you and for what. Put it in `llms.txt`, an agent file, or an MCP server's `instructions`. This is one of the most underused identity signals - most products describe what they are but never when to use them.

## Well-known and agent files

Where applicable:

- `/.well-known/agent-skills/index.json` (agentskills.io schema) if you publish skills *(emerging)*.
- `/.well-known/agent-card.json` (A2A Agent Card) if you participate in agent-to-agent flows. Template in `assets/` *(emerging)*.
- `/.well-known/mcp.json` or `/.well-known/mcp/manifest.json` to advertise an MCP server with display name, icon, and description.

## Trust anchors

Real About, Contact, and Privacy pages with genuine content (not stubs). Agents and the systems that rank them use these to gauge legitimacy.
