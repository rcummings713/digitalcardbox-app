-- Existing sessions remain valid for ordinary reads but cannot authorize a
-- sensitive action until the same actor signs in or reauthenticates.
ALTER TABLE host_sessions ADD COLUMN authenticated_at TEXT;
INSERT INTO review_schema_versions VALUES(8,strftime('%Y-%m-%dT%H:%M:%fZ','now'));
