# ADR 0001 Production application stack

**Status:** Open. **Decision deadline:** 14 October 2026. **Owner:** developer.

## Context

The developer knows React but has not used Next.js. A working private MVP is targeted for October 31. This repository starts with React, Vite and a static clickable concept to avoid delaying UI and user-flow work.

## Options

1. Next.js TypeScript application with server route handlers and a small worker. It colocates pages and API endpoints, but requires learning server/client boundaries and a Cloudflare Workers deployment adapter if Cloudflare is chosen.
2. React with Vite on Cloudflare Pages plus Pages Functions or a Worker for the API. It reuses familiar React and has a straightforward static preview, but requires explicit routing and server API composition.

## Decision rule

By October 14, implement a short spike: authenticated host request, protected event read, one server secret and a preview deployment. Pick the approach that passes this spike with the least integration and debugging work. Keep one GitHub repository either way. Record the chosen runtime, database, authentication provider, deployment method and rollback in this ADR. Do not place secrets or event-window policy in the React browser.

## Consequences

[ADR 0005](0005-database-design.md) selects managed PostgreSQL independently of this open runtime choice. The spike must exercise an authenticated customer lookup, a short multi-statement transaction through the deployed adapter, and migration/restore support. Evaluate Supabase first, consistent with the financial reference; record provider, supported version, pooling/caching configuration and identity integration here when the spike passes. DCB-E18 tracks installation; static hosting does not supply it.

The local starter is a UI demo and can be refactored into either option. Domain contracts in `docs/specs` are authoritative; route handlers and Functions are transport adapters. Full Next.js APIs do not run in a static export.

The current Cloudflare Worker preview serves built static demo assets only. Its `wrangler.jsonc` enables that sample deployment and branch previews; it provides no host authentication or server validation and does not resolve this production-stack decision.

[ADR 0006](0006-deployment-environments.md) adds DEV, TEST and owner-approved PROD routing for this static UI. Its GitHub Actions workflow and separate Workers do not resolve the server runtime, identity or PostgreSQL provider decisions above.


## Local implementation update — 18 October 2026

[ADR 0008](0008-local-backend-review.md) adds a Node HTTP API with isolated local
SQLite and seeded identity adapters for the owner’s host/guest testing request.
This is an implemented local runtime, not the deployed PostgreSQL/managed-auth
spike or a production stack decision. React pages call explicit API operations;
provider/runtime adapters and production authorization gates remain open here.
