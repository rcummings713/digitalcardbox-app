# Product checkout: Stripe sandbox setup

Implemented 6 November 2026 for isolated DEV only. Basic card boxes, manual cards, every current template, CardVault and basic exports remain free. Product purchases are separate from guest-to-host Cash App, Venmo, Zelle and PayPal handoffs. Stripe is the only additional provider account needed for these purchases. No live key is accepted by this implementation.

## What is sold

| Product | USD one-time price | Delivered upgrade |
| --- | --- | --- |
| Signature card edition | $4.99 | Choice of six premium treatments before delivery; no extra AI generation |
| Digital keepsake, 0–99 included cards | $15.00 | Downloadable HTML album, editorial or collage |
| Digital keepsake, 100–299 included cards | $30.00 | Same format, larger included membership |
| Digital keepsake, 300+ included cards | $79.00 | Same format, larger included membership |

The book is a self-contained digital edition with full notes, retained artwork and GIFs, suitable for opening offline and browser printing. It is not physical-book fulfillment or a print-production PDF. Existing free exports remain available. Media is bounded to 5 MB per asset / 40 MB of embedded media total (including repeated copies and base64 encoding); a download error leaves the purchase intact. Hand-drawn template layouts are translated into the album's typography; this is not a pixel-exact Canva export. Some current UI-only photo placeholders have no real image upload behind them and are not sold as photo archival.

Normal book checkout requires contribution closure. DEV additionally offers an explicit **provisional test edition** checkbox for an open, published event. Its included membership is frozen at quote time; later submissions are not inserted. Current consent, hidden and removed state are checked again on every download. A completed offline download cannot be recalled. The price/count of its original snapshot stays in history if subsequent moderation reduces visible entries.

## 1. Create a Stripe sandbox

