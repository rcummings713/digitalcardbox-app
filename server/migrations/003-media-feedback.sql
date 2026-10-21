CREATE TABLE usage_counters (
 scope TEXT NOT NULL, period TEXT NOT NULL, used INTEGER NOT NULL DEFAULT 0,
 PRIMARY KEY(scope,period)
) STRICT;
CREATE TABLE runtime_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL) STRICT;
INSERT INTO runtime_settings VALUES('ai_cards_enabled','1');
CREATE TABLE ai_card_jobs (
 id TEXT PRIMARY KEY, event_id TEXT NOT NULL, guest_id TEXT NOT NULL, request_key TEXT NOT NULL,
 choices TEXT NOT NULL, state TEXT NOT NULL CHECK(state IN ('processing','approved','blocked','failed')),
 reason TEXT, created_at TEXT NOT NULL,
 FOREIGN KEY(event_id,guest_id) REFERENCES event_guests(event_id,id), UNIQUE(guest_id,request_key)
) STRICT;
CREATE TABLE card_art (
 id TEXT PRIMARY KEY REFERENCES ai_card_jobs(id), event_id TEXT NOT NULL, guest_id TEXT NOT NULL,
 image BLOB NOT NULL, mime TEXT NOT NULL CHECK(mime='image/webp'), created_at TEXT NOT NULL,
 FOREIGN KEY(event_id,guest_id) REFERENCES event_guests(event_id,id)
) STRICT;
ALTER TABLE cards ADD COLUMN art_id TEXT REFERENCES card_art(id);
CREATE TABLE feedback_sessions (
 token_hash TEXT PRIMARY KEY, csrf_token TEXT NOT NULL, expires_at TEXT NOT NULL
) STRICT;
CREATE TABLE feedback (
 id TEXT PRIMARY KEY, session_hash TEXT NOT NULL REFERENCES feedback_sessions(token_hash), request_key TEXT NOT NULL,
 rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5), category TEXT NOT NULL,
 message TEXT NOT NULL CHECK(length(message) BETWEEN 10 AND 2000), email TEXT NOT NULL DEFAULT '',
 contact_consent INTEGER NOT NULL DEFAULT 0 CHECK(contact_consent IN (0,1)),
 state TEXT NOT NULL DEFAULT 'new' CHECK(state IN ('new','reviewed','archived')), created_at TEXT NOT NULL,
 UNIQUE(session_hash,request_key)
) STRICT;
INSERT INTO review_schema_versions VALUES(3,strftime('%Y-%m-%dT%H:%M:%fZ','now'));
