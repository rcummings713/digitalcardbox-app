# ADR 0010 Public card and invitation design before event setup

**Accepted for isolated DEV review · 30 October 2026.**

The owner requests a Canva-like mobile card editor and equally capable premium
invitations that can be explored before committing to an account/card box.
Sending still requires an event/card box. This extends ADRs 0008/0009 for DEV;
it does not change the production PostgreSQL/managed-identity decision or approve
TEST/PROD promotion, integrated payments or permanent storage guarantees.

Use one bounded versioned design-document contract and a reusable HTML-text/native
ornament editor for public cards, invitation previews and owned invitation edits.
Keep private card text independent of generated artwork. Preserve the existing
26 templates and 144 retained animations; no external editor, GIF service, font
import or arbitrary remote asset loader is needed. Public drafts remain local
until attached to the existing authorized event/card operations. Initial event
setup transfers the draft and replaces its event-title/date/place placeholders;
the host can review/personalize it before publishing the existing private link/QR.
Native-device sharing is a handoff to the owner's messaging channel, not a new
email/SMS delivery system.

Support bounded anonymous AI studio sessions separately from event guests, so
trying an invitation never silently creates a fake event or inflates host/event
counts. Share the existing generation/moderation helper, global 20-attempt daily
cap and 32 MiB art ceiling with guest AI. Add stricter studio IP/session caps,
atomic reservations/idempotency and post-generation checks. Artwork remains
private; claiming it to an event/current guest happens within the save transaction.
No owner/role/event authority is accepted from a public preview payload.

Use additive DEV/local migration 004 for optional event/card document JSON and
studio sessions/jobs; keep the existing named preview, object identity, encryption
key and records. Production schema/identity/backup acceptance remains unfinished.
Document details and API contracts in [INVITATION_STUDIO.md](../specs/INVITATION_STUDIO.md).

The latest readability request permits vertical scrolling for the enlarged phone
comparison, full process copy and design editors. Keep responsive reflow and
progressive controls instead of clipping/shrinking the new content to one screen.
Use the requested marketing copy with an adjacent DEV availability note where
it describes physical books, permanent storage and money/photo capabilities.

Tracking: existing #85, #24, #73, #92; new epic #93 with stories #94–#96.
All remain open / In Progress for the owner's design review and manual closure.
