# Enable AI artwork in DEV

Setup requirements checked on **November 15, 2026**.

The AI artwork feature is implemented, but DEV is missing `OPENAI_API_KEY`. The general assistance switch is already enabled.

## 1. Prepare the OpenAI project

Open [OpenAI Platform](https://platform.openai.com/) in the business owner's account. Create or select a project named **TheDigitalCardBox DEV** and enable API billing or available API credits.

## 2. Create a project API key

Create a project API key with permission to use **image generation and moderation**. Complete organization verification if OpenAI requests it.

The current application uses:

- Image generation: `gpt-image-2-2026-04-21`
- Moderation: `omni-moderation-latest`

Confirm that the project has access to these models. See [OpenAI's image-generation requirements](https://developers.openai.com/api/docs/guides/image-generation).

## 3. Add the key to Cloudflare DEV

Open **Cloudflare → Workers & Pages → digitalcardbox-app-dev → Settings → Variables and Secrets**.

Add the following:

| Field | Value |
| --- | --- |
| Type | Secret |
| Name | `OPENAI_API_KEY` |
| Value | The OpenAI project API key created above |

Keep the key private and enter it directly in Cloudflare. Do not paste its value into chat or commit it to the repository.

## 4. Deploy the setting

Click **Deploy** to apply the secret to **digitalcardbox-app-dev**.

The repository already sets `AI_CARDS_ENABLED=true` for DEV. Keep the existing email, Stripe, database and encryption settings in place.

## 5. Verify the feature

After deploying, ask Codex to check the remaining artwork controls and test:

- Generating artwork for an invitation.
- Generating artwork for a guest card through a published guest link.
- Explicitly choosing the generated result and confirming that it remains available after saving.

The DEV site is:

https://digitalcardbox-app-dev.rcummings71300.workers.dev

Configuration readiness alone does not prove successful generation; a real generation request is required for acceptance.

## Existing safeguards and costs

The application already enforces fixed design choices, moderation before and after generation, and limits of **20 generations per day overall** and **2 per guest/studio session per day**.

AI requests incur real API usage charges, including in DEV. These request limits are not a guaranteed dollar spending cap.

## Scheduled model update

The configured image model, `gpt-image-2-2026-04-21`, is scheduled to retire on **February 10, 2027**. This is not the current activation blocker, but the model should be updated and tested before that deadline.

See [OpenAI's retirement notice](https://developers.openai.com/api/docs/deprecations).
