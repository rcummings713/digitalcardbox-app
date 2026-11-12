import {
  createDesign,
  cardDesignWithNote,
} from "../../src/modules/design/contracts.ts";
import test from "node:test";
import assert from "node:assert/strict";
import { setup, invitation, card, Agent } from "./helpers.mjs";
import { stripeFixture } from "./billing-fixture.mjs";
async function ready(t) {
  const stripe = stripeFixture(),
    f = await setup(t, {
      billingOptions: { ...stripe.options, fetcher: stripe.fetcher },
    }),
    inv = await invitation(f);
  const path = inv.path + "/card-drafts",
    billing = inv.path + "/billing";
  const payload = {
    ...card("premium-draft-reference"),
    premiumEdition: "celestial",
  };
  const saved = await f.guest.call(path, "POST", payload);
  assert.equal(saved.status, 201, JSON.stringify(saved.data));
  return {
    ...f,
    ...inv,
    stripe,
    path,
    billing,
    payload,
    id: saved.data.entry.id,
  };
}
async function pay(f) {
  const q = await f.guest.call(f.billing + "/quotes", "POST", {
    product: "premium-card",
    cardId: f.id,
    requestKey: "premium-checkout-reference",
  });
  assert.equal(q.status, 201);
  const c = await f.guest.call(
    f.billing + "/orders/" + q.data.order.id + "/checkout",
    "POST",
    {},
  );
  assert.equal(c.status, 200);
  const session = f.stripe.pay();
  assert.equal(
    (await f.stripe.webhook(f.base, "checkout.session.completed", session))
      .status,
    200,
  );
  return { session, order: q.data.order };
}
test("premium drafts stay private and cannot bypass payment through the free submission endpoint", async (t) => {
  const f = await ready(t),
    before = (await f.host.call("/api/host/workspace")).data.entries;
  assert.ok(!before.some((e) => e.id === f.id));
  assert.ok(!f.repo.bookCards(f.event.id).some((e) => e.id === f.id));
  assert.equal(
    (await f.host.call("/api/host/cards/" + f.id, "PATCH", { action: "hide" }))
      .status,
    404,
  );
  assert.equal(
    (await f.guest.call(f.path + "/" + f.id + "/send", "POST", {})).status,
    402,
  );
  const { premiumEdition, ...original } = f.payload;
  assert.equal(
    (
      await f.guest.call(
        f.path.replace("/card-drafts", "/cards"),
        "POST",
        original,
      )
    ).status,
    409,
  );
  const stranger = new Agent(f.base);
  await stranger.call(f.path.replace("/card-drafts", ""));
  assert.equal(
    (await stranger.call(f.path + "/" + f.id + "/send", "POST", {})).status,
    404,
  );
  assert.equal(
    (
      await f.guest.call(f.path, "POST", {
        ...f.payload,
        premiumEdition: "unknown",
      })
    ).status,
    422,
  );
  const edited = await f.guest.call(f.path, "POST", {
    ...f.payload,
    note: "Our final carefully edited note.",
    premiumEdition: "pearl",
  });
  assert.equal(edited.status, 201);
  assert.equal(edited.data.entry.id, f.id);
  assert.equal(
    f.repo.guestCard(
      f.event.id,
      f.repo.one("SELECT guest_id FROM cards WHERE id=?", f.id).guest_id,
      f.id,
    ).delivery_state,
    "draft",
  );
});
test("verified payment enables an explicit idempotent Send; refunds preserve delivered words and remove premium access", async (t) => {
  const f = await ready(t);
  const { session } = await pay(f);
  assert.equal(
    (await f.guest.call(f.billing + "/access/" + f.id)).data.active,
    true,
  );
  assert.ok(
    !(await f.host.call("/api/host/workspace")).data.entries.some(
      (e) => e.id === f.id,
    ),
  );
  const sent = await f.guest.call(f.path + "/" + f.id + "/send", "POST", {});
  assert.equal(sent.status, 201);
  assert.equal(
    (await f.guest.call(f.path + "/" + f.id + "/send", "POST", {})).status,
    200,
  );
  const entry = (await f.host.call("/api/host/workspace")).data.entries.find(
    (e) => e.id === f.id,
  );
  assert.equal(entry.premium, true);
  assert.equal(entry.premiumEdition, "celestial");
  assert.equal(entry.note, f.payload.note);
  assert.ok(f.repo.bookCards(f.event.id).some((e) => e.id === f.id));
  const refund = {
    id: "re_draft_full",
    livemode: false,
    payment_intent: session.payment_intent,
    amount: 499,
    currency: "usd",
    status: "succeeded",
  };
  f.stripe.refunds.set(refund.id, refund);
  assert.equal(
    (await f.stripe.webhook(f.base, "refund.created", refund)).status,
    200,
  );
  const after = (await f.host.call("/api/host/workspace")).data.entries.find(
    (e) => e.id === f.id,
  );
  assert.equal(after.premium, false);
  assert.equal(after.note, f.payload.note);
  assert.equal(
    (
      await f.guest.call(f.path, "POST", {
        ...f.payload,
        note: "Cannot edit a delivered card.",
      })
    ).status,
    409,
  );
});
test("paid drafts remain subject to closure, revocation, CSRF and refund checks at Send", async (t) => {
  const f = await ready(t);
  const { session } = await pay(f);
  assert.equal(
    (
      await f.guest.call(
        f.path + "/" + f.id + "/send",
        "POST",
        {},
        { "x-csrf-token": "wrong" },
      )
    ).status,
    403,
  );
  f.repo.run("UPDATE events SET status='paused' WHERE id=?", f.event.id);
  assert.equal(
    (await f.guest.call(f.path + "/" + f.id + "/send", "POST", {})).status,
    409,
  );
  f.repo.run("UPDATE events SET status='published' WHERE id=?", f.event.id);
  const refund = {
    id: "re_unsent_full",
    livemode: false,
    payment_intent: session.payment_intent,
    amount: 499,
    currency: "usd",
    status: "succeeded",
  };
  f.stripe.refunds.set(refund.id, refund);
  await f.stripe.webhook(f.base, "refund.created", refund);
  assert.equal(
    (await f.guest.call(f.path + "/" + f.id + "/send", "POST", {})).status,
    402,
  );
  assert.ok(
    !(await f.host.call("/api/host/workspace")).data.entries.some(
      (e) => e.id === f.id,
    ),
  );
  f.repo.rotateLink(f.event.id);
  assert.equal(
    (await f.guest.call(f.path + "/" + f.id + "/send", "POST", {})).status,
    404,
  );
});

test("a public premium design is selection intent and cannot bypass checkout through free delivery", async (t) => {
  const f = await ready(t);
  const doc = {
    ...cardDesignWithNote(
      createDesign("card", "Wedding", "botanical"),
      "A private premium note.",
    ),
    premiumEdition: "celestial",
  };
  const response = await f.guest.call(
    f.path.replace("/card-drafts", "/cards"),
    "POST",
    {
      ...card("cannot-bypass-premium-intent"),
      style: "botanical",
      gif: null,
      note: "A private premium note.",
      design: doc,
    },
  );
  assert.equal(response.status, 402);
});
