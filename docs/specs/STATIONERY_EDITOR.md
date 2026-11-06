# Stationery editor, save-the-dates and PayPal

5 November 2026 · isolated DEV review · #97, #98, #99 plus #24, #73, #77, #94 and #95. Issues stay open / In Progress for owner review.

## Collection and direct editing

The shipped collection has **106 original card designs** and **95 invitation / save-the-date designs**: the earlier collection plus 20 new stationery families in Classic, Editorial, Arch and Postcard compositions. Designs cover weddings, babies, birthdays, quinceañeras/Sweet 16s, graduation, remembrance, faith celebrations, housewarming and other occasions. Search and occasion filters keep the larger collection manageable; the gallery scrolls within its own area. These are original project designs, not copies of Canva templates.

Select a text layer, then double-tap/double-click it, press Enter/F2, or choose **Type directly on design**. A real plain-text input appears in the design, preserving font, alignment and position. Tap outside or use Control/Command+Enter to finish; Escape cancels. User content is rendered as text, never HTML. The side tools remain available for precise editing.

Creators can change design/default and individual-layer typography, bold/italic/underline, colors, size/alignment, drag or nudge text, resize with the corner handle or keyboard, duplicate/add/remove/reorder layers, and undo/redo 30 changes. Template swaps and imported files participate in history. Reset restores layout/typography while keeping words and artwork. The main message cannot be removed. Six bounded text layers and 8,000 total characters remain the document limits.

**Export editable design** / **Import editable design (.dcb.json)** move this application's validated versioned design between browsers. They preserve text, layout and effects, not a fully independent copy of private AI artwork. Existing private artwork still needs its original authorized access. The file is private customer content. PNG/JPEG images do not contain editable text layers; the application does not claim to recreate Canva's proprietary editor or convert image pixels back into text.

## Finite animation

Page, artwork and individual text layers support Still, Soft fade, Gentle rise, Slow zoom, One after another and Paper float. **Preview design** plays the received-design presentation; **Show still design** immediately reveals the complete still version. Replay is explicit. Automatic presentation stops within 4.4 seconds; effects never flash or loop indefinitely. Reduced-motion preferences and print use still content. Editable canvases and template-search thumbnails remain static. Motion choices are stored with the design and rendered in invitations, save-the-dates, delivered cards and book/card previews. GIFs retain their existing poster, pause and license behavior.

## Save-the-dates

`/save-the-dates` is public and uses its own browser draft. Its invitation-kind document carries `variant: "save-the-date"`. A host can carry it through account-choice/skip and event setup, or edit **Save the date** inside an existing owned event. Setup replaces placeholder title/date/venue with the real event details. The separate `events.save_the_date_json` field preserves the formal invitation independently.

**Invite & share** provides a save-the-date link and a real QR only after the design is saved and the card box is published. The URL is the existing opaque private guest URL plus `/save-the-date`; rotation revokes both. A scheduled event can show its save-the-date before the contribution window opens, without enabling early cards or gifts. Paused, closed, draft, unknown and revoked views keep their existing restrictions. Sharing opens the device's native share sheet or copies a link; no automatic email/SMS delivery is claimed.

## Approved Canva / artwork imports

Canva's [content license](https://www.canva.com/policies/content-license-agreement/) distinguishes eligible Free Content from Pro and other restricted content. Section 6 provides additional template-use permissions for some Free Content; the complete design and every constituent asset still need the appropriate rights. Modifying colors or layout does not replace that requirement. This importer records an owner's review; it cannot automatically certify an asset's legal status.

The Canva authoring plugin is an optional development connection, separate from website customer accounts. It must be installed and connected before authorized Canva designs can be inspected/exported through it. No Canva templates are included without an actual authorized export and recorded grant. The repository currently contains **zero imported Canva assets**. A paid subscription, AI generation or a new Canva service agreement was not purchased.

Canva's [export API](https://www.canva.dev/docs/apps/rest-apis/reference/exports/) supports finished-file exports; its [export job documentation](https://www.canva.dev/docs/apps/rest-apis/reference/exports/create-design-export-job/) describes OAuth and temporary download URLs. The site uses retained approved bytes, not expiring Canva CDN URLs. PNG/JPEG imports are background artwork; editable text must be separate. An optional `textLayouts` recipe maps the editor's standard text-layer IDs to the approved composition.

