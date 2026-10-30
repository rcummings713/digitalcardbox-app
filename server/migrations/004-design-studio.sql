-- Isolated DEV/local design review. Existing records remain unchanged.
ALTER TABLE events ADD COLUMN invitation_json TEXT;
ALTER TABLE cards ADD COLUMN design_json TEXT;
CREATE TABLE studio_sessions (
 token_hash TEXT PRIMARY KEY, csrf_token TEXT NOT NULL, expires_at TEXT NOT NULL
) STRICT;
CREATE TABLE studio_jobs (
 id TEXT PRIMARY KEY, session_hash TEXT NOT NULL REFERENCES studio_sessions(token_hash),
 request_key TEXT NOT NULL, kind TEXT NOT NULL CHECK(kind IN ('card','invitation')),
 choices TEXT NOT NULL, state TEXT NOT NULL CHECK(state IN ('processing','approved','blocked','failed')),
 image BLOB, mime TEXT NOT NULL DEFAULT 'image/webp' CHECK(mime='image/webp'),
 event_id TEXT REFERENCES events(id), guest_id TEXT,
 created_at TEXT NOT NULL, UNIQUE(session_hash,request_key),
 FOREIGN KEY(event_id,guest_id) REFERENCES event_guests(event_id,id),
 CHECK(state!='approved' OR image IS NOT NULL)
) STRICT;
INSERT INTO review_schema_versions VALUES(4,strftime('%Y-%m-%dT%H:%M:%fZ','now'));
