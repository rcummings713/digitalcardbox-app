# Card media, AI setup and feedback

**Updated 22 October 2026 · DEV review · stories #24, #34, #77, #80, #91 and #92.**

## What is available

The collection has **26 templates**. The guest composer and public collection
share the same versioned catalog, with occasion filters in the composer. Notes
remain selectable HTML text, independent of decorative artwork. The home page
has four swipe/keyboard examples: baby, wedding, sweet sixteen and graduation.
Each opens with its matching GIF. Automatic motion stops after 4.4 seconds;
explicit play/pause remains available and reduced-motion settings show posters.

The searchable **144-item GIF and animation store** is served from this
application's own origin. It contains 120 Google Fonts Animated Noto Emoji
animations under **CC BY 4.0**, 23 original project stickers and the unchanged
owner-supplied cosmic GIF. This implements the owner's 22 October choice: no new
GIF API fees, subscription, paid provider or custom agreement. The new Noto
animations can be stored with cards and used commercially while meeting the
license's attribution requirements. The owner's supplied cosmic asset remains
separate and still needs commercial rights confirmation before public rollout.

Search supports multiple words, occasion/feeling shortcuts, 24 results per page,
empty/error states and lazy static thumbnails. Only reviewed catalog IDs are
accepted on card submission. No arbitrary URL fetch, runtime provider request,
third-party script, API key or tracking integration is added. Search still works
from the bundled catalog when the catalog API is unavailable.

The actual media is committed and deployed with the app; cards persist a stable
asset ID. Do not remove or replace an existing asset/ID during a catalog update.
`src/modules/media/noto-manifest.json` records each source URL, creator, license,
source hash, shipped-file hashes and modifications. The asset-derived runtime
catalog is generated separately so hashes do not inflate the customer bundle.
Animations are resized/re-encoded as 192px animated WebP with the original loop
timing, and 112px PNG posters are extracted. This preserves motion while reducing
storage/download size; the 120 animation/poster pairs total about 20 MB. Rebuild
with `python3 scripts/import-noto-animations.py` (Python/Pillow with animated WebP
and curl). Normal builds do not contact Google. Re-imports verify hashes; changed
upstream files need an explicit new-asset review, never a silent replacement.

Attribution appears in the picker, saved card views and book pages. The public
`/media-credits.html` page links the original collection, full license and per-file
manifest. Google attribution/license and modification notices are retained in
exports. The license applies to Noto artwork, not a guest's private writing.

**Save with the card:** CardVault's **Export cards** and the event book's
**Save book with animations** produce JSON archives containing notes plus the
actual selected animation and poster bytes as data URLs, deduplicated by asset
ID. The animation can be recovered without the provider or application being
online. These are portable data archives, not the paid polished-book delivery or
an implemented archive-import/viewer feature. Ordinary readable-text exports
remain available and include selected-animation credits. Archive assembly only
fetches allowlisted same-origin assets, validates response types and caps bytes;
a missing asset fails the export visibly instead of claiming an incomplete save.

Original occasion stickers can still be rebuilt with
`scripts/generate-occasion-stickers.py`. The broader Noto subset was manually
selected for family-friendly celebration, affection, gratitude, nature and animal
content, including neutral and varied skin-tone hand animations. No open-ended
external search or unreviewed provider content reaches the picker.

