# Usability - access and operate you

Can an agent get credentials, get in, and operate the product end to end: call it, recover from errors, and not break on your next release? This is Ora's largest scored layer, because it answers the question that most decides whether an agent succeeds: can it **connect, authenticate, and operate** you. Most agent failures happen here. The product is discoverable and understood, but the agent cannot get past the front door, or it gets in and cannot drive the product reliably.

The layer has three parts, covered in order below, plus the human handoff in `handoff.md`.

## Contents

1. **Authentication and access** - obtaining credentials and getting past the front door, with no human in the loop. Self-serve credentials, OAuth and scopes, machine-to-machine, agent-auth conventions, onboarding friction, auth anti-patterns.
2. **Operating the product** - the API, the MCP server, and the ergonomics an agent depends on to call you reliably. A public API, MCP server, API ergonomics, SDKs and webhooks, REST vs GraphQL.
3. **Operating a web GUI directly** - when a step exists only in the browser, the accessibility tree an agent drives. Accessibility tree, injection safety.
4. **Payments** - a pointer to `payments.md`.

---

## Authentication and access

### Self-serve credentials

The single most important property: an agent (or the developer it works for) can obtain credentials with no human gate.

- A developer portal, console, or dashboard that issues an API key on sign-up.
- No "contact sales for an API key", no manual approval queue, no human-only email link required before the key works for read access.
- A free tier or trial so an agent can evaluate before committing.

### OAuth and scopes (delegated access)

When an agent acts on behalf of a user:

- Publish `/.well-known/openid-configuration` (and, for resource servers, `/.well-known/oauth-authorization-server`, RFC 8414).
- Support PKCE with the `S256` code challenge method.
- Define scoped permissions so an agent requests only what it needs. Declare them in OpenAPI `securitySchemes` and document them.

### Machine-to-machine

For server-side or autonomous agents, support the OAuth `client_credentials` grant, and document it clearly alongside API-key auth. State which flow to use when.

### Agent-auth conventions (emerging)

A growing set of conventions lets an agent bootstrap auth with no prior knowledge. Adopt the ones that fit:

- **`/auth.md`**: a markdown walkthrough (Discover, Pick a method, Register, Claim, Use, Errors, Revocation) describing how an agent registers and authenticates. Served as `text/markdown`, 200+ chars, starting with a heading.
- **`/.well-known/oauth-protected-resource`** (RFC 9728): a `resource` field plus `authorization_servers`, `scopes_supported`, `bearer_methods_supported`.
- **`WWW-Authenticate: Bearer resource_metadata=...`**: API paths returning 401 with this header point an agent at the protected-resource metadata, so it can discover how to authenticate from a bare unauthorized response.

These are optional and evolving; pick what matches your stack rather than implementing all of them.

### Minimise onboarding friction

Audit the path from "agent arrives" to "agent makes its first successful call". Reduce every step:

- Free tier or generous trial.
- A sandbox / test mode with test credentials, so an agent can exercise the API without real side effects.
- Some zero-auth read access (a public read endpoint, a discovery endpoint) so an agent can evaluate before authenticating.
- Clear, machine-readable error messages when auth fails, telling the agent what to do next.

### Auth anti-patterns

- A captcha on the machine path. Captchas are designed to stop automation - they stop your agent users too.
- Human-only email verification required before any API access works.
- Auth docs that exist only as screenshots or video. An agent reads text.

---

## Operating the product

*Scope to the surfaces you actually run: the API guidance applies only if you expose an API, the GraphQL rows only if you run GraphQL, and the MCP guidance only if you ship an MCP server. A surface you do not have is N/A - excluded from scoring, never a deduction - so do not stand one up just to score.*

### A public, documented API

- Reachable endpoints (REST at `/api`, `/v1`; or GraphQL at `/graphql` with introspection).
- A published OpenAPI spec describing them. The spec itself scores under Accessibility (what agents can read); see "A machine-readable API description" in `accessibility.md`. It is still the single file that unlocks most of this layer.

### MCP server (when agents take actions)

If agents will do more than read, ship an MCP server. It is the cleanest action surface for agents.

- **Transport**: Streamable HTTP (modern), not legacy SSE only.
- **Handshake**: a proper `initialize` exchange advertising server `name`, `version`, and `instructions` (use `instructions` for when-to-use guidance).
- **Tools**: clear, descriptive names (snake_case or camelCase, 4+ chars, not generic like `run`). Each tool needs a description (20+ chars) and a typed input schema with `required[]` fields.
- **Annotations**: `readOnlyHint` on read tools, `destructiveHint` on mutating ones. Critical for safe agent use - it tells the agent which calls have side effects.
- **Errors**: structured JSON-RPC errors with `code` and `message` for invalid or malformed calls.
- **Resources**: if you advertise the `resources` capability, `resources/list` must return real, readable resources.
- **Discovery**: a `/.well-known/mcp/server-card.json` for pre-connection discovery (name, description, version, serverUrl, tools[]). Keep the advertised tool count in sync with the live server - drift downgrades trust. Template: `assets/mcp-server-card.template.json`.

