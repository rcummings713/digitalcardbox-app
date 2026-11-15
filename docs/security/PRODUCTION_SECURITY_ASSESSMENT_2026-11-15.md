# Production security assessment — 15 November 2026

**Release recommendation: do not launch the connected application to production yet.** Six application defects were reproduced, and several existing production acceptance gates remain open. Passing the current regression suite does not establish production readiness.

This assessment covers the working tree at commit `6724b0a` on `feature/premium-stationery-collection`, including the owner's existing uncommitted changes. It adds documentation and synthetic assessment evidence only. It makes no deployment, account, payment, schema, or production behavior changes.

## Scope and evidence

Reviewed the React interface, browser storage, Node HTTP adapter, Cloudflare Worker/Durable Object adapter, managed authentication and recovery, event/guest authorization, gift routing, Stripe sandbox purchases and webhooks, generated media, migrations and encryption, exports, dependency lockfile, and deployment workflow. Read PRODUCT, SECURITY_PAYMENT, MVP_ACCEPTANCE, DATA_MODEL, ADRs 0001/0005, and the database backlog audit. Checked relevant live stories and comments, including #7–10, #21, #46, #49–51, #54–56 and #62–65; verified the native #63 → #64 → #65 blocker chain. This is an application-wide assessment spanning those stories, not implementation of one assigned story.

Used synthetic in-memory records and the repository's provider fixtures for exploit probes. Public live checks were limited to ordinary homepage GETs on the documented DEV and PROD Workers and read-only GitHub configuration queries. No real guest records, private production database, payment execution, or live identity-provider administration were inspected.

**Important deployment distinction:** the connected backend is explicitly a DEV adapter. `worker/index.mjs:127` refuses its API unless `DCB_ENV=dev`; `server/index.mjs:11` rejects production execution. The workflow builds TEST/PROD with `VITE_DATA_MODE=review`, and `wrangler.jsonc` deploys static assets without a backend entry point. Publishing the current PROD route would publish the review application rather than a production service. Changing only that flag or removing the runtime guard would expose the unfinished controls described below.

## Confirmed application defects

Severity describes impact and prerequisites; it is not a claim of an unauthenticated production compromise. The first finding is High. The remaining five are Medium.

| ID | Severity | Confirmed behavior | Release action |
| --- | --- | --- | --- |
| A01 | High | A six-day-old managed session can publish and change gift destinations without fresh authentication. | Add server-enforced step-up authentication. |
| A02 | Medium | Closed/paused invitation responses retain payee identifiers and private event details. | Minimize inactive-event API responses. |
| A03 | Medium | Private designs survive logout in account-independent localStorage. | Isolate and expire private drafts; clear them on sign-out. |
| A04 | Medium | After 2,000 historical studio sessions, new sessions fail even when all old sessions expired. | Bound active sessions and safely clean up expired records. |
| A05 | Medium | A gift intent does not lock event date/type/timezone. | Lock lifecycle fields atomically on first gift activity. |
| A06 | Medium | CardVault exports silently omit cards beyond the latest 1,000 across a host's events. | Implement complete, authorized export retrieval and pagination. |

### A01 — No recent authentication for sensitive operations

**Sources:** `server/application.mjs:93`, `:120`, `:137`, `:334`; `server/auth-service.mjs:198`, `:221`; `src/ui/HostPages.tsx:708`.

`requireHost` checks that a session exists. Publishing and destination changes use that check and event ownership, without trustworthy interactive authentication age or a step-up challenge. Managed session token refresh is not recent human authentication. The current free export is generated from the already-loaded workspace, with no fresh-authenticated export request or export audit operation.

**Reproduction:** a synthetic managed user signs in, creates a draft, advances the repository clock six days, then publishes and configures a Venmo destination. Both changes return HTTP 200. Provider token grants show only the original password grant and a refresh. The probe uses fictional preview identifiers; the same authorization path controls actionable destinations.

**Impact:** possession of an active session can permit gift redirection or publication without another identity check. This does not bypass event ownership; it increases the consequences of a stolen session or unattended signed-in browser.