Licensing sources verified on 22 October: [Google's animation documentation](https://googlefonts.github.io/noto-emoji-files/?view=docs)
and [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The standard license
allows commercial copying and adaptation with attribution; no custom GIF-provider
agreement is needed. Existing infrastructure usage remains subject to the
application's hosting plan; this feature adds no GIF vendor charges.

## Enable AI locally

Use Node 22.18+ and install dependencies. Copy `.env.server.example` to
`.env.server`, put a **project-specific OpenAI API key** in `OPENAI_API_KEY`, and
set `AI_CARDS_ENABLED=true`. Restrict the file with `chmod 600 .env.server`, then restart `npm run dev`. The key must be permitted to
use the Images and Moderations endpoints; organization verification may be
required for GPT Image access. Do not paste the key into chat, use a `VITE_`
variable, put it in a browser form, or commit the file. No paid provider calls are
made by automated tests.

Open a published invitation → Choose a card & leave a note → **Make a card with
AI**. Select occasion, palette, art style and motif; create one artwork, explicitly
choose **Use this card**, then add a note and optional GIF. Missing configuration,
limits, refusals or outages leave all collection designs and the manual note usable.

## Enable AI on the isolated DEV preview

The feature workflow builds with `VITE_DATA_MODE=server` and deploys
`wrangler.dev.jsonc`. It does not install the OpenAI key. Use the existing
Cloudflare account login, then run the following from the repo, entering the key
only at Wrangler's secret prompt:

```sh
npx wrangler preview secret put OPENAI_API_KEY --config wrangler.dev.jsonc --worker-name digitalcardbox-app-dev --name feature-compact-mobile-lay-b2925a1b
```

Do not put the key directly in command arguments or deploy it to TEST/PROD. The
preview already sets `AI_CARDS_ENABLED=true`; a valid secret makes AI available.
The operator can pause/resume configured artwork in **Admin → Feature controls →
AI card artwork**, and inspect attempts used today. Removing the preview secret
also disables provider calls. Updating an existing preview's secret is explicit;
base Worker secrets do not retroactively update an existing preview. A newly
created preview needs its own secret configuration. Account permissions and
provider access must be available to the person installing the key.

For local Wrangler, copy `.dev.vars.example` to ignored `.dev.vars`. That file is
for local development; it is not a hosted secret installation. Never set
`DCB_LOCAL_TEST` on a hosted environment. It exists only for local HTTP tests.

## Enforced cost and content limits

| Control | Server behavior |
| --- | --- |
| Card-only input | Exactly four allowlisted design choices plus retry reference. No freeform prompt, model/size/quality/count overrides, URLs, uploaded images or tool instructions. The server builds the family-friendly stationery prompt; private notes are never sent. |
| Provider request | Fixed `gpt-image-2-2026-04-21`, `low`, 1024×1536, one opaque WebP, compression 80, moderation `auto`; never an automatic paid retry. |
| Access | Published, currently open invitation; scoped guest cookie, same origin, custom header and CSRF; one in-flight job per guest. Recheck access before publishing an asset. |
| Daily caps | 2 attempts per guest, 10 per event, 4 per hashed IP and 20 across the application. Atomic persistent reservations, America/New_York day reset. Failed, blocked, timed-out and ambiguous attempts remain counted. |
| Retry | An identical approved reference returns its original artwork without another charge. Reusing a reference for changed choices conflicts. Processing/failed references do not automatically retry a paid call. |
| Budget | 20 attempts × $0.02 estimated reserve = $0.40/day estimated planning ceiling. This is **not a guaranteed dollar billing cap**; provider pricing/input charges can differ. Set project budget alerts in OpenAI, monitor actual usage and pause AI when needed. The request count is a hard app limit; provider budget alerts may be advisory. |
| Safety | Moderate the server prompt and generated image with `omni-moderation-latest`; any flagged category, missing/malformed decision, high sensitive-content score or moderation outage prevents publication. No pending or rejected image reaches the browser. Automated moderation reduces risk and is not a guarantee; operator pause/manual templates remain available. |
| Output | One validated WebP envelope, at most 1.5 MB; bounded provider response and request timeout. A 32 MiB approved-art/active-reservation ceiling prevents unbounded storage; manual designs continue when full. |
| Privacy | Server-only provider key; no provider response bodies, private notes or image data in logs. Private artwork requires its owning guest's scoped session or the owning host's session. No public asset URL or arbitrary remote fetch endpoint. |

Approved artwork and choices/outcomes persist in DEV SQLite until the preview is
removed or review data is deliberately cleaned up. Usage counters are reservation
counts, not a billing ledger. A crashed processing attempt stays charged to quota
and cannot be automatically retried. Production managed identity, retention,
backups, billing reconciliation and approved private media hosting remain open.

## Feedback

The footer links to `/feedback`: rating, category and a 10–2,000-character comment.
Email is optional and requires explicit follow-up permission. Comments are private
and render as text. Same-origin/session CSRF, a honeypot, request bounds and
persistent session/IP/application limits protect submission. Identical retries
save once; a failed request never displays success. The separate operator can
review, archive or reopen feedback in `/admin/feedback`; hosts and guests cannot
read other people's feedback. Review-state changes are audited without logging
comment text or email. DEV feedback is review data, not a public testimonial feed.

Sources checked for this implementation: [OpenAI image generation](https://developers.openai.com/api/docs/guides/image-generation),
[image API](https://developers.openai.com/api/reference/resources/images/methods/generate),
[moderation](https://developers.openai.com/api/docs/guides/moderation), and
[Cloudflare Preview configuration](https://developers.cloudflare.com/workers/previews/configuration/).
