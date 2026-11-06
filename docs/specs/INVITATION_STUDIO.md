# Card and invitation design studio

**30 October 2026 · owner-requested DEV review · epic #93; stories #94–#96.**

## Discover before committing

`/cards` and `/invitations` are public design tools. Neither creates a host,
event, card box, guest link or username on entry. The first start option offers
AI artwork; the second opens the generic card or invitation templates. All 26
card designs remain available. Invitations use a curated subset of those native
stationery motifs with separately editable opening, title, details and personal
invitation text. An occasion changes recommendations without restricting the
full collection. The single home dropdown includes all 17 requested occasions,
including engagement, baptism, Sweet 16, quinceañera and Bar Mitzvah, while
existing additional host event choices remain supported. Only Wedding receives
the existing extended gift window.

The editor uses selectable HTML text over native ornament or approved artwork.
Users can edit words, choose a palette/font, change size/alignment, drag or nudge
text within the page, resize text areas, reorder layers, add/remove optional text,
undo/redo the latest 30 edits and reset. The main message cannot be removed.
On phones, text tools open on selection and can be hidden to inspect the artwork.
Long text scrolls within its own bounded text area instead of overlapping another
layer. Static templates remain available independently of AI. This is a focused
mobile editor, not the full Canva product: collaborative editing, arbitrary asset
uploads, masks, paid stock, arbitrary drawing and external font/image imports are
outside this release.

Drafts save in browser local storage under separate card/invitation keys, with
visible storage-failure handling. A searchable same-origin animation can be added
or removed. Adding the first GIF reserves space in the standard text layout.
Reduced motion uses its poster. Creator/license notices remain outside the
editable personal text. No GIF API or provider fee is introduced.

## Continue into an event or guest card

An invitation preview offers **Create an event & card box**, preserving the draft
through the existing account-choice/skip flow. On initial event creation, the
actual event title, date and location populate the corresponding invitation
layers; the host can fine-tune them next in **Design invitation**. An existing
host can save the preview to an owned card box. Event detail edits preserve the
saved design; review its wording when changing dates or venue.

The host workspace provides **Design invitation** beside **Invite & share**.
The saved invitation appears on the private guest landing. Public previews have
no sendable guest link. Publishing, link/QR copying and native-device sharing
require an existing owned event/card box. The host's share sheet or copied link
opens their chosen messaging channel; no email/SMS delivery service or delivery
confirmation is implemented. Drafts are unavailable to guests. Published,
paused, scheduled and closed routes keep the existing authorization/window rules.
Link rotation revokes old guest sessions, including private design-art reads.

A public card draft can be imported into the invitation-scoped guest composer
with **Use my saved card design**. The sender still supplies their name and
consent, reviews the card and sends through the existing authorized card endpoint.
Edits to the main message/name remain synchronized with the saved layout. The
host receives the same versioned layout in the inbox and book data, alongside
the original authoritative note. Words never require a monetary gift.

## Bounded design documents and persistence

`src/modules/design/contracts.ts` is the shared version-1 document contract:
known kind/occasion/template/palette/font; one to six uniquely identified text
layers; finite bounded positions, dimensions and type sizes; at most 8,000 text
characters total; reviewed GIF IDs; optional opaque approved artwork ID. It accepts
no HTML layout fields, CSS strings, font URLs or image URLs. React renders user
words as text. Submitted card message/GIF fields must agree with the document. Persisted card
layout JSON omits the main message body; reads restore it from the single
authoritative cards.note field.

Additive DEV migration `004-design-studio.sql` adds optional `events.invitation_json`
and `cards.design_json`, plus private `studio_sessions` and `studio_jobs`.
Existing events/cards retain their original rendering when the optional document
is absent. SQLite migrations are versioned and installed at startup locally and
inside the existing named-preview Durable Object. No namespace/name/storage reset
or production PostgreSQL migration is part of this release. Local pre-migration
backup/key copies are ignored and private; they are not independent disaster
recovery. DEV preview/session lifetimes and production gates in ADR 0009 remain.

Event documents require host ownership, same origin, CSRF and the current revision.
Card documents require the current event guest/link/window and retry key. A
successful identical retry returns its existing receipt; changed layout under the
same key conflicts. No random person can browse events or other guests' cards.

## Public AI preview protection

