# TheDigitalCardBox development backlog

**October private MVP target:** 31 October 2026 · 180 focused developer hours across 54 stories.
**Status:** AI-drafted estimates; release depends on acceptance gates and capacity, not date alone.
**Source:** Generated from `backlog.json` by `python3 planning/render_backlog.py`.

Database coverage and scope exclusions: [DATABASE_BACKLOG_AUDIT.md](DATABASE_BACKLOG_AUDIT.md).

## October schedule

| Due | Issue | Story | Hours |
| --- | --- | --- | ---: |
| 2026-10-14 | DCB-E01-S01 | Deploy static demo | 4 |
| 2026-10-14 | DCB-E01-S02 | Make demo boundaries visible | 2 |
| 2026-10-14 | DCB-E18-S01 | Validate PostgreSQL deployment and migration workflow | 8 |
| 2026-10-15 | DCB-E18-S02 | Install module tables and scoped relational constraints | 10 |
| 2026-10-16 | DCB-E01-S03 | Make the demo link shareable | 2 |
| 2026-10-16 | DCB-E02-S01 | Managed host sign-in | 7 |
| 2026-10-16 | DCB-E03-S01 | Create dated event or occasion | 6 |
| 2026-10-16 | DCB-E08-S03 | Protect secrets and destinations | 3 |
| 2026-10-16 | DCB-E18-S03 | Provide atomic units of work and durable delivery | 6 |
| 2026-10-17 | DCB-E02-S02 | Enforce event ownership | 4 |
| 2026-10-17 | DCB-E03-S02 | Publish one shareable URL | 3 |
| 2026-10-18 | DCB-E01-S04 | Review the prototype on phones | 2 |
| 2026-10-18 | DCB-E01-S05 | Capture tester feedback | 2 |
| 2026-10-18 | DCB-E02-S03 | Protect sensitive host actions | 5 |
| 2026-10-18 | DCB-E02-S04 | Issue scoped guest sessions | 3 |
| 2026-10-18 | DCB-E03-S03 | Generate QR from the same URL | 2 |
| 2026-10-18 | DCB-E08-S01 | Authorize every server operation | 3 |
| 2026-10-20 | DCB-E04-S01 | Write and submit a note | 4 |
| 2026-10-21 | DCB-E04-S02 | Style a card with templates | 5 |
| 2026-10-21 | DCB-E04-S03 | Submit card without gift | 2 |
| 2026-10-22 | DCB-E03-S04 | Open no earlier than six months | 3 |
| 2026-10-22 | DCB-E03-S05 | Close book contributions after day 90 | 3 |
| 2026-10-22 | DCB-E05-S01 | Generate three guided note choices | 4 |
| 2026-10-23 | DCB-E03-S06 | Keep late wedding gifts open | 3 |
| 2026-10-23 | DCB-E03-S07 | Show a closed landing page | 2 |
| 2026-10-23 | DCB-E04-S04 | Attach an optional photo | 5 |
| 2026-10-23 | DCB-E05-S02 | Accept optional memory without invention | 2 |
| 2026-10-24 | DCB-E03-S08 | Prevent deadline reset and revoke links | 4 |
| 2026-10-24 | DCB-E04-S05 | Choose book visibility | 2 |
| 2026-10-24 | DCB-E05-S03 | Moderate and cap note requests | 3 |
| 2026-10-24 | DCB-E07-S01 | Show private host dashboard | 3 |
| 2026-10-25 | DCB-E04-S06 | Hide and remove inappropriate content | 3 |
| 2026-10-25 | DCB-E05-S04 | Keep manual composer on AI failure | 2 |
| 2026-10-25 | DCB-E05-S07 | Budget AI and preserve fallback | 2 |
| 2026-10-25 | DCB-E07-S04 | Freeze book after day 90 | 2 |
| 2026-10-26 | DCB-E06-S01 | Configure several payment services | 5 |
| 2026-10-26 | DCB-E06-S02 | Double-enter and confirm each identifier | 3 |
| 2026-10-27 | DCB-E06-S03 | Pause only a changed service | 3 |
| 2026-10-27 | DCB-E06-S04 | Let guest choose a service | 3 |
| 2026-10-28 | DCB-E06-S05 | Reset review when guest switches | 2 |
| 2026-10-28 | DCB-E06-S06 | Show exact payee before leaving | 3 |
| 2026-10-29 | DCB-E02-S05 | Alert hosts to destination changes | 3 |
| 2026-10-29 | DCB-E06-S07 | Validate selected route atomically | 4 |
| 2026-10-29 | DCB-E06-S08 | Keep external status honest | 2 |
| 2026-10-30 | DCB-E06-S09 | Let host mark a checked receipt | 2 |
| 2026-10-30 | DCB-E06-S10 | Respect gifting deadlines | 2 |
| 2026-10-30 | DCB-E07-S02 | Create consented event book view | 3 |
| 2026-10-30 | DCB-E07-S03 | Export basic CardVault privately | 3 |
| 2026-10-30 | DCB-E08-S02 | Protect browser requests | 3 |
| 2026-10-30 | DCB-E08-S04 | Limit abuse and uploads | 2 |
| 2026-10-30 | DCB-E08-S05 | Test backup and restore | 2 |
| 2026-10-31 | DCB-E08-S08 | Run mobile and accessibility checks | 3 |
| 2026-10-31 | DCB-E09-S02 | Check every published payee | 2 |
| 2026-10-31 | DCB-E09-S03 | Run scripted money-state tests | 4 |

## All epics and stories

### DCB-E01 Disposable public prototype

Release: October 2026 private MVP and follow-on. A public demo URL shows the intended guest and host flow without real accounts or transfers

- **DCB-E01-S01 Deploy static demo** — October 2026 private MVP. As a founder, I want a temporary public URL so that I can show the prototype to hosts and guests.
  - The root URL loads the guest landing page on mobile and desktop.
  - The prototype is served over HTTPS and can be deleted without affecting future production.
- **DCB-E01-S02 Make demo boundaries visible** — October 2026 private MVP. As a visitor, I want to know this is a demo so that I do not try to send money or enter sensitive data.
  - Every payment control states no app opens and no transfer occurs.
  - Sample host identifiers and non-persistent content are clearly labeled.
- **DCB-E01-S03 Make the demo link shareable** — October 2026 private MVP. As a founder, I want the Copy link button to use the deployed URL so that testers reach the live prototype.
  - Copied URL opens the guest landing page.
  - A decorative QR is not presented as a scannable QR.
- **DCB-E01-S04 Review the prototype on phones** — October 2026 private MVP. As a founder, I want to test the flow on a phone so that screens are usable at an event.
  - Guest and host navigation, service picker, card editor and book preview work at common mobile widths.
  - Keyboard focus and button labels remain visible.
