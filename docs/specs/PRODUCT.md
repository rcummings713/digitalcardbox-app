# TheDigitalCardBox product specification

**Version:** 13 October 2026. **Target:** private external-wallet MVP by 31 October 2026.

The product name is **TheDigitalCardBox**. See [ADR 0004](../adr/0004-product-name.md) for repository and backlog naming.

## Product promise

The host creates an event or occasion page and shares a single link or QR. Guests leave a note or card, may attach one bounded photo, and can choose a host-enabled external gift service. The host keeps a private CardVault and basic export. Words and gifts are independent: a note needs no gift, a gift needs no note, and an AI failure cannot prevent manual writing.

## October scope

1. Managed host sign-in with verified email, server-side event ownership and fresh authentication for publishing or changing gift destinations.
2. Dated event or bounded undated occasion; stable, unguessable and revocable guest link; QR points to the same link.
3. Server checks opening, contribution and final gift deadlines on every write. For dated events, open no earlier than six months before the event; cards, notes and photos close 90 days after. A wedding may remain gift-only until 12 months after; other events close at day 90. An undated page closes within 90 days of publication. Closed links show a closed page. The host retains private CardVault access and export.
4. Manual note, editable card templates, optional bounded photo and explicit book visibility consent. Guided AI offers three editable text choices and card copy/layout suggestions. The server caps and moderates requests. Static templates work without AI. The owner brought a bounded image-generation experiment forward for isolated DEV on 21 October; see ADR 0009. Production image-generation acceptance remains separate.
5. Host may enable any subset of Cash App, Venmo and Zelle. Each service has one exact destination, entered twice and explicitly confirmed by the host after checking that service. A change pauses only that service until fresh confirmation; other confirmed services remain active. Keep an audit record and alert the host.
6. Guest selects an enabled service, sees the host-supplied recipient and full identifier, confirms they will check the recipient inside that service, and then receives an allowlisted server-generated handoff. Switching services or a destination version invalidates that acknowledgment. Never trust a host-supplied arbitrary redirect.
7. The app labels a handoff as **unconfirmed**. Only the host can mark a gift **host confirmed** after checking their own account. A click, return URL or guest report is not proof of receipt.
8. Private host dashboard, consented event-book view, moderation and basic export. Guests are never blocked at premium book entry thresholds.

## Host event choices

The host setup retains Wedding, Other dated event, and One-off occasion, and also offers:

- Gender reveal parties
- Sip and sees
- First Communions / Confirmations
- Debutante balls / Cotillions
- Proms (and pre-prom parties)
- College Decision Day
- Bridal showers
- Bachelor and bachelorette parties
- Rehearsal dinners
- Housewarming parties
- Retirement parties
- Career promotions / Professional graduations
- Bat Mitzvahs
- Wakes / Celebrations of Life

These additional choices use the existing dated, non-wedding lifecycle: contributions and gifts close at day 90. Wedding alone qualifies for gifts through month 12; bridal showers, bachelor/bachelorette parties, and rehearsal dinners do not inherit that extension. One-off occasion retains its bounded undated lifecycle. The selected event label appears in setup and guest landing; wakes and celebrations of life use remembrance wording.

## Persistent customer, guest and gift records

Production follows [DATA_MODEL.md](DATA_MODEL.md) and [ADR 0005](../adr/0005-database-design.md), with managed PostgreSQL and private photo/export storage. Registered customers represent hosts; anonymous guests are event-scoped and independent of expiring sessions. Cards, consent, destination versions, external gift intent/activity and host receipt marks persist independently. The current UI uses fictional records in device-local storage for account-free owner design review; production authorization and storage remain open. See [UI_DESIGN.md](UI_DESIGN.md) and [ADR 0007](../adr/0007-ui-first-design-review.md).

External gift activity is not proof of a financial transaction. Future premium purchase transactions and approved integrated gift ledgers are separate Post-MVP contracts. Guest intake closure does not delete CardVault records; ongoing private access follows a published retention/deletion policy.

## Beyond October

Supervised live occasions and optional generated backgrounds extend the free pilot. Later candidates include $4.99 premium cards, $15/$30/$79 polished event books priced from 0–99 / 100–299 / 300+ included entries after day 90, hosted product checkout, approved integrated cash processing, licensed art/GIFs and music clips, advanced AI editing, reminders, printed books, video, referrals, pooled gifts, international rails and native mobile apps. The [backlog](../../planning/backlog.md) retains all candidates.

The $500 developer payment is a one-time, indefinitely fixed arrangement for planned code work. It is separate from vendor, hosting, artwork, counsel, licensing and payment-service costs.

## Deployment environments

[ADR 0006](../adr/0006-deployment-environments.md) separates the static UI's DEV feature previews, TEST develop/release deployments and owner-approved PROD deployments from master. The sole contributor can approve their own production deployment; no second-person review is required by this workflow. Each GitHub environment holds a distinct account-owned token with Editor access only to its matching existing Cloudflare Worker. No account-wide or domain-route access is required for the current static UI. Environment setup does not implement the production backend or waive the MVP release gates.

## UI-first design review

The customer interface now includes occasion-led creation and planned Apple/Google/Amazon/email account choices with a no-sign-in continuation, a host workspace, opaque invitation-only guest routes, original illustrated cards with optional local GIFs, editorial/collage book views and an in-app administrator workspace. No public event directory is offered. Feature switches and stats are local fictional review data; production roles, feature enforcement, provider transaction matching and licensed GIF search remain separate work. Known name, payment-app alias and an opaque reference assist host gift matching without verifying receipt. See planning/UI_REVIEW.md for decisions and the page map.
