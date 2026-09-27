# Payments - pay you

Where money changes hands, can an agent complete the transaction on a user's behalf - a purchase, a subscription, a settlement - without a human stepping in for the payment itself?

This pillar applies **only to products that sell**. If yours has no commerce surface, skip it entirely; it does not make you less agent-ready. Do not bolt on a payment protocol where there is nothing to buy.

## The shape of an agent-payable product

1. **A machine-completable checkout.** An agent must be able to drive the purchase through an API or MCP tool - not only through a human-only, multi-step web funnel that ends in a captcha. If checkout exists only in the browser GUI, at least make that GUI operable through the accessibility tree (see `usability.md`).
2. **Machine-readable pricing.** Publish `/pricing.md` (or `schema.org/Offer` JSON-LD) so an agent knows the cost and terms before it commits. See `accessibility.md`.
3. **Idempotent payment calls.** Support an `Idempotency-Key` on the charge/checkout endpoint so a retried call after a timeout never double-charges. See `usability.md`.
4. **Structured receipts and errors.** Return a typed success body (order id, amount, status) and typed errors, so an agent can confirm the outcome or retry safely.
5. **At least one agent payment protocol** (below).

## Agent payment protocols

These let an agent discover how to pay and settle programmatically. They are **complementary, not competing** - supporting any one is meaningful, and you do not need all of them. Pick what fits your stack and your payment partners.

- **x402** - payment over HTTP 402. An endpoint responds `402` with a `PAYMENT-REQUIRED` header; a facilitator endpoint (`/supported`) advertises accepted methods, and resources can be listed in a discovery surface. Good fit for pay-per-call APIs and metered access.
- **ACP (Agentic Commerce Protocol)** - a `/checkout_sessions` flow and a delegated-payment endpoint (`/agentic_commerce/delegate_payment`) using shared payment tokens (`spt_...`). Designed for an agent to complete a cart-style checkout on the user's behalf. Mind CORS on the preflight so an agent host can call it.
- **UCP** - a `/.well-known/ucp` discovery profile (carrying a dated `version`, `YYYY-MM-DD`) advertised via a `UCP-Agent` response header. UCP is the discovery layer several other capabilities (including AP2 mandates) hang off.
- **AP2 (Agent Payments Protocol)** - an authorization layer of cryptographically signed mandates (SD-JWT verifiable digital credentials), backed by major card networks. AP2 has no standalone well-known endpoint; it is advertised as a mandate capability inside a UCP discovery profile.
- **MPP** - an `x-payment-info` extension in your OpenAPI spec plus API paths that return `402` with `WWW-Authenticate: Payment`. A lightweight way to declare paid endpoints in a spec agents already read.

## Build guidance

- **Start with discovery.** Before implementing a full settlement flow, make the *existence* of an agent-payable path discoverable - a `/pricing.md`, a `402` on a metered endpoint, or a UCP profile. An agent that cannot tell you accept agent payments will not try.
- **Reuse, do not reinvent.** If you already use a payment processor, check whether it ships an agent-commerce integration (many now expose ACP/UCP/AP2 rails) before hand-rolling a protocol.
- **Keep the human handoff for the moments that need it.** Agent payment rails handle the settlement; a final human confirmation for a high-value or irreversible purchase still belongs in an interactive handoff (see `handoff.md`). The goal is no human step for routine payments, with a clean handoff when one is genuinely warranted.
- **Test the unhappy paths.** Declined payment, expired token, duplicate request. An agent needs a structured, retryable signal for each, not an HTML error page.

## Anti-patterns

- A captcha or human-only email step at the checkout or confirm screen. It blocks the exact moment an agent must complete.
- Prices only rendered client-side or locked behind a logged-in dashboard, so an agent cannot learn the cost before committing.
- A non-idempotent charge endpoint - a network retry then double-charges the user, the fastest way to lose agent trust.
- Advertising a payment protocol you do not actually honor (a `402` that never settles). Drift between what you advertise and what works erodes trust faster than not supporting it at all.
