# October private MVP acceptance

**Target:** Saturday, 31 October 2026. The date is a planning target. A failed gate moves the private release; do not remove a safety check to meet the date.

| Gate | Evidence to collect before release |
| --- | --- |
| Persistent database | DCB-E18 migrations install DATA_MODEL.md in an empty PostgreSQL environment and rerun safely; failed-migration recovery is documented. Tests reject orphan/cross-event references and duplicate writes. Accepted data survives session expiry and ordinary event closure. Future financial ledgers are not claimed live. |
| Host access | Unauthenticated user cannot create/edit an event or see another host's CardVault. Recent authentication required for destination changes and export. |
| Event lifecycle | Test six-month opening, event timezone, day-90 close, wedding gift-only through month 12, undated close, revocation and closed landing for both URL and QR. Writes are rejected by the server, not just hidden in the UI. |
| Manual content | Note and editable card work with AI disabled; one bounded photo uses private storage, consent is persisted and moderation can hide an entry. |
| Guided AI | Three editable choices avoid invented memories; request caps, moderation, input limits and fallback work. No key appears in the browser bundle. |
| Host destination | Each enabled Cash App, Venmo or Zelle route was entered twice and confirmed. Editing one route pauses only that route, alerts host and increments version. |
| Guest gift | Guest sees full selected identifier and recipient; changing service resets acknowledgment; stale/disabled routes are rejected atomically; outbound route is allowlisted; no app claim of successful external payment. |
| Private book | Host sees only own consented entries and can export after closure. A gift is never required to submit a note. |
| Reliability and usability | Phone and keyboard flows work, fallback errors are clear, deployment uses HTTPS, backup/restore path is tested, and serious bugs are closed. |

## Release decision

Database evidence includes concurrent route edit/handoff, date edit/first contribution, duplicate outbox delivery, atomic consent, quota reservations and removal/export. Test actual least-privilege runtime credentials. DCB-E08-S05 restores database/private media/key references and reapplies deletion tombstones before reads resume. Domain stories own behavior checks; DCB-E18 provides infrastructure and constrained storage.

On October 30–31, walk through the entire guest and host journey on at least two phones. Ask the host to compare every published destination to their account inside each actual external service. Run wrong-payee, changed-route, service-switch, closed-event and cross-account tests. Record results and issue links. If all gates pass, allow a **small private MVP**. Run two supervised real occasions afterward before expanding access.


## DEV product-checkout evidence (6 November extension)

DCB-E10 #100–105 remains OPEN/In Progress for owner review. Verify missing/private/live-key rejection, buyer/CSRF/event scope, fixed prices, 99/100/299/300 book boundaries, frozen membership with current consent, uncertain-create idempotency, expired-session retry, signed/replayed/stale events, missed-webhook recovery, refund-before-paid ordering, full/partial refunds, disputes and operator pause. Original free delivery/exports and external gift wording remain intact. The API fixture injects a private test provider transport; no browser-accessible fake-paid endpoint exists. Browser tests cover pending/paid/refunded receipts, both album downloads and accessibility. A real hosted Stripe sandbox checkout/refund still requires the owner's six configured values and cannot be claimed from fixture tests. No production gate is satisfied merely by this DEV extension.


11 November DEV acceptance adds managed-account verification/role/cross-browser/session/PKCE/recovery checks, original data/key preservation through migration 007, whole-template phone galleries, saved speeds and reduced motion, and pre-send premium draft privacy/payment/send/refund checks. Configured Google/Apple/email and real image-generation checks must be distinguished from fixture evidence. These extensions do not close production PostgreSQL/operations/live-payment gates.