- **DCB-E01-S05 Capture tester feedback** — October 2026 private MVP. As a founder, I want a simple feedback checklist so that the first hosted demo teaches us what to build.
  - Record task completion, confusion points and wrong-payee concerns.
  - Convert validated findings to backlog issues before MVP implementation.

### DCB-E02 Identity and access

Release: October 2026 private MVP and follow-on. Hosts control private event data while guests can contribute through scoped sessions

- **DCB-E02-S01 Managed host sign-in** — October 2026 private MVP. As a host, I want to sign in securely so that I can manage my event.
  - Use a managed identity provider and verified email.
  - Server stores provider subject and role, not a custom password database.
  - Persist one identity.customers record per (auth_issuer, auth_subject); synchronize verified email without using email as ownership identity or storing passwords.
  - Review Apple, Google, Amazon and manual email account entry with an account-free UI bypass during design review; provider eligibility/configuration and verified server sessions remain required before launch. Never collect a password in the local UI.
  - **Blocked by:** DCB-E18-S02
- **DCB-E02-S02 Enforce event ownership** — October 2026 private MVP. As a host, I want only authorized hosts to see my private event data so that gifts and notes remain private.
  - Every host read and write checks ownership or explicit membership on the server.
  - Cross-event access tests are denied.
  - Resolve ownership from events.events.owner_customer_id and verified customer identity; scoped database interfaces/policies deny cross-event data using actual runtime credentials.
  - **Blocked by:** DCB-E18-S02
- **DCB-E02-S03 Protect sensitive host actions** — October 2026 private MVP. As a host, I want a fresh sign-in for payment destination edits and exports so that stolen sessions have less power.
  - Require step-up authentication on sensitive actions.
  - Log actor, event, action and time.
  - Append minimal platform.audit_events for sensitive actions; no token, destination identifier or private text in audit payloads.
- **DCB-E02-S04 Issue scoped guest sessions** — October 2026 private MVP. As a guest, I want to leave a note without an account so that contributing is easy.
  - Issue a short-lived event-scoped session and store only its token hash.
  - A guest cannot read or edit another guest’s private draft.
  - Persist identity.event_guests independently of identity.guest_sessions, with same-event guest/link FKs; session expiry/revocation cannot delete accepted cards or gift records.
  - **Blocked by:** DCB-E18-S02
- **DCB-E02-S05 Alert hosts to destination changes** — October 2026 private MVP. As a host, I want notice when a payment account changes so that I can catch unauthorized edits.
  - Send a change alert containing service and change time without sensitive secrets.
  - Keep old and new route versions in an audit trail.
  - Queue alerts through platform.outbox_messages in the route-change transaction; audit references immutable destination versions without copying identifiers.
  - **Blocked by:** DCB-E18-S03
- **DCB-E02-S06 Separate operator privileges** — Post-MVP. As an operator, I want limited support access so that production support does not expose unrelated private data.
  - Support roles use multifactor authentication and least privilege.
  - Private note access is audited and not available by default.

### DCB-E03 Event pages, links and time windows

Release: October 2026 private MVP and follow-on. One stable event URL supports the full contribution and gift lifecycle

- **DCB-E03-S01 Create dated event or occasion** — October 2026 private MVP. As a host, I want to enter an event date, time zone and page type so that the opening and closing dates are accurate.
  - Server derives allowed windows in the event time zone.
  - An undated one-off page must choose a close date within 90 days.
  - Persist events.events with owner, occasion label, lifecycle kind, IANA timezone, derived UTC deadlines and policy version; only wedding kind grants the month-12 extension.
  - **Blocked by:** DCB-E18-S02
- **DCB-E03-S02 Publish one shareable URL** — October 2026 private MVP. As a host, I want one link that I can text or email so that remote guests reach the event.
  - Generate an opaque, unguessable slug.
  - Public page exposes only approved event fields.
  - Persist events.share_links with unique token hash, encrypted recoverable secret and generation; enforce one unrevoked link per event.
  - Guest pages are invitation-only, with no public event directory or guest-event link in public navigation; host preview uses the same event route. Frontend routing never substitutes for server link authorization.
  - **Blocked by:** DCB-E18-S02
- **DCB-E03-S03 Generate QR from the same URL** — October 2026 private MVP. As a host, I want a printable QR so that in-person guests reach the same page.
  - QR encodes only the stable event URL, never a wallet identifier.
  - Scanning and clicking return the same event state.
- **DCB-E03-S04 Open no earlier than six months** — October 2026 private MVP. As a host, I want to open contributions up to six months before the event so that guests can participate early.
  - Scheduled pages reject new notes, cards, art jobs and gift intents before opens_at.
  - Guest sees the opening state.
- **DCB-E03-S05 Close book contributions after day 90** — October 2026 private MVP. As a host, I want new notes, cards and photos to stop 90 days after the event so that the book can be finalized.
  - Server rejects these writes after the boundary.
  - Existing private content and export remain available to the host.
- **DCB-E03-S06 Keep late wedding gifts open** — October 2026 private MVP. As a guest, I want a gift-only route through month 12 after a wedding so that I can give late without changing the book.
  - Only new gifts are permitted after day 90 and through month 12.
  - Non-wedding events close gift intake at day 90.
- **DCB-E03-S07 Show a closed landing page** — October 2026 private MVP. As a visitor, I want a clear closed message so that I do not attempt an unavailable action.
  - Old link and QR still open a closed page.
  - No new card or gift intent can be initiated after final close.
- **DCB-E03-S08 Prevent deadline reset and revoke links** — October 2026 private MVP. As a host, I want to close or rotate a compromised link so that I can protect the event.
  - Date and closing window cannot move after first contribution or gift attempt.
  - Revocation can close earlier and invalidates the old slug.
  - Lock the event row for date edits and first accepted submission/created gift intent; set window_locked_at atomically and test concurrent attempts to reset deadlines.
  - **Blocked by:** DCB-E18-S03

### DCB-E04 Manual notes, cards and photos

Release: October 2026 private MVP and follow-on. Guests can create personal content without AI or a cash gift

- **DCB-E04-S01 Write and submit a note** — October 2026 private MVP. As a guest, I want to write my own message so that I can contribute without AI.
  - Text remains editable until submission.
  - Server validates length, consent and active contribution window.
  - Persist final text in cards.submissions using same-event guest references and idempotent submission; explicit consent and outbox delivery commit with accepted content.
  - **Blocked by:** DCB-E18-S03