1. Sign in to [Stripe Dashboard](https://dashboard.stripe.com/), creating the business owner's account if needed. Open the account picker and choose **Sandboxes → Create sandbox** (or the existing test environment). Stay in that sandbox throughout these instructions.
2. Open **Developers → API keys** (the Dashboard search can find “API keys”). Reveal/copy the **secret** test key beginning `sk_test_`. Do not use `pk_test_`, `sk_live_` or `rk_live_`. A restricted `rk_test_` key also works if granted Prices read, Checkout Sessions read/write, Payment Intents read, Refunds read and Disputes read.
3. Keep keys out of chat, Git, screenshots, browser code and `VITE_` variables. A full-page hosted Checkout redirect requires **no publishable frontend key**, Stripe.js or client SDK.

Official reference: [sandbox and secret keys](https://docs.stripe.com/keys).

## 2. Create four one-time prices

In the same sandbox open **Product catalogue → Add product**. Create these four products, each with a **one-time, flat USD price**, quantity one. Leave taxes, subscriptions, trials, shipping and coupons off for this test configuration. Do not enable automatic tax for these Checkout sessions; the current server verifies an exact total.

| Suggested product name | Price | Setting to receive its `price_…` ID |
| --- | --- | --- |
| TheDigitalCardBox Signature Card | 4.99 USD | `STRIPE_PRICE_PREMIUM_CARD` |
| TheDigitalCardBox Digital Book — Small | 15.00 USD | `STRIPE_PRICE_BOOK_SMALL` |
| TheDigitalCardBox Digital Book — Medium | 30.00 USD | `STRIPE_PRICE_BOOK_MEDIUM` |
| TheDigitalCardBox Digital Book — Large | 79.00 USD | `STRIPE_PRICE_BOOK_LARGE` |

Open each product's price and copy the **Price ID**, beginning `price_`. Product IDs (`prod_`) and Payment Link URLs are not accepted. The server retrieves and checks each price's sandbox mode, active state, amount, currency and one-time type before checkout. Incorrect setup fails closed without changing the original card or book.

## 3. Create the DEV webhook destination

1. In the sandbox open **Workbench → Webhooks → Create event destination**.
2. Choose events from **Your account** and **Snapshot** payloads. Set the API version to **2026-10-28.endive**, matching `server/stripe-provider.mjs`.
3. Select exactly these event types:

```text
checkout.session.completed
checkout.session.async_payment_succeeded
checkout.session.async_payment_failed
checkout.session.expired
refund.created
refund.updated
refund.failed
charge.dispute.created
```

4. Choose **Webhook endpoint** and enter this exact endpoint URL (no invitation tokens):

```text
https://digitalcardbox-app-dev.rcummings71300.workers.dev/api/billing/stripe/webhook
```

5. Create the destination. Open it and reveal its **Signing secret**, beginning `whsec_`. This is different from the API secret key.

References: [create a destination](https://docs.stripe.com/webhooks), [Checkout fulfillment](https://docs.stripe.com/checkout/fulfillment.md?ui=full-page).

## 4. Connect private values to the stable DEV Worker

The repository's DEV configuration already sets `BILLING_ENABLED=true`, `BILLING_ALLOW_EARLY_BOOK_PREVIEW=true` and the return origin to the stable DEV URL above. These flags alone cannot enable checkout: all six values below are required. TEST and PROD configurations are not changed.

Run these commands in Terminal from the repository. Sign in to Cloudflare if prompted. Each command prompts privately for its one value; paste it there. Use **main Worker secrets** for this stable DEV destination. In Cloudflare Dashboard choose `digitalcardbox-app-dev` → **Production** (the main deployment of the DEV Worker), not a feature preview. This does not select the customer PROD Worker. Existing previews keep separate secrets and data.

```sh
cd /Users/robertcummings/Projects/digitalcardbox-app
npx wrangler login
npx wrangler secret put STRIPE_SECRET_KEY --config wrangler.dev.jsonc --name digitalcardbox-app-dev
npx wrangler secret put STRIPE_WEBHOOK_SECRET --config wrangler.dev.jsonc --name digitalcardbox-app-dev
npx wrangler secret put STRIPE_PRICE_PREMIUM_CARD --config wrangler.dev.jsonc --name digitalcardbox-app-dev
npx wrangler secret put STRIPE_PRICE_BOOK_SMALL --config wrangler.dev.jsonc --name digitalcardbox-app-dev
npx wrangler secret put STRIPE_PRICE_BOOK_MEDIUM --config wrangler.dev.jsonc --name digitalcardbox-app-dev
npx wrangler secret put STRIPE_PRICE_BOOK_LARGE --config wrangler.dev.jsonc --name digitalcardbox-app-dev
```

Each command must complete successfully. Price IDs use secret settings here to avoid committing account-specific configuration; they are not API credentials. Do not replace any existing encryption key, Durable Object namespace, object name or review identity to connect Stripe. No extra database service or migration command is required: additive migration 006 runs on the existing isolated DEV SQLite store.

Reload DEV. Visit `/api/config` on the DEV site: `billing.configured`, `billing.enabled`, `billing.premiumCards` and `billing.eventBooks` should all be `true`. Configuration readiness checks presence/format only; the first checkout also validates the real Stripe price and API access. If `configured` is false, check the secret and signing secret prefixes and return origin. If product flags are false, check the four Price IDs and the operator's **Feature controls → Product test checkout** setting. The API never returns the secret values.

## 5. Test the customer flows

1. As a host, create/publish an event, then open its invitation link in a second private profile. In the guest composer choose **Free collection · $0** or **Signature collection · $4.99**. For Signature, select one of six editions, write/edit your card and GIF/artwork, then choose **Review my card**. This saves a private draft, not a delivered card. Choose **Review $4.99 premium card**, review the fixed price, and continue to Stripe test checkout.
2. Enter test card **4242 4242 4242 4242**, any future expiry and any three-digit CVC in **Stripe's hosted page**. Use any sandbox contact details it requests. No real card or funds are needed. See [Stripe testing](https://docs.stripe.com/testing).
3. Return to the site in the original guest browser. It shows pending until a signed event or server retrieval confirms the exact paid session. Select **Return to your card or card box**, then **Send my card** on the review. Only this explicit authorized send delivers the paid draft to the host. Unpaid/refunded drafts cannot send or appear in host/book views. Original guest purchase context and invitation session remain required; another device does not gain guest receipt access. Free collection cards skip checkout. Existing delivered-card purchases keep their original records and refund behavior.
4. For a book, sign into the host workspace, open **Event book**, choose the provisional checkbox while the event is open, review the included count/price, and pay using the same sandbox card. Download both album styles from the purchase receipt. A final closed-event book omits the provisional checkbox requirement.
5. Cancel a checkout, then revisit its receipt: it stays unpaid and can resume. A declined card can be retried inside the same Stripe session. The app never grants paid access from a return URL, screenshot or external gift status.
6. In Stripe's sandbox **Payments**, open that successful product payment and choose **Refund**. A partial successful refund retains access; a full successful refund revokes the upgrade. Original notes and free CardVault access stay intact. Refunds are initiated in Stripe Dashboard, not through a new app refund-issuance endpoint. Signed refund events update the stored history. A dispute revokes access pending manual review; automatic restoration after a won dispute is not implemented.
7. In operator **Feature controls → Product test checkout**, inspect test order/status and gross/refunded amounts or pause new checkouts. These totals are sandbox bookkeeping, not actual revenue, net profit or processing-fee reconciliation. DCB-E10-S06 remains follow-up work.

## Optional local development

Copy `.env.server.example` to ignored `.env.server` and set the same six values privately, plus:

```dotenv
BILLING_ENABLED=true
BILLING_ALLOW_EARLY_BOOK_PREVIEW=true
BILLING_RETURN_ORIGIN=http://localhost:5173
```

Run `npm run dev`. In another terminal, install/sign into the [Stripe CLI](https://docs.stripe.com/stripe-cli), choose the same sandbox, and run:

```sh
stripe login
stripe listen --events checkout.session.completed,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed,checkout.session.expired,refund.created,refund.updated,refund.failed,charge.dispute.created --forward-to localhost:8787/api/billing/stripe/webhook
```

Use the listener's `whsec_…` value as local `STRIPE_WEBHOOK_SECRET` and restart the app. The CLI signing secret differs from the hosted destination's secret. If using a different UI/API port, adjust both commands/origin. Generic `stripe trigger` events do not belong to app orders and intentionally cannot unlock them; use a real app-created sandbox checkout for the end-to-end test.

## Security, persistence and scope

New tables persist orders, fixed items, attempts, verified-event receipts, access grants and refunds. Unique references and transaction boundaries make event replay safe; ambiguous creation retries use the same Stripe idempotency key and stop before its retention window expires. Raw event bodies, PAN/CVV, bank details and provider secrets are not stored in these tables. Event receipts retain only event ID/type/digest/time; checkout URLs are encrypted. Server-scoped buyers, same-event constraints, CSRF, quotas, fixed price IDs and fixed provider URLs apply. Private notes and invitation tokens never enter Stripe metadata or return URLs.

This uses the existing DEV SQLite/Durable Object store, not the planned production PostgreSQL billing deployment. This code deliberately refuses live credentials/events. Enabling real sales requires a separately reviewed live-mode rollout with production identity/storage, recovery/retention operations, fee reconciliation and owner approval; a key substitution does not silently enable it. See [ADR 0012](../adr/0012-product-checkout-sandbox.md).


## Stable DEV cutover — 11 November 2026

The main DEV Worker now receives connected releases from `dev`; feature previews remain available separately. The webhook and return origin above replace the former branch-preview setup target. If you already registered the preview destination in Stripe, edit that destination's URL to the stable endpoint above, retain the same eight events/snapshot/API version, and install that destination's signing secret on the main DEV Worker. Do not leave both destinations delivering the same sandbox events unnecessarily. Create and pay for new test orders from the stable DEV site. The main store cannot look up old preview orders; old preview invitations and accepted content remain at the old preview URL. No preview store/key is deleted or rebound during this release. Missing Stripe setup keeps checkout disabled; the endpoint may return 503 until its private values are installed.


## Inspect the installed sandbox configuration

An operator can sign in and open `/api/admin/billing/check` on stable DEV. This read-only check retrieves all four prices from Stripe and compares active state, sandbox mode, USD amount and one-time type. It also checks that an enabled webhook destination matches the DEV URL, API version and eight required events. No Stripe keys, signing secret, private notes or full event bodies are returned. `webhookDeliveryVerified` separately reports whether a signed relevant event was accepted; price/endpoint settings are not delivery proof. A completed sandbox purchase/refund remains a separate test. Restricted keys need Webhook Endpoints read permission for endpoint inspection; insufficient access reports unverified.

Dashboard Add/Save can create a staged Worker version. Apply that version with Deploy so the running app receives the settings. Store all six settings as **Secret** bindings. Price IDs are identifiers rather than credentials, but using secret bindings preserves them across releases without requiring extra dashboard-metadata permissions for CI. Plain dashboard variables can be replaced by the next code deployment; existing plain Price IDs should be converted to secrets with the same values. Their actual values are not committed. No code release should substitute a namespace/key or reset billing records to repair configuration.

Runtime verification (11 November): the provider uses Worker-supported manual redirect handling and refuses redirects before reading any response; Stripe credentials are never forwarded. Endive checkout requests use `allowed_payment_method_types` with the existing card scope, rather than the removed `payment_method_types` request field. Available wallets still depend on Stripe eligibility/settings. The operator check may show the latest in-memory provider failure timestamp/status/operation and a short hint with keys/emails redacted; public purchase errors remain fixed text. This hint resets when the instance restarts. References: [Stripe Checkout parameters](https://docs.stripe.com/api/checkout/sessions/create), [Endive migration](https://support.stripe.com/questions/fix-the-payment-method-types-error?locale=en-GB), [Worker Request redirects](https://developers.cloudflare.com/workers/runtime-apis/request/).

Managed Payments compatibility (11 November): this fixed-total sandbox integration explicitly sends `managed_payments[enabled]=false` for its Checkout sessions. It does not change the account default, live settings or taxes for another integration. Managed Payments tax/merchant-of-record behavior is outside ADR 0012. If `stripe trigger checkout.session.completed` fails on fixture shipping fields, the locally installed CLI can use `stripe trigger checkout.session.completed --add checkout_session:managed_payments.enabled=false`. Browser Stripe Shell does not support trigger flags: use `stripe trigger charge.refunded` there instead. Its fixture emits the selected `refund.created` event without Checkout shipping fields. Then inspect this destination’s delivery. Generic CLI events can verify signing/delivery but cannot pay an app order. [Stripe per-session setting](https://docs.stripe.com/payments/managed-payments/set-up). Earlier attempts retain their original idempotency identity after a request migration; do not blindly rotate ambiguous attempts. Verification uses a new synthetic guest/card rather than modifying existing attempts.


11 November: permanent customer sign-in setup is in ACCOUNT_AND_AI_SETUP.md; temporary guest sessions remain scoped separately from host accounts. The owner's $4.99 app order received a real signed checkout.session.completed event and is recorded paid. This confirms that sandbox checkout, beyond synthetic delivery fixtures. A new premium-draft delivery/refund test remains part of this release's owner acceptance.
