# Application review — 20 October 2026

**Current local branch:** `feature/compact-mobile-layout`.
**Owner closes issues:** leave every issue open and board items In Progress.
The owner authorized commit/push to the feature branch and its DEV preview on
20 October. This does not authorize TEST/PROD promotion or closing issues.

## Connected host and guest walkthrough

Run Node 22.18+ and `npm run dev -- --host 0.0.0.0 --port 5173 --strictPort`.
Open the local/network URL Vite prints. The browser and server both run on this
Mac; another phone must be on the same network. Use fictional information only.

1. Review Home’s opening card, GIF, baby glow and before/after artwork. Inspect
   every public tab on a phone; About contains the supplied exact paragraph.
2. Choose an occasion, then **Continue with test host**, or sign in at
   `/workspace` with `host@digitalcardbox.test` / `CardBoxReview!2026`.
3. Open **A little star is on the way**, or create and publish another event.
4. In **Invite & share**, copy the guest link or use its downloadable QR. Open
   the link in a private window, another browser or your phone. Guests cannot
   open the host inbox and events have no public directory.
5. Choose **A Little Star** or another design, write a name/note, search for
   “universe” to find the supplied space GIF, select it and choose book consent.
6. Review and send. The success page appears only after server acceptance.
7. Return to the host’s Cards & notes and click **Refresh**, or refocus the
   browser. Open both book layouts and the text view. Host-only/hidden cards are
   excluded. Hide/restore a card, rotate the invitation and try the old link.
8. Sign out. The same events/cards remain when you sign back in or restart the
   server. Files live in ignored `.data`; clearing browser storage does not
   delete accepted server records.
9. Sign in separately as `operator@digitalcardbox.test` with the same published
   local password. `/admin` has aggregate counts, metadata and server feature
   controls. It does not grant another host’s private card access. Gift matching
   can be paused; no control enables money movement. `other@digitalcardbox.test` is a second host for isolation checks.

Production managed identity/PostgreSQL, private photo upload/storage/scanning,
external GIF catalogs, AI, payment execution, backup/retention and backend deployments remain
separate work. Default Cloudflare builds remain browser-only until deployed
backend adapters are selected. See ADR 0008 and LOCAL_API.md. The original
`npm run dev:ui` account-free browser review is still available.

## Gift handoff walkthrough

The seeded event exposes Cash App, Venmo and Zelle as preview-only recipients.
Send a card or open the optional gift step directly, enter a recognizable name,
payment nickname and optional amount. Switching service clears recipient consent.
Save, preview the service-specific handoff, then finish without sending money.
The host sees unconfirmed matching details and the linked card when one was sent.
For real navigation, enter your own verified identifier twice in Settings, uncheck
Preview only and confirm the service. Never send money during the review.
Zelle requires your own banking app; its button opens the official bank finder.

DEV is the existing static/browser adapter: records stay in that browser.
The persistent connected API continues to run locally with `npm run dev` and is
included in source and CI; pushing the feature does not host that Node service.

## Current verification

- Production client build, planning consistency and six deployment-routing tests pass.
- Fifteen API tests cover real persistence/reopening, host/guest/operator isolation,
  CSRF/origin checks, request bounds, retries, consent/moderation, date/revision
  locks, revocation, event windows, session expiry and disabled money movement.
- Fourteen browser-only UI journeys and seven connected browser journeys cover the review flow. The
  connected flow uses separate host/guest browser contexts, sends real test
  records, persists both book styles and proves a failed send retains its draft.
- The supplied About paragraph matches exactly. All ten public pages fit
  375 × 667 and 375 × 812 viewports at default text size, with no horizontal
  overflow. The 390 × 740 check also fits all ten. Smaller screens, expanded
  details and text zoom retain ordinary scrolling instead of clipping content.
- Axe checks on the tested public/application routes report no violations for
  the selected WCAG 2.2 AA tags. Keyboard focus, reduced motion, optional GIFs,
  automatic preview stop and explicit animation controls are checked. This is
  not a substitute for owner, screen-reader or real-device review.
- Direct database/key/backend source requests are blocked by Vite (403), while
  intended public GIF/artwork assets and `/api/health` remain available. This
  includes raw source and absolute filesystem URL regression checks.
- The supplied GIF and source logo hashes are unchanged. All original uploads
  remain untouched; `.data` is ignored and is never a public asset directory.

## Current tracking