- **DCB-E04-S02 Style a card with templates** — October 2026 private MVP. As a guest, I want to choose a layout, palette and motif so that my card feels personal.
  - A static template is immediately available.
  - Final text is rendered separately from background art for readability.
  - Use the same cards.submissions record for note/card kinds; retain template key/version and bounded style JSON instead of duplicating card text or adding an October template catalog.
  - Review original vector card art, premium typography, full readable long notes and an optional searchable local GIF collection; no generated-image dependency in the core card collection.
  - **Blocked by:** DCB-E18-S02
- **DCB-E04-S03 Submit card without gift** — October 2026 private MVP. As a guest, I want to submit a card without money so that participation is never tied to payment.
  - Card creation does not require a gift ID.
  - Gift failure cannot remove a submitted card.
- **DCB-E04-S04 Attach an optional photo** — October 2026 private MVP. As a guest, I want to attach a photo so that the host can remember the occasion.
  - Enforce type, size and dimension limits and scan uploads.
  - Private storage and short-lived access URLs are used.
  - Persist cards.media_assets metadata and private object key; scoped FKs, clean scan state and a partial unique constraint enforce one guest-owned photo per submission.
  - **Blocked by:** DCB-E18-S02
- **DCB-E04-S05 Choose book visibility** — October 2026 private MVP. As a guest, I want to control whether my message appears in the shared book so that my preferences are respected.
  - Consent is explicit and saved with the submission.
  - Private submissions are excluded from the consented book view.
  - Persist ordered cards.consent_events with explicit choice and wording version; missing/withdrawn consent denies book inclusion even when the projection is stale.
  - Increment the submission public source revision and publish a minimal outbox event for later consent changes so stale book projections cannot authorize an export.
  - **Blocked by:** DCB-E18-S02
- **DCB-E04-S06 Hide and remove inappropriate content** — October 2026 private MVP. As a host, I want to moderate guest content so that the book is safe to share.
  - Host can hide or remove an entry with an audit record.
  - Removal is reflected in later exports.
  - Append cards.moderation_actions, update content state and publish removal atomically; invalidate existing export artifacts and prevent replay from resurrecting erased data.
  - **Blocked by:** DCB-E18-S03

### DCB-E05 AI note and artwork assistance

Release: October 2026 private MVP and follow-on. AI offers bounded editable choices while manual creation always remains available

- **DCB-E05-S01 Generate three guided note choices** — October 2026 private MVP. As a guest, I want to select relationship, tone and length so that AI suggests usable notes.
  - Return three distinct short options.
  - Guest selects and edits one before submission.
- **DCB-E05-S02 Accept optional memory without invention** — October 2026 private MVP. As a guest, I want to add a memory so that suggestions feel personal.
  - Treat guest detail as data, not instructions.
  - With no detail, produce general wording without fabricated memories.
- **DCB-E05-S03 Moderate and cap note requests** — October 2026 private MVP. As an operator, I want AI requests bounded so that abuse and cost stay manageable.
  - Validate sessions and event window before provider calls.
  - Apply input caps, quotas, output validation and refusal fallback.
  - Persist minimal ai.requests and atomically reserve ai.usage_buckets for guest/event/application caps; concurrent requests cannot exceed limits and failed reservations recover safely.
  - **Blocked by:** DCB-E18-S03
- **DCB-E05-S04 Keep manual composer on AI failure** — October 2026 private MVP. As a guest, I want to finish my note if AI is unavailable so that I am never blocked.
  - Timeout, refusal or malformed output preserves the manual editor.
  - An AI error does not create or erase a card.
- **DCB-E05-S05 Generate two artwork variations** — Post-MVP. As a guest, I want up to two background options so that I can choose a look.
  - One active art job per session and two variations maximum.
  - Return approved private previews through short-lived URLs.
- **DCB-E05-S06 Render readable card typography** — Post-MVP. As a guest, I want names and message text legible so that artwork does not distort them.
  - Place precise text in an HTML or SVG overlay.
  - Contrast and export rendering match the preview.
- **DCB-E05-S07 Budget AI and preserve fallback** — October 2026 private MVP. As a founder, I want request usage measured so that a free pilot does not create runaway costs.
  - Record token/image usage without private memories in logs.
  - Budget switch disables AI while templates and manual notes continue.
  - Keep token/image counts, prompt/model versions and outcomes without durable private prompt/suggestion copies; quota counters are not financial transactions.
- **DCB-E05-S08 Generate moderated card artwork within a bounded budget** — UI design review. As an invited guest, I want controlled greeting-card artwork so that I can personalize my card without unbounded cost or arbitrary prompts.
  - Offer at least 20 independent manual templates; keep notes separate from artwork.
  - Only allowlisted occasion/palette/art-direction/motif choices reach a fixed server-built single-image request; reject arbitrary prompts, URLs and provider overrides.
  - Persist guest/event/IP/global daily reservations before provider work, allow one active job, deduplicate and count failures without automatic paid retry.
  - Moderate input and output, fail closed on explicit/malformed/unavailable safety checks, expose only approved owned assets, and document server-only key setup.
  - Manual cards and GIFs remain usable on missing keys, failures or quota limits; the owner reviews and closes the story.

### DCB-E06 External cash gifts with guest choice

Release: October 2026 private MVP and follow-on. Guests choose among host-confirmed services and pay the host outside the app

- **DCB-E06-S01 Configure several payment services** — October 2026 private MVP. As a host, I want to enable Cash App, Venmo and Zelle together so that guests can choose the service they use.
  - Allow any nonempty subset with one active destination per service.
  - Only confirmed enabled routes appear to guests.
  - Persist gifts.routes with UQ (event_id, service) and a scoped current-version reference; enabled plus current host-confirmed version determines guest availability.
  - **Blocked by:** DCB-E18-S02
- **DCB-E06-S02 Double-enter and confirm each identifier** — October 2026 private MVP. As a host, I want to enter each account twice so that I can catch typing errors.
  - Require exact match, format validation, host ownership acknowledgment and review in that service.
  - Do not accept arbitrary redirect URLs or account credentials.
  - Persist immutable encrypted gifts.destination_versions; record host confirmation actor/time/wording version once and never store the repeated identifier entry.
- **DCB-E06-S03 Pause only a changed service** — October 2026 private MVP. As a host, I want to edit or disable one destination so that other services remain available.
  - Fresh authentication, audit and alert are required.
  - Edited route disappears until reconfirmed; other confirmed routes continue.
  - Route edits and handoffs lock the same route row; create a new unconfirmed current version, audit and queue the alert atomically. Prior versions remain historical only.
  - **Blocked by:** DCB-E18-S03
