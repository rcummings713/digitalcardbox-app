import { randomUUID } from "node:crypto";
import { hash, secret } from "./domain/identity.mjs";
import { fail, keys, dayInZone } from "./domain/events.mjs";
import { cardChoices, consume, AI_POLICY } from "./media-service.mjs";
export class StudioService {
  constructor(repo, media) {
    this.repo = repo;
    this.media = media;
  }
  session(cookieToken, ip) {
    const previous =
      cookieToken &&
      this.repo.one(
        "SELECT * FROM studio_sessions WHERE token_hash=? AND expires_at>?",
        hash(cookieToken),
        this.repo.now(),
      );
    if (previous) return { csrfToken: previous.csrf_token };
    return this.repo.transaction(() => {
      consume(
        this.repo,
        "studio:sessions:" + hash(this.repo.key.toString("hex") + ip),
        dayInZone(this.repo.clock(), "America/New_York"),
        20,
      );
      if (this.repo.one("SELECT count(*) AS n FROM studio_sessions").n >= 2000)
        fail(
          429,
          "The design studio is busy. Manual designs remain available.",
        );
      const token = secret(),
        csrfToken = secret();
      this.repo.run(
        "INSERT INTO studio_sessions VALUES(?,?,?)",
        hash(token),
        csrfToken,
        new Date(this.repo.clock().getTime() + 7 * 86400000).toISOString(),
      );
      return { cookieToken: token, csrfToken };
    });
  }
  requireSession(token, csrf) {
    const session =
      token &&
      this.repo.one(
        "SELECT * FROM studio_sessions WHERE token_hash=? AND expires_at>?",
        hash(token),
        this.repo.now(),
      );
    if (!session)
      fail(401, "Reopen the design studio before creating artwork.");
    if (csrf !== undefined && (!csrf || csrf !== session.csrf_token))
      fail(
        403,
        "Refresh the design studio before trying again.",
        "csrf_failed",
      );
    return session;
  }
  async generate(cookieToken, csrf, input, ip) {
    keys(input, [
      "kind",
      "requestKey",
      "occasion",
      "palette",
      "artwork",
      "motif",
    ]);
    if (!["card", "invitation"].includes(input.kind))
      fail(422, "Choose a card or invitation.");
    const { kind, ...selection } = input;
    const choices = cardChoices(selection);
    const session = this.requireSession(cookieToken, csrf);
    const serialized = JSON.stringify({
      kind,
      ...choices,
      requestKey: undefined,
    });
    const reservation = this.repo.transaction(() => {
      if (!this.media.available || !this.repo.flags().assistance)
        fail(
          503,
          "AI artwork is not enabled yet. You can still personalize every template.",
          "ai_not_configured",
        );
      const previous = this.repo.one(
        "SELECT * FROM studio_jobs WHERE session_hash=? AND request_key=?",
        session.token_hash,
        choices.requestKey,
      );
      if (previous) {
        if (previous.choices !== serialized)
          fail(409, "That reference belongs to another design.");
        if (previous.state === "approved") return { previous };
        fail(
          409,
          "That attempt has already started or finished. Choose a template or start a new allowed attempt.",
        );
      }
      if (
        this.repo.one(
          "SELECT id FROM studio_jobs WHERE session_hash=? AND state='processing'",
          session.token_hash,
        )
      )
        fail(409, "Wait for your current design to finish.");
      const size = this.repo.one(
        "SELECT coalesce((SELECT sum(length(image)) FROM card_art),0)+coalesce((SELECT sum(length(image)) FROM studio_jobs),0) AS n",
      ).n;
      const pending = this.repo.one(
        "SELECT (SELECT count(*) FROM studio_jobs WHERE state='processing')+(SELECT count(*) FROM ai_card_jobs WHERE state='processing') AS n",
      ).n;
      if (size + (pending + 1) * 1500000 > 33554432)
        fail(
          429,
          "The artwork collection is full. Choose a template for now.",
          "art_storage_limit",
        );
      const period = dayInZone(this.repo.clock(), "America/New_York"),
        ipKey = hash(this.repo.key.toString("hex") + ip);
      consume(this.repo, "ai:global", period, AI_POLICY.maxGlobal);
      consume(this.repo, "ai:ip:" + ipKey, period, AI_POLICY.maxPerIp);
      consume(this.repo, "ai:studio-ip:" + ipKey, period, 2);
      consume(this.repo, "ai:studio-session:" + session.token_hash, period, 2);
      const id = randomUUID();
      this.repo.run(
        "INSERT INTO studio_jobs(id,session_hash,request_key,kind,choices,state,created_at) VALUES(?,?,?,?,?,'processing',?)",
        id,
        session.token_hash,
        choices.requestKey,
        kind,
        serialized,
        this.repo.now(),
      );
      return { id };
    });
    if (reservation.previous)
      return { artId: reservation.previous.id, repeated: true };
    try {
      const image = await this.media.renderArtwork(
        choices,
        kind,
        session.token_hash,
      );
      this.repo.transaction(() => {
        this.requireSession(cookieToken, csrf);
        if (!this.media.available || !this.repo.flags().assistance)
          fail(409, "AI artwork was paused while your design was being made.");
        this.repo.run(
          "UPDATE studio_jobs SET state='approved',image=? WHERE id=?",
          image,
          reservation.id,
        );
      });
      return { artId: reservation.id, repeated: false };
    } catch (error) {
      this.repo.run(
        "UPDATE studio_jobs SET state=? WHERE id=?",
        error.code === "art_blocked" ? "blocked" : "failed",
        reservation.id,
      );
      throw error;
    }
  }
  authorize(design, context, cookieToken) {
    if (!design?.artId) return;
    const row = this.repo.one(
      "SELECT * FROM studio_jobs WHERE id=? AND state='approved' AND kind=?",
      design.artId,
      design.kind,
    );
    if (!row)
      fail(
        404,
        "Your design artwork is unavailable. Choose a template or create another design.",
      );
    if (row.event_id) {
      if (
        row.event_id !== context.eventId ||
        (row.guest_id ?? null) !== (context.guestId ?? null)
      )
        fail(404, "This artwork belongs to a different invitation or card.");
      return;
    }
    const session = this.requireSession(cookieToken);
    if (row.session_hash !== session.token_hash)
      fail(404, "Your private design artwork could not be found.");
    this.repo.run(
      "UPDATE studio_jobs SET event_id=?,guest_id=? WHERE id=?",
      context.eventId,
      context.guestId ?? null,
      row.id,
    );
  }
  image(cookieToken, id) {
    const session = this.requireSession(cookieToken);
    const row = this.repo.one(
      "SELECT * FROM studio_jobs WHERE id=? AND session_hash=? AND state='approved'",
      id,
      session.token_hash,
    );
    if (!row) fail(404, "Design artwork not found.");
    return row;
  }
  hostImage(app, session, id) {
    const host = app.requireHost(session);
    const row = this.repo.one(
      "SELECT s.* FROM studio_jobs s JOIN events e ON e.id=s.event_id WHERE s.id=? AND e.owner_id=? AND s.state='approved'",
      id,
      host.id,
    );
    if (!row) fail(404, "Design artwork not found.");
    return row;
  }
  guestImage(app, token, guestCookie, id) {
    const { event, session } = app.guestSession(token, guestCookie);
    const row = this.repo.one(
      "SELECT * FROM studio_jobs WHERE id=? AND event_id=? AND state='approved' AND ((kind='invitation' AND guest_id IS NULL) OR (kind='card' AND guest_id=?))",
      id,
      event.id,
      session.guest_id,
    );
    if (!row) fail(404, "Design artwork not found.");
    return row;
  }
}
