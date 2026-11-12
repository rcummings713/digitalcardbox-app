-- Additive DEV managed-identity bridge. Passwords remain exclusively in Supabase.
CREATE TABLE auth_subjects (
 issuer TEXT NOT NULL, subject TEXT NOT NULL, host_id TEXT NOT NULL UNIQUE REFERENCES hosts(id),
 email_verified_at TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY(issuer,subject)
) STRICT;
CREATE TABLE auth_sessions (
 token_hash TEXT PRIMARY KEY REFERENCES host_sessions(token_hash) ON DELETE CASCADE,
 tokens_ciphertext TEXT NOT NULL, issuer TEXT NOT NULL, subject TEXT NOT NULL,
 access_expires_at TEXT NOT NULL, checked_at TEXT NOT NULL, recovery INTEGER NOT NULL DEFAULT 0 CHECK(recovery IN(0,1)),
 FOREIGN KEY(issuer,subject) REFERENCES auth_subjects(issuer,subject)
) STRICT;
CREATE TABLE auth_flows (
 token_hash TEXT PRIMARY KEY, verifier_ciphertext TEXT NOT NULL, provider TEXT NOT NULL CHECK(provider IN('google','apple')),
 return_path TEXT NOT NULL, prior_host_id TEXT REFERENCES hosts(id), expires_at TEXT NOT NULL
) STRICT;
CREATE INDEX auth_flow_expiry ON auth_flows(expires_at);
ALTER TABLE cards ADD COLUMN delivery_state TEXT NOT NULL DEFAULT 'delivered' CHECK(delivery_state IN('draft','delivered'));
ALTER TABLE cards ADD COLUMN premium_edition TEXT CHECK(premium_edition IN('gilded','garden','celestial','pearl','celebration','classic'));
CREATE INDEX cards_delivery ON cards(event_id,delivery_state,created_at);
INSERT INTO review_schema_versions VALUES(7,strftime('%Y-%m-%dT%H:%M:%fZ','now'));