- **DCB-E06-S04 Let guest choose a service** — October 2026 private MVP. As a guest, I want to select from the host’s enabled services so that I can use an app I have.
  - Show only currently confirmed routes.
  - Selecting another service updates the full recipient and identifier.
- **DCB-E06-S05 Reset review when guest switches** — October 2026 private MVP. As a guest, I want a fresh recipient check after switching services so that I do not approve the wrong destination.
  - Changing service or route version clears acknowledgment.
  - Handoff stays disabled until the selected route is reviewed again.
  - Increment gifts.gift_intents.review_revision on service/version switches and clear acknowledgment atomically; a stale revision cannot authorize a later handoff.
  - Keep a handed-off intent’s selected tuple immutable; a later service choice creates a new intent rather than relabeling a prior gift or receipt.
  - **Blocked by:** DCB-E18-S03
- **DCB-E06-S06 Show exact payee before leaving** — October 2026 private MVP. As a guest, I want to see the host-supplied name and exact identifier so that I can compare the recipient in my payment app.
  - Prominent adjacent copy states who supplied the details and that the app has not independently verified them.
  - Mismatch tells guest to stop and contact host by a known channel.
- **DCB-E06-S07 Validate selected route atomically** — October 2026 private MVP. As an operator, I want stale or cross-event gift intents rejected so that a switched or disabled account is not used.
  - Store selected_service, destination_id and version with the intent.
  - Server rejects stale, disabled, unconfirmed or wrong-event route at handoff.
  - Use a short PostgreSQL unit of work through public module repositories to lock event/link/session/route/intent and recheck current deadlines, revocation, switches and exact reviewed tuple before recording handoff_issued.
  - Composite FKs bind event/guest/service/route/version; repeated requests deduplicate durable effects but recheck current authorization and route validity before returning a handoff.
  - **Blocked by:** DCB-E18-S03
- **DCB-E06-S08 Keep external status honest** — October 2026 private MVP. As a guest, I want the app to state what it knows so that a click is not mistaken for a successful payment.
  - Link opened and guest reported remain unverified.
  - No external handoff is labeled provider verified.
  - Persist external activity in gifts.gift_events; handoff_issued/guest_reported stay unconfirmed, with no provider settlement, verified transaction or payout ledger in October.
- **DCB-E06-S09 Let host mark a checked receipt** — October 2026 private MVP. As a host, I want to mark a gift received after checking that provider account so that my private list is useful.
  - UI labels it host marked received.
  - Host review records actor and time without claiming provider confirmation.
  - Append gifts.gift_events host confirmation with actor/time and reviewed version; permit an audited corrective revocation and keep host confirmation distinct from provider verification.
  - Show guest known name, optional payment-app alias, intended amount, linked card and opaque matching reference. Treat these as unverified clues; names or references alone never establish receipt.
  - **Blocked by:** DCB-E18-S03
- **DCB-E06-S10 Respect gifting deadlines** — October 2026 private MVP. As a host, I want gift initiation blocked after close so that old links cannot be used indefinitely.
  - Active and wedding gift-only states allow new intents.
  - Final closure rejects new intents while permitting prior reconciliation.
  - Check the fresh event clock inside the transaction after locking; final closure blocks new handoffs without deleting prior intents or blocking host reconciliation.
- **DCB-E06-S11 Investigate approved external transaction-data matching** — Post-MVP. As a host, I want a permitted way to match an external gift to its sender and card so that duplicate names or aliases do not create false receipt claims.
  - Document provider-by-provider personal/business eligibility, available API or approved import, consent/scopes, permitted transaction identifiers, costs and restrictions. Do not assume personal Cash App, Venmo or Zelle history is accessible.
  - If an approved integration exists, design server-owned event/card/reference mapping with authenticated provider evidence, idempotency, ambiguous-match handling, correction and audit; a browser callback or guest report is not evidence.
  - Retain known name, payment-app alias, optional amount/reference and manual host receipt review as the fallback. Do not collect credentials, financial screenshots or infer receipt from names alone.
  - Get owner/provider approval before expanding from external directions to integrated payment processing; keep verified provider state separate from host-confirmed state.

### DCB-E07 Host dashboard, CardVault and event book

Release: October 2026 private MVP and follow-on. The host keeps private memories and can export them after guest intake closes

- **DCB-E07-S01 Show private host dashboard** — October 2026 private MVP. As a host, I want to view entries and gift intent states so that I can manage my event.
  - Host-only view displays approved cards and unverified/host marked gift states separately.
  - Guest link never grants dashboard access.
  - Read customer-owned data through public module queries; CardVault is a view of Cards/Gifts data, not a duplicate content table.
  - **Blocked by:** DCB-E18-S02
- **DCB-E07-S02 Create consented event book view** — October 2026 private MVP. As a host, I want a book of allowed notes and photos so that I can revisit them.
  - Book includes only consented and unhidden entries.
  - A card with an attached photo counts as one entry.
  - Use book.entry_projection as rebuildable revisioned metadata; obtain content through Cards public contracts and recheck current consent/moderation before disclosure.
  - Review editorial and collage spreads, a dedication/cover, photo compositions and a readable text mode; preserve complete long notes and remove hidden/nonconsented cards immediately.
  - **Blocked by:** DCB-E18-S03
- **DCB-E07-S03 Export basic CardVault privately** — October 2026 private MVP. As a host, I want a basic export even if I never buy an upgrade so that my memories remain accessible.
  - Host can request export after closure.
  - Signed download is short-lived and audited.
  - Persist book.exports with requester, same-event snapshot, status, private object key, expiry and invalidation; never store signed URLs or serve artifacts after removal/withdrawal.
  - **Blocked by:** DCB-E18-S03
- **DCB-E07-S04 Freeze book after day 90** — October 2026 private MVP. As a host, I want a stable snapshot after new entries close so that book pricing and layout can be final.
  - No late wedding gift adds a new book entry.
  - Snapshot records included count and timestamp.
  - Persist book.snapshots and book.snapshot_entries after consuming source changes through cutoff; unique membership/position, atomic included count and correction revisions never admit late gifts.
  - **Blocked by:** DCB-E18-S03
- **DCB-E07-S05 Preview book tiers without guest cap** — Post-MVP. As a host, I want the projected $15/$30/$79 price to follow included entry count so that no guest is blocked.
  - Show 0–99, 100–299 and 300+ tiers.
  - Quote final tier after day 90; no preselected guest list or contribution cap.
- **DCB-E07-S06 Honor later removal requests** — Post-MVP. As a guest, I want an allowed removal request to affect later exports so that my content preferences are respected.
  - Host moderation or deletion updates read model and subsequent export.
  - Required financial records, if any, follow separate retention policy.

### DCB-E08 Security, privacy and reliability

