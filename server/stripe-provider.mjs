import { createHmac, timingSafeEqual } from "node:crypto";
import { fail } from "./domain/events.mjs";
export const STRIPE_VERSION = "2026-10-28.endive";
export function checkoutUrl(value) {
  try {
    const url = new URL(value);
    if (
      url.protocol === "https:" &&
      url.hostname === "checkout.stripe.com" &&
      !url.username &&
      !url.password &&
      !url.port &&
      url.pathname.startsWith("/c/pay/cs_test_") &&
      value.length <= 8192
    )
      return value;
  } catch {}
  fail(502, "Stripe did not return a valid test checkout. Please try again.");
}
export class StripeProvider {
  constructor({
    secretKey = "",
    webhookSecret = "",
    returnOrigin = "",
    fetcher = fetch,
  } = {}) {
    this.key = secretKey;
    this.webhookSecret = webhookSecret;
    this.fetcher = fetcher;
    try {
      const u = new URL(returnOrigin);
      if (
        u.origin === returnOrigin &&
        !u.username &&
        !u.password &&
        (u.protocol === "https:" ||
          (u.protocol === "http:" &&
            ["localhost", "127.0.0.1"].includes(u.hostname)))
      )
        this.origin = u.origin;
    } catch {}
  }
  get configured() {
    return (
      /^(?:sk|rk)_test_[A-Za-z0-9_]{8,}$/.test(this.key) &&
      /^whsec_[A-Za-z0-9_]{8,}$/.test(this.webhookSecret) &&
      !!this.origin
    );
  }
  async api(path, params, idempotencyKey) {
    if (!this.configured)
      fail(
        503,
        "Stripe test checkout needs its private server configuration.",
        "billing_unavailable",
      );
    let response;
    try {
      response = await this.fetcher("https://api.stripe.com/v1/" + path, {
        method: params ? "POST" : "GET",
        redirect: "error",
        headers: {
          Authorization: "Bearer " + this.key,
          "Stripe-Version": STRIPE_VERSION,
          ...(params
            ? {
                "Content-Type": "application/x-www-form-urlencoded",
                "Idempotency-Key": idempotencyKey,
              }
            : {}),
        },
        ...(params ? { body: new URLSearchParams(params).toString() } : {}),
        signal: AbortSignal.timeout(10000),
      });
    } catch {
      fail(
        503,
        "Stripe could not confirm this action. Your order is saved; check its status before retrying.",
        "stripe_unavailable",
      );
    }
    const reader = response.body.getReader();
    let total = 0;
    const chunks = [];
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        total += value.length;
        if (total > 262144) {
          await reader.cancel();
          fail(502, "Stripe returned an unexpected response.");
        }
        chunks.push(Buffer.from(value));
      }
      const value = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      if (!response.ok) {
        const versionRejected =
          typeof value.error?.message === "string" &&
          /invalid stripe api version/i.test(value.error.message);
        const code =
          response.status === 401
            ? "stripe_authentication_failed"
            : response.status === 403
              ? "stripe_permission_denied"
              : response.status === 404
                ? "stripe_resource_missing"
                : versionRejected
                  ? "stripe_api_version_unsupported"
                  : "stripe_unavailable";
        fail(
          503,
          "Stripe could not complete this action. Your order is saved; please check its status.",
          code,
        );
      }
      return value;
    } catch (error) {
      if (error.status) throw error;
      fail(502, "Stripe returned an unexpected response.");
    }
  }
  async create(order, attempt) {
    const price = await this.api("prices/" + order.price_id);
    if (
      price.id !== order.price_id ||
      price.active !== true ||
      price.livemode !== false ||
      price.currency !== "usd" ||
      price.unit_amount !== order.amount_minor ||
      price.recurring
    )
      fail(
        503,
        "The configured Stripe test price does not match this product. Ask the site owner to check setup.",
        "price_mismatch",
      );
    const result = await this.api(
      "checkout/sessions",
      {
        mode: "payment",
        "payment_method_types[0]": "card",
        "line_items[0][price]": order.price_id,
        "line_items[0][quantity]": "1",
        client_reference_id: order.id,
        "metadata[dcb_order_id]": order.id,
        "metadata[dcb_attempt_id]": attempt.id,
        "payment_intent_data[metadata][dcb_order_id]": order.id,
        "payment_intent_data[metadata][dcb_attempt_id]": attempt.id,
        success_url: this.origin + "/checkout/return?order=" + order.id,
        cancel_url:
          this.origin + "/checkout/return?order=" + order.id + "&canceled=1",
      },
      "dcb-checkout-" + attempt.id,
    );
    if (!/^cs_test_[A-Za-z0-9_]+$/.test(result.id) || result.livemode !== false)
      fail(502, "Only Stripe test checkouts are supported here.");
    checkoutUrl(result.url);
    if (new URL(result.url).pathname !== "/c/pay/" + result.id)
      fail(502, "Stripe returned a mismatched checkout link.");
    return result;
  }
  session(id) {
    if (!/^cs_test_[A-Za-z0-9_]{5,240}$/.test(id))
      fail(422, "Invalid checkout reference.");
    return this.api("checkout/sessions/" + id + "?expand%5B%5D=line_items");
  }
  verify(raw, header, now = Date.now()) {
    if (!this.configured) fail(503, "Stripe webhook is not configured.");
    if (typeof header !== "string" || header.length > 2000)
      fail(400, "Invalid Stripe signature.");
    const fields = header.split(",").map((part) => part.trim().split("="));
    const times = fields.filter(([key]) => key === "t").map(([, v]) => v);
    const signatures = fields.filter(([key]) => key === "v1").map(([, v]) => v);
    if (
      times.length !== 1 ||
      !/^\d{10}$/.test(times[0]) ||
      Math.abs(now / 1000 - Number(times[0])) > 300 ||
      signatures.length < 1 ||
      signatures.length > 8
    )
      fail(400, "Invalid Stripe signature.");
    const digest = createHmac("sha256", this.webhookSecret)
      .update(times[0] + ".")
      .update(raw)
      .digest();
    if (
      !signatures.some(
        (s) =>
          /^[a-f0-9]{64}$/.test(s) &&
          timingSafeEqual(digest, Buffer.from(s, "hex")),
      )
    )
      fail(400, "Invalid Stripe signature.");
    let event;
    try {
      event = JSON.parse(raw.toString("utf8"));
    } catch {
      fail(400, "Invalid Stripe event.");
    }
    if (
      event.livemode !== false ||
      !/^evt_[A-Za-z0-9_]{3,240}$/.test(event.id) ||
      typeof event.type !== "string" ||
      event.type.length > 100 ||
      !event.data?.object
    )
      fail(400, "Only valid Stripe test events are accepted.");
    return event;
  }
}
