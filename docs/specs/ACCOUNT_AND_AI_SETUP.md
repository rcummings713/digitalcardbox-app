# DEV accounts and AI setup

The application uses Supabase Auth for verified email/password, Google and Apple. Its existing DEV event/card database remains in Cloudflare; creating this Auth project does not move or erase those records. No customer password is stored in the app. Keep test and production projects separate. This guide enables DEV only.

## 1. Create the DEV Auth project

1. Open https://supabase.com/dashboard and sign in. Create an organization if requested, then choose **New project**.
2. Name it **TheDigitalCardBox DEV**, select the Free plan if suitable, set a strong database password and retain it in your password manager. The app does not need that database password. Choose a region near your testers and wait for the project to finish provisioning.
3. In project **Connect** or **Settings → API Keys**, copy the project URL (`https://YOUR_PROJECT_REF.supabase.co`) and **publishable** key (`sb_publishable_…`). A legacy `anon` key is also supported. Do not use a secret/service-role key.
4. Cloudflare Dashboard → Workers & Pages → **digitalcardbox-app-dev** → main deployment / Production → Settings → Variables and Secrets. Add both as **Secret** bindings:
   - `SUPABASE_URL`: the exact project URL, without a trailing slash.
   - `SUPABASE_PUBLISHABLE_KEY`: the publishable key.
5. Click **Deploy** to apply the values; Save alone can leave a staged version. Existing Stripe settings stay intact. The repository already configures the DEV authentication origin. No private key belongs in chat or a `VITE_` setting.

## 2. Configure email and redirects

In Supabase **Authentication → URL Configuration** set Site URL to:

```
https://digitalcardbox-app-dev.rcummings71300.workers.dev
```

