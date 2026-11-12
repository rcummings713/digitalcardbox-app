import { fail, keys, windowFor } from "./domain/events.mjs";
import { premiumEditions } from "../src/modules/cards/premium.ts";

export class CardDraftService {
  constructor(repo, app, canDeliver) {
    this.repo = repo;
    this.app = app;
    this.canDeliver = canDeliver;
  }
  save(token, cookie, csrf, input, studioCookie) {
    keys(input, [
      "premiumEdition",
      "requestKey",
      "name",
      "note",
      "style",
      "gif",
      "consent",
      "artId",
      "design",
    ]);
    const { premiumEdition, ...card } = input;
    if (!premiumEditions.some((e) => e.id === premiumEdition))
      fail(422, "Choose an available premium card edition.");
    return this.app.submitCard(
      token,
      cookie,
      csrf,
      card,
      studioCookie,
      premiumEdition,
    );
  }
  send(token, cookie, csrf, id, input) {
    keys(input, []);
    return this.repo.transaction(() => {
      const { event, session } = this.app.guestSession(token, cookie);
      if (!csrf || csrf !== session.csrf_token)
        fail(403, "Reopen your invitation before sending.", "csrf_failed");
      const card = this.repo.guestCard(event.id, session.guest_id, id);
      if (!card || !card.premium_edition)
        fail(404, "Your premium card draft could not be found.");
      if (card.delivery_state === "delivered")
        return {
          entry: { id: card.id, createdAt: card.created_at },
          repeated: true,
        };
      if (windowFor(event, this.repo.clock()) !== "open")
        fail(409, "This invitation is not accepting cards.");
      if (!this.canDeliver(id))
        fail(
          402,
          "Complete the premium card checkout before sending, or choose a free card.",
          "premium_payment_required",
        );
      if (card.gif && !this.repo.flags().gifs)
        fail(
          409,
          "GIFs are paused. Return to your card and remove the GIF first.",
        );
      this.repo.run(
        "UPDATE cards SET delivery_state='delivered',created_at=? WHERE id=? AND delivery_state='draft'",
        this.repo.now(),
        id,
      );
      this.repo.run(
        "UPDATE events SET locked_at=coalesce(locked_at,?),revision=revision+1 WHERE id=?",
        this.repo.now(),
        event.id,
      );
      return { entry: { id, createdAt: this.repo.now() }, repeated: false };
    });
  }
}
