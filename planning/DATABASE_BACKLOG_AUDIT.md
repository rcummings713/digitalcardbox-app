# Database coverage and redundancy audit

**Reviewed:** 13 October 2026. **Repository:** `rcummings713/digitalcardbox-app`.
**Project:** [TheDigitalCardBox Development](https://github.com/users/rcummings713/projects/3).

Reviewed all six Word references, canonical specs, ADRs, repository instructions, the complete local 17-epic/101-story backlog, and all 60 existing GitHub issues (9 epics/51 stories, including comments, parent/sub-issue and blocking relationships). The project had exactly those 60 issues and no draft items. No pre-existing database foundation story or linked blocker was found. Existing issue #14's event-selection update and #5's presentation history are preserved.

## Findings and decisions

The Word system-design file already proposed PostgreSQL and a brief table list; it mixed current external gifts with future recipient accounts, provider events, music and book orders. DATA_MODEL.md only named module record groups. Database, migrations and backups were mentioned in aggregate Word estimates, but no issue installed a schema or tested the deployed connection/migration workflow. Thus the gap is explicit design and delivery ownership, not a complete absence of storage references.

[ADR 0005](../docs/adr/0005-database-design.md) selects managed PostgreSQL and [DATA_MODEL.md](../docs/specs/DATA_MODEL.md) defines 23 MVP tables. Supabase is the first spike candidate, consistent with the financial reference; provider/runtime/auth choices remain conditional on ADR 0001. No service is provisioned by this change. Word diagrams are preserved and the outdated table list is replaced, not kept as a competing design.

The MVP records external intent/activity and host receipt marks, not verified financial transactions. Existing later stories already cover platform checkout and approved gift ledgers. Their local criteria now identify separate Billing and Gifts tables; those later epics have not been imported merely to implement this database review.

Older Word text required a confirmed cash route before publishing an event. Canonical product scope makes gifts optional and notes independent: a note-only page can publish with gifts disabled, while gift actions require a confirmed enabled route. The reference wording is corrected to match that boundary. A host-only receipt mark is not provider verification.

## New infrastructure work

| Backlog item | Scope | Estimate / provisional target |
| --- | --- | --- |
| [DCB-E18 / #62 Database foundations and migrations](https://github.com/rcummings713/digitalcardbox-app/issues/62) | Parent for the three missing prerequisites; no duplicate domain implementations. | October private MVP |
| [DCB-E18-S01 / #63 Validate PostgreSQL deployment and migration workflow](https://github.com/rcummings713/digitalcardbox-app/issues/63) | Provider/connection spike, environment roles, ordered migration workflow and recovery. | 8 h / Oct 14 |
| [DCB-E18-S02 / #64 Install module tables and scoped relational constraints](https://github.com/rcummings713/digitalcardbox-app/issues/64) | Canonical tables, keys/indexes/FKs, narrow database interfaces and synthetic integrity checks. | 10 h / Oct 15; blocked by S01 |
| [DCB-E18-S03 / #65 Provide atomic units of work and durable delivery](https://github.com/rcummings713/digitalcardbox-app/issues/65) | Composition-layer transactions, reusable idempotency/outbox/consumer primitives and crash/replay evidence. | 6 h / Oct 16; blocked by S02 |

Existing persistence stories depend on S02; transactional/replay consumers depend on S03, which already depends on S02. Redundant transitive blockers are removed. Native GitHub blocker links and linked issue bodies mirror this graph. Stable backlog markers prevent reruns from creating a second epic/story.

## Existing owners retained

| Concern | Existing live issues | Added storage contract, not another story |
| --- | --- | --- |
| Customer identity, host scope, audit and guests | #7 epic; #8–12 stories | identity.customers/event_guests/guest_sessions, event owner and audit/outbox references. |
| Event configuration, link and window locking | #13 epic; #14, #15, #21 | events.events/share_links; scoped link generation; atomic first-activity window lock. QR/lifecycle stories retain their existing behavior. |
| Notes/cards/photo/consent/moderation | #22 epic; #23, #24, #26–28 | cards.submissions/media_assets/consent_events/moderation_actions. Card independence remains #25. |
| AI budgets and privacy | #29 epic; #32, #34 | ai.requests/usage_buckets, bounded metadata and atomic reservation; manual fallback remains #33. |
| External routes, acknowledgment, handoff and receipt | #35 epic; #36–38, #40, #42–45 | gifts.routes/destination_versions/gift_intents/gift_events. Guest route display remains #39/#41. |
| Host view, consented book, snapshot and export | #46 epic; #47–50 | book metadata/snapshots/entries/exports; current consent/moderation rechecked before disclosure. |
| Encryption, retention and recovery | #51 epic; #54, #56 | External versioned keys, least privilege, retention/manual deletion and database/media restore. #54 moves Oct 13 → Oct 16 after schema installation. |

## Future owners retained locally

| Existing item | Distinct responsibility |
| --- | --- |
| DCB-E08-S06 | Later provider-specific callback/retry workflows; foundational October SQL delivery is DCB-E18-S03. |
| DCB-E10-S02 through S05 | Billing order/item/attempt/verified event/entitlement/refund tables; no separate book_orders copy. |
| DCB-E11-S02 through S07 | Approved recipient/payment/event/ledger/payout/refund/dispute/reconciliation tables. A new funds-flow ADR remains required. |
| DCB-E17-S02 | Automate the MVP manual retention/deletion runbook; do not duplicate its initial recovery policy. |

## Redundancy checks

- One customer identity per issuer/subject; no duplicate users/hosts/customer profiles. Managed identity retains host sessions.
- Event-scoped guest survives session expiry; no unrequested global guest CRM/contact matching.
- Notes/cards share a submission table; CardVault is an authorized view; Book stores only rebuildable metadata and frozen membership.
- Route slot and immutable versions are separate; intents reference versions without copying clear identifiers. Only the initial repeated entry is transient.
- Gift events provide receipt history; security audit records references; outbox delivers public messages. These are distinct purposes with minimal payloads.
- Future orders and gift ledgers are separate; a generic transactions table or parallel book_orders table would duplicate those sources of truth.
- New work installs storage/primitives; existing domain stories implement behavior. No duplicate backup, encryption, guest-session, receipt or checkout story is added.
- Backlog validation checks unique markers/titles, known acyclic nonredundant blockers, dates/hours and generated Markdown synchronization. Live verification checks unique markers, parent relationships, blocker links and project membership after creation.

## Applied updates and validation

Created #62–65, added all four to the existing project in Todo, and extended 29 existing story bodies plus seven parent epics. The live project now has 64 issues (10 epics/54 stories); no unrelated future backlog was imported. All three new stories are sub-issues of #62 and share the October milestone. Prior notes in #5/#14 remain intact. No issues were closed.

`npm run build`, `npm run check:planning`, importer dry-run, readable backlog synchronization and diff whitespace checks pass. All six Word packages parse as valid OOXML; all unchanged package parts and all seven existing drawings are preserved byte for byte. These are documentation/planning validations, not SQL migration or production-behavior test results; the new issues define those outstanding implementation checks.

## Schedule and status

The baseline grows from 156 hours/51 October stories to **180 hours/54 stories**. The local complete backlog becomes **18 epics/104 stories**. First-week prerequisites produce 72/54/54 weekly hours, so capacity must be replanned before promising October 31. Historical 114–157 / 126–192 Word ranges are superseded by this detailed 180-hour October baseline and a provisional 192–215-hour broader pilot (180 + prior 12–35 follow-on allowance), pending overlap review. The fixed $500 code-work arrangement is unchanged. No issue is closed or implementation claimed by the documentation/backlog update.


## 6 November 2026 DEV product-purchase extension

DCB-E10 is now imported as #100, with S01–S05 #101–105 OPEN/In Progress and S06 #106 OPEN/Todo. Migration 006 implements isolated SQLite Billing/Book tables, unique provider/request references, composite scope, frozen membership and preserved content/key. The production PostgreSQL infrastructure/recovery work stays with DCB-E18; this does not duplicate or close those stories. Sandbox gross/refund totals do not satisfy margins/processing-fee reconciliation in S06.


## 11 November stable DEV target

Extend existing hosted DEV story #91 (DCB-E18-S05) and checkout story #103 rather than adding another database epic. The existing DEV Worker's main deployment initializes its own isolated review namespace, preserving the previous preview. `dev` provides repeatable releases and a stable Stripe sandbox endpoint. Migrations/key storage remain unchanged; this is neither a preview-record migration nor delivery of production PostgreSQL/recovery gates. Stories stay open/In Progress for owner review.