Add these redirect entries (the callback suffix supports this DEV app's random state query):

```
https://digitalcardbox-app-dev.rcummings71300.workers.dev/auth/callback**
https://digitalcardbox-app-dev.rcummings71300.workers.dev/auth/confirmed
https://digitalcardbox-app-dev.rcummings71300.workers.dev/auth/verify
https://digitalcardbox-app-dev.rcummings71300.workers.dev/auth/recover
```

Under **Authentication → Sign In / Providers → Email**, enable email/password and keep email confirmation enabled. The app requires verified email before issuing a permanent host session. Set a minimum password length of 12 or stronger.

Under **Authentication → Email Templates**, set the confirmation link in **Confirm signup** to:

```html
<a href="{{ .SiteURL }}/auth/verify?token_hash={{ .TokenHash }}">Confirm my email</a>
```

Set the **Reset password** link to:

```html
<a href="{{ .SiteURL }}/auth/recover?token_hash={{ .TokenHash }}">Reset my password</a>
```

These are one-use managed-provider tokens; no access/refresh token needs to be saved in browser storage. Email confirmation verifies the address and then asks the customer to sign in. Recovery updates the password and revokes local sessions.

For your first email test, use an email belonging to your Supabase project team. Supabase's built-in mail delivery is restricted to authorized team addresses and is rate-limited. To invite other testers, configure a sender/domain and custom SMTP in **Authentication → Email / SMTP Settings**. Enter SMTP credentials only in Supabase. Do not turn off confirmation to bypass delivery problems. See [Supabase SMTP](https://supabase.com/docs/guides/auth/auth-smtp) and [password authentication](https://supabase.com/docs/guides/auth/passwords).

## 3. Google sign-in

1. Open Google Cloud Console / Google Auth Platform. Create or select the business's DEV project and configure Branding/Audience. While the app is in Testing, add your Google test accounts under test users.
2. Create an OAuth client of type **Web application**.
3. Add the DEV site's origin as an authorized JavaScript origin if requested. The **authorized redirect URI** is Supabase's callback, not the app's `/auth/callback`:

```
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```

4. Copy the client ID and client secret into Supabase **Authentication → Sign In / Providers → Google**, enable Google, and save. The secret stays in Supabase; the app needs no Google secret. Use minimum identity scopes (openid/email/profile).
5. Refresh the app after about a minute. Its Google button becomes available only when Supabase reports the provider enabled.

Reference: [Supabase Google setup](https://supabase.com/docs/guides/auth/social-sign-in/auth-google).

## 4. Apple sign-in

Apple needs an eligible Apple Developer account and configured Sign in with Apple identifiers; creating a Supabase project alone does not enable Apple.

1. In Apple Developer → Certificates, Identifiers & Profiles, create/use a primary App ID with Sign in with Apple enabled.
2. Create a **Services ID** for the website (for example `com.thedigitalcardbox.dev.web`) and associate it with the primary App ID.
3. Configure its website domain as `YOUR_PROJECT_REF.supabase.co` and its return URL as `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`.
4. Create a Sign in with Apple key, retain its `.p8` file securely, and obtain the Team ID / Key ID. Generate the Apple OAuth client secret using the official Supabase guide's tool.
5. Supabase → Authentication → Sign In / Providers → Apple: enter the **Services ID first** in Client IDs and the generated secret. Enable and save. Apple keys/secrets do not belong in Cloudflare or chat.
6. Rotate the Apple web OAuth secret before its six-month expiry. The Apple button appears after Supabase reports the provider enabled. Customers can edit their display name if Apple does not supply one.

Reference: [Supabase Apple setup](https://supabase.com/docs/guides/auth/social-sign-in/auth-apple).

## 5. Enable bounded AI artwork

1. Open https://platform.openai.com/ in the business owner's account. Create/select a dedicated DEV project, enable API billing with a small initial balance, and create a project API key. Confirm access to `gpt-image-2-2026-04-21` and `omni-moderation-latest`; complete any verification OpenAI requests.
2. In Cloudflare's main **digitalcardbox-app-dev** deployment add **Secret** `OPENAI_API_KEY`, paste the key privately there and click **Deploy**. The repository already sets `AI_CARDS_ENABLED=true`.
3. In the site administrator's feature controls enable AI artwork/assistance if paused. After the new application release is deployed, try one invitation and one invited-guest card. Choose the generated result explicitly; it does not overwrite your words automatically.
4. The app accepts fixed occasion/palette/style/motif choices, never arbitrary prompts, models, sizes, image counts or external URLs. It makes one low-quality portrait request, moderates input and output, keeps results private, and shares daily quotas across public and guest studios: 20 application-wide, 2 per guest/studio session, 4 per IP, and 10 per event. Failed/ambiguous attempts consume a slot and are not automatically retried.
5. OpenAI project budgets may be alerts rather than hard spending stops. The app's request caps bound this feature's request count; its cost estimate is not a guarantee of provider billing. Keep the project key limited to this integration and retain templates as the fallback.

References: [image generation API](https://developers.openai.com/api/reference/resources/images/methods/generate), [moderation](https://developers.openai.com/api/docs/guides/moderation).

## End-to-end DEV acceptance

Create/confirm an email account, sign out and back in, and verify the same boxes on another browser. Test configured Google/Apple separately, including cancelling a provider login. Create/publish an event, open its live QR in another browser, explore the six premium editions on The Cards or select a free or premium card in the guest composer before sending, edit text/GIF/art, review, and complete premium sandbox checkout when selected. Unpaid drafts must stay out of the host inbox/book. A paid draft still requires **Send my card**. Test the host inbox, book purchase/download, full/partial refunds and recipient-reviewed external gift handoffs. External gifts always remain unconfirmed until checked by the host. Stripe sandbox setup is in PRODUCT_CHECKOUT.md; no live money is enabled by these instructions.

The saved public card design carries its requested premium edition into the invited guest composer. This is a choice, never payment proof: server-verified entitlement is still required for premium delivery. Guest drafts/receipts require their original invitation-scoped browser session, including after checkout.
