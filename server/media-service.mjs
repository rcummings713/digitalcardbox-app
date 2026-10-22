import { randomUUID, createHash } from "node:crypto";
import { aiOptions, searchGifs } from "../src/modules/media/catalog.ts";
import { fail, keys, text, windowFor, dayInZone } from "./domain/events.mjs";
import { hash, secret } from "./domain/identity.mjs";

export const AI_POLICY = Object.freeze({
  model: "gpt-image-2-2026-04-21",
  quality: "low",
  size: "1024x1536",
  maxPerGuest: 2,
  maxPerEvent: 10,
  maxGlobal: 20,
  maxPerIp: 4,
  reservationUsd: 0.02,
});
export function cardChoices(input) {
  keys(input, ["requestKey", ...Object.keys(aiOptions)]);
  const value = {};
  for (const [key, choices] of Object.entries(aiOptions)) {
    if (!choices.includes(input[key]))
      fail(422, "Choose one of the available card design options.");
    value[key] = input[key];
  }
  const requestKey = text(input.requestKey, "generation reference", 100);
  if (!/^[A-Za-z0-9_-]{12,100}$/.test(requestKey))
    fail(422, "Use a valid generation reference.");
  return { requestKey, ...value };
}
export function artworkPrompt(value) {
  return `Create one premium portrait greeting-card artwork for a ${value.occasion}. Palette: ${value.palette}. Art direction: ${value.artwork}. Decorative motif: ${value.motif}. Refined, elegant stationery with generous clean space in the center for a personal note added separately. Family-friendly illustration only. No text, letters, numbers, logos, watermarks, people, faces, bodies, nudity, sexual content, violence, drugs, political symbols or copyrighted characters. Return only the card artwork.`;
}
export function consume(repo, scope, period, limit) {
  const row = repo.one(
    "SELECT used FROM usage_counters WHERE scope=? AND period=?",
    scope,
    period,
  );
  if ((row?.used ?? 0) >= limit)
    fail(
      429,
      "This limit has been reached. Please try again after the daily reset.",
      "usage_limit",
    );
  repo.run(
    "INSERT INTO usage_counters VALUES(?,?,1) ON CONFLICT(scope,period) DO UPDATE SET used=used+1",
    scope,
    period,
  );
}
function day(repo) {
  return dayInZone(repo.clock(), "America/New_York");
}
export class MediaService {
  constructor(repo, { apiKey = "", aiEnabled = false, fetcher = fetch } = {}) {
    this.repo = repo;
    this.apiKey = apiKey;
    this.enabled = aiEnabled;
    this.fetcher = fetcher;
  }
  get available() {
    return (
      !!this.apiKey &&
      this.enabled &&
      this.repo.one(
        "SELECT value FROM runtime_settings WHERE key='ai_cards_enabled'",
      )?.value === "1"
    );
  }
  status() {
    const used =
      this.repo.one(
        "SELECT used FROM usage_counters WHERE scope='ai:global' AND period=?",
        day(this.repo),
      )?.used ?? 0;
    return {
      available: this.available,
      configured: !!this.apiKey && this.enabled,
      dailyLimit: AI_POLICY.maxGlobal,
      usedToday: used,
      perGuest: AI_POLICY.maxPerGuest,
      estimatedDailyCeilingUsd: AI_POLICY.maxGlobal * AI_POLICY.reservationUsd,
    };
  }
  gifs(query = "") {
    if (query.length > 50)
      fail(422, "Search for a GIF using up to 50 characters.");
    return searchGifs(query);
  }

