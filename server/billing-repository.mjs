import { randomUUID } from "node:crypto";
import { hash } from "./domain/identity.mjs";
export class BillingRepository {
  constructor(repository) {
    this.repo = repository;
  }
  order(id) {
    return this.repo.one(
      `SELECT o.*,i.id AS item_id,i.product,i.target_id,i.card_id,i.snapshot_id,i.amount_minor,i.currency,i.price_id
      FROM billing_orders o JOIN billing_order_items i ON i.order_id=o.id WHERE o.id=?`,
      id,
    );
  }
  byRequest(actor, key) {
    const row = this.repo.one(
      `SELECT id FROM billing_orders WHERE ${actor.hostId ? "buyer_host_id" : "buyer_guest_id"}=? AND request_key=?`,
      actor.hostId || actor.guestId,
      key,
    );
    return row && this.order(row.id);
  }
  entitlement(product, target) {
    return this.repo.one(
      "SELECT * FROM billing_entitlements WHERE product=? AND target_id=? AND active=1",
      product,
      target,
    );
  }
  activeOrder(actor, product, target) {
    const row = this.repo.one(
      `SELECT o.id FROM billing_orders o JOIN billing_order_items i ON i.order_id=o.id
      WHERE ${actor.hostId ? "o.buyer_host_id" : "o.buyer_guest_id"}=? AND i.product=? AND i.target_id=?
      AND o.status NOT IN ('refunded','disputed') ORDER BY o.created_at DESC LIMIT 1`,
      actor.hostId || actor.guestId,
      product,
      target,
    );
    return row && this.order(row.id);
  }
  snapshot(eventId, entries, preview) {
    const digest = hash(JSON.stringify(entries.map((entry) => entry.id)));
    let snapshot = this.repo.one(
      "SELECT * FROM book_snapshots WHERE event_id=? ORDER BY revision DESC LIMIT 1",
      eventId,
    );
    if (
      snapshot?.membership_digest === digest &&
      snapshot.preview === Number(preview)
    )
      return snapshot;
    const id = randomUUID(),
      revision = (snapshot?.revision || 0) + 1;
    this.repo.run(
      "INSERT INTO book_snapshots VALUES(?,?,?,?,?,?,?)",
      id,
      eventId,
      revision,
      this.repo.now(),
      entries.length,
      digest,
      Number(preview),
    );
    entries.forEach((entry, i) =>
      this.repo.run(
        "INSERT INTO book_snapshot_entries VALUES(?,?,?,?)",
        eventId,
        id,
        entry.id,
        i,
      ),
    );
    return this.repo.one("SELECT * FROM book_snapshots WHERE id=?", id);
  }
  create(actor, value, key, digest) {
    const id = randomUUID(),
      now = this.repo.now();
    this.repo.run(
      "INSERT INTO billing_orders VALUES(?,?,?,?,?,?,?,?,?)",
      id,
      value.eventId,
      actor.hostId || null,
      actor.guestId || null,
      key,
      digest,
      "created",
      now,
      now,
    );
    this.repo.run(
      "INSERT INTO billing_order_items VALUES(?,?,?,?,?,?,?,?,?,?)",
      randomUUID(),
      id,
      value.eventId,
      value.product,
      value.targetId,
      value.cardId || null,
      value.snapshotId || null,
      value.amount,
      "usd",
      value.priceId,
    );
    return this.order(id);
  }
  attempt(orderId) {
    return this.repo.one(
      "SELECT * FROM billing_payment_attempts WHERE order_id=? ORDER BY created_at DESC,rowid DESC LIMIT 1",
      orderId,
    );
  }
  bySession(id) {
    return this.repo.one(
      "SELECT * FROM billing_payment_attempts WHERE provider_session_id=?",
      id,
    );
  }
  newAttempt(orderId) {
    const id = randomUUID(),
      now = this.repo.now();
    this.repo.run(
      "INSERT INTO billing_payment_attempts VALUES(?,?,'creating',NULL,NULL,NULL,?,?)",
      id,
      orderId,
      now,
      now,
    );
    return this.attempt(orderId);
  }
  status(orderId, status) {
    this.repo.run(
      "UPDATE billing_orders SET status=?,updated_at=? WHERE id=?",
      status,
      this.repo.now(),
      orderId,
    );
  }
  refundTotal(orderId) {
    return this.repo.one(
      `SELECT coalesce(sum(r.amount_minor),0) AS amount FROM billing_refunds r
      JOIN billing_payment_attempts a ON a.id=r.attempt_id WHERE a.order_id=? AND r.status='succeeded'`,
      orderId,
    ).amount;
  }
  grant(order) {
    const previous = this.repo.one(
      "SELECT * FROM billing_entitlements WHERE product=? AND target_id=?",
      order.product,
      order.target_id,
    );
    if (previous?.active && previous.item_id !== order.item_id) return;
    this.repo.run(
      `INSERT INTO billing_entitlements VALUES(?,?,?,?,1,?,NULL)
      ON CONFLICT(product,target_id) DO UPDATE SET item_id=excluded.item_id,active=1,granted_at=excluded.granted_at,revoked_at=NULL`,
      randomUUID(),
      order.item_id,
      order.product,
      order.target_id,
      this.repo.now(),
    );
  }
  revoke(order) {
    this.repo.run(
      "UPDATE billing_entitlements SET active=0,revoked_at=? WHERE item_id=?",
      this.repo.now(),
      order.item_id,
    );
  }
}
