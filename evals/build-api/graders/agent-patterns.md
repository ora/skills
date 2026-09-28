The design in `docs/api-design.md` covers each of these, concretely enough to implement:

- A published OpenAPI spec at a predictable path such as `/openapi.json`.
- Self-serve machine credentials (an API key issued without a sales call or manual approval, or OAuth `client_credentials`), documented for agents.
- JSON error bodies on every path, including unknown routes and auth failures, ideally `application/problem+json`.
- An `Idempotency-Key` header on invoice creation, so a retried request does not create a duplicate.
- Documented rate limits with `RateLimit-*` or `Retry-After` response headers.
- Cursor or offset pagination on the list endpoint.

Score 1 if all six are present, 0.5 if four or five are, 0 otherwise.