The owner/developer can import up to 100 reviewed backgrounds per manifest:

```sh
npm run import:templates -- /path/to/manifest.json --dry-run
npm run import:templates -- /path/to/manifest.json
npm run build
```

Run under Node 22.18+ from this repository. This is an owner-reviewed repository tool, not an anonymous upload endpoint. The manifest and source images stay in the same directory; source traversal/symlink escapes, remote fetches, SVG/HTML/ZIP inputs, duplicate IDs, unsupported grants and missing rights fail before catalog changes. PNG/JPG files are limited to 2 MB and 64–4096 pixels per side. Export background artwork without baked-in text and review the result visually.

Example manifest (replace placeholders with actual source and license evidence):

```json
[{
  "id": "licensed-garden-invitation",
  "name": "Garden invitation",
  "description": "Approved background with separate editable text",
  "category": "Wedding",
  "palette": "sage",
  "sourceFile": "background.png",
  "sourceUrl": "https://www.canva.com/design/YOUR_DESIGN_ID/view",
  "creator": "ACTUAL CREATOR",
  "grant": "canva-free",
  "licenseUrl": "https://www.canva.com/policies/content-license-agreement/",
  "licenseEvidence": "ACTUAL export/date and review of every asset's permitted uses",
  "territory": "Worldwide",
  "backgroundOnly": true,
  "rights": {
    "commercial": true,
    "derivatives": true,
    "templateRedistribution": true,
    "permanentStorage": true,
    "portableExport": true
  }
}]
```

Supported grants are `canva-free`, `original`, `written-permission`, `CC0`, and `CC-BY-4.0`, with explicit worldwide commercial, derivative, template redistribution, retention and export rights. Pro Content needs a separately suitable grant; changing its label is not permission. Catalog metadata, source/grant/territory/evidence and immutable SHA-256 hashes are recorded in `docs/licensing/template-imports.json`. Visible credits follow imported artwork; CardVault/book JSON exports embed selected imported-background bytes and license/source credits under the existing bounded archive budget. Imported artwork does not silently depend on Canva remaining online. Ordinary hosting and the owner's actual licenses still apply.

## PayPal external handoff

Hosts can add **PayPal** in event settings. Enter the PayPal.Me handle (ASCII letters/numbers, at most 20 characters) twice, check the actual account in PayPal and confirm. Known fictional `CardBoxPreview` stays in internal preview mode. The guest reviews the full recipient/handle, acknowledges checking inside PayPal and receives only `https://paypal.me/HANDLE`. No amount, memo, invitation token or private card text is put in the outbound URL.

This follows the existing per-service revision, ownership, session/CSRF, event window, revocation, feature-switch and stale-destination checks. Opening/returning remains **unconfirmed**; the host's later receipt mark is an assertion, not a provider settlement. No PayPal payment SDK, API secret, transfer endpoint or bank credentials are introduced. A normal host-configured PayPal.Me account is required; provider availability and fees are handled by PayPal. See [PayPal.Me help](https://www.paypal.com/us/cshelp/article/paypalme-frequently-asked-questions-help432).

## Persistence and operational boundaries

DEV/local migration 005 adds the optional save-the-date column and rebuilds only the destination table to admit PayPal, preserving rows and versions. Existing encrypted routing values are kept byte for byte. The review adapter now application-encrypts legacy plaintext destination and gift-intent identifiers atomically with the existing AES-GCM key; subsequent writes are encrypted and internal comparisons use decrypted values. The marker cannot collide with valid request text. Keys, original accepted notes, event/link IDs and matching references are preserved. Reopening does not re-encrypt already sealed values.

The pre-migration local database/key backup remains private and ignored. This is an isolated DEV extension, not a production PostgreSQL/managed-identity/backup rollout. Earlier builds do not understand sealed identifiers: roll forward with compatible fixes instead of deploying an old adapter or restoring an old snapshot over accepted content. Backup/deletion/KMS/production acceptance remain their existing work. No Worker name, named preview, Durable Object identity or payment execution scope changes.
