import test from "node:test";
import assert from "node:assert/strict";
import { setup, invitation, card } from "./helpers.mjs";
import { stripeFixture } from "./billing-fixture.mjs";
import { SqliteReviewRepository } from "../adapters/sqlite.mjs";
import { BillingService } from "../billing-service.mjs";

test("migration 007 preserves version-6 accepted cards, paid purchases, destinations and the existing encryption key", async (t) => {
  const stripe = stripeFixture(),
    f = await setup(t, {
      billingOptions: { ...stripe.options, fetcher: stripe.fetcher },
    }),
    inv = await invitation(f);
  const sent = await f.guest.call(
    inv.path + "/cards",
    "POST",
    card("legacy-paid-card-reference"),
  );
  const id = sent.data.entry.id;
  const quote = await f.guest.call(inv.path + "/billing/quotes", "POST", {
    product: "premium-card",
    cardId: id,
    requestKey: "legacy-paid-order-reference",
  });
  await f.guest.call(
    inv.path + "/billing/orders/" + quote.data.order.id + "/checkout",
    "POST",
    {},
  );
  assert.equal(
    (await stripe.webhook(f.base, "checkout.session.completed", stripe.pay()))
      .status,
    200,
  );
  const before = {
    cards: f.repo.all(
      "SELECT id,event_id,guest_id,note,request_key,created_at FROM cards ORDER BY id",
    ),
    orders: f.repo.all("SELECT * FROM billing_orders ORDER BY id"),
    entitlements: f.repo.all("SELECT * FROM billing_entitlements ORDER BY id"),
    destinations: f.repo.all(
      "SELECT * FROM gift_destinations ORDER BY event_id,service",
    ),
    key: Buffer.from(f.repo.key),
  };
  f.repo.db.exec(
    "DROP TABLE auth_flows;DROP TABLE auth_sessions;DROP TABLE auth_subjects;DROP INDEX cards_delivery;ALTER TABLE cards DROP COLUMN premium_edition;ALTER TABLE cards DROP COLUMN delivery_state;DELETE FROM review_schema_versions WHERE version=7;",
  );
  for (let run = 0; run < 2; run++) {
    const reopened = new SqliteReviewRepository(f.path, { seed: false });
    try {
      assert.equal(
        reopened.one("SELECT max(version) AS n FROM review_schema_versions").n,
        7,
      );
      assert.deepEqual(
        reopened.all(
          "SELECT id,event_id,guest_id,note,request_key,created_at FROM cards ORDER BY id",
        ),
        before.cards,
      );
      assert.deepEqual(
        reopened.all("SELECT * FROM billing_orders ORDER BY id"),
        before.orders,
      );
      assert.deepEqual(
        reopened.all("SELECT * FROM billing_entitlements ORDER BY id"),
        before.entitlements,
      );
      assert.deepEqual(
        reopened.all(
          "SELECT * FROM gift_destinations ORDER BY event_id,service",
        ),
        before.destinations,
      );
      assert.deepEqual(reopened.key, before.key);
      assert.equal(
        reopened.one("SELECT delivery_state FROM cards WHERE id=?", id)
          .delivery_state,
        "delivered",
      );
      assert.equal(new BillingService(reopened).premiumCardStatus(id), true);
      assert.deepEqual(reopened.all("PRAGMA foreign_key_check"), []);
    } finally {
      reopened.close();
    }
  }
});
