# TheDigitalCardBox application UI

**Updated:** 18 October 2026. **Stage:** local design review with a persistent test backend (ADR 0008); production integration remains open.

## Visual direction

Retain the current branch's founder logo, `public/theme.css` palette and locally
hosted Forum, Montserrat and Hanken Grotesk fonts. La Belle Aurore remains the
documented decorative fallback until a licensed Miss Noteworthy webfont is
supplied. Public pages use generous spacing, white panels, blush backgrounds,
direct occasion-specific creation calls to action. The latest home page replaces stock photography with an opening card and the owner-supplied before/after artwork.

The composer includes a guided relationship/tone/length/memory writing panel
with three editable prepared choices. Live AI is explicitly unconnected;
manual notes always remain available.

Cards include the opening A Little Star baby card, plus six original code-native vector directions: Pressed Peony, Golden
Hour, Written in the Stars, With Love, Wildflower Letter and A Moment to Keep.
Do not add generated background art to the core collection. The founder's logo
stays in the shared header/footer, not on guest cards or book entries. Long text
must wrap and expand without clipping. Every decorative illustration is hidden
from assistive technology; each personal note remains real readable text.

The event book starts with an editorial cover and dedication, followed by paired
spreads with readable notes and photo compositions. A second collage layout
places illustrated cards on paper-like spreads. Include a text-reading mode,
previous/next controls, current spread, readable export and print view. Only
currently consented and unhidden entries appear. The owner confirmed both
directions: an elegant editorial album and a rich scrapbook with layered notes
and photos. Present The Editorial and The Collage as equal choices and remember
the selected style per card box in the browser adapter. Changing event details
must preserve that choice. Detailed artwork polish and actual device review
remain open; automated checks do not certify visual quality.

## Browser-only design review (`npm run dev:ui`)

All records are fictional. No authentication, private server storage, message
delivery, checkout, provider transaction import, live AI or licensed GIF API is
connected. Workspace edits persist in browser local storage; guest drafts use
per-invitation session storage. Storage failures are surfaced. Account reset
restores fictional records. Uploaded images stay on the device, with a 2 MB
limit. No password or provider credential is collected. Public pages do not use
the old sample-site banner or navigation.

The entry screen shows planned Apple, Google, Amazon and email choices with a
clear **Continue without signing in** path, as confirmed by the owner. Creation
buttons retain this account-choice step before event setup. Provider buttons explain their
unconnected state rather than simulate authentication. This is an intentional
review affordance, not an account or access-control implementation.

The review build sets noindex/nofollow/noarchive and no-referrer.
These prevent ordinary indexing/referrer disclosure and are not authorization.
Before public launch, make indexing policy route-specific on the server.

Never put real customer data into this build. Client-side routes, role labels,
UUID links, hidden navigation and local storage cannot protect private data.
Production requires the server-side gates in SECURITY_PAYMENT.md and
MVP_ACCEPTANCE.md. Keep this work off PROD until the owner chooses a release.

## Page map

| Route | Purpose |
| --- | --- |
| `/` | Occasion-led creation, card collection, product story |
| `/start?occasion=Wedding` | Account choices, account-free continuation |
| `/how-it-works`, `/cards`, `/pricing`, `/about` | Product discovery, art collection, book tiers |
| `/contact` | Support/info addresses and a local email draft; no silent sending |
| `/privacy`, `/terms`, `/accessibility` | Accurate workspace disclosures, use guidance and accessibility contact |
| `/workspace` | Host card-box directory with open, draft and closed occasions |
| `/workspace/new` | Occasion, title, host names, date/time zone, welcome, cover |
| `/workspace/events/:id/overview` | Cards/photos/gifts counts and next actions |
| `/workspace/events/:id/edit` | Editable details; date/type lock after contributions |
| `/workspace/events/:id/share` | Publication, guest preview, copy invite, functional downloadable QR |
| `/workspace/events/:id/cards` | Search/filter/read, host-only status, hide/remove, local CardVault export |
| `/workspace/events/:id/gifts` | Sender/payment alias/reference, receipt review and host-only confirmation |
| `/workspace/events/:id/book` | Editorial/collage, consent filtering, text view, export/print |
| `/workspace/events/:id/settings` | Pause/revoke invitation, per-service double entry and confirmation |
| `/workspace/account` | Device profile/preferences, motion setting, reset and admin review entry |
| `/g/:opaqueToken` | Invitation-only guest landing; no public event directory |
| `/g/:opaqueToken/card` | Template, note, optional photo/GIF, explicit book consent |
| `/g/:opaqueToken/review` | Full card and text review, local send action |
| `/g/:opaqueToken/gift` | Independent optional gift, exact recipient, matching reference |
| `/g/:opaqueToken/handoff` | Recipient/service instructions, exact HTTPS route, copy helpers, safe preview or explicit service navigation, return without receipt claims |
| `/g/:opaqueToken/thanks` | Card/gift outcome with honest unconfirmed status |
| `/admin/overview` | Aggregate fictional workspace metrics, no private card text |
| `/admin/features` | Device-only switches for creation, gifts, GIFs, prompts and books |
| `/admin/events`, `/admin/activity` | Minimal event metadata and change history |