  async call(path, payload) {
    let response;
    try {
      response = await this.fetcher("https://api.openai.com/v1/" + path, {
        method: "POST",
        headers: {
          Authorization: "Bearer " + this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(90000),
        redirect: "error",
      });
    } catch {
      fail(
        503,
        "Card artwork is unavailable right now. You can still choose a collection design.",
        "ai_unavailable",
      );
    }
    if (!response.ok)
      fail(
        503,
        "Card artwork could not be created. You can still choose a collection design.",
        "ai_unavailable",
      );
    const reader = response.body?.getReader();
    if (!reader)
      fail(503, "Artwork response was unavailable.", "ai_unavailable");
    const chunks = [];
    let length = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > 4500000) {
        await reader.cancel();
        fail(503, "Artwork response was too large.", "ai_unavailable");
      }
      chunks.push(Buffer.from(value));
    }
    try {
      return JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
      fail(503, "Artwork response was unavailable.", "ai_unavailable");
    }
  }
  async moderate(input) {
    const result = await this.call("moderations", {
      model: "omni-moderation-latest",
      input,
    });
    const decision = result?.results?.[0];
    if (
      !decision ||
      decision.flagged !== false ||
      !decision.categories ||
      !decision.category_scores ||
      !Object.values(decision.categories).every(
        (v) => typeof v === "boolean",
      ) ||
      Object.values(decision.categories).some(Boolean)
    )
      fail(
        422,
        "This artwork did not pass the card safety check. Choose another collection design.",
        "art_blocked",
      );
    for (const category of [
      "sexual",
      "sexual/minors",
      "violence/graphic",
      "hate/threatening",
      "self-harm/instructions",
    ]) {
      const score = decision.category_scores[category];
      if (
        typeof score !== "number" ||
        !Number.isFinite(score) ||
        score < 0 ||
        score > 1
      )
        fail(
          503,
          "The card safety check is unavailable. Choose a collection design.",
          "ai_unavailable",
        );
      if (score >= 0.02)
        fail(
          422,
          "This artwork did not pass the card safety check. Choose another collection design.",
          "art_blocked",
        );
    }
  }
  async generate(app, token, cookieToken, csrf, input, ip) {
    const choices = cardChoices(input);
    const context = this.repo.transaction(() => {
      const { event, session } = app.guestSession(token, cookieToken);
      if (!csrf || csrf !== session.csrf_token)
        fail(
          403,
          "Reopen your invitation before creating artwork.",
          "csrf_failed",
        );
      if (windowFor(event, this.repo.clock()) !== "open")
        fail(409, "This invitation is not accepting cards.");
      if (!this.available || !this.repo.flags().assistance)
        fail(
          503,
          "AI card artwork is not enabled yet. Choose a collection design for now.",
          "ai_not_configured",
        );
      const previous = this.repo.one(
        "SELECT * FROM ai_card_jobs WHERE guest_id=? AND request_key=?",
        session.guest_id,
        choices.requestKey,
      );
      const serialized = JSON.stringify(
        Object.fromEntries(Object.keys(aiOptions).map((k) => [k, choices[k]])),
      );
      if (previous) {
        if (previous.choices !== serialized)
          fail(409, "This generation reference belongs to a different design.");
        if (previous.state === "approved") return { previous, event, session };
        fail(
          409,
          previous.state === "processing"
            ? "Your card is still being created. Do not start another request."
            : "That attempt has finished. Choose a collection design or start a new allowed attempt.",
          "generation_" + previous.state,
        );
      }
      if (
        this.repo.one(
          "SELECT id FROM ai_card_jobs WHERE guest_id=? AND state='processing'",
          session.guest_id,
        )
      )
        fail(
          409,
          "Wait for your current artwork before starting another.",
          "generation_processing",
        );
      const stored = this.repo.one(
        "SELECT coalesce(sum(length(image)),0) AS size FROM card_art",
      ).size;
      const pending = this.repo.one(
        "SELECT count(*) AS count FROM ai_card_jobs WHERE state='processing'",
      ).count;
      if (stored + (pending + 1) * 1500000 > 33554432)
        fail(
          429,
          "The artwork collection is full for this review. Please choose a collection design.",
          "art_storage_limit",
        );
      const period = day(this.repo);
      consume(this.repo, "ai:global", period, AI_POLICY.maxGlobal);
      consume(
        this.repo,
        "ai:guest:" + session.guest_id,
        period,
        AI_POLICY.maxPerGuest,
      );
      consume(this.repo, "ai:event:" + event.id, period, AI_POLICY.maxPerEvent);
      consume(
        this.repo,
        "ai:ip:" + hash(this.repo.key.toString("hex") + ip),
        period,
        AI_POLICY.maxPerIp,
      );
      const id = randomUUID();
      this.repo.run(
        "INSERT INTO ai_card_jobs VALUES(?,?,?,?,?,'processing',NULL,?)",
        id,
        event.id,
        session.guest_id,
        choices.requestKey,
        serialized,
        this.repo.now(),
      );
      return { id, event, session };
    });
    if (context.previous) return { artId: context.previous.id, repeated: true };
    try {
      const prompt = artworkPrompt(choices);
      await this.moderate([{ type: "text", text: prompt }]);
      const result = await this.call("images/generations", {
        model: AI_POLICY.model,
        prompt,
        quality: AI_POLICY.quality,
        size: AI_POLICY.size,
        n: 1,
        output_format: "webp",
        output_compression: 80,
        moderation: "auto",
        background: "opaque",
        safety_identifier: createHash("sha256")
          .update(context.session.guest_id)
          .digest("hex"),
      });
      if (
        result?.data?.length !== 1 ||
        typeof result.data[0].b64_json !== "string" ||
        !/^[A-Za-z0-9+/]+={0,2}$/.test(result.data[0].b64_json)
      )
        fail(503, "Artwork response was unavailable.", "ai_unavailable");
      const encoded = result.data[0].b64_json;
      const image = Buffer.from(encoded, "base64");
      if (
        image.length > 1500000 ||
        image.length < 16 ||
        image.subarray(0, 4).toString() !== "RIFF" ||
        image.subarray(8, 12).toString() !== "WEBP"
      )
        fail(
          503,
          "Artwork response was not a supported card image.",
          "ai_unavailable",
        );
      await this.moderate([
        {
          type: "image_url",
          image_url: { url: "data:image/webp;base64," + encoded },
        },
      ]);
      this.repo.transaction(() => {
        // Recheck access after the network work. Revoked links cannot receive an asset.
        const current = app.guestSession(token, cookieToken);
        if (
          current.event.id !== context.event.id ||
          current.session.guest_id !== context.session.guest_id ||
          windowFor(current.event, this.repo.clock()) !== "open" ||
          !this.available ||
          !this.repo.flags().assistance
        )
          fail(409, "The invitation changed while the card was being made.");
        this.repo.run(
          "INSERT INTO card_art VALUES(?,?,?,?,?,?)",
          context.id,
          context.event.id,
          context.session.guest_id,
          image,
          "image/webp",
          this.repo.now(),
        );
        this.repo.run(
          "UPDATE ai_card_jobs SET state='approved' WHERE id=?",
          context.id,
        );
      });
      return { artId: context.id, repeated: false };
    } catch (error) {
      this.repo.run(
        "UPDATE ai_card_jobs SET state=?,reason=? WHERE id=?",
        error.code === "art_blocked" ? "blocked" : "failed",
        error.code || "unavailable",
        context.id,
      );
      throw error;
    }
  }
  guestArt(app, token, cookieToken, id) {
    const { event, session } = app.guestSession(token, cookieToken);
    const image = this.repo.one(
      "SELECT * FROM card_art WHERE id=? AND event_id=? AND guest_id=?",
      id,
      event.id,
      session.guest_id,
    );
    if (!image) fail(404, "Card artwork not found.");
    return image;
  }
  hostArt(app, session, id) {
    const host = app.requireHost(session);
    const image = this.repo.one(
      "SELECT a.* FROM card_art a JOIN events e ON e.id=a.event_id WHERE a.id=? AND e.owner_id=?",
      id,
      host.id,
    );
    if (!image) fail(404, "Card artwork not found.");
    return image;
  }
  feedbackSession(cookieToken) {
    const previous =
      cookieToken &&
      this.repo.one(
        "SELECT * FROM feedback_sessions WHERE token_hash=? AND expires_at>?",
        hash(cookieToken),
        this.repo.now(),
      );
    if (previous) return { csrfToken: previous.csrf_token };
    const token = secret(),
      csrf = secret();
    this.repo.run(
      "INSERT INTO feedback_sessions VALUES(?,?,?)",
      hash(token),
      csrf,
      new Date(this.repo.clock().getTime() + 86400000).toISOString(),
    );
    return { csrfToken: csrf, cookieToken: token };
  }
  saveFeedback(cookieToken, csrf, input, ip) {
    keys(input, [
      "requestKey",
      "rating",
      "category",
      "message",
      "email",
      "contactConsent",
      "website",
    ]);
    if (input.website) fail(422, "Feedback could not be submitted.");
    const session =
      cookieToken &&
      this.repo.one(
        "SELECT * FROM feedback_sessions WHERE token_hash=? AND expires_at>?",
        hash(cookieToken),
        this.repo.now(),
      );
    if (!session || !csrf || csrf !== session.csrf_token)
      fail(403, "Refresh the feedback form before submitting.", "csrf_failed");
    const value = {
      requestKey: text(input.requestKey, "submission reference", 100),
      message: text(input.message, "feedback", 2000),
      email: text(input.email ?? "", "email address", 254, false),
      category: input.category,
      rating: input.rating,
      consent: input.contactConsent,
    };
    if (
      !/^[A-Za-z0-9_-]{12,100}$/.test(value.requestKey) ||
      value.message.length < 10 ||
      ![1, 2, 3, 4, 5].includes(value.rating) ||
      ![
        "Overall experience",
        "Card designs",
        "GIFs and AI",
        "Invitations and QR",
        "Something went wrong",
        "Suggestion",
      ].includes(value.category) ||
      typeof value.consent !== "boolean" ||
      (!!value.email &&
        (!value.consent || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)))
    )
      fail(
        422,
        "Check your feedback fields. Email is optional and needs permission to follow up.",
      );
    return this.repo.transaction(() => {
      const previous = this.repo.one(
        "SELECT * FROM feedback WHERE session_hash=? AND request_key=?",
        session.token_hash,
        value.requestKey,
      );
      if (previous) {
        if (
          previous.message !== value.message ||
          previous.rating !== value.rating ||
          previous.category !== value.category ||
          previous.email !== value.email ||
          !!previous.contact_consent !== value.consent
        )
          fail(409, "This submission reference has already been used.");
        return { id: previous.id, repeated: true };
      }
      const hour = this.repo.now().slice(0, 13);
      consume(this.repo, "feedback:session:" + session.token_hash, hour, 3);
      consume(
        this.repo,
        "feedback:ip:" + hash(this.repo.key.toString("hex") + ip),
        hour,
        5,
      );
      consume(this.repo, "feedback:global", day(this.repo), 100);
      const id = randomUUID();
      this.repo.run(
        "INSERT INTO feedback (id,session_hash,request_key,rating,category,message,email,contact_consent,created_at) VALUES(?,?,?,?,?,?,?,?,?)",
        id,
        session.token_hash,
        value.requestKey,
        value.rating,
        value.category,
        value.message,
        value.email,
        +value.consent,
        this.repo.now(),
      );
      return { id, repeated: false };
    });
  }
  listFeedback(app, session) {
    app.requireOperator(session);
    return this.repo
      .all(
        "SELECT id,rating,category,message,email,contact_consent AS contactConsent,state,created_at AS createdAt FROM feedback ORDER BY created_at DESC LIMIT 200",
      )
      .map((item) => ({ ...item, contactConsent: !!item.contactConsent }));
  }
  reviewFeedback(app, session, id, input) {
    app.requireOperator(session);
    keys(input, ["state"]);
    if (!["new", "reviewed", "archived"].includes(input.state))
      fail(422, "Choose a feedback review state.");
    return this.repo.transaction(() => {
      if (!this.repo.one("SELECT id FROM feedback WHERE id=?", id))
        fail(404, "Feedback not found.");
      this.repo.run("UPDATE feedback SET state=? WHERE id=?", input.state, id);
      this.repo.audit(session.host.id, "Feedback marked " + input.state + ".");
      return { ok: true };
    });
  }
}
