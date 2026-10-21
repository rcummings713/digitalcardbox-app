import {
  validIdentifier,
  reviewDestination,
  fictionalIdentifier,
} from "../src/modules/gifts/routing.ts";
import { randomUUID } from "node:crypto";
import { consume } from "./media-service.mjs";
import { hash, secret, publicHost } from "./domain/identity.mjs";
import {
  fail,
  keys,
  text,
  validateEvent,
  validateCard,
  windowFor,
} from "./domain/events.mjs";

// Application operations use explicit repository contracts; no React/browser state is accepted.
export class ReviewApplication {
  constructor(repository, identity) {
    this.repo = repository;
    this.identity = identity;
  }
  login(input) {
    keys(input, ["email", "password"]);
    const email = text(input.email, "email address", 254).toLowerCase();
    const password = text(input.password, "password", 200);
    const host = this.identity.authenticate(email, password);
    if (!host)
      fail(401, "The email or password is incorrect.", "invalid_credentials");
    const token = secret();
    const csrf = secret();
    const expires = new Date(
      this.repo.clock().getTime() + 8 * 3600000,
    ).toISOString();
    this.repo.putHostSession(hash(token), host.id, csrf, expires);
    return {
      token,
      account: publicHost(host),
      csrfToken: csrf,
      expiresAt: expires,
    };
  }
  startReview(ip) {
    return this.repo.transaction(() => {
      consume(
        this.repo,
        "review:ip:" + hash(this.repo.key.toString("hex") + ip),
        this.repo.now().slice(0, 10),
        5,
      );
      const id = "visitor-" + randomUUID();
      this.repo.run(
        "INSERT INTO hosts (id,email,name,role,password_salt,password_hash) VALUES(?,?,?,'host',?,?)",
        id,
        id + "@review.invalid",
        "My workspace",
        secret(),
        secret(),
      );
      const token = secret(),
        csrf = secret();
      this.repo.putHostSession(
        hash(token),
        id,
        csrf,
        new Date(this.repo.clock().getTime() + 7 * 86400000).toISOString(),
      );
      return {
        token,
        account: publicHost(this.repo.host(id)),
        csrfToken: csrf,
      };
    });
  }
  session(token) {
    const session = token && this.repo.hostSession(hash(token));
    if (!session) return null;
    const host = this.repo.host(session.host_id);
    return host ? { ...session, host } : null;
  }
  requireHost(session) {
    if (!session)
      fail(401, "Sign in to open your card boxes.", "sign_in_required");
    return session.host;
  }
  requireOperator(session) {
    const host = this.requireHost(session);
    if (host.role !== "operator")
      fail(403, "This view requires a site administrator.");
    return host;
  }
  ownedEvent(session, id) {
    const host = this.requireHost(session);
    const event = this.repo.ownedEvent(host.id, id);
    if (!event) fail(404, "Card box not found.");
    return event;
  }
  revision(event, expected) {
    if (expected === undefined)
      fail(428, "Refresh the card box before saving.");
    if (String(event.revision) !== String(expected))
      fail(
        409,
        "This card box changed. Refresh it before saving.",
        "stale_revision",
      );
  }
  createEvent(session, input) {
    const host = this.requireHost(session);
    if (!this.repo.flags().newEvents) fail(409, "New card boxes are paused.");
    const value = validateEvent(input, null, this.repo.clock());
    return this.repo.transaction(() => {
      const event = this.repo.createEvent(host.id, value);
      this.repo.audit(host.id, "Card box created.", event.id);
      return event;
    });
  }
  updateEvent(session, id, input, expected) {
    return this.repo.transaction(() => {
      const row = this.ownedEvent(session, id);
      this.revision(row, expected);
      const current = { ...row, bookLayout: row.book_layout };
      const value = validateEvent(input, current, this.repo.clock());
      this.repo.updateEvent(id, value);
      this.repo.audit(session.host.id, "Card box settings updated.", id);
      return this.repo.event(this.repo.ownedEvent(session.host.id, id));
    });
  }
  rotateLink(session, id, expected) {
    return this.repo.transaction(() => {
      const row = this.ownedEvent(session, id);
      this.revision(row, expected);
      this.repo.rotateLink(id);
      this.repo.audit(
        session.host.id,
        "Guest link replaced; earlier guest sessions revoked.",
        id,
      );
      return this.repo.event(this.repo.ownedEvent(session.host.id, id));
    });
  }
  invitation(token, cookieToken) {
    const event = this.repo.resolveLink(hash(token));
    if (!event) fail(404, "Your invitation is not available.");
    const existing =
      cookieToken &&
      this.repo.guestSession(hash(cookieToken), event.id, event.share_id);
    if (existing)
      return {
        event: this.repo.event(event, { guest: true }),
        window: windowFor(event, this.repo.clock()),
        flags: this.repo.flags(),
        csrfToken: existing.csrf_token,
      };
    const newToken = secret();
    const csrf = secret();
    const expires = new Date(
      this.repo.clock().getTime() + 24 * 3600000,
    ).toISOString();
    this.repo.transaction(() =>
      this.repo.putGuestSession(
        hash(newToken),
        event.id,
        event.share_id,
        csrf,
        expires,
      ),
    );
    return {
      event: this.repo.event(event, { guest: true }),
      window: windowFor(event, this.repo.clock()),
      flags: this.repo.flags(),
      csrfToken: csrf,
      cookieToken: newToken,
    };
  }
  guestSession(token, cookieToken) {
    const event = this.repo.resolveLink(hash(token));
    if (!event) fail(404, "Your invitation is not available.");
    const session =
      cookieToken &&
      this.repo.guestSession(hash(cookieToken), event.id, event.share_id);
    if (!session)
      fail(
        401,
        "Reopen your invitation before sending the card.",
        "guest_session_required",
      );
    return { event, session };
  }
  submitCard(token, cookieToken, csrf, input) {
    return this.repo.transaction(() => {
      const { event, session } = this.guestSession(token, cookieToken);
      if (!csrf || csrf !== session.csrf_token)
        fail(
          403,
          "Refresh your invitation before sending the card.",
          "csrf_failed",
        );
      const flags = this.repo.flags();
      const previous =
        typeof input?.requestKey === "string" &&
        this.repo.cardByRequest(session.guest_id, input.requestKey);
      if (previous) {
        const candidate = validateCard(input, { ...flags, gifs: true });
        if (
          !["name", "note", "style", "gif"].every(
            (k) => candidate[k] === previous[k],
          ) ||
          candidate.consent !== !!previous.consent ||
          (candidate.artId ?? null) !== previous.art_id
        )
          fail(
            409,
            "This submission reference has already been used. Start a new card.",
          );
        return {
          entry: { id: previous.id, createdAt: previous.created_at },
          repeated: true,
        };
      }
      if (windowFor(event, this.repo.clock()) !== "open")
        fail(409, "This invitation is not accepting cards.");
      const value = validateCard(input, flags);
      if (
        value.artId &&
        !this.repo.one(
          "SELECT id FROM card_art WHERE id=? AND event_id=? AND guest_id=?",
          value.artId,
          event.id,
          session.guest_id,
        )
      )
        fail(404, "Your card artwork could not be found.");
      const entry = this.repo.insertCard(event.id, session.guest_id, value);
      // A guest receives only a receipt for their own submission, never the host inbox.
      return {
        entry: { id: entry.id, createdAt: entry.createdAt },
        repeated: false,
      };
    });
  }
  saveDestination(session, id, input, expected) {
    return this.repo.transaction(() => {
      const event = this.ownedEvent(session, id);
      this.revision(event, expected);
      keys(input, [
        "service",
        "identifier",
        "recipient",
        "repeatIdentifier",
        "checked",
        "previewOnly",
        "enabled",
        "version",
      ]);
      if (!["Cash App", "Venmo", "Zelle"].includes(input.service))
        fail(422, "Choose a supported service.");
      const previous = this.repo
        .destinations(id)
        .find((d) => d.service === input.service);
      if ((previous?.version ?? 0) !== input.version)
        fail(409, "Refresh the destination before saving.", "stale_revision");
      let value;
      if (input.enabled === false && previous)
        value = {
          ...previous,
          enabled: false,
          confirmed: false,
          version: previous.version + 1,
        };
      else {
        const identifier = text(input.identifier, "identifier", 100);
        const recipient = text(input.recipient, "recipient", 100);
        if (
          input.enabled !== true ||
          input.checked !== true ||
          input.repeatIdentifier !== identifier ||
          typeof input.previewOnly !== "boolean" ||
          !validIdentifier(input.service, identifier)
        )
          fail(
            422,
            "Enter matching valid identifiers and confirm the recipient in the service.",
          );
        // A reserved test email must never become an external payee.
        if (!input.previewOnly && fictionalIdentifier(identifier))
          fail(422, "Keep fictional recipients in preview mode.");
        value = {
          service: input.service,
          identifier,
          recipient,
          previewOnly: input.previewOnly,
          enabled: true,
          confirmed: true,
          version: (previous?.version ?? 0) + 1,
        };
      }
      this.repo.saveDestination(id, value);
      this.repo.audit(
        session.host.id,
        value.service +
          " destination " +
          (value.enabled ? "host confirmed" : "paused") +
          ".",
        id,
      );
      return this.repo.event(this.repo.ownedEvent(session.host.id, id));
    });
  }
  prepareGift(token, cookieToken, csrf, input) {
    return this.repo.transaction(() => {
      const { event, session } = this.guestSession(token, cookieToken);
      if (!csrf || csrf !== session.csrf_token)
        fail(403, "Refresh your invitation before continuing.", "csrf_failed");
      if (
        !this.repo.flags().gifts ||
        !["open", "gift-only"].includes(windowFor(event, this.repo.clock()))
      )
        fail(409, "Gift services are unavailable for this invitation.");
      keys(input, [
        "requestKey",
        "service",
        "version",
        "name",
        "alias",
        "amount",
        "reference",
        "entryId",
        "acknowledged",
      ]);
      if (input.acknowledged !== true)
        fail(422, "Review the exact recipient before continuing.");
      let destination;
      try {
        destination = reviewDestination(
          this.repo.destinations(event.id),
          input.service,
          input.version,
        );
      } catch (error) {
        fail(409, error.message, "stale_destination");
      }
      const value = {
        requestKey: text(input.requestKey, "submission reference", 100),
        name: text(input.name, "name", 80),
        alias: text(input.alias, "payment-app name", 80, false),
        amount: text(input.amount, "amount", 20, false),
        reference: text(input.reference, "matching reference", 40),
        entryId:
          input.entryId == null
            ? null
            : text(input.entryId, "card reference", 100),
      };
      if (
        !/^DCB-[A-F0-9]{8}$/.test(value.reference) ||
        (value.amount &&
          (!/^\d{1,5}(?:\.\d{1,2})?$/.test(value.amount) ||
            +value.amount < 1 ||
            +value.amount > 10000))
      )
        fail(422, "Check the amount and matching reference.");
      if (
        value.entryId &&
        !this.repo.one(
          "SELECT id FROM cards WHERE id=? AND event_id=? AND guest_id=? AND removed_at IS NULL",
          value.entryId,
          event.id,
          session.guest_id,
        )
      )
        fail(404, "Your linked card could not be found.");
      let row = this.repo.giftByRequest(session.guest_id, value.requestKey);
      if (
        row &&
        (row.service !== destination.service ||
          row.destination_version !== destination.version ||
          row.recipient !== destination.recipient ||
          row.identifier !== destination.identifier ||
          ["name", "alias", "amount", "reference"].some(
            (k) => row[k] !== value[k],
          ) ||
          row.entry_id !== value.entryId)
      )
        fail(409, "These gift details changed. Review and save a new handoff.");
      const repeated = !!row;
      if (!row)
        row = this.repo.insertGift(
          event.id,
          session.guest_id,
          value,
          destination,
        );
      return {
        gift: this.repo.gift(row),
        handoff: {
          giftId: row.id,
          service: destination.service,
          recipient: destination.recipient,
          identifier: destination.identifier,
          version: destination.version,
          previewOnly: destination.previewOnly !== false,
          reference: row.reference,
          amount: row.amount,
        },
        repeated,
      };
    });
  }
  confirmGift(session, id, input) {
    const host = this.requireHost(session);
    keys(input, ["received", "checked"]);
    if (
      typeof input.received !== "boolean" ||
      (input.received && input.checked !== true)
    )
      fail(422, "Check your payment account before confirming receipt.");
    return this.repo.transaction(() => {
      const gift = this.repo.ownedGift(host.id, id);
      if (!gift) fail(404, "Gift details not found.");
      this.repo.run(
        "UPDATE gift_intents SET status=? WHERE id=?",
        input.received ? "host-confirmed" : "unconfirmed",
        id,
      );
      this.repo.audit(
        host.id,
        "Host " +
          (input.received ? "confirmed" : "undid confirmation of") +
          " gift " +
          gift.reference +
          "; not provider verified.",
        gift.event_id,
      );
      return { ok: true };
    });
  }
  moderateCard(session, id, action) {
    const host = this.requireHost(session);
    if (!["hide", "restore", "remove"].includes(action))
      fail(422, "Choose a valid card action.");
    return this.repo.transaction(() => {
      const card = this.repo.ownedCard(host.id, id);
      if (!card) fail(404, "Card not found.");
      this.repo.moderateCard(id, action);
      this.repo.audit(
        host.id,
        `Card ${action === "remove" ? "removed" : action === "hide" ? "hidden from book" : "restored"}.`,
        card.event_id,
      );
      return { ok: true };
    });
  }
  book(session, id) {
    const row = this.ownedEvent(session, id);
    if (!this.repo.flags().books) fail(409, "Event books are paused.");
    return { event: this.repo.event(row), entries: this.repo.bookCards(id) };
  }
  saveProfile(session, input) {
    const host = this.requireHost(session);
    keys(input, ["name", "reducedMotion"]);
    if (typeof input.reducedMotion !== "boolean")
      fail(422, "Choose a motion preference.");
    return publicHost(
      this.repo.saveProfile(host.id, {
        name: text(input.name, "name", 80),
        reducedMotion: input.reducedMotion,
      }),
    );
  }
  setFlag(session, key, input) {
    const host = this.requireOperator(session);
    keys(input, ["enabled"]);
    if (
      !Object.hasOwn(this.repo.flags(), key) ||
      typeof input.enabled !== "boolean"
    )
      fail(422, "Choose a valid feature setting.");
    return this.repo.transaction(() => {
      this.repo.setFlag(key, input.enabled);
      this.repo.audit(
        host.id,
        `Feature ${key} ${input.enabled ? "enabled" : "disabled"}.`,
      );
      return this.repo.flags();
    });
  }
}
