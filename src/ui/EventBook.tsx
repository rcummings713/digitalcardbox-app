import { useState } from "react";
import { bookEntries, formatDate } from "./model";
import type { Occasion } from "./model";
import { Botanical, Card, Empty, Heading, Notice, download } from "./shared";
import { useStore } from "./state";

export function EventBook({ event }: { event: Occasion }) {
  const { data, actions, notify, busy } = useStore();
  const layout = event.bookLayout || "editorial";
  const [spread, setSpread] = useState(0);
  const [reading, setReading] = useState(false);
  const entries = bookEntries(data, event.id);
  const pages = Math.ceil(entries.length / 2) + 1;
  const safeSpread = Math.min(spread, pages - 1);
  const visible = entries.slice((safeSpread - 1) * 2, (safeSpread - 1) * 2 + 2);
  const price = entries.length < 100 ? 15 : entries.length < 300 ? 30 : 79;
  if (!data.flags.books)
    return (
      <Empty title="Event books are taking a little pause">
        <p>Your cards remain in your CardVault.</p>
      </Empty>
    );
  return (
    <>
      <Heading
        eyebrow="Your event book"
        title="Some feelings deserve a whole book."
      >
        <p>Only cards whose senders agreed to book inclusion appear here.</p>
      </Heading>
      <div className="book-toolbar">
        <fieldset className="book-style-choices">
          <legend>Choose your book style</legend>
          <div className="book-style-options">
            {(
              [
                {
                  value: "editorial",
                  name: "The Editorial",
                  description:
                    "An elegant album with airy typography and curated photo spreads.",
                },
                {
                  value: "collage",
                  name: "The Collage",
                  description:
                    "A rich scrapbook with layered cards, notes and photographs.",
                },
              ] as const
            ).map((style) => (
              <button
                key={style.value}
                className="book-style-option"
                aria-label={style.name}
                aria-describedby={`book-style-${style.value}`}
                aria-pressed={layout === style.value}
                disabled={busy}
                onClick={() =>
                  actions.updateEvent(event.id, { bookLayout: style.value })
                }
              >
                <strong>{style.name}</strong>
                <span id={`book-style-${style.value}`}>
                  {style.description}
                </span>
              </button>
            ))}
          </div>
        </fieldset>
        <button
          className="secondary"
          onClick={() => setReading(!reading)}
          aria-expanded={reading}
        >
          {reading ? "Return to book" : "Read as text"}
        </button>
      </div>
      {!entries.length ? (
        <Empty title="Your story is still gathering">
          <p>
            Consented cards will find their place here as guests contribute.
          </p>
        </Empty>
      ) : reading ? (
        <div className="panel book-transcript">
          <h2>{event.title}</h2>
          {entries.map((entry) => (
            <article key={entry.id}>
              <h3>From {entry.name}</h3>
              <p>{entry.note}</p>
              {entry.photo && (
                <img src={entry.photo} alt={"Memory shared by " + entry.name} />
              )}
            </article>
          ))}
        </div>
      ) : (
        <section
          className={`book-stage book-${layout}`}
          aria-label="Event book"
        >
          <div className="book-spread" aria-live="polite">
            {safeSpread === 0 ? (
              <>
                <div className="book-cover">
                  <Botanical />
                  <p className="eyebrow">A collection of love</p>
                  <h2>{event.title}</h2>
                  <div className="cover-rule" />
                  <p>{formatDate(event.date)}</p>
                  <span className="script-accent">the words we’ll keep</span>
                </div>
                <div className="book-opening">
                  <p className="eyebrow">Our people. Our beginning.</p>
                  <h3>
                    Some days become
                    <br />
                    part of who we are.
                  </h3>
                  <p>
                    These are the words, the faces,
                    <br />
                    and the little pieces of love
                    <br />
                    we took with us.
                  </p>
                  <p className="book-dedication">
                    For {event.hosts},<br />
                    from the people who love you.
                  </p>
                  <span className="book-folio">i</span>
                </div>
              </>
            ) : (
              visible.map((entry, i) => (
                <div
                  className={
                    "book-page " + (!entry.photo ? "book-page-words" : "")
                  }
                  key={entry.id}
                >
                  <p className="eyebrow">
                    {i % 2 ? "Love, in their words" : "A memory worth keeping"}
                  </p>
                  {layout === "collage" ? (
                    <Card entry={entry} small />
                  ) : (
                    <>
                      {entry.photo && (
                        <div className="book-photo">
                          <img
                            src={entry.photo}
                            alt={"A memory from " + entry.name}
                          />
                          <span className="photo-tape" aria-hidden="true" />
                        </div>
                      )}
                      <blockquote>“{entry.note}”</blockquote>
                      <p className="book-signature">— {entry.name}</p>
                      {entry.gif && (
                        <img
                          className="book-sticker"
                          src={
                            entry.gif === "cosmic"
                              ? "/gifs/cosmic-poster.png"
                              : "/gifs/" + entry.gif + ".svg"
                          }
                          alt="An illustrated keepsake sticker"
                          width="100"
                          height="100"
                        />
                      )}
                    </>
                  )}
                  <span className="book-folio">
                    {(safeSpread - 1) * 2 + i + 1}
                  </span>
                </div>
              ))
            )}
          </div>
          <div className="book-pagination">
            <button
              className="secondary"
              disabled={safeSpread === 0}
              onClick={() => setSpread(safeSpread - 1)}
            >
              ← Previous
            </button>
            <span>
              Spread {safeSpread + 1} of {pages}
            </span>
            <button
              className="secondary"
              disabled={safeSpread === pages - 1}
              onClick={() => setSpread(safeSpread + 1)}
            >
              Next →
            </button>
          </div>
        </section>
      )}
      <div className="book-summary">
        <section>
          <h2>A keepsake, on your terms.</h2>
          <p>
            {entries.length} included{" "}
            {entries.length === 1 ? "entry" : "entries"} · projected polished
            book ${price}. Final price follows the included entry count when
            contributions close. Your basic CardVault export remains available
            without purchasing.
          </p>
          <div className="buttons">
            <button
              className="secondary"
              onClick={() => {
                download(
                  "TheDigitalCardBox-event-book.txt",
                  `${event.title}\n${formatDate(event.date)}\n\n` +
                    entries
                      .map((x) => `From ${x.name}\n${x.note}`)
                      .join("\n\n"),
                );
                notify("Your readable event-book file is ready.");
              }}
            >
              Export readable book ↓
            </button>
            <button className="secondary" onClick={() => window.print()}>
              Print this view
            </button>
          </div>
        </section>
        <section className="panel">
          <p className="eyebrow">The polished edition</p>
          <h3>Room for every memory.</h3>
          <p className="small">
            No guest is blocked by a book tier. Payment and high-resolution book
            delivery are not connected yet.
          </p>
          <Notice>Enjoy arranging your book. No purchase has been made.</Notice>
        </section>
      </div>
    </>
  );
}
