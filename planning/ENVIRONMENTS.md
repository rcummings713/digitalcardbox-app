# Deployment environments and solo release workflow

The setup follows [ADR 0006](../docs/adr/0006-deployment-environments.md). The feature DEV route now builds the connected UI and deploys `wrangler.dev.jsonc` with a private SQLite-backed Durable Object under ADR 0009. TEST/PROD retain their previous static review route; their production backend/identity decisions are not part of this DEV change. `npm run dev` retains the Node SQLite adapter for local review.

| Environment | Source | URL |
| --- | --- | --- |
| DEV | Each `feature/` branch | Its own preview under the DEV Worker; `digitalcardbox-app-dev.rcummings71300.workers.dev` is the initial DEV baseline. |
| TEST | `develop` | `https://digitalcardbox-app-test.rcummings71300.workers.dev` |
| TEST candidate | Each `release/` branch | Its own preview under the TEST Worker. |
| PROD | Approved `master` build | `https://digitalcardbox-app.rcummings71300.workers.dev` |

Preview links and the exact deployed SHA appear in the Actions run and GitHub environment deployment. Preview names include a short hash of the full branch name. These addresses are disposable; no purchased domain is required.

`master` starts from the current production history with pipeline files only, and is the default branch. The new `develop` branch starts from that same source. The previous `main` is retained as a frozen legacy production reference. The owner confirmed the Cloudflare Git-connected builds were disconnected during cutover; no feature UI was promoted during setup.

## One-time Cloudflare setup

The existing local Wrangler session can deploy Workers, but Cloudflare returned HTTP 403 for API-token management and Workers Builds management. The account owner completed the following setup. Keep these instructions for token rotation or rebuilding an environment:

1. Create three distinct account-owned API tokens using **Start from scratch**, with the policy scope **Specified Workers**. Select the Worker below and check **Developer Platform → Individual Workers → Editor** only. Store each token directly as `CLOUDFLARE_API_TOKEN` in its matching GitHub environment. Keep token values out of chat, source files and command arguments.

   | GitHub environment | Token name | Selected Worker |
   | --- | --- | --- |
   | DEV | DigitalCardBox DEV Deployments | `digitalcardbox-app-dev` |
   | TEST | DigitalCardBox TEST Deployments | `digitalcardbox-app-test` |
   | PROD | DigitalCardBox PROD Deployments | `digitalcardbox-app` |

   Review each token before creation: it must list only the selected Worker with **Individual Workers Editor**. The broad Edit Cloudflare Workers template grants account-wide access to unrelated projects and routes; do not use that template for this setup. No Entire Account, domain, Pages, KV, R2, Containers, or Workers CI policy is required for the current static deployment. Leave optional IP filtering empty for GitHub-hosted runners; the initial tokens use No expiration. Worker-specific tokens cannot provision new Workers: the three targets already exist. See [Cloudflare's Worker scope and role documentation](https://developers.cloudflare.com/workers/authorization/workers/).

2. Disable the existing Worker's Git-connected automatic builds in Cloudflare. Keep `digitalcardbox-app` and its existing URL running. GitHub Actions must be the only automatic production deployment path.

Each GitHub environment already has the public `CLOUDFLARE_ACCOUNT_ID` variable. Keep it as a variable; the separate API token is an environment secret. The CI workflow checks for credentials and stops with a clear error if they are missing. The Cloudflare OAuth token used on this Mac is never copied into GitHub Secrets.

On 13 October 2026 the owner installed the three Worker-specific tokens. Retrying the existing [DEV run](https://github.com/rcummings713/digitalcardbox-app/actions/runs/38434931406) and [TEST run](https://github.com/rcummings713/digitalcardbox-app/actions/runs/38436361400) succeeded. Live checks verified the feature UI, contact addresses, logo, and deep links, and confirmed that production's active version remained unchanged. A temporary release branch also passed Build and Deploy TEST ([run](https://github.com/rcummings713/digitalcardbox-app/actions/runs/38479641570)), verifying TEST preview delivery with its restricted token; no PROD job was selected. The owner subsequently confirmed that the production Worker's legacy Git build connection was disconnected while retaining the Worker. Direct Builds API verification remains unavailable to the local OAuth session (HTTP 403); the owner's dashboard confirmation is the cutover evidence. GitHub Actions is now the configured automatic deployment path. Production deployment remains subject to the owner's own approval; no PROD deployment was approved during setup.

## Daily work

1. Start a `feature/<name>` branch from `develop`, commit and push. Actions builds it and publishes its independent DEV preview.
2. Merge your feature PR into `develop` after checks pass. The stable TEST site updates automatically.
3. Create `release/<version>` from `develop`. Push candidate fixes and review its TEST preview. A release branch never publishes PROD directly.
4. Open a release PR into `master`. You can merge your own PR once the required Build check passes; no approval from another person is required.
5. In Actions, use **Review deployments** to approve your own PROD deployment. Self-review is enabled. If master moved while the run was waiting, approve the newer run instead.
6. Merge release fixes back into `develop` so they are retained for the next feature.

Use Actions **Re-run jobs** after adding missing credentials or resolving a transient deployment failure. A manual workflow run uses the selected branch's route; choosing a release branch still deploys TEST.

## Validation and recovery

Run `node --test scripts/deployment-plan.test.mjs`, `npm run build`, and `npm run check:planning` before merging. The pipeline pins its actions and Wrangler version, deploys the checked build artifact, and serializes deployment updates. Deleted-branch push events skip jobs so the default-branch fallback cannot select a production deployment. Branch-routing tests cover unsupported refs, tags, PR events, nested names, shell-sensitive characters, and preview-name collisions.

For an application rollback, revert the problematic production change on master through a PR, let Build pass, and approve the rollback deployment. Keep the deployed SHA/version in the incident note. Domain and database release checks remain required when those implementations are introduced.

## DEV shared backend (21 October)

The feature preview has isolated persistent storage, Secure/HttpOnly cookies,
private seven-day host review sessions and secret-protected operator access.
Do not share the local published test passwords as hosted logins. Install
`DCB_OPERATOR_PASSWORD` on the named DEV preview with Wrangler's secret prompt,
using a generated password of at least 20 characters; operator email is
`operator@digitalcardbox.test`. `DCB_HOST_PASSWORD` is optional for the seeded
fictional hosts; ordinary reviewers use Continue without signing in.

GIF/AI setup and limits: [CARD_MEDIA.md](../docs/specs/CARD_MEDIA.md). The OpenAI
key is not a GitHub build secret and is never embedded into `dist`. A named
preview's Durable Object namespace is separate from the base Worker and other
previews. Updating the same named preview retains review data; removing it can
remove access/data. New preview names require their own secrets.

The original Worker-specific CI token may need narrowly scoped capability to
create/use this DEV Worker's Durable Object binding. Diagnose the actual API
error before changing permissions; do not broaden TEST/PROD tokens or grant
account-wide access for unrelated resources. No production deployment is authorized.
