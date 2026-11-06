# ADR 0011 Direct editing, stationery motion, save-the-dates and PayPal

Accepted for isolated DEV review · 5 November 2026.

The owner requests broader Canva-quality stationery, direct on-design typing,
save-the-dates, PowerPoint-like entrance effects and PayPal. Extend the existing
shared bounded editor and external-gift adapter; preserve the current application,
brand, branch, named preview, records and existing production gates.

Use original vector families in four composed layouts, plus an owner-reviewed
asset importer with recorded source, grant, territory and redistribution/export
rights. Actual Canva assets require an authorized export and an appropriate
asset-specific grant. No scraping, paid design generation, unsupported Canva
file conversion or public arbitrary media-upload endpoint is added. The optional
Canva authoring connection is separate from customer authentication.

Render editable words through an on-design plain-text input, not arbitrary rich
HTML. Add bounded per-layer type/formatting, resize/duplicate controls and shared
undo/redo. Optional version-1 document fields carry finite named motion choices;
received presentation can animate, while edit/search, reduced-motion and print
remain still. Pause reveals all text. Manual design works without an AI key.

Keep save-the-date and invitation documents separately on the existing owned
event. Save-the-dates use invitation-kind documents with an explicit variant.
Public previews create no event; publishing and sharing still require a card box.
The existing opaque link/QR gets a save-the-date route, and scheduled events can
show that announcement without accepting early contributions. No guest directory,
automatic messaging or new funds-flow capability is introduced.

Add only an external PayPal.Me profile handoff with a structured 20-character
alphanumeric handle, existing host/guest reviews and per-service version checks.
The new service does not verify or execute payments. Migration 005 preserves
existing destination rows while expanding its service constraint. Correct the
DEV adapter's prior plaintext routing storage through application encryption of
current/snapshotted identifiers using its unchanged key, with an idempotent
legacy-data upgrade and transparent authorized reads. Older adapters require
compatibility work before rollback; use forward fixes to preserve accepted data.

Details, import instructions and limitations: [STATIONERY_EDITOR.md](../specs/STATIONERY_EDITOR.md).
Tracking: #24, #73, #77, #94, #95 and new #97–#99; all remain open / In Progress.
