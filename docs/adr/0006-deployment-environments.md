# ADR 0006 DEV, TEST and PROD deployment workflow

**Status:** Accepted and configured; Worker-specific CI tokens installed, DEV/TEST deployments verified, and legacy Git-build disconnection confirmed by the owner. PROD deployment requires the owner's own approval.
**Date:** 13 October 2026. **Owner:** rcummings713, sole repository contributor.

## Decision

Keep one GitHub repository and use GitHub Actions to build and route static UI deployments to separate Cloudflare Workers:

| Source | GitHub environment | Cloudflare target |
| --- | --- | --- |
| `dev` | DEV | The stable connected `digitalcardbox-app-dev` Worker main deployment |
| `feature/` prefix, including nested branch names | DEV | A named preview under `digitalcardbox-app-dev` |
| `develop` | TEST | The stable `digitalcardbox-app-test` Worker |
| `release/` prefix, including nested branch names | TEST | A named preview under `digitalcardbox-app-test` |
| `master` | PROD | Existing `digitalcardbox-app` Worker, after the owner's manual approval |

Other branches, pull request events and tags build without deployment. Deleted-branch push events skip jobs so the default-branch fallback cannot select a production deployment. Hash-qualified preview names prevent similar, long or nested branch names from colliding or entering shell commands. PROD's GitHub environment permits only the `master` branch.

Promote a tested release by merging it into `master`, then approving the PROD deployment. Master holds approved production source; the recorded deployment commit/version identifies what is actually live while a build or approval is pending. An outdated approval must fail when `master` has moved. A checked build artifact is passed to deployment rather than rebuilt after approval.

## Solo contributor controls

Master requires a pull request and the Build check, with **zero required PR reviewers**. The owner can merge their own PR after checks pass. PROD lists only `rcummings713` as its required deployment reviewer with `prevent_self_review: false`; the owner can approve the deployment they initiated. DEV and TEST have no reviewer requirements. No second-person maker/checker control is introduced.

## Isolation and cutover

Preserve the existing customer URL and application source when installing the pipeline. Bootstrap `master` from the current production history, separately from the feature UI work, make it the default branch, and create `develop` from that bootstrap source. Retain the old `main` branch as a frozen legacy reference during the Cloudflare build-integration cutover. Keep future feature UI changes off master until release promotion.

GitHub environments hold the account ID variable and environment secret `CLOUDFLARE_API_TOKEN`. Cloudflare's current local OAuth session is not an appropriate long-lived CI credential. The existing Git-connected Cloudflare automatic builds must be disabled so they cannot bypass the GitHub PROD approval. Do not delete or disable the live Worker. The owner confirmed this repository disconnection was completed. The local OAuth session cannot independently read Workers Builds configuration (HTTP 403), so the cutover record relies on that dashboard confirmation.

Workers, preview URLs and deployment targets are separate. This static setup adds no database, authentication, private storage, AI secret or live payment route. Future bindings and PostgreSQL instances must be explicitly scoped to the environment under DATA_MODEL.md and ADR 0005. Use three distinct account-owned API tokens scoped through Specified Workers / Individual Workers Editor to the matching existing DEV, TEST or PROD Worker. Cloudflare supports individual Worker scopes; distinct GitHub secret slots alone do not restrict an account-wide token. No whole-account or zone policy is granted for this static setup. The broad Edit Cloudflare Workers template is inappropriate when other projects share the account. Creating additional Workers or adding custom domain routes requires a separate, explicitly scoped setup action; it is not permission granted to the current deployment tokens. Only trusted branch pushes deploy, and pull requests never receive deployment secrets.

## Consequences

Use disposable HTTPS `workers.dev` URLs now and attach the final domain to PROD later. Features and release candidates have independent preview URLs. Record each deployment's environment, commit SHA and URL; restore a previous approved master commit for application rollback, then approve its new PROD deployment. Database rollback remains a separate future runbook.

This decides the static UI deployment pipeline only. The production server/runtime spike in ADR 0001 remains open, and the private MVP release gates are unchanged. See [the environment runbook](../../planning/ENVIRONMENTS.md).


## 11 November 2026: stable DEV integration target

The owner requests the connected backend at the main DEV Worker address for a permanent Stripe sandbox endpoint. Add `dev` as a DEV-only integration branch: `deploy --config wrangler.dev.jsonc --name digitalcardbox-app-dev`. The existing DEV-scoped CI token deploys it; GitHub builds with connected/server data mode and runs the same checks as feature deployments. Cloudflare labels this Worker's main deployment “Production”; this is still the DEV Worker and never the customer PROD target. Feature previews remain isolated. `develop`/release and `master` routing/owner approval are unchanged.

Stable DEV uses its own Durable Object namespace and the existing `shared-review-v1` object name, repository migrations and stored encryption key. The previous static baseline had no backend records. This deployment initializes a new DEV test store; it does not copy, delete, expire or rebind the existing preview's records, links, sessions, keys or secrets. Existing preview invitations continue at their original origin. New DEV invitations and checkout returns use the stable DEV origin. Operator access is privately configured on the main Worker before backend release. Future updates to `dev` preserve its namespace and key. Stripe sandbox credentials remain owner-provided; live keys/events stay rejected.
