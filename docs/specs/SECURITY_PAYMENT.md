# Authentication and external gift rules

The October MVP handles **gift directions**, not gift money. Cash App, Venmo, Zelle or PayPal handle transfers outside TheDigitalCardBox. A host supplied handle, email or phone can still be personal information and must be protected. Neither a disclaimer nor a private repository makes a wrong destination harmless.

## Authentication and authorization

- Use a managed identity provider with verified host email; prefer passkeys or MFA where available. Do not create a password database.
- Store host session secrets server-side or in secure, HttpOnly, SameSite cookies. Use strict Origin or CSRF checks on cookie-authenticated mutations.
- Derive the actor, role and owned event from the verified session and database; never accept browser-supplied owner IDs or roles as authority.
- Require recent authentication for publishing, editing or disabling a gift destination and for a private export. Alert the host on destination changes. Operators have separate accounts and MFA.
- Guests may access only the event-scoped, time-bounded actions visible for that event. Links do not grant host access. Check authorization again for files, exports, jobs and writes.

## Destination setup

- Allowlist the supported service names (Cash App, Venmo, Zelle and the 5 November PayPal DEV extension) and validate a structured identifier for each. Do not accept arbitrary outbound URLs.
- Require double-entry, an exact recipient display, host review in the actual payment service and explicit confirmation. Version each active route and retain an audit trail.
- Any edit pauses only that service; an old destination version cannot be used for a new handoff. A disabled service disappears immediately.
- A guest chooses one route and sees the full host-supplied identifier and service. The acknowledgment resets on a route switch or version change. The guest must confirm the recipient again **inside the external service** before sending.
- TheDigitalCardBox cannot independently verify ownership of a host supplied external account or the success, reversal or recovery of an external transfer. Host confirmation is labeled as such; never display “paid” based on a redirect or a guest click.
- Have counsel review terms and adjacent on-screen copy before opening a public pilot. Language may describe responsibility but must not promise immunity for a bug in this app.

## Data and operations

[DATA_MODEL.md](DATA_MODEL.md) defines storage/access/deletion. Keep one provider-linked customer identity and event-scoped guests; no guest email or financial credentials required to identify a contribution. Expiring token hashes are separate from accepted content. Server scope and composite FKs prevent cross-event guest/media/route references.

Application-encrypt destinations and recoverable share secrets with external keys. Separate migration/runtime roles and test policies with actual runtime credentials and transaction-scoped actor context. Atomically revalidate event, guest/link revocation, route/version, acknowledgment and switches at handoff; cached reads are insufficient. Handoff issuance is unconfirmed activity, never a settled transaction. Audit/outbox/idempotency contain minimal IDs/revisions, no raw secrets or private text. Retention, object deletion and restoration of deletion tombstones are MVP recovery requirements.

Keep AI keys and any vendor secret on the server, never in `VITE_*` or client bundles. Do not collect card numbers, bank details, wallet credentials, payment passwords or screenshots as proof. Encrypt stored destination identifiers, restrict reads, redact logs, use least privilege, rate limits, media caps, malware scanning or safe media handling, backups and a restore drill. Record minimal audit events for destination edits and exports. Test cross-event reads, expired sessions, deadline boundaries, stale route versions, service switching and failure states before live users.

Integrated guest-gift checkout is a separate phase requiring written provider approval of custody, underwriting, payout, fees, disputes and liability. Only then use provider-hosted data collection, signed webhooks, idempotent ledger transitions and reconciliation. A browser return still does not verify payment.

## Deployment credentials

DEV, TEST and PROD use distinct Cloudflare account-owned API tokens restricted to their existing individual Worker with the Editor role, held as GitHub environment secrets. Keep the account ID as a non-secret environment variable. The current static UI needs no whole-account, domain-route, Pages, KV, R2, Containers or Workers CI policy. Do not use a broad template token as if it were project-isolated. Never expose deployment credentials in browser bundles, source files, command arguments or logs. Existing Cloudflare Git-connected builds must be disconnected before the GitHub production approval is treated as the sole automatic production path. New Workers, custom domains and future storage bindings require separately reviewed scopes under ADR 0006.


5 November DEV: PayPal accepts a structured PayPal.Me handle and only a fixed HTTPS profile route; it uses all existing ownership/version/window/CSRF and acknowledgment checks. Current and snapshotted routing identifiers are application-encrypted using the existing key, with an idempotent upgrade of legacy plaintext. This is not full-database encryption or a production KMS/identity rollout. See STATIONERY_EDITOR.md and ADR 0011 for scope and rollback compatibility.


## DEV product purchases, separate from guest gifts

ADR 0012 permits Stripe sandbox hosted product checkout only. The browser never receives private keys or supplies an authoritative price, buyer, paid status or redirect. Raw-body timestamped HMAC verification, fresh Stripe session/price retrieval, exact order/attempt/amount/currency/item matching and durable event deduplication precede access grants. Buyer authorization is scoped to the host or original same-event guest. Full successful refunds and disputes revoke only the paid upgrade; partial refunds retain it. New-checkout pause does not suppress settlement. Strict return-origin/provider allowlists, CSRF and quotas apply. Stripe metadata and return URLs contain opaque order/attempt IDs, never private text, payment handles or invitation tokens. No verified gift receipt or live payment claim follows from a product purchase. See PRODUCT_CHECKOUT.md for private setup and limitations.


11 November owner-directed DEV extension: see ADR 0013 and ACCOUNT_AND_AI_SETUP.md. Supabase owns passwords and verified provider identities; additive migration 007 stores only issuer/subject links, encrypted session tokens and expiring S256 PKCE flows. Cards-owned premium drafts stay outside host/book views until an authorized Send after verified sandbox payment. Existing accepted records/keys remain intact; production PostgreSQL/identity/recovery gates remain open.
