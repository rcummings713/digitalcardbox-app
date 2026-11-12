import test from "node:test";
import assert from "node:assert/strict";
import { StripeProvider } from "../stripe-provider.mjs";
import { BillingService } from "../billing-service.mjs";
import { setup, invitation, card, Agent } from "./helpers.mjs";
import { stripeFixture } from "./billing-fixture.mjs";
import { SqliteReviewRepository } from "../adapters/sqlite.mjs";
async function ready(t, overrides = {}) {
  const stripe = stripeFixture();
  const f = await setup(t, {
    billingOptions: {
      ...stripe.options,
      fetcher: stripe.fetcher,
      ...overrides,
    },
  });
  const inv = await invitation(f);
  const sent = await f.guest.call(inv.path + "/cards", "POST", card());
  assert.equal(sent.status, 201);
  return {
    ...f,
    ...inv,
    dbPath: f.path,
    stripe,
    cardId: sent.data.entry.id,
    billingPath: inv.path + "/billing",
  };
}
async function quote(f, key = "purchase-reference-1") {
  const result = await f.guest.call(f.billingPath + "/quotes", "POST", {
    product: "premium-card",
    cardId: f.cardId,
    requestKey: key,
  });
  assert.equal(result.status, 201, JSON.stringify(result.data));
  return result.data.order;
}
async function checkout(f, order) {
  const value = await f.guest.call(
    f.billingPath + "/orders/" + order.id + "/checkout",
    "POST",
    {},
  );
  assert.equal(value.status, 200, JSON.stringify(value.data));
  return value;
}
test("test-only checkout is unavailable without private setup or with live keys; free submission still works", async (t) => {
  for (const options of [{}, { secretKey: "sk_live_not_allowed" }]) {
    const f = await ready(t, {
      ...options,
      ...(Object.keys(options).length ? {} : { secretKey: "" }),
    });
    const result = await f.guest.call(f.billingPath + "/quotes", "POST", {
      product: "premium-card",
      cardId: f.cardId,
      requestKey: "setup-unavailable-1",
    });
    assert.equal(result.status, 503);
    assert.equal(f.stripe.calls.length, 0);
    assert.ok(f.repo.one("SELECT id FROM cards WHERE id=?", f.cardId));
  }
});
test("buyer scope, CSRF, server prices, immutable references and provider-only destinations protect checkout", async (t) => {
  const f = await ready(t);
  assert.equal(
    (
      await f.guest.call(
        f.billingPath + "/quotes",
        "POST",
        {},
        { origin: "https://evil.invalid" },
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await f.guest.call(
        f.billingPath + "/quotes",
        "POST",
        {},
        { "x-csrf-token": "wrong" },
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await f.guest.call(f.billingPath + "/quotes", "POST", {
        product: "premium-card",
        cardId: f.cardId,
        requestKey: "tamper-price-1",
        amount: 1,
      })
    ).status,
    422,
  );
  const other = new Agent(f.base);
  await other.call(f.path);
  assert.equal(
    (
      await other.call(f.billingPath + "/quotes", "POST", {
        product: "premium-card",
        cardId: f.cardId,
        requestKey: "another-guest-1",
      })
    ).status,
    409,
  );
  const order = await quote(f);
  assert.equal(order.amountMinor, 499);
  assert.equal(
    (await other.call(f.billingPath + "/orders/" + order.id)).status,
    404,
  );
  assert.equal(
    (await f.host.call("/api/billing/orders/" + order.id)).status,
    404,
  );
  assert.equal(
    (
      await f.guest.call(f.billingPath + "/quotes", "POST", {
        product: "premium-card",
        cardId: "other",
        requestKey: "purchase-reference-1",
      })
    ).status,
    409,
  );
  const a = await checkout(f, order),
    b = await checkout(f, order);
  assert.equal(a.data.url, b.data.url);
  assert.equal(f.stripe.sessions.size, 1);
  const body = f.stripe.calls.find((call) => call.method === "POST").body;
  assert.ok(!body.includes(f.event.token));
  assert.ok(!body.includes(encodeURIComponent(card().note)));
  assert.equal(
    f.repo.one("SELECT count(*) AS n FROM billing_payment_attempts").n,
    1,
  );
  assert.equal(
    (await f.guest.call(f.billingPath + "/access/" + f.cardId)).data.active,
    false,
  );
});
test("return-page polling cannot claim payment; verified Stripe payment grants once and survives repository reopen", async (t) => {
  const f = await ready(t);
  const order = await quote(f);
  await checkout(f, order);
  const before = await f.guest.call(f.billingPath + "/orders/" + order.id);
  assert.equal(before.data.order.entitled, false);
  assert.equal(
    (
      await f.stripe.webhook(
        f.base,
        "checkout.session.completed",
        [...f.stripe.sessions.values()][0],
      )
    ).status,
    200,
  );
  assert.equal(
    f.repo.one("SELECT count(*) AS n FROM billing_entitlements").n,
    0,
  );
  const session = f.stripe.pay();
  assert.equal(
    (
      await f.stripe.webhook(f.base, "checkout.session.completed", session, {
        id: "evt_paid_repeat",
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await f.stripe.webhook(f.base, "checkout.session.completed", session, {
        id: "evt_paid_repeat",
      })
    ).data.repeated,
    true,
  );
  assert.equal(
    (await f.guest.call(f.billingPath + "/orders/" + order.id)).data.order
      .entitled,
    true,
  );
  assert.equal(
    (await f.guest.call(f.billingPath + "/access/" + f.cardId)).data.card
      .premium,
    true,
  );
  assert.equal(
    f.repo.one("SELECT count(*) AS n FROM billing_entitlements").n,
    1,
  );
  const repo = new SqliteReviewRepository(f.dbPath);
  const billing = new BillingService(repo);
  assert.ok(billing.records.entitlement("premium-card", f.cardId));
  repo.close();
  assert.equal(f.repo.one("SELECT count(*) AS n FROM gift_intents").n, 0);
});
test("forged/stale/live events and price mismatches cannot unlock a product", async (t) => {
  const f = await ready(t);
  const order = await quote(f);
  await checkout(f, order);
  const session = f.stripe.pay();
  assert.equal(
    (
      await f.stripe.webhook(f.base, "checkout.session.completed", session, {
        secret: "wrong",
        id: "evt_forged",
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await f.stripe.webhook(f.base, "checkout.session.completed", session, {
        stamp: 1_000_000_000,
        id: "evt_stale",
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await f.stripe.webhook(f.base, "checkout.session.completed", session, {
        live: true,
        id: "evt_live",
      })
    ).status,
    400,
  );
  session.amount_total = 1;
  assert.equal(
    (
      await f.stripe.webhook(f.base, "checkout.session.completed", session, {
        id: "evt_wrong_price",
      })
    ).status,
    409,
  );
  assert.equal(
    f.repo.one("SELECT count(*) AS n FROM billing_entitlements").n,
    0,
  );
  assert.equal(
    f.repo.one(
      "SELECT count(*) AS n FROM billing_provider_events WHERE provider_event_id='evt_wrong_price'",
    ).n,
    0,
  );
});
test("successful partial/full refunds and disputes retain history, revoke only the paid upgrade, and ignore late payment replay", async (t) => {
  const f = await ready(t);
  const order = await quote(f);
  await checkout(f, order);
  const session = f.stripe.pay();
  await f.stripe.webhook(f.base, "checkout.session.completed", session);
  const r = {
    id: "re_first",
    payment_intent: session.payment_intent,
    livemode: false,
    currency: "usd",
    amount: 200,
    status: "pending",
  };
  f.stripe.refunds.set(r.id, r);
  await f.stripe.webhook(f.base, "refund.created", r);
  assert.equal(
    (await f.guest.call(f.billingPath + "/orders/" + order.id)).data.order
      .refundedMinor,
    0,
  );
  r.status = "succeeded";
  await f.stripe.webhook(f.base, "refund.updated", r);
  assert.equal(
    (await f.guest.call(f.billingPath + "/orders/" + order.id)).data.order
      .entitled,
    true,
  );
  const full = { ...r, id: "re_rest", amount: 299 };
  f.stripe.refunds.set(full.id, full);
  await f.stripe.webhook(f.base, "refund.created", full);
  await f.stripe.webhook(f.base, "refund.updated", full);
  await f.stripe.webhook(f.base, "checkout.session.completed", session);
  const final = (await f.guest.call(f.billingPath + "/orders/" + order.id)).data
    .order;
  assert.equal(final.status, "refunded");
  assert.equal(final.entitled, false);
  assert.equal(final.refundedMinor, 499);
  assert.equal(
    f.repo.one("SELECT note FROM cards WHERE id=?", f.cardId).note,
    card().note,
  );
  assert.equal(f.repo.one("SELECT count(*) AS n FROM billing_refunds").n, 2);
});
test("books quote frozen eligible membership, never client prices; finalization, cross-event constraints and current moderation protect paid downloads", async (t) => {
  const f = await ready(t, { allowEarlyBooks: true });
  const input = {
    product: "event-book",
    eventId: f.event.id,
    requestKey: "book-order-1",
  };
  assert.equal(
    (await f.host.call("/api/billing/quotes", "POST", input)).status,
    409,
  );
  const order = (
    await f.host.call("/api/billing/quotes", "POST", {
      ...input,
      preview: true,
    })
  ).data.order;
  assert.equal(order.amountMinor, 1500);
  assert.equal(
    order.snapshot.included_count,
    f.repo.bookCards(f.event.id).length,
  );
  assert.equal(
    (await f.other.call("/api/billing/orders/" + order.id)).status,
    401,
  );
  await f.host.call(
    "/api/billing/orders/" + order.id + "/checkout",
    "POST",
    {},
  );
  await f.stripe.webhook(f.base, "checkout.session.completed", f.stripe.pay());
  const before = await f.host.call("/api/billing/orders/" + order.id + "/book");
  assert.equal(before.status, 200);
  await f.guest.call(f.path + "/cards", "POST", card("later-card-reference"));
  assert.equal(
    (await f.host.call("/api/billing/orders/" + order.id + "/book")).data
      .entries.length,
    before.data.entries.length,
  );
  await f.host.call("/api/host/cards/" + f.cardId, "PATCH", { action: "hide" });
  assert.ok(
    !(
      await f.host.call("/api/billing/orders/" + order.id + "/book")
    ).data.entries.some((entry) => entry.id === f.cardId),
  );
  assert.equal(
    f.repo.one(
      "SELECT included_count FROM book_snapshots WHERE id=(SELECT snapshot_id FROM billing_order_items WHERE order_id=?)",
      order.id,
    ).included_count,
    order.snapshot.included_count,
  );
  assert.deepEqual(f.repo.all("PRAGMA foreign_key_check"), []);
});
test("operator pause blocks new provider sessions while signed payments still settle and private billing stays operator-only", async (t) => {
  const f = await ready(t);
  const order = await quote(f);
  await checkout(f, order);
  assert.equal((await f.host.call("/api/admin/billing")).status, 403);
  await f.operator.login("operator@digitalcardbox.test");
  assert.equal(
    (await f.operator.call("/api/admin/billing", "PATCH", { enabled: false }))
      .status,
    200,
  );
  assert.equal(
    (
      await f.guest.call(
        f.billingPath + "/orders/" + order.id + "/checkout",
        "POST",
        {},
      )
    ).status,
    503,
  );
  assert.equal(
    (
      await f.stripe.webhook(
        f.base,
        "checkout.session.completed",
        f.stripe.pay(),
      )
    ).status,
    200,
  );
  assert.equal(
    (await f.guest.call(f.billingPath + "/orders/" + order.id)).data.order
      .entitled,
    true,
  );
});

test("provider creation uncertainty retries one durable attempt and Stripe idempotency key without duplicate checkout", async (t) => {
  const f = await ready(t);
  const order = await quote(f);
  const actual = f.billing.provider.fetcher;
  let loseResponse = true;
  f.billing.provider.fetcher = async (url, init) => {
    const response = await actual(url, init);
    if (init.method === "POST" && loseResponse) {
      loseResponse = false;
      throw new Error("response lost after provider commit");
    }
    return response;
  };
  const failed = await f.guest.call(
    f.billingPath + "/orders/" + order.id + "/checkout",
    "POST",
    {},
  );
  assert.equal(failed.status, 503);
  assert.equal(f.stripe.sessions.size, 1);
  await checkout(f, order);
  assert.equal(f.stripe.sessions.size, 1);
  assert.equal(
    f.repo.one("SELECT count(*) AS n FROM billing_payment_attempts").n,
    1,
  );
  const ids = [...f.stripe.sessions.values()];
  assert.ok(ids[0].retryKey.startsWith("dcb-checkout-"));
});
test("server retrieval recovers a missed webhook; expired sessions retry with a new bounded attempt", async (t) => {
  const f = await ready(t);
  const order = await quote(f);
  await checkout(f, order);
  const session = [...f.stripe.sessions.values()][0];
  session.status = "expired";
  const expired = await f.guest.call(f.billingPath + "/orders/" + order.id);
  assert.equal(expired.data.order.status, "expired");
  await checkout(f, order);
  assert.equal(f.stripe.sessions.size, 2);
  await f.stripe.webhook(f.base, "checkout.session.expired", session);
  assert.equal(
    (await f.guest.call(f.billingPath + "/orders/" + order.id)).data.order
      .status,
    "pending",
  );
  const current = [...f.stripe.sessions.keys()][1];
  f.stripe.pay(current);
  const result = await f.guest.call(f.billingPath + "/orders/" + order.id);
  assert.equal(result.data.order.entitled, true);
  assert.equal(
    f.repo.one(
      "SELECT count(*) AS n FROM billing_provider_events WHERE type='checkout.session.completed'",
    ).n,
    0,
  );
});
test("refund before the paid webhook and dispute both prevent a late paid event from restoring access", async (t) => {
  for (const resource of ["refund", "dispute"]) {
    const f = await ready(t);
    const order = await quote(f);
    await checkout(f, order);
    const session = f.stripe.pay();
    const state = {
      id: resource === "refund" ? "re_early" : "dp_early",
      payment_intent: session.payment_intent,
      livemode: false,
      currency: "usd",
      amount: 499,
      status: "succeeded",
    };
    (resource === "refund" ? f.stripe.refunds : f.stripe.disputes).set(
      state.id,
      state,
    );
    assert.equal(
      (
        await f.stripe.webhook(
          f.base,
          resource === "refund" ? "refund.created" : "charge.dispute.created",
          state,
        )
      ).status,
      200,
    );
    await f.stripe.webhook(f.base, "checkout.session.completed", session);
    const final = (await f.guest.call(f.billingPath + "/orders/" + order.id))
      .data.order;
    assert.equal(final.entitled, false);
    assert.equal(final.status, resource === "refund" ? "refunded" : "disputed");
  }
});
test("server book tiers use 99/100/299/300 eligible cards with stable priced membership", async (t) => {
  for (const [count, amount] of [
    [99, 1500],
    [100, 3000],
    [299, 3000],
    [300, 7900],
  ]) {
    const f = await ready(t, { allowEarlyBooks: true });
    const initial = f.repo.bookCards(f.event.id).length;
    f.repo.transaction(() => {
      for (let i = initial; i < count; i++)
        f.repo.run(
          `INSERT INTO cards(id,event_id,guest_id,request_key,name,note,style,gif,consent,created_at)
        SELECT ?,event_id,guest_id,?,name,note,style,gif,consent,created_at FROM cards WHERE id=?`,
          "tier-card-" + i,
          "tier-reference-" + i,
          f.cardId,
        );
    });
    const result = await f.host.call("/api/billing/quotes", "POST", {
      product: "event-book",
      eventId: f.event.id,
      requestKey: "tier-test-order",
      preview: true,
    });
    assert.equal(result.status, 201);
    assert.equal(result.data.order.amountMinor, amount);
    assert.equal(result.data.order.snapshot.included_count, count);
    const again = await f.host.call("/api/billing/quotes", "POST", {
      product: "event-book",
      eventId: f.event.id,
      requestKey: "tier-second-order",
      preview: true,
    });
    assert.equal(again.data.order.id, result.data.order.id);
  }
});
test("parallel duplicate events grant exactly once and a wrong configured provider price fails closed", async (t) => {
  const f = await ready(t);
  const order = await quote(f);
  await checkout(f, order);
  const session = f.stripe.pay();
  const responses = await Promise.all(
    Array.from({ length: 4 }, () =>
      f.stripe.webhook(f.base, "checkout.session.completed", session, {
        id: "evt_parallel_one",
      }),
    ),
  );
  assert.ok(responses.every((r) => r.status === 200));
  assert.equal(
    f.repo.one("SELECT count(*) AS n FROM billing_provider_events").n,
    1,
  );
  assert.equal(
    f.repo.one("SELECT count(*) AS n FROM billing_entitlements").n,
    1,
  );
  const other = await ready(t);
  const bad = await quote(other);
  const actual = other.billing.provider.fetcher;
  other.billing.provider.fetcher = async (url, init) =>
    url.includes("/prices/")
      ? Response.json({
          id: "price_card_test",
          active: true,
          livemode: false,
          currency: "usd",
          unit_amount: 1,
          recurring: null,
        })
      : actual(url, init);
  assert.equal(
    (
      await other.guest.call(
        other.billingPath + "/orders/" + bad.id + "/checkout",
        "POST",
        {},
      )
    ).status,
    503,
  );
  assert.equal(other.stripe.sessions.size, 0);
});

test("unmapped refund during uncertain creation retries instead of permanently acknowledging lost reconciliation", async (t) => {
  const f = await ready(t);
  const order = await quote(f);
  const actual = f.billing.provider.fetcher;
  f.billing.provider.fetcher = async (url, init) => {
    const response = await actual(url, init);
    if (init.method === "POST") throw new Error("lost response");
    return response;
  };
  assert.equal(
    (
      await f.guest.call(
        f.billingPath + "/orders/" + order.id + "/checkout",
        "POST",
        {},
      )
    ).status,
    503,
  );
  const session = f.stripe.pay();
  const refund = {
    id: "re_uncertain",
    payment_intent: session.payment_intent,
    livemode: false,
    currency: "usd",
    amount: 499,
    status: "succeeded",
  };
  f.stripe.refunds.set(refund.id, refund);
  assert.equal(
    (
      await f.stripe.webhook(f.base, "refund.created", refund, {
        id: "evt_retry_refund",
      })
    ).status,
    503,
  );
  assert.equal(
    f.repo.one("SELECT count(*) AS n FROM billing_provider_events").n,
    0,
  );
  f.billing.provider.fetcher = actual;
  await checkout(f, order);
  assert.equal(
    (
      await f.stripe.webhook(f.base, "refund.created", refund, {
        id: "evt_retry_refund",
      })
    ).status,
    200,
  );
  await f.stripe.webhook(f.base, "checkout.session.completed", session);
  assert.equal(
    (await f.guest.call(f.billingPath + "/orders/" + order.id)).data.order
      .entitled,
    false,
  );
});
test("expired contribution windows block new premium purchases and stale creating attempts require review", async (t) => {
  const f = await ready(t);
  const order = await quote(f);
  f.repo.run("UPDATE events SET date='2025-01-01' WHERE id=?", f.event.id);
  assert.equal(
    (
      await f.guest.call(
        f.billingPath + "/orders/" + order.id + "/checkout",
        "POST",
        {},
      )
    ).status,
    409,
  );
  const other = await ready(t);
  const second = await quote(other);
  other.billing.records.newAttempt(second.id);
  other.repo.run(
    "UPDATE billing_payment_attempts SET created_at='2026-10-16T00:00:00Z' WHERE order_id=?",
    second.id,
  );
  assert.equal(
    (
      await other.guest.call(
        other.billingPath + "/orders/" + second.id + "/checkout",
        "POST",
        {},
      )
    ).status,
    409,
  );
  assert.equal(other.stripe.sessions.size, 0);
});

test("operator setup inspection verifies all four Stripe prices and endpoint settings without creating payments or revealing keys", async (t) => {
  const f = await ready(t);
  assert.equal((await f.other.call("/api/admin/billing/check")).status, 401);
  await f.host.login();
  assert.equal((await f.host.call("/api/admin/billing/check")).status, 403);
  assert.equal(f.stripe.calls.length, 0);
  await f.operator.login("operator@digitalcardbox.test");
  const result = await f.operator.call("/api/admin/billing/check");
  assert.equal(result.status, 200);
  assert.equal(result.data.pricingVerified, true);
  assert.equal(result.data.webhook.settingsVerified, true);
  assert.equal(result.data.webhookDeliveryVerified, false);
  assert.equal(result.data.completedTestPaymentCount, 0);
  assert.deepEqual(
    result.data.prices.map((p) => p.actualMinor),
    [499, 1500, 3000, 7900],
  );
  assert.ok(f.stripe.calls.every((c) => c.method === "GET"));
  assert.equal(f.stripe.sessions.size, 0);
  assert.ok(!JSON.stringify(result.data).includes("sk_test_"));
  assert.ok(!JSON.stringify(result.data).includes("whsec_"));
});
test("setup inspection flags incorrect amount/currency/recurrence/mode and wrong endpoint selection", async (t) => {
  const f = await ready(t);
  await f.operator.login("operator@digitalcardbox.test");
  const actual = f.billing.provider.fetcher;
  for (const delta of [
    { unit_amount: 1 },
    { currency: "eur" },
    { recurring: { interval: "month" }, type: "recurring" },
    { livemode: true },
    { active: false },
  ]) {
    f.billing.provider.fetcher = async (url, init) => {
      const response = await actual(url, init);
      return url.includes("/prices/")
        ? Response.json({ ...(await response.json()), ...delta })
        : response;
    };
    const value = (await f.operator.call("/api/admin/billing/check")).data;
    assert.equal(value.pricingVerified, false);
    assert.ok(value.prices.every((p) => !p.verified));
  }
  f.billing.provider.fetcher = actual;
  f.stripe.webhooks[0].enabled_events = ["checkout.session.completed"];
  let value = (await f.operator.call("/api/admin/billing/check")).data;
  assert.equal(value.webhook.settingsVerified, false);
  assert.equal(value.webhook.missingEvents.length, 7);
  f.stripe.webhooks[0].url =
    "https://different.invalid/api/billing/stripe/webhook";
  value = (await f.operator.call("/api/admin/billing/check")).data;
  assert.equal(value.webhook.status, "missing");
  assert.equal(f.stripe.sessions.size, 0);
});
test("setup inspection keeps delivery proof separate and reports unavailable provider permissions honestly", async (t) => {
  const f = await ready(t);
  await f.operator.login("operator@digitalcardbox.test");
  const actual = f.billing.provider.fetcher;
  f.billing.provider.fetcher = async (url, init) =>
    url.includes("/webhook_endpoints")
      ? Response.json({}, { status: 403 })
      : actual(url, init);
  let value = (await f.operator.call("/api/admin/billing/check")).data;
  assert.equal(value.pricingVerified, true);
  assert.equal(value.webhook.status, "unverified");
  assert.equal(value.webhookDeliveryVerified, false);
  f.billing.provider.fetcher = actual;
  const order = await quote(f);
  await checkout(f, order);
  const event = [...f.stripe.sessions.values()][0];
  event.status = "expired";
  assert.equal(
    (await f.stripe.webhook(f.base, "checkout.session.expired", event)).status,
    200,
  );
  value = (await f.operator.call("/api/admin/billing/check")).data;
  assert.equal(value.webhookDeliveryVerified, true);
  assert.equal(value.latestVerifiedWebhook.type, "checkout.session.expired");
  assert.equal(value.completedTestPaymentCount, 0);
});

test("operator inspection reports safe Stripe access categories with redacted operator hints", async (t) => {
  const f = await ready(t);
  await f.operator.login("operator@digitalcardbox.test");
  for (const [status, message, reason] of [
    [
      401,
      "Invalid API Key provided: sk_test_PRIVATE",
      "stripe_authentication_failed",
    ],
    [403, "Not permitted sk_test_PRIVATE", "stripe_permission_denied"],
    [
      404,
      "Missing price for customer@example.invalid",
      "stripe_resource_missing",
    ],
    [
      400,
      "Invalid Stripe API version: invalid-version",
      "stripe_api_version_unsupported",
    ],
  ]) {
    f.billing.provider.fetcher = async () =>
      Response.json({ error: { message } }, { status });
    const result = await f.operator.call("/api/admin/billing/check");
    assert.equal(result.status, 200);
    assert.ok(result.data.prices.every((p) => p.reason === reason));
    assert.equal(result.data.webhook.reason, reason);
    assert.equal(result.data.lastProviderFailure.httpStatus, status);
    assert.ok(!JSON.stringify(result.data).includes("sk_test_PRIVATE"));
    assert.ok(
      !JSON.stringify(result.data).includes("customer@example.invalid"),
    );
  }
});

test("default Stripe transport preserves the runtime global fetch receiver", async (t) => {
  const original = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = original;
  });
  let called = false;
  globalThis.fetch = function (url, options) {
    assert.equal(this, globalThis, "Runtime fetch received the wrong receiver");
    called = true;
    assert.equal(url, "https://api.stripe.com/v1/prices/price_fixture");
    assert.equal(options.method, "GET");
    return Promise.resolve(Response.json({ id: "price_fixture" }));
  };
  const provider = new StripeProvider({
    secretKey: "sk_test_receiver_fixture",
    webhookSecret: "whsec_receiver_fixture",
    returnOrigin: "https://example.com",
  });
  assert.equal(
    (await provider.api("prices/price_fixture")).id,
    "price_fixture",
  );
  assert.equal(called, true);
});

test("checkout rejection hints remain operator-only and redact credentials and emails", async (t) => {
  const f = await ready(t);
  const original = f.billing.provider.fetcher;
  const privateHint =
    "Unsupported method for sk_test_PRIVATE and whsec_PRIVATE at buyer@example.invalid";
  f.billing.provider.fetcher = async (url, init) =>
    url.endsWith("/checkout/sessions")
      ? Response.json({ error: { message: privateHint } }, { status: 400 })
      : original(url, init);
  const order = await quote(f);
  const rejected = await f.guest.call(
    f.billingPath + "/orders/" + order.id + "/checkout",
    "POST",
    {},
  );
  assert.equal(rejected.status, 503);
  assert.ok(!JSON.stringify(rejected.data).includes("Unsupported method"));
  assert.equal((await f.guest.call("/api/admin/billing/check")).status, 401);
  await f.operator.login("operator@digitalcardbox.test");
  const result = await f.operator.call("/api/admin/billing/check");
  assert.equal(result.data.lastProviderFailure.operation, "checkout/sessions");
  assert.match(result.data.lastProviderFailure.hint, /Unsupported method/);
  for (const secret of [
    "sk_test_PRIVATE",
    "whsec_PRIVATE",
    "buyer@example.invalid",
  ])
    assert.ok(!JSON.stringify(result.data).includes(secret));
  assert.equal(result.data.completedTestPaymentCount, 0);
});
