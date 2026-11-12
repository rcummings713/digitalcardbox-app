import { inspectStripeSetup } from "./billing-setup.mjs";
import { randomUUID } from "node:crypto";
import { BillingRepository } from "./billing-repository.mjs";
import { StripeProvider } from "./stripe-provider.mjs";
import { fail, keys, windowFor } from "./domain/events.mjs";
import { hash } from "./domain/identity.mjs";
import { consume } from "./media-service.mjs";
const prices = {
  "premium-card": 499,
  "book-small": 1500,
  "book-medium": 3000,
  "book-large": 7900,
};
const priceKey = (count) =>
  count < 100 ? "book-small" : count < 300 ? "book-medium" : "book-large";
const supportedEvents = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "checkout.session.expired",
  "refund.created",
  "refund.updated",
  "refund.failed",
  "charge.dispute.created",
]);
export class BillingService {
  constructor(
    repository,
    {
      enabled = false,
      priceIds = {},
      allowEarlyBooks = false,
      ...providerOptions
    } = {},
  ) {
    this.repo = repository;
    this.records = new BillingRepository(repository);
    this.provider = new StripeProvider(providerOptions);
    this.enabled = enabled;
    this.priceIds = priceIds;
    this.allowEarlyBooks = allowEarlyBooks;
  }
  premiumCardStatus(id) {
    return !!this.records.entitlement("premium-card", id);
  }
  get available() {
    return (
      this.enabled &&
      this.provider.configured &&
      this.repo.one(
        "SELECT value FROM runtime_settings WHERE key='billing_enabled'",
      )?.value === "1"
    );
  }
  configuredPrice(key) {
    return /^price_[A-Za-z0-9_]{3,200}$/.test(this.priceIds[key] || "");
  }
  configuration() {
    return {
      testMode: true,
      configured: this.provider.configured,
      enabled: !!this.available,
      premiumCards: !!this.available && this.configuredPrice("premium-card"),
      eventBooks:
        !!this.available &&
        ["book-small", "book-medium", "book-large"].every((key) =>
          this.configuredPrice(key),
        ),
      earlyBookPreview: this.allowEarlyBooks,
      prices,
    };
  }
  assertAvailable(product) {
    const config = this.configuration();
    if (
      !config.enabled ||
      !(product === "premium-card" ? config.premiumCards : config.eventBooks)
    )
      fail(
        503,
        "Test checkout is not available yet. Your free cards and CardVault still work.",
        "billing_unavailable",
      );
  }
  actor(app, session, token, cookie, csrf, write = false) {
    if (token) {
      const guest = app.guestSession(token, cookie);
      if (write && (!csrf || csrf !== guest.session.csrf_token))
        fail(403, "Refresh your invitation before continuing.", "csrf_failed");
      return {
        guestId: guest.session.guest_id,
        eventId: guest.event.id,
        event: guest.event,
      };
    }
    const host = app.requireHost(session);
    if (write && (!csrf || csrf !== session.csrf_token))
      fail(403, "Refresh your workspace before continuing.", "csrf_failed");
    return { hostId: host.id };
  }
  owned(actor, id) {
    const order = this.records.order(id);
    if (
      !order ||
      (actor.hostId
        ? order.buyer_host_id !== actor.hostId
        : order.buyer_guest_id !== actor.guestId ||
          order.event_id !== actor.eventId)
    )
      fail(404, "Purchase not found.");
    return order;
  }
  validateTarget(app, session, actor, order) {
    if (order.product === "premium-card") {
      if (
        !actor.guestId ||
        !["open", "gift-only"].includes(
          windowFor(actor.event, this.repo.clock()),
        ) ||
        !this.repo.guestCard(actor.eventId, actor.guestId, order.card_id)
      )
        fail(
          409,
          "This card cannot be upgraded through this invitation right now.",
        );
    } else {
      app.ownedEvent(session, order.event_id);
      if (!this.repo.flags().books) fail(409, "Event books are paused.");
    }
  }
  quote(app, session, actor, input) {
    keys(input, ["product", "cardId", "eventId", "requestKey", "preview"]);
    if (
      !["premium-card", "event-book"].includes(input.product) ||
      !/^[a-zA-Z0-9_-]{8,80}$/.test(input.requestKey || "") ||
      (input.preview !== undefined && typeof input.preview !== "boolean")
    )
      fail(422, "Choose a valid product and purchase reference.");
    this.assertAvailable(input.product);
    const digest = hash(
      JSON.stringify([
        input.product,
        input.cardId || null,
        input.eventId || null,
        !!input.preview,
      ]),
    );
    return this.repo.transaction(() => {
      const previous = this.records.byRequest(actor, input.requestKey);
      if (previous) {
        if (previous.request_digest !== digest)
          fail(409, "This purchase reference belongs to another selection.");
        this.validateTarget(app, session, actor, previous);
        return this.view(previous);
      }
      let eventId,
        targetId,
        cardId,
        snapshotId,
        key,
        bookPreview = false;
      if (input.product === "premium-card") {
        if (
          !actor.guestId ||
          input.eventId ||
          input.preview ||
          typeof input.cardId !== "string"
        )
          fail(422, "Choose your own delivered card.");
        eventId = actor.eventId;
        targetId = cardId = input.cardId;
        key = "premium-card";
        this.validateTarget(app, session, actor, {
          product: input.product,
          card_id: cardId,
        });
      } else {
        if (!actor.hostId || input.cardId || typeof input.eventId !== "string")
          fail(422, "Choose one of your card boxes.");
        const event = app.ownedEvent(session, input.eventId);
        if (!this.repo.flags().books) fail(409, "Event books are paused.");
        const closed = ["closed", "gift-only"].includes(
          windowFor({ ...event, status: "published" }, this.repo.clock()),
        );
        if (!closed && !(input.preview && this.allowEarlyBooks))
          fail(
            409,
            "Final book checkout opens after cards close. You can keep arranging your book for free.",
            "book_not_final",
          );
        if (event.status === "draft")
          fail(409, "Publish the card box before testing its book purchase.");
        eventId = targetId = event.id;
        bookPreview = !closed;
      }
      const active = this.records.activeOrder(actor, input.product, targetId);
      if (active) return this.view(active);
      consume(
        this.repo,
        "billing:buyer:" + (actor.hostId || actor.guestId),
        this.repo.now().slice(0, 10),
        15,
      );
      consume(this.repo, "billing:all", this.repo.now().slice(0, 10), 200);
      if (input.product === "event-book") {
        const entries = app.book(session, eventId).entries;
        const snapshot = this.records.snapshot(eventId, entries, bookPreview);
        snapshotId = snapshot.id;
        key = priceKey(snapshot.included_count);
      }
      const order = this.records.create(
        actor,
        {
          eventId,
          targetId,
          product: input.product,
          cardId,
          snapshotId,
          amount: prices[key],
          priceId: this.priceIds[key],
        },
        input.requestKey,
        digest,
      );
      return this.view(order);
    });
  }
  view(order) {
    const attempt = this.records.attempt(order.id);
    const snapshot =
      order.snapshot_id &&
      this.repo.one(
        "SELECT included_count,revision,preview,cutoff_at FROM book_snapshots WHERE id=?",
        order.snapshot_id,
      );
    const entitlement = this.records.entitlement(
      order.product,
      order.target_id,
    );
    return {
      id: order.id,
      product: order.product,
      targetId: order.target_id,
      eventId: order.event_id,
      amountMinor: order.amount_minor,
      currency: order.currency,
      status: order.status,
      testMode: true,
      entitled: !!entitlement && entitlement.item_id === order.item_id,
      refundedMinor: this.records.refundTotal(order.id),
      createdAt: order.created_at,
      attemptState: attempt?.state || null,
      ...(snapshot ? { snapshot } : {}),
    };
  }
  async checkout(app, session, actor, id) {
    this.assertAvailable(this.owned(actor, id).product);
    const { order, attempt } = this.repo.transaction(() => {
      const order = this.owned(actor, id);
      this.validateTarget(app, session, actor, order);
      if (
        ["paid", "partially_refunded", "refunded", "disputed"].includes(
          order.status,
        )
      )
        fail(
          409,
          "Check the existing purchase before starting another payment.",
        );
      let attempt = this.records.attempt(id);
      if (attempt?.state === "paid")
        fail(409, "This checkout was already paid.");
      if (!attempt || ["expired", "failed"].includes(attempt.state)) {
        const count = this.repo.one(
          "SELECT count(*) AS n FROM billing_payment_attempts WHERE order_id=?",
          id,
        ).n;
        if (count >= 5)
          fail(
            429,
            "Please contact the site owner before another checkout attempt.",
          );
        attempt = this.records.newAttempt(id);
      }
      if (
        attempt.state === "creating" &&
        this.repo.clock() - new Date(attempt.created_at) > 23 * 3600000
      )
        fail(
          409,
          "This checkout needs a Stripe Dashboard review before retrying.",
          "checkout_review_required",
        );
      return { order, attempt };
    });
    if (attempt.state === "open" && attempt.checkout_ciphertext)
      return {
        order: this.view(order),
        url: this.repo.decrypt(attempt.checkout_ciphertext),
      };
    const result = await this.provider.create(order, attempt);
    return this.repo.transaction(() => {
      // No provider/network work is inside the database transaction.
      const fresh = this.owned(actor, id);
      this.repo.run(
        "UPDATE billing_payment_attempts SET provider_session_id=coalesce(provider_session_id,?),checkout_ciphertext=coalesce(checkout_ciphertext,?),state=CASE WHEN state='creating' THEN 'open' ELSE state END,updated_at=? WHERE id=?",
        result.id,
        this.repo.encrypt(result.url),
        this.repo.now(),
        attempt.id,
      );
      if (["created", "failed", "expired"].includes(fresh.status))
        this.records.status(id, "pending");
      return { order: this.view(this.records.order(id)), url: result.url };
    });
  }
  validateSession(order, attempt, value) {
    const item = value.line_items?.data?.[0];
    if (
      value.livemode !== false ||
      value.mode !== "payment" ||
      value.client_reference_id !== order.id ||
      value.metadata?.dcb_order_id !== order.id ||
      value.metadata?.dcb_attempt_id !== attempt.id ||
      (attempt.provider_session_id &&
        value.id !== attempt.provider_session_id) ||
      !/^cs_test_[A-Za-z0-9_]{5,240}$/.test(value.id || "") ||
      value.amount_total !== order.amount_minor ||
      value.currency !== order.currency ||
      value.line_items?.has_more !== false ||
      value.line_items?.data?.length !== 1 ||
      item?.quantity !== 1 ||
      item.amount_total !== order.amount_minor ||
      item.price?.id !== order.price_id ||
      (value.payment_intent &&
        !/^pi_[A-Za-z0-9_]{3,240}$/.test(value.payment_intent))
    )
      fail(
        409,
        "Stripe payment details do not match this purchase.",
        "payment_mismatch",
      );
  }
  applySession(order, attempt, value) {
    this.validateSession(order, attempt, value);
    this.repo.run(
      "UPDATE billing_payment_attempts SET provider_session_id=coalesce(provider_session_id,?),payment_intent_id=coalesce(payment_intent_id,?),updated_at=? WHERE id=?",
      value.id,
      value.payment_intent || null,
      this.repo.now(),
      attempt.id,
    );
    if (value.payment_status === "paid" && value.status === "complete") {
      this.repo.run(
        "UPDATE billing_payment_attempts SET state='paid' WHERE id=?",
        attempt.id,
      );
      const total = this.records.refundTotal(order.id);
      if (order.status === "disputed") {
        this.records.revoke(order);
        return;
      }
      if (total >= order.amount_minor) {
        this.records.status(order.id, "refunded");
        this.records.revoke(order);
      } else {
        this.records.status(order.id, total ? "partially_refunded" : "paid");
        this.records.grant(order);
      }
    } else if (
      !["paid", "partially_refunded", "refunded", "disputed"].includes(
        order.status,
      )
    ) {
      if (this.records.attempt(order.id)?.id !== attempt.id) return;
      if (value.status === "expired") {
        this.repo.run(
          "UPDATE billing_payment_attempts SET state='expired' WHERE id=? AND state<>'paid'",
          attempt.id,
        );
        this.records.status(order.id, "expired");
      } else if (order.status !== "failed")
        this.records.status(order.id, "pending");
    }
  }
  async status(actor, id, refresh = true) {
    let order = this.owned(actor, id);
    const attempt = this.records.attempt(id);
    if (
      refresh &&
      this.provider.configured &&
      attempt?.provider_session_id &&
      ["created", "pending", "failed"].includes(order.status)
    ) {
      const value = await this.provider.session(attempt.provider_session_id);
      this.repo.transaction(() =>
        this.applySession(this.records.order(id), attempt, value),
      );
      order = this.records.order(id);
    }
    return this.view(order);
  }
  async webhook(raw, signature) {
    const event = this.provider.verify(raw, signature);
    if (
      this.repo.one(
        "SELECT 1 FROM billing_provider_events WHERE provider='stripe' AND provider_event_id=?",
        event.id,
      )
    )
      return { received: true, repeated: true };
    const object = event.data.object;
    let attempt,
      order,
      value,
      refund,
      disputed = false;
    if (supportedEvents.has(event.type)) {
      if (event.type.startsWith("checkout.session.")) {
        attempt = this.records.bySession(object.id);
        if (!attempt && object.metadata?.dcb_attempt_id)
          attempt = this.repo.one(
            "SELECT * FROM billing_payment_attempts WHERE id=? AND provider_session_id IS NULL",
            object.metadata.dcb_attempt_id,
          );
        if (attempt) {
          order = this.records.order(attempt.order_id);
          value = await this.provider.session(object.id);
          this.validateSession(order, attempt, value);
        }
      } else {
        const resource =
          event.type === "charge.dispute.created" ? "disputes" : "refunds";
        if (
          !new RegExp(
            resource === "refunds"
              ? "^re_[A-Za-z0-9_]{3,240}$"
              : "^dp_[A-Za-z0-9_]{3,240}$",
          ).test(object.id || "")
        )
          fail(400, "Invalid Stripe resource.");
        const state = await this.provider.api(resource + "/" + object.id);
        const pi =
          typeof state.payment_intent === "string"
            ? state.payment_intent
            : state.payment_intent?.id;
        if (!/^pi_[A-Za-z0-9_]{3,240}$/.test(pi || ""))
          fail(400, "Invalid Stripe payment reference.");
        attempt = this.repo.one(
          "SELECT * FROM billing_payment_attempts WHERE payment_intent_id=?",
          pi,
        );
        if (!attempt) {
          const intent = await this.provider.api("payment_intents/" + pi);
          if (intent.metadata?.dcb_attempt_id)
            attempt = this.repo.one(
              "SELECT * FROM billing_payment_attempts WHERE id=?",
              intent.metadata.dcb_attempt_id,
            );
        }
        if (attempt && !attempt.provider_session_id)
          fail(
            503,
            "This checkout is still being reconciled. Retry the Stripe event.",
          );
        if (attempt?.provider_session_id) {
          order = this.records.order(attempt.order_id);
          value = await this.provider.session(attempt.provider_session_id);
          this.validateSession(order, attempt, value);
          if (
            value.payment_intent !== pi ||
            state.id !== object.id ||
            state.livemode !== false ||
            state.currency !== order.currency ||
            !Number.isInteger(state.amount) ||
            state.amount <= 0 ||
            state.amount > order.amount_minor
          )
            fail(409, "Stripe adjustment does not match this purchase.");
          if (resource === "refunds") {
            if (
              ![
                "pending",
                "requires_action",
                "succeeded",
                "failed",
                "canceled",
              ].includes(state.status)
            )
              fail(409, "Unexpected refund state.");
            refund = state;
          } else disputed = true;
        }
      }
    }
    return this.repo.transaction(() => {
      if (
        this.repo.one(
          "SELECT 1 FROM billing_provider_events WHERE provider='stripe' AND provider_event_id=?",
          event.id,
        )
      )
        return { received: true, repeated: true };
      if (order && value) {
        order = this.records.order(order.id);
        this.applySession(order, attempt, value);
        if (
          event.type === "checkout.session.async_payment_failed" &&
          value.payment_status !== "paid" &&
          !["paid", "partially_refunded", "refunded", "disputed"].includes(
            order.status,
          ) &&
          this.records.attempt(order.id)?.id === attempt.id
        ) {
          this.repo.run(
            "UPDATE billing_payment_attempts SET state='failed' WHERE id=? AND state<>'paid'",
            attempt.id,
          );
          this.records.status(order.id, "failed");
        }
        if (refund) {
          this.repo.run(
            `INSERT INTO billing_refunds VALUES(?,?,?,?,?,?) ON CONFLICT(provider_refund_id)
            DO UPDATE SET status=excluded.status,updated_at=excluded.updated_at`,
            refund.id,
            attempt.id,
            refund.amount,
            refund.currency,
            refund.status,
            this.repo.now(),
          );
          const amount = this.records.refundTotal(order.id);
          if (amount > order.amount_minor)
            fail(409, "Refund total exceeds the purchase.");
          if (amount >= order.amount_minor) {
            this.records.status(order.id, "refunded");
            this.records.revoke(order);
          } else if (amount > 0 && order.status !== "disputed")
            this.records.status(order.id, "partially_refunded");
        }
        if (disputed) {
          this.records.status(order.id, "disputed");
          this.records.revoke(order);
        }
      }
      this.repo.run(
        "INSERT INTO billing_provider_events VALUES('stripe',?,?,?,?)",
        event.id,
        event.type,
        hash(raw),
        this.repo.now(),
      );
      return { received: true };
    });
  }
  access(app, session, actor, target) {
    if (actor.guestId) {
      const card = this.repo.guestCard(actor.eventId, actor.guestId, target);
      if (!card) fail(404, "Your card could not be found.");
      return {
        active: !!this.records.entitlement("premium-card", target),
        card: this.repo.card(card),
      };
    }
    app.ownedEvent(session, target);
    const entitlement = this.records.entitlement("event-book", target);
    return {
      active: !!entitlement,
      orderId: entitlement
        ? this.repo.one(
            "SELECT order_id FROM billing_order_items WHERE id=?",
            entitlement.item_id,
          ).order_id
        : null,
    };
  }
  book(app, session, actor, id) {
    const order = this.owned(actor, id);
    if (
      !actor.hostId ||
      order.product !== "event-book" ||
      !this.view(order).entitled
    )
      fail(403, "This digital edition needs a confirmed product purchase.");
    const current = app.book(session, order.event_id);
    const ids = this.repo.all(
      "SELECT card_id FROM book_snapshot_entries WHERE snapshot_id=? ORDER BY position",
      order.snapshot_id,
    );
    const entries = new Map(current.entries.map((entry) => [entry.id, entry]));
    return {
      event: {
        title: current.event.title,
        hosts: current.event.hosts,
        date: current.event.date,
        bookLayout: current.event.bookLayout,
      },
      entries: ids.map((row) => entries.get(row.card_id)).filter(Boolean),
      snapshot: this.view(order).snapshot,
      testMode: true,
    };
  }
  async inspectSetup(app, session) {
    app.requireOperator(session);
    return inspectStripeSetup(this, [...supportedEvents]);
  }
  operator(app, session, input) {
    app.requireOperator(session);
    if (input) {
      keys(input, ["enabled"]);
      if (typeof input.enabled !== "boolean")
        fail(422, "Choose a checkout setting.");
      this.repo.transaction(() => {
        this.repo.run(
          "UPDATE runtime_settings SET value=? WHERE key='billing_enabled'",
          input.enabled ? "1" : "0",
        );
        this.repo.audit(
          session.host.id,
          "Product test checkout " + (input.enabled ? "enabled." : "paused."),
        );
      });
    }
    return {
      configuration: this.configuration(),
      orders: this.repo
        .all(`SELECT o.id,o.status,o.created_at,i.product,i.amount_minor,i.currency
      FROM billing_orders o JOIN billing_order_items i ON o.id=i.order_id ORDER BY o.created_at DESC LIMIT 100`),
      totals: {
        paidMinor: this.repo.one(
          "SELECT coalesce(sum(i.amount_minor),0) AS amount FROM billing_order_items i JOIN billing_orders o ON o.id=i.order_id WHERE o.status IN ('paid','partially_refunded','refunded','disputed')",
        ).amount,
        refundedMinor: this.repo.one(
          "SELECT coalesce(sum(amount_minor),0) AS amount FROM billing_refunds WHERE status='succeeded'",
        ).amount,
      },
      testMode: true,
    };
  }
}
