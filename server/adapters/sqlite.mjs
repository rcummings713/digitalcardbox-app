import { DatabaseSync } from "node:sqlite";
import {
  readFileSync,
  mkdirSync,
  chmodSync,
  existsSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  randomUUID,
  scryptSync,
} from "node:crypto";
import { fileURLToPath } from "node:url";
import { hash, secret } from "../domain/identity.mjs";
export class SqliteReviewRepository {
  constructor(path, { clock = () => new Date(), seed = true } = {}) {
    this.clock = clock;
    if (path !== ":memory:")
      mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    const keyPath =
      path === ":memory:" ? null : join(dirname(path), "review-link.key");
    if (keyPath && !existsSync(keyPath))
      writeFileSync(keyPath, randomBytes(32), { mode: 0o600, flag: "wx" });
    this.key = keyPath ? readFileSync(keyPath) : randomBytes(32);
    this.db = new DatabaseSync(path);
    if (path !== ":memory:") chmodSync(path, 0o600);
    this.db.exec(
      "PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;",
    );
    this.db.exec(
      "CREATE TABLE IF NOT EXISTS review_schema_versions (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)",
    );
    if (
      !this.db
        .prepare("SELECT 1 FROM review_schema_versions WHERE version=1")
        .get()
    ) {
      this.transaction(() =>
        this.db.exec(
          readFileSync(
            fileURLToPath(
              new URL("../migrations/001-local-review.sql", import.meta.url),
            ),
            "utf8",
          ),
        ),
      );
    }
    if (
      !this.db
        .prepare("SELECT 1 FROM review_schema_versions WHERE version=2")
        .get()
    ) {
      this.transaction(() =>
        this.db.exec(
          readFileSync(
            fileURLToPath(
              new URL("../migrations/002-gift-routing.sql", import.meta.url),
            ),
            "utf8",
          ),
        ),
      );
    }
    if (seed && !this.db.prepare("SELECT 1 FROM hosts LIMIT 1").get())
      this.seed();
  }
  now() {
    return this.clock().toISOString();
  }
  one(sql, ...values) {
    return this.db.prepare(sql).get(...values);
  }
  all(sql, ...values) {
    return this.db.prepare(sql).all(...values);
  }
  run(sql, ...values) {
    return this.db.prepare(sql).run(...values);
  }
  transaction(work) {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const result = work();
      this.db.exec("COMMIT");
      return result;
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }
  encrypt(value) {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(value, "utf8"),
      cipher.final(),
    ]);
    return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString(
      "base64url",
    );
  }
  decrypt(value) {
    const bytes = Buffer.from(value, "base64url");
    const cipher = createDecipheriv(
      "aes-256-gcm",
      this.key,
      bytes.subarray(0, 12),
    );
    cipher.setAuthTag(bytes.subarray(12, 28));
    return Buffer.concat([
      cipher.update(bytes.subarray(28)),
      cipher.final(),
    ]).toString("utf8");
  }
  event(row, { guest = false } = {}) {
    const share = this.one(
      "SELECT * FROM share_links WHERE event_id=? AND revoked_at IS NULL",
      row.id,
    );
    return {
      id: row.id,
      token: share ? this.decrypt(share.token_ciphertext) : "",
      title: row.title,
      hosts: row.hosts,
      type: row.type,
      date: row.date,
      timezone: row.timezone,
      location: row.location,
      welcome: row.welcome,
      status: row.status,
      cover: row.cover,
      bookLayout: row.book_layout,
      destinations: this.destinations(row.id).filter(
        (d) => !guest || (d.enabled && d.confirmed),
      ),
      ...(!guest ? { revision: row.revision, locked: !!row.locked_at } : {}),
    };
  }
  card(row) {
    return {
      id: row.id,
      eventId: row.event_id,
      name: row.name,
      note: row.note,
      style: row.style,
      ...(row.gif ? { gif: row.gif } : {}),
      consent: !!row.consent,
      hidden: !!row.hidden,
      createdAt: row.created_at,
    };
  }
  flags() {
    return Object.fromEntries(
      this.all("SELECT * FROM flags").map((row) => [row.key, !!row.enabled]),
    );
  }
  audit(hostId, action, eventId = null) {
    this.run(
      "INSERT INTO audit VALUES (?,?,?,?,?)",
      randomUUID(),
      hostId,
      eventId,
      action,
      this.now(),
    );
  }
  newLink(eventId) {
    const token = secret();
    const generation = this.one(
      "SELECT coalesce(max(generation),0)+1 AS n FROM share_links WHERE event_id=?",
      eventId,
    ).n;
    this.run(
      "INSERT INTO share_links VALUES(?,?,?,?,?,NULL,?)",
      randomUUID(),
      eventId,
      hash(token),
      this.encrypt(token),
      generation,
      this.now(),
    );
    return token;
  }
  createEvent(ownerId, value, id = randomUUID()) {
    this.run(
      "INSERT INTO events (id,owner_id,title,hosts,type,date,timezone,location,welcome,status,cover,book_layout,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)",
      id,
      ownerId,
      value.title,
      value.hosts,
      value.type,
      value.date,
      value.timezone,
      value.location,
      value.welcome,
      value.status,
      value.cover,
      value.bookLayout ?? "editorial",
      this.now(),
    );
    this.newLink(id);
    return this.event(this.one("SELECT * FROM events WHERE id=?", id));
  }
  destinations(eventId) {
    return this.all(
      "SELECT * FROM gift_destinations WHERE event_id=? ORDER BY service",
      eventId,
    ).map((row) => ({
      service: row.service,
      recipient: row.recipient,
      identifier: row.identifier,
      version: row.version,
      enabled: !!row.enabled,
      confirmed: !!row.confirmed,
      previewOnly: !!row.preview_only,
    }));
  }
  saveDestination(eventId, value) {
    this.run(
      `INSERT INTO gift_destinations VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(event_id,service) DO UPDATE SET recipient=excluded.recipient, identifier=excluded.identifier, version=excluded.version, enabled=excluded.enabled, confirmed=excluded.confirmed, preview_only=excluded.preview_only`,
      eventId,
      value.service,
      value.recipient,
      value.identifier,
      value.version,
      +value.enabled,
      +value.confirmed,
      +value.previewOnly,
    );
    this.run("UPDATE events SET revision=revision+1 WHERE id=?", eventId);
  }
  gift(row) {
    return {
      id: row.id,
      eventId: row.event_id,
      entryId: row.entry_id ?? undefined,
      name: row.name,
      alias: row.alias,
      service: row.service,
      amount: row.amount,
      reference: row.reference,
      status: row.status,
      previewOnly: !!row.preview_only,
      date: row.created_at.slice(0, 10),
    };
  }
  giftByRequest(guestId, requestKey) {
    return this.one(
      "SELECT * FROM gift_intents WHERE guest_id=? AND request_key=?",
      guestId,
      requestKey,
    );
  }
  insertGift(eventId, guestId, input, destination) {
    const id = randomUUID();
    this.run(
      "INSERT INTO gift_intents (id,event_id,guest_id,request_key,entry_id,name,alias,service,amount,reference,destination_version,recipient,identifier,preview_only,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
      id,
      eventId,
      guestId,
      input.requestKey,
      input.entryId || null,
      input.name,
      input.alias,
      destination.service,
      input.amount,
      input.reference,
      destination.version,
      destination.recipient,
      destination.identifier,
      +destination.previewOnly,
      this.now(),
    );
    return this.one("SELECT * FROM gift_intents WHERE id=?", id);
  }
  ownedGift(hostId, id) {
    return this.one(
      "SELECT g.* FROM gift_intents g JOIN events e ON e.id=g.event_id WHERE e.owner_id=? AND g.id=?",
      hostId,
      id,
    );
  }
  workspace(host) {
    const rows = this.all(
      "SELECT * FROM events WHERE owner_id=? ORDER BY created_at DESC LIMIT 100",
      host.id,
    );
    const cards = this.all(
      "SELECT c.* FROM cards c JOIN events e ON e.id=c.event_id WHERE e.owner_id=? AND c.removed_at IS NULL ORDER BY c.created_at DESC LIMIT 1000",
      host.id,
    );
    return {
      version: 1,
      events: rows.map((row) => this.event(row)),
      entries: cards.map((row) => this.card(row)),
      gifts: this.all(
        "SELECT g.* FROM gift_intents g JOIN events e ON e.id=g.event_id WHERE e.owner_id=? ORDER BY g.created_at DESC LIMIT 1000",
        host.id,
      ).map((row) => this.gift(row)),
      flags: this.flags(),
      profile: {
        name: host.name,
        email: host.email,
        reducedMotion: !!host.reduced_motion,
      },
      audit: this.all(
        "SELECT action FROM audit WHERE actor_id=? ORDER BY created_at DESC LIMIT 50",
        host.id,
      ).map((row) => row.action),
    };
  }
  seed() {
    this.transaction(() => {
      for (const [id, email, name, role] of [
        ["review-host", "host@digitalcardbox.test", "Jamie", "host"],
        ["review-other", "other@digitalcardbox.test", "Alex", "host"],
        [
          "review-operator",
          "operator@digitalcardbox.test",
          "Site operator",
          "operator",
        ],
      ]) {
        const salt = randomBytes(16).toString("hex");
        const password = scryptSync("CardBoxReview!2026", salt, 64).toString(
          "hex",
        );
        this.run(
          "INSERT INTO hosts (id,email,name,role,password_salt,password_hash) VALUES(?,?,?,?,?,?)",
          id,
          email,
          name,
          role,
          salt,
          password,
        );
      }
      for (const key of ["gifts", "gifs", "assistance", "books", "newEvents"])
        this.run("INSERT INTO flags VALUES(?,?)", key, 1);
      const date = new Date(this.clock());
      date.setUTCDate(date.getUTCDate() + 7);
      this.createEvent(
        "review-host",
        {
          title: "A little star is on the way",
          hosts: "Jamie & Riley",
          type: "Baby shower",
          date: date.toISOString().slice(0, 10),
          timezone: "America/New_York",
          location: "Our home",
          welcome:
            "A little one, so much love. Leave a wish or a memory for our growing family.",
          status: "published",
          cover: "flowers",
        },
        "test-baby-shower",
      );
      for (const [service, identifier] of [
        ["Venmo", "@digitalcardbox-preview"],
        ["Cash App", "$CardBoxPreview"],
        ["Zelle", "gift@example.invalid"],
      ]) {
        this.run(
          "INSERT INTO gift_destinations VALUES(?,?,?,?,1,1,1,1)",
          "test-baby-shower",
          service,
          "Jamie & Riley",
          identifier,
        );
      }
      const messages = [
        [
          "Norma",
          "The universe is full of a million little stars ... but none will shine as much as your beautiful baby Boy !",
          "little-star",
          "cosmic",
          1,
        ],
        [
          "Jordan",
          "Here’s to tiny hands, big adventures, and all the beautiful firsts ahead. So much love to your growing family.",
          "botanical",
          "hearts",
          1,
        ],
        [
          "Sam",
          "A little note just for the two of you. You are going to be wonderful parents.",
          "arch",
          null,
          0,
        ],
      ];
      for (const [name, note, style, gif, consent] of messages) {
        const guestId = randomUUID();
        this.run(
          "INSERT INTO event_guests VALUES(?,?,?)",
          guestId,
          "test-baby-shower",
          this.now(),
        );
        this.run(
          "INSERT INTO cards (id,event_id,guest_id,request_key,name,note,style,gif,consent,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)",
          randomUUID(),
          "test-baby-shower",
          guestId,
          randomUUID(),
          name,
          note,
          style,
          gif,
          consent,
          this.now(),
        );
      }
      this.run(
        "UPDATE events SET locked_at=? WHERE id=?",
        this.now(),
        "test-baby-shower",
      );
      this.audit(
        "review-host",
        "Test card box created with fictional cards.",
        "test-baby-shower",
      );
    });
  }
  findHost(email) {
    return this.one("SELECT * FROM hosts WHERE email=?", email);
  }
  host(id) {
    return this.one("SELECT * FROM hosts WHERE id=?", id);
  }
  hostSession(tokenHash) {
    return this.one(
      "SELECT * FROM host_sessions WHERE token_hash=? AND expires_at>?",
      tokenHash,
      this.now(),
    );
  }
  putHostSession(tokenHash, hostId, csrf, expires) {
    this.run("DELETE FROM host_sessions WHERE expires_at<=?", this.now());
    this.run(
      "INSERT INTO host_sessions VALUES(?,?,?,?)",
      tokenHash,
      hostId,
      csrf,
      expires,
    );
  }
  dropHostSession(tokenHash) {
    this.run("DELETE FROM host_sessions WHERE token_hash=?", tokenHash);
  }
  ownedEvent(hostId, id) {
    return this.one(
      "SELECT * FROM events WHERE id=? AND owner_id=?",
      id,
      hostId,
    );
  }
  updateEvent(id, value) {
    this.run(
      "UPDATE events SET title=?,hosts=?,type=?,date=?,timezone=?,location=?,welcome=?,status=?,cover=?,book_layout=?,revision=revision+1 WHERE id=?",
      value.title,
      value.hosts,
      value.type,
      value.date,
      value.timezone,
      value.location,
      value.welcome,
      value.status,
      value.cover,
      value.bookLayout,
      id,
    );
  }
  rotateLink(eventId) {
    this.run("DELETE FROM guest_sessions WHERE event_id=?", eventId);
    this.run(
      "UPDATE share_links SET revoked_at=? WHERE event_id=? AND revoked_at IS NULL",
      this.now(),
      eventId,
    );
    const token = this.newLink(eventId);
    this.run("UPDATE events SET revision=revision+1 WHERE id=?", eventId);
    return token;
  }
  resolveLink(tokenHash) {
    return this.one(
      "SELECT e.*,s.id AS share_id FROM share_links s JOIN events e ON e.id=s.event_id WHERE s.token_hash=? AND s.revoked_at IS NULL AND e.status<>?",
      tokenHash,
      "draft",
    );
  }
  guestSession(tokenHash, eventId, shareId) {
    return this.one(
      "SELECT * FROM guest_sessions WHERE token_hash=? AND event_id=? AND share_id=? AND expires_at>?",
      tokenHash,
      eventId,
      shareId,
      this.now(),
    );
  }
  putGuestSession(tokenHash, eventId, shareId, csrf, expires) {
    const id = randomUUID();
    this.run("DELETE FROM guest_sessions WHERE expires_at<=?", this.now());
    this.run("INSERT INTO event_guests VALUES(?,?,?)", id, eventId, this.now());
    this.run(
      "INSERT INTO guest_sessions VALUES(?,?,?,?,?,?)",
      tokenHash,
      eventId,
      id,
      shareId,
      csrf,
      expires,
    );
    return id;
  }
  cardByRequest(guestId, key) {
    return this.one(
      "SELECT * FROM cards WHERE guest_id=? AND request_key=?",
      guestId,
      key,
    );
  }
  insertCard(eventId, guestId, value) {
    const id = randomUUID();
    this.run(
      "INSERT INTO cards (id,event_id,guest_id,request_key,name,note,style,gif,consent,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)",
      id,
      eventId,
      guestId,
      value.requestKey,
      value.name,
      value.note,
      value.style,
      value.gif,
      value.consent ? 1 : 0,
      this.now(),
    );
    this.run(
      "UPDATE events SET locked_at=coalesce(locked_at,?),revision=revision+1 WHERE id=?",
      this.now(),
      eventId,
    );
    return this.card(this.one("SELECT * FROM cards WHERE id=?", id));
  }
  ownedCard(hostId, id) {
    return this.one(
      "SELECT c.* FROM cards c JOIN events e ON e.id=c.event_id WHERE c.id=? AND e.owner_id=? AND c.removed_at IS NULL",
      id,
      hostId,
    );
  }
  moderateCard(id, action) {
    if (action === "remove")
      this.run("UPDATE cards SET removed_at=? WHERE id=?", this.now(), id);
    else
      this.run(
        "UPDATE cards SET hidden=? WHERE id=?",
        action === "hide" ? 1 : 0,
        id,
      );
  }
  bookCards(eventId) {
    return this.all(
      "SELECT * FROM cards WHERE event_id=? AND consent=1 AND hidden=0 AND removed_at IS NULL ORDER BY created_at",
      eventId,
    ).map((row) => this.card(row));
  }
  saveProfile(hostId, value) {
    this.run(
      "UPDATE hosts SET name=?,reduced_motion=? WHERE id=?",
      value.name,
      value.reducedMotion ? 1 : 0,
      hostId,
    );
    return this.host(hostId);
  }
  setFlag(key, enabled) {
    this.run("UPDATE flags SET enabled=? WHERE key=?", enabled ? 1 : 0, key);
  }
  adminSummary() {
    return {
      events: this.all(
        "SELECT id,title,type,date,status FROM events ORDER BY created_at DESC LIMIT 100",
      ),
      totals: {
        events: this.one("SELECT count(*) AS n FROM events").n,
        cards: this.one(
          "SELECT count(*) AS n FROM cards WHERE removed_at IS NULL",
        ).n,
      },
      flags: this.flags(),
      audit: this.all(
        "SELECT action,created_at FROM audit ORDER BY created_at DESC LIMIT 50",
      ),
    };
  }
  close() {
    this.db.close();
  }
}