Use the existing server-only OpenAI configuration in [CARD_MEDIA.md](CARD_MEDIA.md).
No extra provider account/key is required for invitations. The Images request
keeps the existing fixed model, low quality, portrait size and one WebP output.
Only the purpose (card/invitation) and four allowlisted design choices are accepted;
there is no freeform prompt, upload, URL, size/model/count override or tool input.
The generated artwork contains no intended text; personal text stays editable in
HTML and is never sent to the image service. The shared provider helper performs
pre/post moderation and validates the bounded WebP envelope. Any blocked,
malformed or unavailable safety result fails closed.

A studio cookie is HttpOnly, same-origin, Secure on hosted DEV and expires after
seven days. The database stores its hash and separate CSRF token. Requests reserve
persistent quotas before provider work: **2 per studio session/day, 2 per hashed
IP/day for the studio, 4 per IP/day across all artwork and 20/day across the
application**, shared with the existing guest generator. One in-flight request per
studio session; identical approved retries reuse the image; failed/ambiguous jobs
cannot auto-retry. Session creation has additional persistent IP/total limits.
The combined guest/studio approved-image and active-reservation ceiling remains
32 MiB. These are request/storage limits, not a guaranteed provider dollar cap.
No paid calls occur in automated tests.

New AI images stay private to the studio cookie until attached to an owned event
or current guest card in the same transaction as saving. Cross-session claims,
cross-event reuse, wrong guest reads and unapproved assets are rejected. Once
claimed, the owning host/current guest reads through their authorized route;
art is not copied into a public static URL. Access and the operator switch are
rechecked after generation. An approved result is explicitly chosen with **Use this artwork**; completion
never overwrites words edited while waiting. Missing keys leave manual editing available and
state clearly that AI generation awaits setup. Never put the key in chat, VITE_
variables, a design document or source control.

| Route | Scope |
| --- | --- |
| `GET /api/studio/session` | Anonymous private studio cookie and CSRF; no event creation |
| `POST /api/studio/art` | Studio CSRF, controlled choices and persistent shared quotas |
| `GET /api/studio/art/:id` | Only the owning unexpired studio session; approved image |
| `GET /api/host/studio-art/:id` | Only the owning event host; approved claimed image |
| `GET /api/invitations/:token/studio-art/:id` | Current guest/link; event invitation art or that guest's own card art |

## Public presentation changes

Home uses the requested Smart Event Planning / Seamless Gifting heading and
platform copy. On phones, Before/After selectors enlarge each original comparison
panel; the full-resolution dialog supports panning. Desktop retains the combined
artwork. The source bitmap remains unchanged. Home cards wait 2.4 seconds, then
open over 2.2 seconds; manual controls and reduced motion remain available. The
baby card's right page shows the larger GIF with no Spanish verse/baby illustration.
Carousel titles remain available to screen readers but leave the visible arrow
control row. The new How It Works paragraphs are reproduced with a short DEV
availability note: monetary gifts use external services, private photo upload and
physical books are not connected, and permanent account-backed storage is planned.
The new readable/editor screens may scroll on phones; compactness must not clip
copy, editing controls or the enlarged comparison.

## Verification

The 30 October implementation passes the production build, planning validation,
40 API tests, five Worker tests, six deployment-routing tests, 14 UI tests and
15 connected browser tests (80 total). Coverage includes a version-3 database
upgrade/reopen without lost notes or key changes, private artwork claims and
reads, shared AI/storage caps, moderation failures, anonymous draft editing,
invitation setup/publication, guest delivery of editable cards, accessibility,
reduced motion, live QR decoding and external-payment preview boundaries.
AI provider responses are mocked; no paid request is made. The GitHub issues
record the deployed commit and hosted review results after DEV deployment.

## Remaining production work

Managed host identity/recovery, independent backups/restore testing, production
PostgreSQL/permissions, published retention/deletion, public AI abuse monitoring,
private user uploads, email/SMS delivery and physical book fulfillment keep their
existing gates. The requested marketing copy does not make these services live
or promise permanent DEV retention. The owner reviews and closes issues manually.

Official implementation references checked 30 October 2026:
[Image generation](https://developers.openai.com/api/docs/guides/image-generation),
[Moderation](https://developers.openai.com/api/docs/guides/moderation).


## 5 November 2026 stationery update

5 November extension supersedes the collection/editor counts above: 106 original cards and 95 invitation/save-the-date designs, direct on-design typing, per-layer formatting, corner resizing/duplication, editable-file import/export and finite page/art/text motion. Save-the-dates are separate owned-event designs with private links/QR and scheduled read-only presentation. Approved background imports preserve their own provenance and export bytes. Actual Canva imports require an authorized eligible export. See STATIONERY_EDITOR.md and ADR 0011.
