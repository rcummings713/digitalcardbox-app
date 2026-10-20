# ADR 0008 Persistent local backend for design review

**Status:** Accepted for local testing. **Date:** 18 October 2026.

## Context

The owner now requests real host/guest processing while the page design remains
changeable, explicitly excluding payments and allowing fictional data. This
supersedes ADR 0007’s pause on backend implementation for the local test flow.
The owner authorized commit/push to the isolated DEV preview on 20 October.
This does not approve PROD, a production identity provider, or a replacement of
ADR 0005’s managed PostgreSQL production design.

## Decision

Keep React/Vite and add a Node HTTP transport, application operations with
explicit repository/identity contracts, calendar/input domain rules, and
replaceable infrastructure adapters. No application operation imports a React
page or browser store. Use Node 22.18+ and its built-in SQLite module as a
persistent **local test adapter**, with a versioned relational migration and
seeded fictional host/operator identities. The local password verifier is an
isolated test adapter, not the production password database prohibited by the
security spec. It must be replaced by managed identity before a live pilot.

`npm run dev` starts the API and frontend. Vite proxies `/api` to loopback so
host and guest cookies remain on one origin, including a phone using the LAN URL.
Host sessions expire after eight hours; invitation-scoped guest sessions after
24 hours. Store only cookie token hashes. Store share token hashes for resolution
and AES-GCM ciphertext for repeated host copy/QR; the local key remains outside
version control with restricted file permissions. Local HTTP test cookies are
HttpOnly/SameSite=Strict; production HTTPS/secure cookie/provider configuration
remains a release gate.

Recheck ownership, role, guest scope, link generation, publication, event window,
feature flags and input bounds on the server. Serialize writes in a database
transaction, lock event calendar edits after the first accepted card, check event
revisions on host edits, and deduplicate submission request keys per event guest.
Book reads include only consented, unhidden, unremoved cards. An operator receives
aggregate counts and event metadata, not private card content or invitation keys.

Use same-origin/custom-header checks plus session CSRF tokens on mutations,
request-size limits, server GIF/template allowlists, parameterized SQL and basic
request/login limits. Never fetch a guest-supplied GIF URL. Serve the bundled GIF
catalog, including the owner-supplied space GIF, as same-origin assets. No vendor
keys, external GIF search requests, trackers, payment SDKs or transfer endpoints
are installed. The 20 October extension allows gift matching and explicit
external-service navigation: fictional recipients stay in preview, verified
host-configured recipients can open Cash App/Venmo profiles or Zelle’s bank finder.
No transfer is executed and opening/returning never verifies receipt. Gift settings,
retry keys, snapshots and host checks persist in the local SQLite adapter.

## Boundaries and consequences

This proves the local host-create/publish → guest-compose/send → host-inbox/book
journey across browsers and restarts. Managed identity and deployed PostgreSQL,
module-owned production schemas, private media storage/scanning, retention,
backups, production abuse controls and deployments still require their existing
stories. Private photo upload is visibly unavailable in connected mode rather
than silently claiming a local preview was delivered. No money moves.

The browser-only adapter remains an explicit `npm run dev:ui` mode. Static
Cloudflare builds retain that adapter until a production backend adapter and
hosting spike are selected. Server errors never silently switch a connected
session into browser-local success. The local entrypoint refuses production
mode. Keep `.data` and credentials for real accounts out of version control.

[LOCAL_API.md](../specs/LOCAL_API.md) records the transport contract; UI layout
changes do not require its event/card operations to be reimplemented.


Vite’s static-file deny rules cover `.data`, SQLite/key files, backend source,
repository/agent/credential directories and the original reference uploads. Only
the intentional `public` media copies are web assets. Connected tests check both
ordinary and raw backend URLs and absolute filesystem URLs for database/key files.
