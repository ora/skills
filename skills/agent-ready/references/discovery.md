# Discovery

Can an agent find you in the registries and searches it checks? An agent that cannot discover you never gets to evaluate you.

## llms.txt

A markdown navigation index served at `/llms.txt` (and optionally `/.well-known/llms.txt`). It is a nav bar for agents, not prose docs.

- Start with an `#` H1, a one-line `>` summary, then grouped bullet links.
- Link out to the real content (docs, OpenAPI, MCP, pricing). Do not inline paragraphs.
- 100+ characters of real content. Files under that are treated as placeholders and earn nothing.
- Serve the file body, not your HTML homepage shell. A common misconfiguration is an SPA catch-all that returns the app shell for every path, including `/llms.txt`. The content type does not matter (text/plain, text/markdown both fine); returning HTML does.
- Optional depth *(emerging)*: per-section files (`/docs/llms.txt`, `/api/llms.txt`) for large products.

Copy `assets/llms.txt.template`.

## Sitemap and robots

- `GET /sitemap.xml` should return valid XML (`<urlset>` or `<sitemapindex>`).
- `robots.txt` should carry an explicit AI-crawler policy. Be deliberate: you can allow search/answer agents while restricting training crawlers, or declare Content Signals. Silence is ambiguous. Template: `assets/robots.txt.template`.

A `robots.txt` that allows AI crawlers is only half of it. Your WAF or bot-detection vendor must also let them through. That live reachability check scores under Accessibility; see `accessibility.md`.

## Registries an agent checks

Register where agents actually look:

- **MCP registries** if you ship an MCP server: Smithery, mcp.so, the official MCP registry, plus a GitHub repo and npm package. Bi-directional verification matters - the registry entry should link to your domain and your domain should link back.
- **Package registries**: npm and PyPI for any SDK or CLI. A discoverable, well-named SDK package is a strong discovery and integration signal.
- **skills.sh** *(emerging)*: publish agent skills in a public GitHub repo owned by your brand's org (the common convention is `<org>/skills`), so `npx skills add <org>/skills` installs them. skills.sh lists a repo after its first install, then runs security audits on each skill. Link the install command from your homepage or `llms.txt` so agents can confirm the skills are yours rather than a third party's.
- **App directories**: e.g. the ChatGPT app directory, where relevant.
- **Agent platform configs** *(emerging)*: shipping `.claude/`, `.cursor/`, or `.windsurf/` config or rules for your product helps agents that read them.

## Brand and developer-resource discoverability

When someone searches your product name, your own domain and developer resources (API docs, OpenAPI, MCP, auth docs) should rank at the top. If a third-party page outranks your docs for your own name, agents building on you cannot find what they need by brand alone. Invest in clear, crawlable, on-domain developer content.

## Entity presence

A Wikipedia / Wikidata entity (with a `P856` official-website claim back to your domain) is the single largest source of citations in AI answers. For established products, an accurate entity is high-value. Do not fabricate one; earn it.
