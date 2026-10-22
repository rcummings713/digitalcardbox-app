# ADR 0009 Shared DEV invitations and bounded card media

**Accepted for DEV review · 21 October 2026.**

The owner requests working cross-device QR invitations, searchable GIFs, at least
20 templates, safe low-cost AI artwork and private experience feedback. Browser
storage cannot resolve an event created on another phone. ADR 0008's local-only
boundary is therefore extended for the isolated feature DEV preview.

Reuse application operations and the repository contract behind both native
Node SQLite and a SQLite-backed Cloudflare Durable Object. Keep the Worker in
`wrangler.dev.jsonc`; TEST/PROD retain their previous deployment paths and require
separate production architecture work and owner release decisions. Each named
preview owns isolated storage. The current feature preview is the review target;
its URL remains stable when that named preview is updated. Old browser-only review events are not server records; publish a new hosted invitation/QR instead of reusing one of those device-only codes.

Offer a new private, cookie-owned host workspace through Continue without signing
in. The opaque host cookie lasts seven days; clearing it loses browser access and
there is no managed account recovery yet. Public local fixture passwords must
never authenticate a hosted account. A configured high-entropy server secret is
required for the seeded hosted operator; operator sessions last eight hours.
Only event link holders can open a published guest page. Link rotation revokes old
links/sessions. QR payloads use the actual UI origin/canonical URL, four-module
quiet zone, high contrast and 1280px export. Tests decode the image and send a card
from its link in a separate browser, then verify the host inbox.

Use 26 native card templates and a 24-item same-origin curated GIF store. Accept
only fixed design choices for paid AI artwork, with server-built prompts, fixed
single low-quality output, persistent atomic quotas, one active job, no automatic
paid retries, pre/post moderation and private approved assets. Missing provider
configuration leaves manual cards available. Feedback is bounded and private to
operators. See [CARD_MEDIA.md](../specs/CARD_MEDIA.md) for setup and exact limits.

This adapter is for synthetic review data. It does not satisfy managed production
identity/PostgreSQL, payment verification, production retention or backup gates.
No payment execution is introduced; reviewed external gift handoffs remain as
previously authorized. Do not promote to TEST/PROD as part of this change. Named
previews and their storage can expire or be deleted; preserve review evidence
before removal. The owner reviews and closes stories manually.

## 22 October: freely licensed stored animations

The owner excludes new GIF-provider costs and complicated agreements. Expand the
existing catalog with 120 Google Fonts Animated Noto Emoji animations licensed
under CC BY 4.0, bringing the picker to 144 choices. Commit approved files and
posters with stable IDs and a hashed provenance manifest; runtime calls remain
same-origin. Carry creator/license/modification notices in card/book views and
archives. Exports can include the actual selected animation/poster bytes, so
retention does not depend on Google URLs or a search-provider API. Keep the
original home examples and supplied cosmic asset unchanged. No API key,
subscription or paid GIF agreement is introduced; production gates remain open.
