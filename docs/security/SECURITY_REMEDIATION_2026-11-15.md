# Security remediation — 15 November 2026

The owner authorized implementation, commit and push after the assessment. This change addresses A01–A06 in the existing application and D01–D03 repository hardening. It does not approve production release. The original assessment remains the historical record of the vulnerable snapshot.

| Finding | Implemented behavior | Regression evidence |
| --- | --- | --- |
| A01 — Recent authentication | Publishing, destination changes/disable and private export retrieval require authentication within fifteen minutes. Refresh/SSO do not reset the timestamp. A same-account password dialog preserves forms and retries once; wrong passwords, account changes, logout races and CSRF do not renew authority. Existing sessions fail sensitive actions closed until confirmation. | `server/tests/recent-auth.test.mjs`, `tests/accounts.spec.ts`; migration preservation tests. |
| A02 — Inactive invitation data | Closed/paused links return safe landing fields without payee, location, private copy/design or new guest cookie. Their invitation artwork is blocked. Scheduled save-the-dates retain approved date/location/design but hide payment identifiers. Disabling gifts also removes payees from the response. | `server/tests/security-invitations.test.mjs`, `server/tests/security-data.test.mjs`. |
| A03 — Private browser drafts | Owned event designs never enter the public draft cache. Signed-in standalone drafts stay in validated, expiring tab storage and clear on sign-out/account changes, including other tabs. Anonymous drafts expire after seven days. Unsafe legacy drafts are deleted. Privacy copy matches server premium-draft persistence and soft removal. | `server/tests/design-drafts-security.test.mjs`, `tests/studio.spec.ts`. |
| A04 — Studio capacity | Admission counts active sessions. Unreferenced expired rows are safely pruned; referenced artwork remains available to its authorized owner and does not consume active capacity. | `server/tests/security-data.test.mjs`. |
| A05 — Lifecycle lock | First gift intent locks date/type/timezone atomically. Existing gift-first events receive an idempotent lock repair without changing their data/key. | `server/tests/security-data.test.mjs`; existing handoff/version/window tests. |
| A06 — Complete CardVault retrieval | Workspace pages expose totals/cursors and the UI loads complete groups. Export independently pages all eligible event cards; five-minute encrypted continuation rejects wrong owner/event, changed content, expiry or tampering. Only a complete count can produce a successful download. | `server/tests/security-data.test.mjs`; existing browser archive/export journey. |
| D01 — Dependencies | Wrangler upgraded to 4.162.0 in npm/lockfile and CI. The resulting audit reports zero known vulnerabilities. | `npm audit --audit-level=moderate`; Worker runtime/Stripe tests. |
| D02 — Response headers | Production static assets now receive CSP, referrer policy, nosniff, HSTS and permissions policy via `public/_headers`; DEV applies the same controls. | `worker/tests/static-headers.test.mjs` uses the actual production static configuration for root/deep links. |
| D03 — Continuous scanning | CI audits locked dependencies and runs pinned Gitleaks 8.30.1/action v3 with no PR comments or artifact upload. Four verified historical synthetic fingerprints are narrowly ignored. | Local history and staged secret checks; deployment-routing tests. |

The implementation decisions and compatibility boundaries are in [ADR 0015](../adr/0015-security-remediation.md). Existing domain stories remain the owners; no duplicate security/database epic is created and no story is closed as production-complete.

## Production work still required

- G01: select/validate the production runtime, PostgreSQL adapter/schema, runtime permissions and deployment path under ADRs 0001/0005 and #62–65. TEST/PROD still deploy the static review route; API production guards remain.
- G02: verified production identity and named operator MFA. DEV anonymous workspaces and private seeded operator credentials remain DEV-only. OAuth sensitive actions currently use managed password confirmation; provider-native MFA/step-up needs separate acceptance.
- G03/G04: install external versioned encryption-key management, immutable destination history and durable host-change notification delivery. Current adapter data and keys are preserved.
- G05: approve retention/erasure policy and execute backup, restore, media/key recovery and deletion-tombstone drills. Session cleanup is not erasure of accepted content.
- G06: complete the production private-photo pipeline and live guided-AI acceptance, or explicitly revise the release scope. The privacy copy is corrected, but this does not create those services.
- G07/G08: approve live product-purchase operations if in launch scope; verify actual provider configuration, monitoring, incident response, durable edge/application limits and job recovery. Sandbox-only checkout and honest external-gift wording remain.
- #49: production private-object exports/signed URLs remain open. This change fixes free archive completeness and authorization in the current adapter. Existing generated-artwork archive-format limits are not represented as newly implemented media embedding.

No live users, payments, production account settings or production secrets were modified. Pushing this feature branch may run its existing DEV preview pipeline; production still follows its separate owner-approved release path.

## Verification

Run `npm run build`, `npm run test:api`, `npm run test:worker`, `npm run test:ui`, `npm run test:connected`, `npm run check:planning`, `node --test scripts/deployment-plan.test.mjs`, and `npm audit --audit-level=moderate`. New security regressions are included in the existing suites. Test results are recorded after the final run in `evidence/remediation-results.json`.

The original `evidence/*-probes.mjs` scripts intentionally assert the old vulnerable behavior and are retained as historical evidence. They are not current regression tests. Use the suites above to validate this implementation.
