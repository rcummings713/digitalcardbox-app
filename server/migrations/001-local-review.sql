-- Local test adapter only. Production PostgreSQL remains governed by ADR 0005.
CREATE TABLE IF NOT EXISTS review_schema_versions (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);
CREATE TABLE hosts (
 id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE COLLATE NOCASE, name TEXT NOT NULL,
 role TEXT NOT NULL CHECK(role IN ('host','operator')), password_salt TEXT NOT NULL,
 password_hash TEXT NOT NULL, reduced_motion INTEGER NOT NULL DEFAULT 0 CHECK(reduced_motion IN (0,1))
) STRICT;
CREATE TABLE host_sessions (
 token_hash TEXT PRIMARY KEY, host_id TEXT NOT NULL REFERENCES hosts(id), csrf_token TEXT NOT NULL,
 expires_at TEXT NOT NULL
) STRICT;
CREATE TABLE events (
 id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES hosts(id), title TEXT NOT NULL CHECK(length(title) BETWEEN 1 AND 100),
 hosts TEXT NOT NULL CHECK(length(hosts) BETWEEN 1 AND 100), type TEXT NOT NULL, date TEXT NOT NULL,
 timezone TEXT NOT NULL, location TEXT NOT NULL DEFAULT '', welcome TEXT NOT NULL DEFAULT '',
 status TEXT NOT NULL CHECK(status IN ('draft','published','paused')), cover TEXT NOT NULL,
 book_layout TEXT NOT NULL DEFAULT 'editorial' CHECK(book_layout IN ('editorial','collage')),
 revision INTEGER NOT NULL DEFAULT 1, locked_at TEXT, created_at TEXT NOT NULL
) STRICT;
CREATE INDEX events_owner ON events(owner_id,created_at DESC);
CREATE TABLE share_links (
 id TEXT PRIMARY KEY, event_id TEXT NOT NULL REFERENCES events(id), token_hash TEXT NOT NULL UNIQUE,
 token_ciphertext TEXT NOT NULL, generation INTEGER NOT NULL, revoked_at TEXT, created_at TEXT NOT NULL,
 UNIQUE(event_id,generation), UNIQUE(event_id,id)
) STRICT;
CREATE UNIQUE INDEX one_active_share ON share_links(event_id) WHERE revoked_at IS NULL;
CREATE TABLE event_guests (
 id TEXT PRIMARY KEY, event_id TEXT NOT NULL REFERENCES events(id), created_at TEXT NOT NULL, UNIQUE(event_id,id)
) STRICT;
CREATE TABLE guest_sessions (
 token_hash TEXT PRIMARY KEY, event_id TEXT NOT NULL, guest_id TEXT NOT NULL, share_id TEXT NOT NULL,
 csrf_token TEXT NOT NULL, expires_at TEXT NOT NULL,
 FOREIGN KEY(event_id,guest_id) REFERENCES event_guests(event_id,id),
 FOREIGN KEY(event_id,share_id) REFERENCES share_links(event_id,id)
) STRICT;
CREATE TABLE cards (
 id TEXT PRIMARY KEY, event_id TEXT NOT NULL, guest_id TEXT NOT NULL, request_key TEXT NOT NULL,
 name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 80), note TEXT NOT NULL CHECK(length(note) BETWEEN 1 AND 5000),
 style TEXT NOT NULL, gif TEXT, consent INTEGER NOT NULL CHECK(consent IN (0,1)),
 hidden INTEGER NOT NULL DEFAULT 0 CHECK(hidden IN (0,1)), removed_at TEXT, created_at TEXT NOT NULL,
 FOREIGN KEY(event_id,guest_id) REFERENCES event_guests(event_id,id), UNIQUE(guest_id,request_key)
) STRICT;
CREATE INDEX cards_event ON cards(event_id,created_at DESC);
CREATE TABLE flags (
 key TEXT PRIMARY KEY CHECK(key IN ('gifts','gifs','assistance','books','newEvents')),
 enabled INTEGER NOT NULL CHECK(enabled IN (0,1))
) STRICT;
CREATE TABLE audit (
 id TEXT PRIMARY KEY, actor_id TEXT NOT NULL REFERENCES hosts(id), event_id TEXT REFERENCES events(id),
 action TEXT NOT NULL, created_at TEXT NOT NULL
) STRICT;
INSERT INTO review_schema_versions VALUES(1,strftime('%Y-%m-%dT%H:%M:%fZ','now'));
