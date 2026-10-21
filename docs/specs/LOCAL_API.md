# Local host and guest API

**Scope:** ADR 0008 and ADR 0009, updated 21 October 2026. Local and isolated hosted DEV review; no production identity, transaction-data API
or payment execution. JSON request/response bodies, `/api` same-origin
proxy, no CORS grant. Errors are `{ error: { code, message } }` without stack,
private content or secrets. Invalid API paths return JSON 404 rather than SPA HTML.

All writes require JSON, matching `Origin`, and `X-DCB-Request: 1`. Authenticated
writes also require `X-CSRF-Token`, returned by session/invitation reads. Host
cookies have `/api` scope; guest cookies have the exact invitation API path.
No owner, operator role, guest identity or financial status is accepted from a
browser payload as authority.

| Method and route | Contract |
| --- | --- |
| `GET /api/health` | Local-test availability, `moneyMovement: false` |
| `GET /api/session` | Current host identity or null, CSRF token, public flags |
| `POST /api/session` | Seeded test email/password; issue fresh host cookie |
| `DELETE /api/session` | Revoke current host session and clear cookie |
| `GET /api/host/workspace` | Signed-in actor’s events/cards/gift matching/preferences only |
| `PATCH /api/host/profile` | Name and reduced-motion preference; test email fixed |
| `POST /api/host/events` | Create owned event and server-generated opaque link |
| `GET /api/host/events/:id` | Owned event details, revision and lock state |
| `PATCH /api/host/events/:id` | Allowed event fields; require current `If-Match` revision |
| `POST /api/host/events/:id/rotate-link` | Empty JSON/current revision; revoke old link and guest sessions |
| `GET /api/host/events/:id/book` | Owned event plus consent-filtered book entries |
| `PATCH /api/host/cards/:id` | Owned-card `hide` or `restore` action |
| `DELETE /api/host/cards/:id` | Remove owned card from inbox/book; date lock remains |
| `GET /api/invitations/:token` | Minimal welcome/window/enabled host-confirmed destinations/flags; issue scoped guest session |
| `POST /api/invitations/:token/cards` | Name/note/template/GIF/consent + retry key; own receipt only |
| `PATCH /api/host/events/:id/destinations` | Owned service, matching identifiers and explicit confirmation; current event revision/route version required |
| `POST /api/invitations/:token/gift-intents` | Revalidate guest/link/window/flag/exact current service version; save unconfirmed details with retry key and optional own card |
| `PATCH /api/host/gift-intents/:id` | Host receipt confirmation or undo; never provider verification |
| `GET /api/admin/summary` | Operator-only aggregate counts, event metadata and minimal audit |
| `PATCH /api/admin/flags/:key` | Operator-only supported flags; gifts controls matching/handoffs, never payment execution |

Card input: `{ requestKey, name, note, style, gif, consent }`. Names are 1–80
characters, notes 1–5000, GIF/template IDs must be in the bundled allowlists, and
book consent must be an explicit boolean. No photo bytes or remote URLs are
accepted. Duplicate identical request keys return the original receipt; changed
content under the same key is a conflict. The server supplies IDs and timestamps.
Guests never receive an event’s other notes, host email, other guests’ gift details or history.

Event input is limited to title, host display names, occasion, date, time zone,
location, welcome, cover and book layout/status. No arbitrary destination URLs,
IDs, ownership or role fields. Date/type/time zone lock after the first accepted
card, even if that card is later removed. Calendar windows use the event’s time
zone and clamp month ends. Stale updates return 409 and refresh the browser’s
state before another save. Book reads enforce consent and moderation independently
of UI filtering.

Local configuration: `DCB_API_PORT` (8787), `DCB_DATABASE_PATH`
(`.data/review.sqlite`). The API listens only on 127.0.0.1; Vite provides LAN
access for a phone. Do not put real private information into this HTTP test setup.
Test authentication is deliberately refused when the entrypoint is started with
`NODE_ENV=production` or `DCB_ENV=prod`. No payment/transfer endpoint exists.


Vite’s static-file deny rules cover `.data`, SQLite/key files, backend source,
repository/agent/credential directories and the original reference uploads. Only
the intentional `public` media copies are web assets. Connected tests check both
ordinary and raw backend URLs and absolute filesystem URLs for database/key files.

Gift routing was added on 20 October. `gift-intents` stores a recipient/version
snapshot and rechecks the current route even on retries before handing off.
Only the current guest’s card can be linked. No arbitrary outbound URL is accepted.
The shared routing module builds fixed HTTPS provider profiles or Zelle’s bank
finder; amount/reference are copied manually. See GIFT_ROUTING.md. Production
PostgreSQL unit-of-work contracts and approved provider-data access remain open.

## Shared DEV media and feedback extension

`GET /api/config` exposes public mode, actual UI origin, catalog count and AI
availability; session reads also include this configuration. Hosted
`POST /api/review/session {}` creates/reuses a private cookie-owned host workspace
(seven-day cookie; no account recovery). Published local passwords are refused by
the hosted identity adapter. Hosted cookies are Secure. Local QR users should
open the LAN UI URL first; `DCB_PUBLIC_SITE_URL` can fix a canonical local UI origin.

| Route | Additional contract |
| --- | --- |
| `GET /api/gifs?q=` | Bounded same-origin catalog search, known IDs only |
| `POST /api/invitations/:token/art` | Guest CSRF and exactly four design choices + retry key; reserve caps, moderate twice, return approved `artId` only |
| `GET /api/invitations/:token/art/:id` | Only the owning event guest, private no-store WebP |
| `GET /api/host/art/:id` | Only the owning event host, private no-store WebP |
| `GET /api/admin/media` | Operator-only configuration, daily attempts and estimated reserve |
| `PATCH /api/admin/media` | Operator + CSRF; `{enabled:boolean}` kill switch |
| `GET /api/feedback/session` | Scoped HttpOnly feedback cookie + CSRF, 24 hours |
| `POST /api/feedback` | CSRF, retry key, rating/category/comment and optional consented email; persistent abuse limits |
| `GET /api/admin/feedback` | Operator-only private feedback, newest 200 |
| `PATCH /api/admin/feedback/:id` | Operator + CSRF; new/reviewed/archived state, minimal audit |

Card input optionally adds `artId`; `style=ai-art` requires approved artwork owned
by this guest/event. Manual styles cannot attach arbitrary art IDs. Catalog IDs
now cover 26 templates and 24 GIFs. No photo or arbitrary URL input is added.
See [CARD_MEDIA.md](CARD_MEDIA.md) for exact quotas, retention and key setup.
