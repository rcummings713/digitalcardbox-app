import { DatabaseSync } from "node:sqlite";
import {
  readFileSync,
  mkdirSync,
  chmodSync,
  existsSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { randomBytes } from "node:crypto";
import { ReviewRepository } from "./repository.mjs";
export class SqliteReviewRepository extends ReviewRepository {
  constructor(path, options = {}) {
    if (path !== ":memory:")
      mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    const keyPath =
      path === ":memory:" ? null : join(dirname(path), "review-link.key");
    if (keyPath && !existsSync(keyPath))
      writeFileSync(keyPath, randomBytes(32), { mode: 0o600, flag: "wx" });
    const key = keyPath ? readFileSync(keyPath) : randomBytes(32);
    const db = new DatabaseSync(path);
    if (path !== ":memory:") chmodSync(path, 0o600);
    db.exec(
      "PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;",
    );
    const migrations = [
      "001-local-review.sql",
      "002-gift-routing.sql",
      "003-media-feedback.sql",
    ].map((name) =>
      readFileSync(new URL("../migrations/" + name, import.meta.url), "utf8"),
    );
    super(db, { ...options, key, migrations });
  }
}