Release: October 2026 private MVP and follow-on. Authentication, data boundaries and failure tests protect the pilot

- **DCB-E08-S01 Authorize every server operation** — October 2026 private MVP. As a host, I want another event’s users blocked from my data so that private content stays private.
  - Validate actor and event from server session, not browser-supplied role.
  - Cover read, write, export, media and job status routes.
- **DCB-E08-S02 Protect browser requests** — October 2026 private MVP. As an operator, I want common web attacks mitigated so that basic routes are not easy to abuse.
  - Use secure cookies, CSRF or strict Origin checks, output escaping and a restrictive CSP.
  - Test expired sessions and privilege changes.
- **DCB-E08-S03 Protect secrets and destinations** — October 2026 private MVP. As a host, I want account identifiers and API keys handled carefully so that exposure is limited.
  - Keep provider secrets server-side; encrypt sensitive destinations at rest.
  - No bank credentials, passwords or payment details in analytics/logs.
  - Application-encrypt gifts.destination_versions identifiers and recoverable share secrets with external versioned keys; separate migration/runtime roles and redact database errors/audit/outbox.
  - **Blocked by:** DCB-E18-S02
- **DCB-E08-S04 Limit abuse and uploads** — October 2026 private MVP. As an operator, I want rate limits and file checks so that malicious traffic does not overwhelm the app.
  - Rate-limit session, AI and upload routes.
  - Reject unsupported/oversized files and scan approved uploads.
- **DCB-E08-S05 Test backup and restore** — October 2026 private MVP. As a host, I want my accepted cards recoverable so that an outage does not erase the event.
  - Run tested database backup and restore.
  - Private media retention and deletion rules are documented.
  - Document provider/version/backup method and recovery objectives; restore migrated database, private object references and external encryption-key access, then reapply deletion tombstones before serving data.
  - Publish retention periods/TTLs and a tested manual deletion runbook for sessions, orphan media, exports, customer/guest/content/gift history and replay evidence; event closure alone does not purge CardVault.
  - **Blocked by:** DCB-E18-S02
- **DCB-E08-S06 Make retried work safe** — Post-MVP. As an operator, I want jobs and callbacks to tolerate retries so that duplicate events do not create inconsistent state.
  - Use idempotency keys or unique event IDs.
  - Replay tests cover duplicate and out-of-order events.
  - Scope this Post-MVP story to provider callbacks and expanded asynchronous workflows; October SQL idempotency/outbox/consumer foundations belong to DCB-E18-S03 and feature-specific retries stay with their domain stories.
- **DCB-E08-S07 Observe failures and spend** — Post-MVP. As a founder, I want error and usage dashboards so that I can detect problems during the pilot.
  - Log minimal event IDs, action outcome, latency and cost.
  - Alert on auth failures, AI spend and gift-route mismatches without logging private text.
- **DCB-E08-S08 Run mobile and accessibility checks** — October 2026 private MVP. As a guest, I want screens I can use on a phone or keyboard so that I can participate at an event.
  - Test focus order, labels, contrast and responsive layouts.
  - High priority blockers are fixed before supervised pilot.
  - UI review includes axe WCAG 2.2 AA checks, keyboard skip and route focus, 320/375/768/1280 px reflow, opt-in/pausable GIF motion and real-device/manual assistive-technology review. Automated checks do not certify ADA compliance.

### DCB-E09 Supervised pilot and learning

Release: October 2026 private MVP and follow-on. Two supervised events validate completion, correct destinations and real demand

- **DCB-E09-S01 Recruit pilot hosts** — Post-MVP. As a founder, I want a small set of suitable hosts so that I can test realistic occasions.
  - Recruit 5–10 interested hosts and select two supervised events.
  - Explain prototype limitations and support contact.
- **DCB-E09-S02 Check every published payee** — October 2026 private MVP. As a founder, I want to compare host-entered routes to their payment apps so that wrong destinations are caught before guests use them.
  - Host confirms each enabled account and display name.
  - Record mismatch and resolution without collecting account credentials.
- **DCB-E09-S03 Run scripted money-state tests** — October 2026 private MVP. As a founder, I want wrong-account and closure scenarios tested so that we do not falsely claim gifts were paid.
  - Test switches, stale versions, disabled routes, event boundary and host-marked status.
  - No unresolved wrong-destination defect at release gate.
- **DCB-E09-S04 Measure guest completion** — Post-MVP. As a founder, I want separate conversion for notes, cards and gift handoffs so that I know where users struggle.
  - Record privacy-safe funnel events and mobile failures.
  - Separate link opens from host-confirmed external receipt.
- **DCB-E09-S05 Triage and decide next phase** — Post-MVP. As a founder, I want a release decision based on pilot evidence so that later costs are justified.
  - Review support complaints, usage and premium interest.
  - Record go/no-go and priority fixes before integrated payments or licensed music.

### DCB-E10 Optional premium cards and books

Release: Post-MVP. Sell optional design upgrades and polished books without charging for basic participation

- **DCB-E10-S01 Offer premium card design** — Post-MVP. As a guest, I want to see a $4.99 premium card option so that I can choose a richer design.
  - Free manual path remains.
  - Premium status and price are clear before checkout.
- **DCB-E10-S02 Quote book price from included entries** — Post-MVP. As a host, I want a final server quote so that I pay for the correct $15/$30/$79 tier.
  - Tier uses 0–99, 100–299 or 300+ consented entries after day 90.
  - Price cannot be altered by the browser.
  - Quote from a frozen book.snapshots revision and included membership; billing.order_items preserve count/tier/price/currency without another book_orders table.
- **DCB-E10-S03 Use hosted product checkout** — Post-MVP. As a buyer, I want to pay for a card or book through a hosted payment page so that the app does not collect my card details.
  - Create server-side order and provider session.
  - Do not store PAN/CVV or treat return URL as payment proof.
  - Persist billing.orders/order_items/payment_attempts; customer or same-event guest buyer, unique provider/request references and server prices remain separate from gift funds.
- **DCB-E10-S04 Grant paid entitlement on signed event** — Post-MVP. As a buyer, I want access to the upgrade after payment so that I receive what I bought.
  - Verified provider event is replay-safe.
  - Entitlement applies once to the correct card or event.
  - Durably deduplicate verified billing.provider_events by provider/event ID and grant billing.entitlements once per paid target; no browser-controlled paid state.
- **DCB-E10-S05 Handle failed checkout and refund** — Post-MVP. As a buyer, I want an honest order status so that I know whether I was charged.
  - Pending and failed payments do not unlock.
  - Refund updates entitlement and purchase history.
  - Persist billing.refunds against the payment attempt with unique provider refund ID; partial/full refunds preserve purchase history and apply the approved entitlement policy.