A docs MCP (read-only content search) and a product MCP (authenticated actions) are different shapes. Docs MCPs should be public and focused (1-3 tools); product MCPs should require auth and can be broader. Shipping both is the strong pattern for products with a public docs surface and an authenticated business API.

### API ergonomics agents depend on

These are the difference between an agent succeeding and silently failing:

- **JSON errors, never HTML.** Probe an invalid path and an auth failure - both must return JSON, not an HTML error page. An agent expecting JSON cannot parse a 404 page.
- **Typed error model.** Use `application/problem+json` (or, in GraphQL, typed `Error` types / Relay-style `userErrors` / `extensions.code`).
- **Rate limits.** Document them, and return `RateLimit-*` / `X-RateLimit-*` / `Retry-After` response headers so an agent can back off correctly instead of hammering.
- **Idempotency.** Support an `Idempotency-Key` header on mutation endpoints (or `clientMutationId` in GraphQL) so a retried call after a timeout does not double-charge or double-create.
- **Pagination.** Cursor-based (preferred) or offset-based, with a clear shape. In GraphQL, Relay-style `Connection` + `PageInfo`.
- **Async jobs.** For long-running work, return `202 Accepted` with a status-polling endpoint, so an agent does not block on a request that will time out.
- **Versioning and deprecation.** URL or header versioning, with `Sunset` / `Deprecation` headers and a documented policy, so an agent built on you today does not break when you ship v2.

### SDKs, CLI, webhooks

- SDK packages in the major languages (npm, PyPI, Go, RubyGems), well-named so they are discoverable. A well-named package is itself a registry entry. It is how agents and developers find your product by capability, not just by domain.
- A CLI (npm / PyPI / Homebrew) where it fits.
- Webhooks with signature verification (HMAC-SHA256, `X-Signature` or similar) so an agent can trust and react to events.
- `function calling` compatibility: an OpenAPI spec that maps cleanly to tool/function schemas across model providers.

### REST vs GraphQL

The same concerns apply to both; the implementation differs:

| Concern | REST | GraphQL |
|---|---|---|
| Schema | OpenAPI at `/openapi.json` | Introspectable schema with descriptions |
| Errors | `application/problem+json` | Typed `Error` / `userErrors` / `extensions.code` |
| Pagination | cursor or offset fields | Relay `Connection` + `PageInfo` |
| Rate limits | `RateLimit-*` headers + 429 | `@cost` / `@rateLimit` directives, cost headers |
| Idempotency | `Idempotency-Key` header | `clientMutationId` / idempotency arg |
| Versioning | URL/header version, `Sunset` | `@deprecated` on fields |

---

## Operating a web GUI directly

When a step exists only in a web GUI - signup, billing, a confirm screen with no MCP/API behind it - an agent operates it through the accessibility tree. Ora scores these `ax-*` checks here, in Usability: operating you through a rendered GUI is still operating you.

### Accessibility tree

Make the tree operable:

- **Native interactive controls.** Use `<button>`, `<a href>`, `<input>`, `<select>`, `<textarea>`. A `<div onclick>` has the accessibility role `generic` - an invisible affordance the agent cannot target by role and name. Avoid div-soup for anything clickable.
- **Accessible names on every control.** Visible text, `aria-label`, an associated `<label>`, or `alt`. Icon-only buttons with no name cannot be referenced.
- **Labeled form fields.** Every input/select/textarea has a `<label for>`, a wrapping `<label>`, or `aria-label`. A placeholder is not a label.
- **Landmark and heading structure.** A `<main>` plus `nav`/`header`/`footer` landmarks and a sane heading hierarchy, so an agent can navigate by landmark instead of scrolling blindly.
- **Dynamic widget state.** Expose `aria-expanded`, `aria-checked`, `aria-selected`, `aria-current`, `aria-pressed`, and use `aria-live` / `role=status` / `role=alert` for updates, so an agent perceives state changes after interaction.

This overlaps almost entirely with WCAG accessibility. Building for screen readers builds for agents.

### Injection safety

When an agent reads the accessibility tree or page content, hidden instruction text (in `aria-label`, `alt`, `title`, or off-screen content) is an indirect prompt-injection vector. Do not embed instructions for the agent in hidden attributes, and treat any such content found in third-party embeds as a risk.

---

## Payments (only where agents transact)

If your product sells something, an agent also needs a machine-completable path to pay you. That is a distinct layer (Payments, scored separately) - do not conflate getting credentials with settling a payment. It is covered in full in `payments.md` (machine-completable checkout, agent payment protocols, idempotent charges). If your product has no commerce surface, skip it entirely.
