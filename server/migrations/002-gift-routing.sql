-- Local review adapter only. No payment credentials or transaction execution.
CREATE TABLE gift_destinations (
 event_id TEXT NOT NULL REFERENCES events(id), service TEXT NOT NULL CHECK(service IN ('Cash App','Venmo','Zelle')),
 recipient TEXT NOT NULL, identifier TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1,
 enabled INTEGER NOT NULL CHECK(enabled IN (0,1)), confirmed INTEGER NOT NULL CHECK(confirmed IN (0,1)),
 preview_only INTEGER NOT NULL DEFAULT 1 CHECK(preview_only IN (0,1)), PRIMARY KEY(event_id,service)
) STRICT;
CREATE TABLE gift_intents (
 id TEXT PRIMARY KEY, event_id TEXT NOT NULL, guest_id TEXT NOT NULL, request_key TEXT NOT NULL,
 entry_id TEXT REFERENCES cards(id), name TEXT NOT NULL, alias TEXT NOT NULL, service TEXT NOT NULL,
 amount TEXT NOT NULL, reference TEXT NOT NULL, destination_version INTEGER NOT NULL,
 recipient TEXT NOT NULL, identifier TEXT NOT NULL, preview_only INTEGER NOT NULL CHECK(preview_only IN (0,1)),
 status TEXT NOT NULL DEFAULT 'unconfirmed' CHECK(status IN ('unconfirmed','host-confirmed')), created_at TEXT NOT NULL,
 FOREIGN KEY(event_id,guest_id) REFERENCES event_guests(event_id,id), UNIQUE(guest_id,request_key)
) STRICT;
CREATE INDEX gift_intents_event ON gift_intents(event_id,created_at DESC);
INSERT INTO gift_destinations SELECT id,'Venmo',hosts,'@digitalcardbox-preview',1,1,1,1 FROM events WHERE id='test-baby-shower';
INSERT INTO gift_destinations SELECT id,'Cash App',hosts,'$CardBoxPreview',1,1,1,1 FROM events WHERE id='test-baby-shower';
INSERT INTO gift_destinations SELECT id,'Zelle',hosts,'gift@example.invalid',1,1,1,1 FROM events WHERE id='test-baby-shower';
UPDATE flags SET enabled=1 WHERE key='gifts';
INSERT INTO review_schema_versions VALUES(2,strftime('%Y-%m-%dT%H:%M:%fZ','now'));