**Required change:** record provider-validated interactive authentication time and enforce a defined freshness window on publishing, editing/disabling destinations, and private export retrieval. Use managed reauthentication or MFA challenges with one-time, action-scoped evidence. Do not reset freshness on token refresh. Audit sensitive actions without storing raw identifiers. Browser-only export cannot erase content already fetched; fresh authentication must guard retrieval where the policy requires it.

**Verification:** stale sessions must be denied before mutation; fresh challenges authorize only the intended actor/action; refresh, replay, parallel requests, and recovery must not bypass the challenge. Existing owner: [#10 — Protect sensitive host actions](https://github.com/rcummings713/digitalcardbox-app/issues/10), with #8 managed identity and the #7 identity epic.

### A02 — Inactive invitations disclose payee and event data

**Sources:** `server/application.mjs:190`; `server/adapters/repository.mjs:107`, `:508`.

The invitation handler serializes the full guest event before returning its calculated window. Guest serialization filters destinations by enabled/confirmed status, but not by event window. A valid bearer link for a closed, paused, or scheduled event therefore returns the host-supplied payment identifier, recipient, event location, and other design/details even when the interface hides them.

**Reproduction:** synthetic closed, scheduled and paused invitations each returned HTTP 200 with a configured identifier and private location. Card writes correctly returned 409 in all three states. No private host inbox was disclosed.

**Impact:** an old or paused invitation remains a source of personal data until its link is revoked. A valid invitation bearer is required. This is a disclosure-policy/deadline gap, not a confirmed cross-account authorization bypass.

**Required change:** apply a response allowlist based on the event state before serialization. Closed/paused responses should expose only the minimal safe landing information. Scheduled save-the-dates intentionally show date/location; preserve that approved behavior while making pre-opening payee disclosure explicit. Do not create unnecessary guest sessions for a minimal closed landing.

**Verification:** inspect JSON responses, images and other assets directly for every state, independently of what the UI renders. Revoked links must continue to fail. Existing owners: #13/#21 lifecycle, #35 gift routing, #52 authorization.

### A03 — Private designs persist across sign-out

**Sources:** `src/ui/DesignStudio.tsx:66`, `:107`; `src/ui/DesignEditor.tsx:1029`; `src/ui/state.tsx:282`; `src/App.tsx:74`.

The editor writes every design, including event-bound invitations and save-the-dates, to global persistent browser keys such as `dcb-design-studio-invitation-v1`. The public studio restores those keys without customer/event context. Sign-out clears account state but leaves the drafts.

**Reproduction:** executed the actual bundled `createDesign` and `readDesignDraft` functions in a VM with synthetic localStorage. The reader recovered `PRIVATE SYNTHETIC HOME ADDRESS` without an account or session. The automatic writer, public route, and logout path were additionally source-reviewed; this probe does not claim a separate real-provider browser logout test.

**Impact:** another person using the same browser profile can reopen a previous customer's private text or address after sign-out. Remote access to a different browser is not implied.

**Required change:** separate explicitly device-saved anonymous drafts from private authenticated designs. Avoid writing event-private documents into public global draft keys. Clear private drafts on logout/account change and apply expiry. Account-scoped key names alone are insufficient protection from another person with the same browser profile. Explain any intentional device persistence accurately.

**Verification:** account A edits and signs out; account B and an anonymous visitor must not recover A's private design through public routes, refresh, browser navigation, or draft restoration. Existing owners: #51/#54 privacy and the invitation/editor stories.

### A04 — Studio session capacity is a lifetime limit

**Sources:** `server/studio-service.mjs:10`, `:26`; `server/migrations/004-design-studio.sql:4`.

The session-creation cap counts all historical rows. Expiry prevents reuse but does not remove a row from that count. There is no cleanup for this table. The public endpoint can be used without making an AI request.

**Reproduction:** with 2,000 synthetic expired sessions and zero active sessions, a new session returned 429. A separate probe created the sessions through the service while respecting its per-IP daily limit, advanced eight days, and reproduced the same outcome.

**Impact:** ordinary growth eventually disables new studio sessions; distributed traffic can accelerate exhaustion. Manual designs remain available, but new AI studio sessions do not recover naturally.

**Required change:** count active sessions, implement safe expiry cleanup, and separate retained artwork/job ownership from short-lived anonymous sessions. Preserve accepted artwork and respect foreign keys when pruning. Add an operational capacity metric and durable abuse controls.

**Verification:** exceed 2,000 lifetime sessions, expire them, and demonstrate new sessions succeed while unexpired sessions remain usable and accepted artwork survives. Existing owner: #55.

### A05 — Gift-only activity leaves lifecycle editable

**Sources:** `server/adapters/repository.mjs:271`; `server/application.mjs:402`; `server/domain/events.mjs:146`; `docs/specs/DATA_MODEL.md` Events section.

The first card sets the lifecycle lock. Gift intent insertion does not. Event validation relies on `events.locked_at`, so an event with gifts and no cards can still change its date, occasion type, and timezone.

**Reproduction:** created a Wedding dated 20 November 2026, configured a route, and created a gift intent. `locked_at` remained null. Updating it to Baby shower on 15 April 2027 succeeded.

**Impact:** a host can change previously presented deadlines and gift-only eligibility after gift activity. This breaks the canonical first-activity lock and can prolong or otherwise change guest expectations.

**Required change:** set the lock in the same transaction as the first accepted gift intent, while rechecking the event/link/session/route/version/window. Keep Events responsible for the lifecycle rule.

**Verification:** gift-before-card, card-before-gift, retries, and concurrent first intent/date edits must produce one consistent locked lifecycle. Existing owners: #13/#21 lifecycle and #42 atomic handoff.

### A06 — Complete-looking exports truncate retained content

**Sources:** `server/adapters/repository.mjs:300`; `src/ui/HostPages.tsx:708`.

The workspace returns at most 100 events, 1,000 delivered cards, and 1,000 gifts across the host, without a cursor, total, or incompleteness flag. The free CardVault export filters and downloads this bounded browser cache, then reports success.

**Reproduction:** 1,004 stored delivered host cards produced only 1,000 workspace entries; pagination metadata was absent. The four older records remained stored, but were unavailable to that export path. This is silent omission, not evidence of database deletion.

**Impact:** hosts may mistake an incomplete download for a complete private archive. Multiple smaller events can reach the same aggregate limit. The separate paid-book delivery path was not shown to have this particular defect.

**Required change:** provide complete, authorized event exports from the server with explicit totals, bounded streaming or pagination, and failure on incomplete retrieval. Paginate workspace views so old events and records remain reachable. Include fresh authentication and an export audit event.

**Verification:** export events and combined workspaces above each boundary; compare IDs/counts with eligible stored records, including consent/moderation rules, and test closed-event access. Existing owner: [#49 — Export basic CardVault privately](https://github.com/rcummings713/digitalcardbox-app/issues/49), within #46; #50 separately owns frozen book membership.

## Dependency and deployment observations

### D01 — Vulnerable development tooling

The locked dependency scan reports **three affected package nodes: one High and two Moderate**, along the `wrangler → miniflare → undici` chain. These are development dependencies, not three independently confirmed application exploits. `npm audit --omit=dev --json` reports **zero known advisories** for production dependencies at the assessment date. The all-dependency audit and production-only audit are preserved in `evidence/npm-audit.json` and `evidence/npm-prod-audit.json`.

The maintainers identify affected Undici 7.x releases below 7.30.1, including a [process-crashing response handling defect](https://github.com/nodejs/undici/security/advisories/GHSA-xjj6-f33q-929c) and a [redirect/cache disclosure defect with specific dispatcher/interceptor prerequisites](https://github.com/nodejs/undici/security/advisories/GHSA-4w7w-5xrc-9h26). The latter configuration was not established in this application. The audit recommends Wrangler 4.162.0 as an available non-major fix; verify the resulting lockfile resolves every advisory before accepting an upgrade.

Upgrade the package lock and the separately pinned `wranglerVersion` in `.github/workflows/deploy.yml` together, then rerun Worker/billing/deployment tests. Select a supported patched Node runtime and verify the actual Cloudflare compatibility/runtime versions. npm's package scan does not cover Node's built-in libraries, Cloudflare's runtime, provider configuration, or application logic. No dependency changes were made by this assessment.

### D02 — PROD does not inherit DEV browser headers

Ordinary live homepage responses on 15 November confirmed DEV sends CSP, `Referrer-Policy: no-referrer`, and `X-Content-Type-Options: nosniff`. The PROD homepage sent none of these headers. Neither observed homepage response advertised HSTS. DEV's headers are applied in `worker/index.mjs:142`; PROD's static configuration does not run that code.

Apply and verify a suitable CSP including `frame-ancestors`, referrer policy, nosniff, and HTTPS transport policy on the actual production route and custom domain, including error pages and private downloads. DEV's existing script/object/frame restrictions are useful starting evidence. HSTS should be configured for the owned deployment/domain with its subdomain implications understood. Missing headers are defense-in-depth gaps; this review did not establish an XSS exploit because of them. See [OWASP's header guidance](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html).

### D03 — Release controls have useful safeguards; security scanning is not a required CI step

Live GitHub queries confirmed the default branch requires the `Build` status. PROD deployment is restricted to `master` and requires owner approval; self-approval is allowed, matching the solo-owner policy. Actions are pinned to commits, checkout credentials are not persisted, and the workflow deploys the checked build artifact. The workflow rejects stale production approvals.

The checked workflow does not run dependency auditing or secret scanning. The repository is public. A scoped working-tree scan found no matching private key/provider-token patterns in tracked and nonignored files up to 10 MB each. A targeted history search across 56 reachable commits found no matching live Stripe token, classic GitHub token, or private-key additions. These limited searches do not prove the absence of every secret, encoded credential, log exposure, or prior exposure. GitHub reported zero vulnerability alerts; that does not override the npm findings.

Add dependency review/auditing and maintained secret scanning to CI and enable provider/repository protections as appropriate. Do not copy real credentials into reproductions, browser fixtures or report artifacts. Cloudflare token scopes and the historical legacy-build disconnection were not independently revalidated against the Cloudflare account during this assessment.

## Outstanding production requirements

These are documented release gaps, not claims that the intentional DEV adapter is already a production compromise.

| Gate | Evidence and risk | Required release evidence / existing owner |
| --- | --- | --- |
| G01 — Production runtime and persistence | ADR 0001 remains open; approved PostgreSQL foundations are not installed by the current SQLite/Durable Object implementation. TEST/PROD still deploy the browser review route. DEV routes all API traffic to one `shared-review-v1` Durable Object. | Select and document the production stack; deploy separate production identity/database/storage; verify migrations, runtime policies, cross-event FKs, atomic operations and rollback with actual least-privilege runtime credentials. #62–65 own foundations. Do not remove DEV guards as a substitute. |
| G02 — Production identity and operator MFA | Anonymous `/api/review/session` returns `registered:false` accounts that can create published events (reproduced HTTP 201). `HostedReviewIdentity` authenticates seeded operators through one environment password, without MFA. These are intentional DEV mechanisms. | Require verified managed identity for publishing and actionable destinations; keep anonymous creation within the approved draft scope. Exclude review/seed credentials from production. Provision named operator accounts with enforced MFA and bounded privileges. #7/#8–12 and #52. |
| G03 — Independent, versioned encryption keys | `worker/index.mjs:41` stores the raw AES key in the same Durable Object storage context as the encrypted records; the local adapter stores a key beside its database. AES-256-GCM and random IVs exist, but external versioned key management/rotation do not. | Store versioned keys outside the application data store, define access/rotation/recovery, and prove old/new records decrypt through rotation and restore. A storage-wide compromise must not automatically provide the decrypting key. A SQL-only export is a narrower threat and was not shown to include KV. #54, dependent on #64. |
| G04 — Destination history and host alerts | `repository.mjs:232` overwrites the route row. Old versions exist only if a gift intent happened to snapshot them. Generic audit text cannot reconstruct unused old versions. No host-change notification is durably queued. | Retain immutable destination versions and confirmation history. Atomically record route changes and an outbox notification; retry/deduplicate delivery and alert the host. Preserve current stale-version/handoff protections. #35–45 with #65 delivery foundations. |
| G05 — Retention, erasure and recovery | Card removal sets `removed_at`; it does not erase the body/image. No complete retention/deletion/tombstone workflow or production restore-drill evidence was found. Provider durability alone is insufficient release evidence. | Publish retention periods; provide tested manual erasure for customer/guest/content/media/drafts/exports and applicable audit/provider evidence; preserve required records deliberately. Restore database, media and key access in isolation, reapply deletion tombstones before reads, and measure agreed recovery objectives. #56; later automation remains with its existing owner. |
| G06 — Accurate privacy disclosures and release scope | `PublicPages.tsx:332` says unsent drafts stay in the tab; studio drafts persist in localStorage and premium drafts also persist on the server before Send. The same copy describes host removal without explaining soft retention. Production photo storage/uploads are disabled, and guided writing assistance uses static prepared text. | Publish a notice matching actual data locations, provider use, access, TTLs, deletion and draft behavior. Deliver the required private photo pipeline with safe media handling or explicitly revise launch scope before release. Treat live guided AI acceptance separately from static fallback. Preserve the already implemented premium draft isolation. |
| G07 — Live product sales and operations | Checkout deliberately accepts sandbox keys/events and refuses live mode. Fixture tests cannot establish real provider acceptance, reconciliation or refunds. Basic external gifts remain separate unconfirmed handoffs. | If launch excludes product sales, keep checkout disabled and remove misleading sales promises. If sales are included, approve the live architecture/configuration and demonstrate actual provider setup, settlement/refund/dispute handling and reconciliation in the production design. Never treat a return URL or external gift click as payment confirmation. Existing DCB-E10 stories #100–106. |
| G08 — Operational detection and abuse controls | General HTTP throttles are in-memory maps; some AI/review quotas are persisted. All tenants share one DEV object. Error handling emits only the exception name. No complete production alerting, job-recovery or incident-runbook evidence was available. | Verify edge and durable application limits for sessions/events/writes/AI, storage capacity, provider timeouts and restart behavior. Establish alerts for authentication abuse, destination changes, webhook failures, exhausted quotas/capacity, stuck jobs and service errors, using minimal IDs and redacted logs. Exercise response and recovery. #55/#56 with existing reliability owners. |

Cloudflare documents a finite [SQLite Durable Object storage limit](https://developers.cloudflare.com/durable-objects/platform/limits/); one shared object is therefore a concrete capacity boundary for this adapter. That is not an independent architectural decision to replace the approved PostgreSQL production plan.

## Controls that held under this review

- Host and operator authority comes from server records. Cross-event ownership and scoped media/buyer checks are present; no cross-account bypass was confirmed.
- Host/guest content mutations validate Origin plus a custom header and session-bound CSRF. Account start/login/recovery routes enforce Origin plus the custom header without requiring a pre-existing session token. Hosted cookies are Secure, HttpOnly and SameSite. Invitation links do not confer host privileges.
- Managed identity verifies email, prevents email-based account merging/role escalation, uses encrypted provider tokens, and implements PKCE/state/expiry/replay constraints and password-recovery revocation.
- Issue #8 records real DEV email signup/reset delivery acceptance on 15 November; this assessment did not repeat those external sends. The same issue records Google/Apple activation as pending. Provider fixtures and existing DEV email evidence do not establish production identity acceptance.
- Queries use bound values in the reviewed data paths; user text is rendered through React. No dangerous HTML sink or confirmed SQL injection was identified. Portable paid-book text is escaped and its document has a restrictive CSP.
- Gift handoffs use structured identifiers and fixed provider URLs. Stale versions, route switches, event windows and feature switches are rechecked. Guest reports/handoffs remain unconfirmed; host confirmation is explicitly distinguished from provider proof.
- Stripe sandbox checkout uses server-owned prices, scoped buyers, signed raw-body webhook verification, timestamp tolerance, fresh provider retrieval, exact order/session/amount/item checks, durable deduplication, and refund/dispute entitlement revocation. No payment-forgery bypass was identified.
- Paid books recheck current consent/moderation, and premium drafts stay outside delivered host/book views until authorized Send. Manual writing/templates remain available when AI is unavailable.
- Generated artwork uses bounded choices, moderation, atomic quotas, output checks and scoped access. Connected private photo uploads are disabled, limiting current upload attack surface.
- Vite denies private backend/database/key paths; the browser regression checks those denials. Deployment artifacts do not intentionally contain server credentials.

These observations describe reviewed controls and regression evidence, not exhaustive proof against every exploit class.

## Validation results and reproducible evidence

| Check | Result |
| --- | --- |
| `npm run build` | Pass. Vite emitted a bundle-size advisory, not a security/build failure. |
| `npm run test:api` | 88 passing, zero failing. |
| `npm run test:worker` | Seven passing, zero failing. |
| `npm run test:ui -- --output /tmp/dcb-security-ui-results` | 14 passing, zero failing. |
| `npm run test:connected -- --output /tmp/dcb-security-connected-results-original` | 28 passing, zero failing, using synthetic local records. |
| Deployment routing tests and `npm run check:planning` | Seven routing tests pass; backlog validation passes. |
| Synthetic authentication probes | Reproduced stale-session publish/destination changes, anonymous DEV publication, and inactive-link disclosure in three states. |
| Synthetic data probes | Reproduced gift lifecycle editing, expired studio exhaustion, and 1,004-to-1,000 truncation. |
| Actual draft-reader VM probe | Recovered synthetic private text without account/session context. |
| Dependency audit | All dependencies: one High/two Moderate affected nodes; production dependencies: zero reported advisories. |
| Secret checks | No matches in the bounded pattern scans described above; no comprehensive secret-free certification. |
| Live checks | DEV/PROD homepage headers and GitHub branch/environment protections read successfully. |

Initial sandboxed API/Worker runs could not bind loopback sockets (`EPERM`); approved reruns passed. The first UI run encountered missing trace-artifact files; rerunning with isolated output passed all 14 tests. A connected run initially encountered an occupied port. An alternate-port attempt was stopped because some existing tests hard-code the original URL; the final run uses the original configuration with isolated output. These setup failures must not be presented as application vulnerability assertions.

Reproduce the synthetic findings from the repository root with the project's supported Node environment:

```sh
node docs/security/evidence/auth-probes.mjs
node docs/security/evidence/data-probes.mjs
node docs/security/evidence/browser-draft-probe.mjs
```

The scripts use synthetic data, in-memory databases and a fake identity provider; they make no external calls and mutate no application records. Their assertions intentionally document the vulnerable behavior observed on this snapshot. After a fix, replace those assertions with regression expectations that enforce the required control. The draft probe uses the installed esbuild supplied through the development toolchain. These probes are evidence artifacts and are not added to the normal test command.

## Remediation order and release decision

1. Complete G01/G02: choose and validate the actual production composition, database and managed identities. Keep DEV/review data and credentials isolated. Do not deploy a flag-only promotion.
2. Address A01 and G03–G05: fresh authentication, key separation, durable destination history/alerts, and demonstrated recovery/deletion are prerequisites for real host/payment identifiers and private cards.
3. Correct A02–A06; update the privacy notice, dependency pins and production headers. Add targeted regression tests covering each reproduction and repeat the affected security tests.
4. Resolve the launch scope for live sales, private uploads and guided AI; keep unfinished features disabled or complete their documented acceptance. Validate real provider configuration and operations separately from fixtures.
5. Run the existing MVP acceptance gates against the production candidate with actual runtime credentials, prove restore/deletion and cross-account boundaries, and record the owner release decision. The present evidence supports continued isolated DEV review, not production approval.

This assessment does not create or close GitHub issues, modify canonical implementation decisions or Word references, or authorize live checkout. Future implementation changes must keep the assigned stories, specifications/ADRs and affected references synchronized under AGENTS.md.