[DCB-E18-S04 #90](https://github.com/rcummings713/digitalcardbox-app/issues/90)
tracks this local persistent backend, under the existing database epic #62.
Related ownership/session/security/flag stories #9, #11, #52, #53, #55 and #83
are In Progress. Existing public/art-direction stories #85/#88 and domain stories
#14–16, #21, #23–25, #27–28, #47–48 remain In Progress. PostgreSQL deployment
Gift route/deadline stories #42/#45 are now In Progress. Production
PostgreSQL story #63 remains Todo; the test SQLite adapter does not complete it. No stories
are closed and no board item is marked Done.

The earlier UI review record below is historical context; its statements about
browser-only storage apply to `npm run dev:ui`, not the connected local command.

---


**Branch:** `feature/mvp_iteration_1`. **Stage:** frontend design review.
**Owner closes issues:** do not close issues or mark board items Done.

Start at `/`, choose an occasion and continue without signing in, or use
`/workspace` to open the seeded fictional card boxes. From the wedding card box,
use Invite & share to open the guest journey. Account & preferences provides the
administrator review entry. No backend, identity or payment provider is connected.

## Owner review sequence

1. Home, occasion-specific creation and account-choice screen.
2. Create/edit an occasion, publish its local invitation and inspect the QR.
3. Open the host's guest preview, choose a card, write a note and add photo/GIF.
4. Review consent and send the card locally, with or without an independent gift.
5. Compare full name, payment-app name, reference and linked card in Gift matching.
6. Review receipt manually; confirm only after checking a payment account in the
   future connected application. The current UI makes no transfer.
7. Curate cards and compare The Editorial / The Collage event books. Try readable
   text, print, hidden entries and host-only consent.
8. Use administrator switches, inspect unavailable states, and check small-screen,
   keyboard and reduced-motion behavior. Reset via Preferences when needed.

## Confirmed owner choices

Confirmed on 13 October 2026:

- Home creation buttons show the planned account-choice screen, with an explicit
  **Continue without signing in** option for this account-free review.
- Offer **both** an elegant editorial album and a rich scrapbook with layered
  notes and photos. The Editorial and The Collage are equal choices; each card
  box remembers the host’s selected style on this device.

The current UI already implements these starting choices. Detailed visual polish,
real-device review and backend acceptance remain open; this does not close stories
or approve production deployment.

## Design decisions still open

- Final cover/spread artwork and layout polish for both book directions.
- Sign-in provider priority, managed identity provider and detailed account-screen polish.
- Final production policy copy and retention promises; current notice describes
  only this device-based review build.
- Whether original GIF stickers suffice or a licensed searchable provider is
  needed; provider retention/export rights require review.
- Approved transaction-data access per payment provider. Personal payment history
  is not assumed accessible; ambiguous names cannot automatically settle a gift.
- Final purchased-book delivery and checkout; no purchase is connected here.

## Work tracking

DCB-E19 tracks UI foundation/review-specific work. Existing DCB-E03, E04, E06,
E07 and E08 stories retain their domain/backend acceptance criteria; UI progress
does not finish them. DCB-E02-S06, E12-S05, E15-S04 and E17-S01 already existed in
the local backlog and are published rather than recreated. DCB-E06-S11 adds the
provider-data feasibility gap, and DCB-E17-S05 adds server-enforced feature flags.
GitHub mapping and verification evidence are recorded after the implementation
checks. No new work silently changes the October capacity commitment.

## GitHub implementation record

The [Customer UI and owner design review epic #84](https://github.com/rcummings713/digitalcardbox-app/issues/84)
and stories [#85](https://github.com/rcummings713/digitalcardbox-app/issues/85),
[#86](https://github.com/rcummings713/digitalcardbox-app/issues/86),
[#87](https://github.com/rcummings713/digitalcardbox-app/issues/87) and
[#88](https://github.com/rcummings713/digitalcardbox-app/issues/88) are In Progress.
Related existing event/card/gift/book/accessibility stories also record their UI
progress without removing backend acceptance criteria. No issues were closed.

| Work | Issue | Status |
| --- | --- | --- |
| DCB-E02-S06 | [#72](https://github.com/rcummings713/digitalcardbox-app/issues/72) | Todo |
| DCB-E05-S01 | [#30](https://github.com/rcummings713/digitalcardbox-app/issues/30) | In Progress |
| DCB-E05-S02 | [#31](https://github.com/rcummings713/digitalcardbox-app/issues/31) | In Progress |
| DCB-E05-S04 | [#33](https://github.com/rcummings713/digitalcardbox-app/issues/33) | In Progress |
| DCB-E05-S06 | [#73](https://github.com/rcummings713/digitalcardbox-app/issues/73) | In Progress |
| DCB-E06-S11 | [#74](https://github.com/rcummings713/digitalcardbox-app/issues/74) | Todo |
| DCB-E07-S05 | [#75](https://github.com/rcummings713/digitalcardbox-app/issues/75) | In Progress |
| DCB-E12-S05 | [#77](https://github.com/rcummings713/digitalcardbox-app/issues/77) | In Progress |
| DCB-E12-S06 | [#78](https://github.com/rcummings713/digitalcardbox-app/issues/78) | In Progress |
| DCB-E15-S04 | [#80](https://github.com/rcummings713/digitalcardbox-app/issues/80) | In Progress |
| DCB-E17-S01 | [#82](https://github.com/rcummings713/digitalcardbox-app/issues/82) | In Progress |
| DCB-E17-S05 | [#83](https://github.com/rcummings713/digitalcardbox-app/issues/83) | Todo |

## Verification

- Production build, planning consistency and six deployment-routing tests pass.
- Thirteen browser journeys pass, including real photo validation, local drafts,
  guest-link states, consent and moderation filtering, editable writing choices,
  gift matching/receipt rules, feature switches and keyboard/reduced motion.
- Axe checks report no violations for the selected WCAG 2.2 AA tags on the tested
  public/application routes and open guided-writing state.
- Layout checks cover 320, 375, 768 and 1280 CSS pixels; desktop/mobile screenshots
  were inspected. Real device, screen-reader and owner art-direction review remain.
- CI repeats the browser checks before publishing its isolated DEV preview.

These checks validate the UI and fictional local adapter. They do not validate
production authentication, server access control, money movement or ADA compliance.


21 October review: test the four home carousel cards and automatic/pause/reduced-motion GIFs; browse all 26 templates and search the 24-item GIF store; inspect the uncropped comparison; submit private feedback and review it as operator. Decode a published QR on another device and confirm its card in the host inbox. AI requires a private OpenAI key; see docs/specs/CARD_MEDIA.md. Stories #91 and #92 extend the existing epics and remain open/In Progress. No TEST/PROD promotion.

22 October free-animation review (#77/#80): search “heart face,” page through
144 choices, add a Noto animation, pause/replay, and check reduced-motion posters.
Send a consented card, reopen the host inbox/book, and export its CardVault/book
archive; verify actual animation bytes and license/source/modification notices.
No external provider request or GIF key is required. Issues remain open/In Progress.