- **DCB-E10-S06 Track product margins** — Post-MVP. As a founder, I want to compare revenue with processing, AI and media costs so that prices can be adjusted.
  - Report paid conversion by tier and product contribution.
  - Gift principal is never counted as platform revenue.

### DCB-E11 Approved integrated gift payments

Release: Post-MVP. A provider-approved future route can process gift checkout with a reconciled ledger

- **DCB-E11-S01 Secure written provider approval** — Post-MVP. As a founder, I want provider approval for the exact gifting flow so that checkout fits underwriting and legal roles.
  - Document merchant of record, custody, fees, payout timing, disputes and refunds.
  - Do not enable live integrated gifts before written acceptance.
- **DCB-E11-S02 Onboard recipient through provider** — Post-MVP. As a host, I want hosted identity and payout onboarding so that bank details never enter this app.
  - Provider collects documents and bank numbers.
  - App stores provider account ID and readiness state only.
  - Persist gifts.recipient_accounts with provider account ID/readiness only, scoped to the customer; no identity documents or bank numbers.
- **DCB-E11-S03 Show full fee and create checkout** — Post-MVP. As a guest, I want to see gift, service fee and total before paying so that the charge is clear.
  - Server calculates approved fee and creates idempotent checkout.
  - Hosted page collects funding credentials.
- **DCB-E11-S04 Verify signed payment callbacks** — Post-MVP. As an operator, I want signed webhooks to update payment state so that browser redirects cannot claim a gift was paid.
  - Verify raw payload signature and unique provider event ID.
  - Duplicate and out-of-order delivery tests pass.
  - Persist separate gifts.integrated_payments/payment_attempts/provider_events; verified provider-event uniqueness and allowed transitions never promote an external intent to verified payment.
- **DCB-E11-S05 Keep gift ledger and payout state** — Post-MVP. As a host, I want available and paid-out totals separated so that I understand where money stands.
  - Settled, payout pending and paid out have distinct states.
  - Unsettled funds are never shown as available.
  - Finalize provider-approved gifts.ledger_accounts/ledger_journals/ledger_entries and payouts/payout_allocations design under a new ADR; balanced atomic journals, currency segregation and no mutable host balance.
- **DCB-E11-S06 Handle refunds and disputes** — Post-MVP. As an operator, I want reversals recorded so that reported balances remain accurate.
  - Refunds and disputes create compensating entries.
  - Guest and host views use provider-backed status.
  - Persist gifts.refunds/disputes with provider references and compensating journals; history is append-only and partial refunds never overwrite settled principal.
- **DCB-E11-S07 Reconcile provider and app daily** — Post-MVP. As a founder, I want daily exception reporting so that money mismatches are caught promptly.
  - Compare signed provider events and ledger totals.
  - Investigate any unmatched charge or payout before expansion.
  - Persist gifts.reconciliation_runs/items linking provider totals and unmatched payment/payout/journal records with resolution evidence.
- **DCB-E11-S08 Retain external route as independent choice** — Post-MVP. As a host, I want approved integrated checkout to coexist safely with external services if supported so that migration is gradual.
  - Clearly distinguish external unverified and integrated provider-verified gifts.
  - Never merge their statuses or fee models.

### DCB-E12 Conditional music, GIFs and licensed artwork

Release: Post-MVP. Media enriches cards only when the specific distribution rights and cost are approved

- **DCB-E12-S01 Obtain music use rights** — Post-MVP. As a founder, I want a contract for short clips so that card and note playback is permitted.
  - Contract covers composition and recording, sharing, territory, term and in-app playback.
  - Do not assume a 15-second clip is exempt.
- **DCB-E12-S02 Offer licensed clip picker** — Post-MVP. As a guest, I want an optional song snippet so that my card evokes a memory.
  - No song is the default; previews play only after a tap.
  - Store catalog ID and rights version, not a copied recording.
- **DCB-E12-S03 Recheck rights at playback** — Post-MVP. As a recipient, I want a card to remain viewable if a song expires so that memories are not lost.
  - Authorize each stream by rights, region and expiry.
  - Unavailable clip becomes a silent card with allowed attribution.
- **DCB-E12-S04 Control audio in exports** — Post-MVP. As a host, I want book exports to honor music rights so that I can share them safely.
  - Default export contains no recorded audio.
  - Include playback or audio only if export rights are explicitly granted.
- **DCB-E12-S05 License art templates and GIFs** — Post-MVP. As a founder, I want approved assets so that generated and selected visuals can be displayed and retained.
  - Record creator, source, grant, territory, derivatives and export rights.
  - Reject unlicensed user-added popular media until a permitted route exists.
  - Original project GIF stickers can support design review; approved third-party API attribution, content filtering, retention and event-book export rights must be resolved before catalog rollout.
- **DCB-E12-S06 Keep media optional** — Post-MVP. As a guest, I want a complete static card so that licensing or media failures do not block my note or gift.
  - Manual no-song and no-GIF paths always work.
  - Media errors do not roll back accepted cards or gift intents.

### DCB-E13 Advanced AI and personalization

Release: Post-MVP. Assess evidence, vendor terms, cost and risk before scheduling this extension.

- **DCB-E13-S01 Edit an existing image with consent** — Post-MVP. As a user or operator of TheDigitalCardBox, I want to edit an existing image with consent so the product can expand when justified.
  - Reference-photo transformations need explicit owner consent, moderation, provenance and deletion.
  - Scope, pricing and release gate are documented before implementation.
- **DCB-E13-S02 Learn a private writing voice by opt in** — Post-MVP. As a user or operator of TheDigitalCardBox, I want to learn a private writing voice by opt in so the product can expand when justified.
  - Personal profile is optional, scoped, deletable and never mixed with other accounts.
  - Scope, pricing and release gate are documented before implementation.
- **DCB-E13-S03 Compare generated designs before spending** — Post-MVP. As a user or operator of TheDigitalCardBox, I want to compare generated designs before spending so the product can expand when justified.
  - Show cost and output limits before starting image work.
  - Scope, pricing and release gate are documented before implementation.
- **DCB-E13-S04 Expand bounded occasion templates** — Post-MVP. As a user or operator of TheDigitalCardBox, I want to expand bounded occasion templates so the product can expand when justified.
  - Templates cover birthdays, graduations, holidays and sympathy with manual fallback.
  - Scope, pricing and release gate are documented before implementation.

### DCB-E14 Growth and reminder features

Release: Post-MVP. Assess evidence, vendor terms, cost and risk before scheduling this extension.

