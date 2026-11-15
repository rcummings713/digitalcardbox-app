# ADR 0014 Versioned Studio stationery collection

Accepted; stable DEV publication authorized · 15 November 2026 · #24, #73, #94, epic #93.

The owner requested a complete quality review and a more premium visual direction.
The earlier catalog has 206 IDs, including 106 greeting cards and 195 invitation
choices. Repeated small motifs, largely identical layouts, and embedded lettering
in some imported backgrounds make quantity a poor proxy for design quality.

Introduce 24 original Studio designs with stable `studio-…-v1` IDs. Each supports
cards, invitations and save-the-dates through the existing bounded version-1
layout document. Distinct editorial, botanical, classic, celestial, illustrated
and playful treatments retain the brand's installed fonts and palette. Recommend
this collection first; All designs browses these 24. Earlier collection explicitly
retains the prior library. Accepted template IDs, bytes, licensed notices and
saved personal documents are preserved; no migration or catalog database is added.

Twenty original vector illustrations use a shared, deterministic SVG generator
with allowlisted motifs and strictly validated hex colors. Local SVG snapshots
retain the default art for archives. Four original AI-assisted paintings are
optimized retained WebP assets. Artwork contains no personal text. Supplier pages
are research references; their artwork is not copied or embedded. Authoring with
ChatGPT's built-in image tool is separate from the application's runtime AI/key.

Use composed native text layers, typography appropriate to each design, clear
illustration/text regions and consistent editable/presentation alignment.
Paintings keep their original background; the editor offers compatible text
palettes. Vector backgrounds follow the chosen palette. Optional GIF placements,
finite motion, still/reduced-motion presentation, inline editing, history and
private event publication retain their contracts.

Extend the portable-media allowlist only for the known same-origin Studio SVG
and WebP paths. Retain existing per-asset/archive budgets and actual background
bytes. The archive contains the base art and versioned editable document; this
is not a new pixel-perfect print/export engine. Prices and entitlement behavior
are unchanged; the six existing Signature choices use refreshed preview artwork.

Verification and asset provenance: [review](../specs/TEMPLATE_COLLECTION_REVIEW.md).
Owner acceptance remains pending. Keep all affected issues open / In Progress.


Owner screenshot addendum, 15 November: add 21 originals without altering the
first 24 IDs/assets. All designs now has 45; New arrivals has the 21 additions.
Nine retained AI-assisted scenes and twelve vectors introduce composed photo,
newspaper, split-panel and evening layouts; optional monogram/milestone/masthead
text uses the same maximum six layers. GIF placement follows these compositions.
Selecting a Studio design in the guest picker creates its native layout before
editing/sending. No new image URL/upload field, persistence schema or runtime
provider is added. The owner authorizes committing and publishing all pending
work to the **stable DEV main deployment**, not the customer PROD Worker.