Unknown or draft invitation tokens reveal no event. Scheduled, paused, expired
and gift-only states have distinct routes/actions. Public navigation has no
event guest link; the host's share panel supplies preview and QR. Rotating the
token invalidates old local links. In browser-only mode, custom event links work only in the same browser. In connected local mode, published invitations work across browsers/devices through the API. Legacy `/prototype/index.html` and
`/host` lead to the host workspace; `/guest` no longer opens a public event.

## Gift matching and media boundaries

Collect the guest's known name, optional payment-app name, intended amount and
an opaque per-contribution matching reference that may be copied into a memo.
These are clues, not a provider transaction ID. The host must check their own
account before marking **host confirmed**, and can undo the mark. Changing
services or destination versions resets recipient acknowledgment. Disabled and
unconfirmed destinations do not appear to guests. As authorized on 20 October,
verified host-configured recipients can open Cash App/Venmo profiles; Zelle uses
bank-app guidance and its bank finder. Fictional recipients stay in preview.
No payment is executed or automatically confirmed. See GIFT_ROUTING.md.

Do not assume peer-to-peer transaction data is available. Cash App's documented
Pay integrations describe approved merchant/platform arrangements, not generic
read access to arbitrary personal accounts. [Partner requirements](https://developers.cash.app/docs/partner/partner-onboarding/integrating-with-cash-app-pay/partner-with-cash-app-pay)
and [Pay with Venmo](https://developer.paypal.com/v5/venmo/overview) are inputs to
the provider discovery story, not evidence that this external-gift app is
approved. Evaluate per-provider account eligibility, consent, permitted data,
cost and supported identifiers before choosing an integration. Keep manual
receipt checks as the fallback and ambiguity unresolved.

The searchable local GIF collection consists of six original vector animations
with static SVG posters. No third-party search request is made. Motion is
opt-in, pausable and suppressed in reduced-motion mode. A future catalog needs
approved API access, filtering, attribution, error states and retention/export
rights. [GIPHY's documentation](https://developers.giphy.com/docs/api/) requires
attribution and describes Search/Trending; it does not by itself grant book
export rights. Provider selection remains open.

## Accessibility and verification

Target [WCAG 2.2 AA](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/).
Use real links, semantic landmarks/headings, labeled inputs, fieldsets, keyboard
skip/navigation, main-content focus after routing, visible focus, live status
messages, non-color status text, reduced motion and responsive text reflow.
Avoid drag-only controls, animated search tiles and fixed-height note clipping.
All pages have the copyright/footer and an accessibility contact path.

`npm run test:ui` runs browser journeys and axe checks. It covers direct links,
refresh, local drafts, consent/hidden book filtering, gift acknowledgment,
honest receipt states, switches, closed/revoked links, keyboard navigation and
320/375/768/1280 px layouts. Automated success does not establish ADA compliance
or replace assistive-technology, real-phone and owner review. Backend acceptance
criteria remain open even when their UI is reviewable.

## Compact handheld layout — local proposal

**Requested:** 16 October 2026. **Branch:** `feature/compact-mobile-layout`.
**Review state:** commit/push to the isolated DEV preview authorized on 20 October; TEST/PROD promotion remains separate.

`src/compact-mobile.css` applies below 900 CSS pixels and preserves the existing
larger-screen presentation. Reduce header/logo size, heading scale, decorative
spacing and image height. Use multiple columns for occasions, card-box lists,
card collections and book spreads so a phone shows more useful content at once.
Keep the palette, fonts, logo, complete page content and existing functionality.

The guest composer puts card choices beside a compact live preview, followed by
full-width writing and attachment controls. Its labeled preview region is
keyboard-focusable and scrolls for long notes; the review screen still shows the
complete note. Inputs remain 16 px, controls keep usable hit areas, and ordinary
browser zoom is preserved. No viewport shrinking or whole-page transform is used.

The proposed home page at 375 px is roughly 59% shorter than the previous mobile
layout, with all four occasion choices visible in a 375 × 844 px viewport. Before
the logo treatment below, five 1440 px desktop page screenshots were pixel-identical
to the baseline. These measurements support local review; they do not replace
approval on an actual phone.

The shared header and footer logo now uses a non-destructive display treatment:
normalize its embedded cream background to white, then multiply the image into
the page surface. This removes the visible rectangular panel on blush and white
backgrounds while retaining the supplied artwork, lettering, tagline, accessible
name and home link. The source PNG is unchanged. This presentation adjustment
also applies on larger screens and remains part of the local proposal.

The logo adjustment passes the production build and the existing responsive
accessibility test. Visual checks cover public, host and guest headers at 320,
375, 768 and 1440 px; the logo remains linked to home and keeps its accessible
name. The source bitmap SHA-256 is unchanged.


## October 18 public pages and connected local review

Target one screen on common phones with greatly reduced scrolling, rather than
making desktop density the limit. Home combines the shared blended logo, one
opening baby card, four creation choices and the supplied before/after artwork.
Remove the previous roses, table and other stock photos from that page. Desktop
uses a two-column editorial arrangement; mobile stacks the compact card and
product explanation. Every public tab keeps its own route. Browser zoom and
expanded forms/details may scroll; content is never hidden by locking the body.

About reproduces the owner’s entire supplied paragraph word for word, including
“The Digital Card box” capitalization. Instagram points to
`https://www.instagram.com/thedigitalcardbox/` in the shared footer and contact
page, with an accessible label and noreferrer protection. Card text is live HTML;
the photographed reference’s English note, Spanish verse and Norma signature
are retained in the A Little Star preview. A sleeping baby on the right has a
warm starlight glow. The card opens once with gentle motion; its initial GIF
play stops within five seconds. Open/close and play/pause remain explicit,
keyboard-accessible controls. Reduced motion leaves a still card/poster.

The guest composer includes the same card design and a searchable seven-item
same-origin GIF catalog. Still posters appear in search; selecting, replacing,
removing and playing a GIF are separate actions. The space GIF is a byte-for-byte
copy of the supplied `tmp.gif`; no external API or arbitrary media URL is loaded.
Server validation accepts only catalog IDs. Private photo upload is not yet
connected and is labeled unavailable in server mode.

`npm run dev` now runs a persistent API plus Vite. Host sign-in/skip-account-setup
uses a published fictional test identity, while Apple/Google/Amazon choices remain
unconnected. An opaque invitation grants only guest actions. Host ownership,
operator role, event windows/revisions, consent, moderation, link rotation and
feature controls are enforced on the server. Book layout choices persist there.
A guest sees acceptance only after the API confirms it; failed sends retain the
draft. Gift matching and reviewed handoffs are persisted separately from cards;
operator controls can pause them. Payment execution remains absent.
See LOCAL_API.md, ADR 0008 and planning/UI_REVIEW.md for test access and boundaries.


Verification on 18 October: all ten public routes fit both 375 × 667 and
375 × 812 phone viewports at default text size, including Contact and account
choices. Short-screen layouts remove repeated decorative headings, place account
providers together and expose optional pricing detail through a disclosure. The
complete About wording stays visible. Ordinary scrolling remains for expanded
details, browser text zoom and smaller viewports. Header/card typography, input
sizes and motion controls are preserved without page-scale transforms.


The 21 October DEV extension adds 26 collection designs, 24 searchable curated GIFs, four opening carousel cards, an uncropped comparison image with full-size view, private feedback and bounded AI card artwork. About keeps the requested paragraph with its final period and omits the removed tagline. See [CARD_MEDIA.md](CARD_MEDIA.md) and [ADR 0009](../adr/0009-hosted-dev-media.md).

22 October: the picker now searches 144 same-origin GIFs/animations with
24-result pages and feeling/occasion shortcuts. New Noto assets retain credits
in card/book views and exports. CardVault and book archives embed selected
animation/poster bytes; see CARD_MEDIA.md for license and retention details.