- **DCB-E14-S01 Let a recipient schedule future occasions** — Post-MVP. As a user or operator of TheDigitalCardBox, I want to let a recipient schedule future occasions so the product can expand when justified.
  - Reminders are opt in with a clear off switch and no contact scraping.
  - Scope, pricing and release gate are documented before implementation.
- **DCB-E14-S02 Track guest to host referrals** — Post-MVP. As a user or operator of TheDigitalCardBox, I want to track guest to host referrals so the product can expand when justified.
  - Measure invitations without exposing guest identities to unrelated events.
  - Scope, pricing and release gate are documented before implementation.
- **DCB-E14-S03 Offer planner and venue referrals** — Post-MVP. As a user or operator of TheDigitalCardBox, I want to offer planner and venue referrals so the product can expand when justified.
  - Attribute referrals with explicit consent and measurable terms.
  - Scope, pricing and release gate are documented before implementation.
- **DCB-E14-S04 Create a private relationship timeline** — Post-MVP. As a user or operator of TheDigitalCardBox, I want to create a private relationship timeline so the product can expand when justified.
  - Only opted-in contacts and occasions appear, with export and deletion.
  - Scope, pricing and release gate are documented before implementation.

### DCB-E15 Media and physical keepsakes

Release: Post-MVP. Assess evidence, vendor terms, cost and risk before scheduling this extension.

- **DCB-E15-S01 Support consented video memories** — Post-MVP. As a user or operator of TheDigitalCardBox, I want to support consented video memories so the product can expand when justified.
  - Enforce upload size, duration, moderation, storage and retention limits.
  - Scope, pricing and release gate are documented before implementation.
- **DCB-E15-S02 Offer a printed event book** — Post-MVP. As a user or operator of TheDigitalCardBox, I want to offer a printed event book so the product can expand when justified.
  - Quote printing, shipping, taxes, returns and proof approval before sale.
  - Scope, pricing and release gate are documented before implementation.
- **DCB-E15-S03 Offer reusable design marketplace** — Post-MVP. As a user or operator of TheDigitalCardBox, I want to offer reusable design marketplace so the product can expand when justified.
  - Record commercial template and derivative rights for each asset.
  - Scope, pricing and release gate are documented before implementation.
- **DCB-E15-S04 Expand GIF library safely** — Post-MVP. As a user or operator of TheDigitalCardBox, I want to expand gif library safely so the product can expand when justified.
  - Use a licensed API/catalog and label attribution and allowed reuse.
  - Scope, pricing and release gate are documented before implementation.
  - Provide searchable/paginated licensed GIF results with loading/empty/failure states, provider attribution and content filters; use static posters and explicit play/pause, preserve a no-GIF path, and handle removal/rights expiry without losing a note.
  - Owner choice on 22 October: use freely licensed, locally retained animations without a GIF API fee, subscription or custom provider agreement.
  - Retain creator, source, license, change notices and immutable asset hashes; selected animation bytes and credits are included in CardVault/book archives.

### DCB-E16 New gift rails and markets

Release: Post-MVP. Assess evidence, vendor terms, cost and risk before scheduling this extension.

- **DCB-E16-S01 Evaluate pooled group gifts** — Post-MVP. As a user or operator of TheDigitalCardBox, I want to evaluate pooled group gifts so the product can expand when justified.
  - Map custody, fee, refund and dispute duties before collecting principal.
  - Scope, pricing and release gate are documented before implementation.
- **DCB-E16-S02 Evaluate international gifts** — Post-MVP. As a user or operator of TheDigitalCardBox, I want to evaluate international gifts so the product can expand when justified.
  - Research country limits, currencies, tax and provider approval before build.
  - Scope, pricing and release gate are documented before implementation.
- **DCB-E16-S03 Offer more provider approved external routes** — Post-MVP. As a user or operator of TheDigitalCardBox, I want to offer more provider approved external routes so the product can expand when justified.
  - Add only allowlisted methods with host confirmation and exact guest display.
  - Scope, pricing and release gate are documented before implementation.
- **DCB-E16-S04 Add native mobile applications if justified** — Post-MVP. As a user or operator of TheDigitalCardBox, I want to add native mobile applications if justified so the product can expand when justified.
  - Use measured repeat use to justify separate mobile releases.
  - Scope, pricing and release gate are documented before implementation.

### DCB-E17 Operations and analytics

Release: Post-MVP. Assess evidence, vendor terms, cost and risk before scheduling this extension.

- **DCB-E17-S01 Build consent-safe analytics dashboard** — Post-MVP. As a user or operator of TheDigitalCardBox, I want to build consent-safe analytics dashboard so the product can expand when justified.
  - Track funnel and spend without storing unnecessary message content.
  - Scope, pricing and release gate are documented before implementation.
  - Administrator UI shows aggregate counts and feature health without private card text, destination identifiers or unverified revenue; device-only fictional stats remain distinct from production analytics.
- **DCB-E17-S02 Automate retention and deletion requests** — Post-MVP. As a user or operator of TheDigitalCardBox, I want to automate retention and deletion requests so the product can expand when justified.
  - Respect active event windows and lawful financial retention.
  - Scope, pricing and release gate are documented before implementation.
  - Extend the October manual retention/deletion runbook into automation; preserve deletion tombstones across replay/restore and apply separately approved financial retention only when financial tables exist.
- **DCB-E17-S03 Document incident response and support flows** — Post-MVP. As a user or operator of TheDigitalCardBox, I want to document incident response and support flows so the product can expand when justified.
  - Handle account takeover, wrong-payee reports and provider disputes with owners.
  - Scope, pricing and release gate are documented before implementation.
- **DCB-E17-S04 Add scalability and recovery drills** — Post-MVP. As a user or operator of TheDigitalCardBox, I want to add scalability and recovery drills so the product can expand when justified.
  - Load test, restore, queued jobs and independent module health checks.
  - Scope, pricing and release gate are documented before implementation.
- **DCB-E17-S05 Enforce feature controls on the server** — Post-MVP. As an authorized operator, I want scoped feature switches so that disabling a feature takes effect on all affected operations, not just the interface.
  - Define scoped/default feature policy, reason, actor, timestamps, rollback and operator MFA/least privilege; deny client-supplied roles and write an audit trail.
  - Recheck feature availability atomically on server mutations/jobs; disabled gifts, GIF selection, book delivery and new-event creation cannot be re-enabled through direct API calls.
  - Preserve accepted cards and truthful gift states when features are disabled; keep administrator reads free of private content by default.
  - The current local administrator switches are UI review only and are not production controls.

### DCB-E18 Database foundations and migrations

Release: October 2026 private MVP. A managed PostgreSQL foundation stores customers, event-scoped guests and honest external gift history with constrained module tables and reliable transactional delivery

