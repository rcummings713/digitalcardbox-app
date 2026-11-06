-- Isolated DEV product purchases. External gift intent tables are unchanged.
CREATE UNIQUE INDEX cards_event_identity ON cards(event_id,id);
CREATE TABLE book_snapshots (
 id TEXT PRIMARY KEY, event_id TEXT NOT NULL REFERENCES events(id), revision INTEGER NOT NULL,
 cutoff_at TEXT NOT NULL, included_count INTEGER NOT NULL CHECK(included_count>=0),
 membership_digest TEXT NOT NULL, preview INTEGER NOT NULL CHECK(preview IN (0,1)),
 UNIQUE(event_id,revision), UNIQUE(event_id,id)
) STRICT;
CREATE TABLE book_snapshot_entries (
 event_id TEXT NOT NULL, snapshot_id TEXT NOT NULL, card_id TEXT NOT NULL, position INTEGER NOT NULL,
 PRIMARY KEY(snapshot_id,card_id), UNIQUE(snapshot_id,position),
 FOREIGN KEY(event_id,snapshot_id) REFERENCES book_snapshots(event_id,id),
 FOREIGN KEY(event_id,card_id) REFERENCES cards(event_id,id)
) STRICT;
CREATE TABLE billing_orders (
 id TEXT PRIMARY KEY, event_id TEXT NOT NULL REFERENCES events(id),
 buyer_host_id TEXT REFERENCES hosts(id), buyer_guest_id TEXT,
 request_key TEXT NOT NULL, request_digest TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('created','pending','paid','failed','expired','partially_refunded','refunded','disputed')),
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
 CHECK((buyer_host_id IS NULL)<>(buyer_guest_id IS NULL)),
 FOREIGN KEY(event_id,buyer_guest_id) REFERENCES event_guests(event_id,id), UNIQUE(event_id,id)
) STRICT;
CREATE UNIQUE INDEX billing_host_retry ON billing_orders(buyer_host_id,request_key) WHERE buyer_host_id IS NOT NULL;
CREATE UNIQUE INDEX billing_guest_retry ON billing_orders(buyer_guest_id,request_key) WHERE buyer_guest_id IS NOT NULL;
CREATE TABLE billing_order_items (
 id TEXT PRIMARY KEY, order_id TEXT NOT NULL UNIQUE, event_id TEXT NOT NULL,
 product TEXT NOT NULL CHECK(product IN ('premium-card','event-book')), target_id TEXT NOT NULL,
 card_id TEXT, snapshot_id TEXT, amount_minor INTEGER NOT NULL CHECK(amount_minor IN (499,1500,3000,7900)),
 currency TEXT NOT NULL CHECK(currency='usd'), price_id TEXT NOT NULL,
 CHECK((product='premium-card' AND card_id IS NOT NULL AND card_id=target_id AND snapshot_id IS NULL AND amount_minor=499) OR
       (product='event-book' AND card_id IS NULL AND snapshot_id IS NOT NULL AND target_id=event_id AND amount_minor IN (1500,3000,7900))),
 UNIQUE(id,product,target_id),
 FOREIGN KEY(event_id,order_id) REFERENCES billing_orders(event_id,id),
 FOREIGN KEY(event_id,card_id) REFERENCES cards(event_id,id),
 FOREIGN KEY(event_id,snapshot_id) REFERENCES book_snapshots(event_id,id)
) STRICT;
CREATE INDEX billing_item_target ON billing_order_items(product,target_id);
CREATE TABLE billing_payment_attempts (
 id TEXT PRIMARY KEY, order_id TEXT NOT NULL REFERENCES billing_orders(id),
 state TEXT NOT NULL CHECK(state IN ('creating','open','paid','failed','expired')),
 provider_session_id TEXT UNIQUE, payment_intent_id TEXT UNIQUE, checkout_ciphertext TEXT,
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL
) STRICT;
CREATE UNIQUE INDEX billing_one_open_attempt ON billing_payment_attempts(order_id) WHERE state IN ('creating','open');
CREATE TABLE billing_provider_events (
 provider TEXT NOT NULL CHECK(provider='stripe'), provider_event_id TEXT NOT NULL,
 type TEXT NOT NULL, digest TEXT NOT NULL, processed_at TEXT NOT NULL,
 PRIMARY KEY(provider,provider_event_id)
) STRICT;
CREATE TABLE billing_entitlements (
 id TEXT PRIMARY KEY, item_id TEXT NOT NULL REFERENCES billing_order_items(id),
 product TEXT NOT NULL CHECK(product IN ('premium-card','event-book')), target_id TEXT NOT NULL,
 active INTEGER NOT NULL CHECK(active IN (0,1)), granted_at TEXT NOT NULL, revoked_at TEXT,
 UNIQUE(product,target_id),
 FOREIGN KEY(item_id,product,target_id) REFERENCES billing_order_items(id,product,target_id)
) STRICT;
CREATE TABLE billing_refunds (
 provider_refund_id TEXT PRIMARY KEY, attempt_id TEXT NOT NULL REFERENCES billing_payment_attempts(id),
 amount_minor INTEGER NOT NULL CHECK(amount_minor>0), currency TEXT NOT NULL CHECK(currency='usd'),
 status TEXT NOT NULL CHECK(status IN ('pending','requires_action','succeeded','failed','canceled')),
 updated_at TEXT NOT NULL
) STRICT;
INSERT INTO runtime_settings VALUES('billing_enabled','1');
INSERT INTO review_schema_versions VALUES(6,strftime('%Y-%m-%dT%H:%M:%fZ','now'));
