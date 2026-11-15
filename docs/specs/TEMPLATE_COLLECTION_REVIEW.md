# Studio template collection review

15 November 2026 · feature/premium-stationery-collection · stable DEV release.

## Review and direction

Reviewed all 206 existing catalog entries: 106 greeting-card compositions and
195 invitation/save-the-date choices, with overlap between those sets. Rendered
contact sheets cover the invitation library and remaining card-only originals.
The repeated four-layout families have nearly identical type placement and small
ornaments. Several imported backgrounds also contain fixed lettering behind the
native editable layers. Preserve these designs for saved documents and explicit
Earlier collection browsing; replace primary discovery with a stronger collection.

References consulted for premium stationery principles:

- [Papier — Classic Thin Border](https://www.papier.com/us/classic-thin-border-16307): restrained framing and formal type hierarchy.
- [Minted — Classic Toile](https://www.minted.com/product/letterpress-wedding-invitations/MIN-ZF6-LPI/classic-toile): detailed ornamental illustration and generous central space.
- [Paperless Post — Rabbit’s Garden](https://www.paperlesspost.com/card/rabbits-garden): an illustrated occasion with its own visual character.

These are design references, not imported artwork or supplier affiliations.

## Current experience

[Visual review sheet of all 24 designs](../reviews/studio-collection-2026-11-15.png).

The Studio collection now has **45 distinct designs**, each usable as a card,
invitation or save-the-date. Recommended filters these by occasion plus versatile
designs; All designs shows all 45, and New arrivals isolates the 21 screenshot-
inspired additions described below. Earlier collection retains 106 greeting cards
or 195 invitations. The backing catalog has 251 IDs: 151 greeting-card and 240
invitation/save-the-date choices, with overlap between those sets. Earlier IDs and
files remain unchanged.

Painted peonies, Mediterranean lemons, a storybook meadow and a midnight garden
sit alongside architectural gold borders, pearl arches, rose ribbons, porcelain
florals, editorial ink layouts, a moon chart, a mirrorball, paper-cut forms,
laurels, graduation styling, and a candle/olive remembrance design. The Forum,
Hanken Grotesk, Montserrat and existing script font remain the typographic system;
the logo and site colors are unchanged. Display styles deliberately vary between
script, editorial sans, serif and italic, with real editable words throughout.

Painted backgrounds retain their colors and offer compatible ink palettes.
Vector art follows the selected palette. Direct text editing, keyboard controls,
undo/redo, GIFs, motion speeds and reduced-motion behavior remain available.
Default text fits the preview; users can still resize/reflow their own long text.
No account, new provider contract or runtime image-generation key is needed to
use this static collection. Existing AI buttons retain their separate key setup.

The six existing $4.99 Signature choices use the refreshed art. This visual update
does not change checkout, prices or access rules. New unsent drafts use the new
collection; existing drafts/cards/invitations retain their selected IDs.

## Art and retained media

Artwork is in `public/templates/studio/`; editable text recipes and original
vector source are in `src/modules/design/studio-presets.ts` and
`src/modules/media/studio-art.ts`. Raster paintings were created with ChatGPT's
built-in image_gen tool, reviewed in the actual layouts, then optimized with
cwebp quality 88. No reference-brand image was used as generation input.

[Asset hashes, dimensions, source records and final prompt set](../licensing/studio-collection-2026-11-15.json)
record all 24 assets and the four painted art directions/iterations. Changing
published art in the future requires a new versioned ID/asset, leaving accepted
content intact. Same-origin SVG/WebP art is embedded in portable card archives and
book downloads under the existing budgets; no supplier URL must remain online.
Base artwork plus the editable document is retained, not a new print-fidelity claim.

## Validation

- Production build and API regression suite, including new cross-occasion design,
  personal-word/storage compatibility, SVG safety and retained-byte tests.
- All 45 styles × 26 occasions × card/invitation/save-the-date × still/GIF ×
  240/280/340/400px canvases: 28,080 browser geometry cases with no clipped default
  text or overflowing text widths. Gallery/editor phone and desktop screenshots
  were also inspected to correct illustration overlap and text alignment.
- Connected browser checks cover inline typing, font changes, earlier/current
  template switching, reload, accessible phone flow, host/guest publication and
  checkout boundaries. Public accessibility, Worker and planning results are
  recorded with the final local verification.

No database migration, external image call at customer runtime, PROD publication,
new payment method or production-acceptance assertion is part of this change.
#24, #73 and #94 remain open / In Progress for the owner's review and closure.

Initial 24-design local verification: production build; **88 API**, **29 connected-browser**,
**14 public UI/accessibility**, **7 native Worker**, and **7 deployment-routing**
checks passed (145 total), plus the planning check and Word XML validation.
All 24 retained assets total 857,698 bytes. The 14,976 layout cases and final
375px/1440px gallery checks show no clipped default text. No environment was
published during that initial review. The earlier overlapping browser run encountered trace-file errors;
independent output directories and sequential full reruns passed.


## Owner screenshot additions — 15 November 2026

Added **21 original Celebration designs**, alongside all 24 Studio originals.
Current All designs now has **45** styles; New arrivals isolates the new 21.
Earlier collection retains all 106 card / 195 invitation designs, giving 151 card
and 240 invitation/save-the-date choices in the backing catalog.

The supplied Canva gallery screenshots guide the visual direction: photographic
split pages, torn-paper film images, curated photo collages, newspaper mastheads,
coastal ceremony arches, evening champagne, ivory silk, ornate gold/white and blue
florals, black ribbon corners, a wedding getaway car, folk florals, leopard print,
blush party balloons, line-art tablescapes, an editable monogram, an embossed frame,
crimson bands and decorative filigree. Nine original photographic/painted scenes
and twelve new vector illustrations are retained locally. No screenshot crops,
Canva stock or template files were copied into the app.

Words remain native editable layers. Newspaper mastheads, monograms and ages are
also editable; the existing six-layer limit remains. Switching keeps customized
extra layers, so remove an unwanted earlier text layer before adding another at
that limit. Selecting a Studio design in the guest picker opens its composed
layout automatically. Photo/newspaper GIFs sit in the artwork region, away from
text. A card/invitation/save-the-date still uses the bounded version-1 document;
there is no database migration or new user-upload/photo-replacement feature.
The retained scenes are decorative backgrounds, not customer photo uploads.

[All 21 additions](../reviews/celebration-collection-2026-11-15.png) ·
[Asset hashes, source records and generation prompts](../licensing/celebration-collection-2026-11-15.json).

Browser geometry checked **28,080** layouts across all 45 styles, 26 occasions,
three document variants, GIF choices and four canvas widths with no clipped
default text. Original 24 asset hashes are unchanged. Release check/deployment
evidence is recorded in the linked DEV workflow and related GitHub stories.

Final local release checks: production build; **88 API**, **30 connected-browser**,
**14 public UI/accessibility**, **7 native Worker** and **7 deployment-routing**
checks passed (**146 total**), plus the planning check and Word XML validation.
The 21 additions total 1,441,362 bytes, with the first 24 assets unchanged.
Deployment target: `dev` → stable `digitalcardbox-app-dev` Worker main deployment.
No migration, binding, payment price, provider key or environment configuration
changes are included. Hosted verification checks the deployed catalog/art and
existing public authentication/billing capabilities.

