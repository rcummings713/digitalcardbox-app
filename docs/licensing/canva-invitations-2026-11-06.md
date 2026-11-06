# One-time project invitation collection

Reviewed 6 November 2026 for the owner's authorized DEV release. Tracking: #77, #94 and epic #93. The owner reviews and closes issues.

All 100 invitation designs created in the owner's connected Canva account are included in the invitation and save-the-date galleries. They add to 95 existing choices, giving 195. Guest greeting cards keep their 106 dedicated designs. The eight imported groups are Wedding 18, Everyday 18, Celebration 12, Baby 12, Birthday 14, Graduation 10, Remembrance 8 and Thanks 8.

## Source and usage review

These are project-specific creations, not copies of Canva's public stock-template catalog. The original authoring inventory and source files are retained in [planning/designs](../../planning/designs/README.md).

- **44 Canva AI-assisted compositions:** inspected the existing design layers and all 600 distinct image assets. Every asset resolved successfully, had the connected author's ownership, and had the generated-image filename pattern from this creation batch. No third-party stock asset was identified. Requests initially rate-limited by Canva were deferred and all 51 were successfully reviewed afterward. The original temporary text-free PNG previews were retained without transcoding, including the supplied XMP/EXIF metadata. Each temporary transaction was discarded; no original Canva design was saved over.
- **56 original project compositions:** the original editable HTML/vector-PDF artwork was created for this application and imported into Canva. Its existing local PDF source was rendered at 1,000px width after removing text only; vector ornament/images were retained. Editable wording/placement was read from the corresponding saved Canva designs. Original PDF hashes are recorded.

The [Canva AI Product Terms](https://www.canva.com/policies/ai-product-terms/), effective 26 June 2026, describe ownership and lawful use of generated output while preserving restrictions on any incorporated licensed library content. The [Content License Agreement](https://www.canva.com/policies/content-license-agreement/) separately controls such library content. The `original` grant in this collection records the project-specific source and this review; it does not assert an exclusive copyright in generated images or grant permission for unrelated Canva stock. No paid assets, new generation, subscriptions, scraping, or service agreements were used for this import.

[Per-template licensing records](template-imports.json) record creator, source design/page, grant, territory, commercial/derivative/template/retention/export rights and the exact shipped SHA-256. [Provenance](canva-invitation-provenance.json) records original source files, reviewed asset IDs, dimensions and hashes. Expiring authenticated download URLs and account credentials are excluded from the repository.

## Rendering and editing

The website hosts immutable PNG backgrounds itself; customer browsing does not contact Canva or need a Canva account/API key. Images load lazily. Text is recreated in four to six native, bounded, editable layers using the site's existing fonts, with optional editable occasion labels and milestone numbers. It supports the current direct typing, drag/resize, formatting, undo/redo, motion, GIFs and draft flows. Switching templates preserves personal wording and replaces untouched template labels. Invitations remain distinct from guest greeting-card choices. Customer text is React text, not imported HTML.

This is not a transfer of Canva's proprietary editor, font files or individual decorative objects. Artwork remains one background image; words and typography are adapted to the existing site editor. Editable document exports retain the known template ID; portable artwork archives include selected retained image bytes and credits. Original supplied provenance metadata remains in shipped Canva PNG bytes. Selected design credits and public artwork notices identify the AI-assisted designs.

The available Canva background previews are approximately **429 × 600px**; the original-source backgrounds are **1,000px wide**. These are web review assets, not a claim of print-ready resolution. Higher-resolution Canva exports should be obtained before a physical book or large-format print release. Upscaling was not substituted for higher source detail.

## Validation and deployment

All 100 native invitation compositions and all 100 save-the-date variants were rendered at a 320px canvas width and inspected for text overflow and overlapping rendered text; final saved recipes have zero reported clipped or overlapping layers. All 100 invitation/save-the-date recipes pass document validation. Regression coverage checks retained hashes, categories, private account-free editing, template changes preserving personal words, draft reload, accessibility, and archive bytes/credits. Existing host/guest lifecycle, QR, authorization, gift and persistence suites remain required by CI.

Deploy only the current feature branch to its existing DEV named preview. No database migration, payment behavior, Worker/Durable Object identity, production release, or ongoing Canva synchronization is part of this change.
