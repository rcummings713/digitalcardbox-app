export function billingOptions(env, localOrigin = "") {
  return {
    enabled: env.BILLING_ENABLED === "true",
    secretKey: env.STRIPE_SECRET_KEY || "",
    webhookSecret: env.STRIPE_WEBHOOK_SECRET || "",
    returnOrigin: env.BILLING_RETURN_ORIGIN || localOrigin,
    allowEarlyBooks: env.BILLING_ALLOW_EARLY_BOOK_PREVIEW === "true",
    priceIds: {
      "premium-card": env.STRIPE_PRICE_PREMIUM_CARD || "",
      "book-small": env.STRIPE_PRICE_BOOK_SMALL || "",
      "book-medium": env.STRIPE_PRICE_BOOK_MEDIUM || "",
      "book-large": env.STRIPE_PRICE_BOOK_LARGE || "",
    },
  };
}
