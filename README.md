# TheDigitalCardBox

Digital cards, private event invitations and two event-book styles. Current work
is on `feature/compact-mobile-layout`, authorized for commit/push and its isolated
DEV preview on 20 October 2026. TEST/PROD promotion is separate.

Use Node **22.18 or newer**, then `npm ci` and `npm run dev -- --host 0.0.0.0`.
This starts Vite and the local API together. Open the URL Vite prints. The API
listens on loopback and is reached through Vite’s same-origin `/api` proxy.

Choose **Continue with test host** from `/start`, or sign in at `/workspace`:

| Local test account | Email | Password |
| --- | --- | --- |
| Host | `host@digitalcardbox.test` | `CardBoxReview!2026` |
| Second host | `other@digitalcardbox.test` | `CardBoxReview!2026` |
| Site administrator | `operator@digitalcardbox.test` | `CardBoxReview!2026` |

These are published, fictional **local test identities**, not production secrets.
The host starts with **A little star is on the way**. Open **Invite & share**,
copy its invitation, and open it in a private window or another phone on the same
network. Send a card with a GIF and book consent; return to the host’s Cards &
notes or Event book. **Refresh** fetches new cards immediately; the workspace
also refreshes on focus and polls while visible. New card boxes may be created
and published through the same flow.

Records persist in ignored `.data/review.sqlite`. Invitation secrets are hashed
for lookup and encrypted with ignored `.data/review-link.key` for host copy/QR.
Session cookies are HttpOnly and event guest sessions cannot open a host inbox.
Only supported feature controls are available to the separate administrator;
its overview excludes private note content. Gift matching and reviewed provider
handoffs are available; this application never submits a payment.
Use fictional information: managed production identity, PostgreSQL hosting,
private photo uploads, transaction-data APIs, payment execution and production operations are not
connected. See [ADR 0008](docs/adr/0008-local-backend-review.md).

For gift testing, the seeded event has all three **preview-only** services.
Send a card, choose an optional service, review the exact recipient and reference,
then preview the handoff and finish without sending. The host sees the linked
card, intended amount and nickname as **Unconfirmed**. To inspect actual service
navigation, use the event’s **Settings**, enter your own verified recipient twice,
uncheck **Preview only**, and confirm that recipient inside the service.
Cash App/Venmo open the recipient’s HTTPS profile; Zelle opens its bank finder
with instructions to use your bank’s app. No amount, memo, guest name or private
card content is passed to a provider. See [gift routing](docs/specs/GIFT_ROUTING.md).

The original account-free browser adapter remains available with
`npm run dev:ui`. Default `npm run build` produces that static review mode for
the existing Cloudflare deployment workflow. It **does not deploy this Node API**.
Do not use the review build as a production authentication/storage implementation.

Checks: `npm run build`, `npm run check:planning`, `npm run test:api`,
`npm run test:ui`, `npm run test:connected`, and
`node --test scripts/deployment-plan.test.mjs`. Connected tests use a separate
temporary database, never the owner’s `.data` directory. Playwright uses Chrome
on macOS and installed Chromium on CI (`npx playwright install chromium`).

Read [the page map](docs/specs/UI_DESIGN.md), [review guide](planning/UI_REVIEW.md),
[API contract](docs/specs/LOCAL_API.md), and
[production release gates](docs/specs/MVP_ACCEPTANCE.md). Issues stay open for the
owner to review and close. The repository/package/Worker identifiers remain
`digitalcardbox-app`; PROD requires a separate owner-approved release under
[ADR 0006](docs/adr/0006-deployment-environments.md).
