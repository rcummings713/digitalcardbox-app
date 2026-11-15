import { fail, keys } from "./domain/events.mjs";

// DEV CardVault export pages have an authenticated, short-lived continuation.
// The production private-object export contract remains with DCB-E07-S03.
export class VaultService {
  constructor(repo) {
    this.repo = repo;
  }
  exportPage(app, session, eventId, input) {
    keys(input, ["cursor"]);
    if (input.cursor !== undefined &&
      (typeof input.cursor !== "string" || input.cursor.length > 2000))
      fail(422, "Start the card export again.");
    return this.repo.transaction(() => {
      const event = app.ownedEvent(session, eventId);
      app.requireRecentAuthentication(session);
      let prior;
      if (input.cursor) {
        try {
          prior = JSON.parse(this.repo.decrypt(input.cursor));
        } catch {
          fail(422, "Start the card export again.");
        }
        if (prior.hostId !== session.host.id || prior.eventId !== event.id)
          fail(404, "Card export not found.");
        if (!Number.isFinite(prior.expiresAt) || prior.expiresAt <= this.repo.clock().getTime())
          fail(409, "This export expired. Start the card export again.", "export_expired");
        if (prior.revision !== event.revision)
          fail(409, "The card box changed. Start the export again to include its current cards.", "export_changed");
        if (!Array.isArray(prior.after) || prior.after.length !== 2 ||
          !prior.after.every((value) => typeof value === "string"))
          fail(422, "Start the card export again.");
      }
      const page = this.repo.exportCardsPage(event.id, prior?.after);
      if (prior && page.total !== prior.total)
        fail(409, "The card box changed. Start the export again to include its current cards.", "export_changed");
      if (!prior)
        this.repo.audit(session.host.id, "Private CardVault export requested.", event.id);
      return {
        entries: page.entries,
        eventTitle: event.title,
        total: page.total,
        nextCursor: page.next ? this.repo.encrypt(JSON.stringify({
          hostId: session.host.id,
          eventId: event.id,
          revision: event.revision,
          total: page.total,
          expiresAt: prior?.expiresAt ?? this.repo.clock().getTime() + 5 * 60000,
          after: page.next,
        })) : null,
      };
    });
  }
}
