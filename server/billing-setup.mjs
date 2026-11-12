import { STRIPE_VERSION } from "./stripe-provider.mjs";

// Operator-only, read-only inspection. Provider keys and webhook secrets never
// leave the server. Presence flags are deliberately separate from verification.
export async function inspectStripeSetup(billing, expectedEvents) {
  const configuration = billing.configuration();
  const checks = await Promise.all(
    Object.entries(configuration.prices).map(
      async ([product, expectedMinor]) => {
        const result = {
          product,
          expectedMinor,
          actualMinor: null,
          currency: null,
          active: false,
          oneTime: false,
          sandbox: false,
          verified: false,
        };
        if (!billing.provider.configured || !billing.configuredPrice(product))
          return { ...result, error: "missing_configuration" };
        try {
          const price = await billing.provider.api(
            "prices/" + billing.priceIds[product],
          );
          result.actualMinor = Number.isInteger(price.unit_amount)
            ? price.unit_amount
            : null;
          result.currency =
            typeof price.currency === "string" ? price.currency : null;
          result.active = price.active === true;
          result.oneTime =
            price.recurring === null && price.type === "one_time";
          result.sandbox = price.livemode === false;
          result.verified =
            price.id === billing.priceIds[product] &&
            result.active &&
            result.oneTime &&
            result.sandbox &&
            result.currency === "usd" &&
            result.actualMinor === expectedMinor;
          return result;
        } catch {
          return { ...result, error: "stripe_price_unavailable" };
        }
      },
    ),
  );
  const webhook = {
    expectedUrl: billing.provider.origin
      ? billing.provider.origin + "/api/billing/stripe/webhook"
      : null,
    settingsVerified: false,
    status: "unverified",
    missingEvents: [...expectedEvents],
  };
  if (billing.provider.configured) {
    try {
      const endpoints = await billing.provider.api(
        "webhook_endpoints?limit=100",
      );
      const matches = Array.isArray(endpoints.data)
        ? endpoints.data.filter(
            (e) => e.url === webhook.expectedUrl && e.livemode === false,
          )
        : [];
      const endpoint =
        matches.find((e) => e.status === "enabled") || matches[0];
      if (!endpoint)
        webhook.status = endpoints.has_more ? "unverified" : "missing";
      else {
        const selected = Array.isArray(endpoint.enabled_events)
          ? endpoint.enabled_events
          : [];
        webhook.missingEvents = expectedEvents.filter(
          (e) => !selected.includes(e) && !selected.includes("*"),
        );
        webhook.enabled = endpoint.status === "enabled";
        webhook.apiVersion = endpoint.api_version;
        webhook.settingsVerified =
          webhook.enabled &&
          endpoint.api_version === STRIPE_VERSION &&
          webhook.missingEvents.length === 0;
        webhook.status = webhook.settingsVerified ? "matched" : "mismatch";
      }
    } catch {
      webhook.status = "unverified";
    }
  }
  const placeholders = expectedEvents.map(() => "?").join(",");
  const verified = billing.repo.one(
    `SELECT count(*) AS n FROM billing_provider_events WHERE provider='stripe' AND type IN (${placeholders})`,
    ...expectedEvents,
  ).n;
  const latest = billing.repo.one(
    `SELECT type,processed_at FROM billing_provider_events WHERE provider='stripe' AND type IN (${placeholders}) ORDER BY processed_at DESC LIMIT 1`,
    ...expectedEvents,
  );
  const paid = billing.repo.one(
    "SELECT count(*) AS n FROM billing_orders WHERE status IN ('paid','partially_refunded','refunded','disputed')",
  ).n;
  return {
    testMode: true,
    checkoutEnabled: configuration.premiumCards && configuration.eventBooks,
    pricingVerified: checks.every((c) => c.verified),
    prices: checks,
    webhook,
    webhookDeliveryVerified: verified > 0,
    verifiedWebhookCount: verified,
    latestVerifiedWebhook: latest || null,
    completedTestPaymentCount: paid,
  };
}