- **DCB-E18-S01 Validate PostgreSQL deployment and migration workflow** — October 2026 private MVP. As a developer, I want a tested managed PostgreSQL connection and versioned migration workflow so that production persistence can be deployed and recovered safely.
  - Read ADR 0001 and ADR 0005; evaluate Supabase first and record selected provider, supported PostgreSQL version, auth integration, connection adapter, pooling/caching and backup capability after the deployed stack spike passes.
  - Verify a server-only connection and short multi-statement transaction in the chosen runtime; separate environments and migration/runtime credentials without browser secrets or cached authorization reads.
  - Establish one ordered module-owned migration history and synthetic-only seed workflow; empty apply, repeat apply and failed-migration recovery pass in an isolated environment.
  - Do not implement sign-in, event behavior, destination encryption or backup drills here; existing domain/security stories retain those responsibilities.
- **DCB-E18-S02 Install module tables and scoped relational constraints** — October 2026 private MVP. As a developer, I want the canonical module tables and constraints so that customer, guest and gift data have one consistent storage contract.
  - Install the 23 October tables in docs/specs/DATA_MODEL.md with module ownership, opaque IDs, typed timestamps/money, same-event FKs, immutable history controls and reviewed indexes.
  - Enforce unique provider identity, active share link, one photo per submission, one route per event/service and route/current-version references; reject orphan and cross-event guest/media/route/snapshot references with synthetic data.
  - Persist event-scoped guests separately from sessions; no duplicate hosts/users/customers, notes/cards/CardVault content, generic transaction ledger or future Billing/integrated-payment migrations.
  - Provide narrow database permissions/policies tested with actual runtime credentials; domain adapters and business behavior remain in DCB-E02 through DCB-E07.
  - **Blocked by:** DCB-E18-S01
- **DCB-E18-S03 Provide atomic units of work and durable delivery** — October 2026 private MVP. As a developer, I want reusable transaction, request deduplication and outbox primitives so that concurrent or retried work cannot lose or duplicate accepted domain changes.
  - Public module repository adapters share a composition-layer PostgreSQL unit of work with documented lock ordering and bounded deadlock/serialization retries; no private-table imports across modules.
  - Implement platform.idempotency_keys, outbox_messages and consumer_receipts with scoped request digest/resource references, atomic mutation/event commits, leases, bounded retries and source-revision checks.
  - Demonstrate concurrent same-key submission returns one resource, changed-body key reuse conflicts, rollback leaves no orphan outbox work, and crash/duplicate/out-of-order delivery cannot duplicate or regress a projection.
  - Domain stories own route/window/quota/consent/receipt checks using these primitives; backup stays DCB-E08-S05 and later provider-specific retry work stays DCB-E08-S06.
  - **Blocked by:** DCB-E18-S02
- **DCB-E18-S04 Run a persistent local host and guest test backend** — UI design review. As the owner, I want a persistent local backend for host and guest review so that I can test the full card journey across browsers while the UI continues to change.
  - Seeded fictional host/operator identities use server sessions; host operations enforce event ownership and guest actions remain invitation-scoped.
  - Create/publish a card box, open the invitation in another browser, submit a note with an allowlisted GIF and explicit consent, and review the persistent host inbox and both book layouts.
  - Validate CSRF/origin, revisions, bounded input, retry keys, event windows, link rotation, moderation and feature flags on the server; payment execution remains disabled.
  - Version and test the isolated local SQLite adapter without replacing the managed PostgreSQL/identity production gates; leave private photo uploads visibly unavailable.
  - Record API/browser verification and local test access; leave GitHub story #90 open and In Progress for owner closure.
- **DCB-E18-S05 Host the DEV test backend for live invitations and QR codes** — UI design review. As the owner, I want shared DEV invitations so that QR codes work across phones.
  - Reuse the event/card repository behind an isolated Cloudflare SQLite Durable Object adapter; keep managed production identity/PostgreSQL open.
  - Cookie-owned private review workspaces and secret-protected operator access replace public hosted test passwords.
  - Generate high-resolution QR images from the canonical published guest URL; decode and test fresh-browser guest submission and host inbox.
  - Persist bounded feedback and approved private card assets with ownership, CSRF, window and quota enforcement; no money movement or TEST/PROD promotion.

### DCB-E19 Customer UI and owner design review

Release: UI design review. The complete customer and operator page set can be reviewed without sign-in before backend integration; production gates remain open.

- **DCB-E19-S01 Build customer discovery and account-free entry** — UI design review. As a visitor, I want intuitive occasion-led creation so that I can begin without understanding the app first.
  - Use the current logo, fonts and palette for home, how it works, cards, pricing, about, contact, privacy, terms and accessibility pages; remove the public sample-site wording.
  - Home creation choices retain occasion context through the planned Apple/Google/Amazon/email account screen, with an explicit no-sign-in route for design review.
  - Include accurate contact draft behavior, copyright and footer navigation; no public guest-event entry or fabricated live service action.
- **DCB-E19-S02 Build application routing and browser review state** — UI design review. As the business owner, I want all intended UI journeys connected using fictional records so that design choices can be tested before backend work.
  - Cover host creation/details/share/QR/cards/gifts/book/settings/profile and invitation-only guest landing/composer/review/gift/thanks plus invalid, draft, paused, scheduled, closed and gift-only states.
  - Direct URLs, refresh and Back/Forward work. Device state and per-invitation drafts survive supported refresh; errors and reset are visible. No sign-in, real event data, payment or provider credentials are needed.
  - Record the browser adapter boundaries and future replacement with authorized server contracts; maintain all existing backend acceptance criteria and keep this release off production.
- **DCB-E19-S03 Build administrator design-review pages** — UI design review. As an operator reviewing the design, I want a coherent administrative workspace so that I can evaluate feature controls and useful stats.
  - Provide overview, feature switches, minimal event directory and activity history in the shared app theme.
  - Local switches affect gift choices, GIF selection, writing prompts, book view and new-event creation. Existing accepted content is preserved.
  - Explain device-only fictional access; production roles, MFA, server feature enforcement and analytics remain separate backlog work.
- **DCB-E19-S04 Review the card and event-book art direction** — UI design review. As the business owner, I want an exceptional coherent keepsake design so that cards and books feel worth revisiting.
  - Review six original vector card directions, actual note typography, optional photo/animated-sticker placements and responsive long-message handling.
  - Compare editorial and collage book spreads, cover/dedication, consent filtering and accessible reading/print modes. Do not introduce a guest contribution cap or require a gift.
  - Record owner choices and remaining polish before approval; keep issues open for the owner and do not infer design approval from automated tests.
