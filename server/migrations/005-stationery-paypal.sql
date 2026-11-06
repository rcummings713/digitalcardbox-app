-- Local/isolated DEV only. Preserve ciphertext and immutable destination versions.
ALTER TABLE events ADD COLUMN save_the_date_json TEXT;
CREATE TABLE gift_destinations_v5 (
 event_id TEXT NOT NULL REFERENCES events(id), service TEXT NOT NULL CHECK(service IN ('Cash App','Venmo','Zelle','PayPal')),
 recipient TEXT NOT NULL, identifier TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1,
 enabled INTEGER NOT NULL CHECK(enabled IN (0,1)), confirmed INTEGER NOT NULL CHECK(confirmed IN (0,1)),
 preview_only INTEGER NOT NULL DEFAULT 1 CHECK(preview_only IN (0,1)), PRIMARY KEY(event_id,service)
) STRICT;
INSERT INTO gift_destinations_v5 SELECT * FROM gift_destinations;
DROP TABLE gift_destinations;
ALTER TABLE gift_destinations_v5 RENAME TO gift_destinations;
INSERT INTO review_schema_versions VALUES(5,strftime('%Y-%m-%dT%H:%M:%fZ','now'));
