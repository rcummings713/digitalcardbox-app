import { cardArchive } from "../modules/media/archive";
import { validIdentifier, fictionalIdentifier } from "../modules/gifts/routing";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  eventTypes,
  eventWindow,
  formatDate,
  initialStore,
  uid,
} from "./model";
import type { Destination, Occasion, Service } from "./model";
import {
  Card,
  Empty,
  Heading,
  Link,
  Notice,
  QR,
  Status,
  copy,
  download,
  go,
} from "./shared";
import { useStore } from "./state";
import { EventBook } from "./EventBook";

export function Workspace() {
  const { data } = useStore();
  return (
    <>
      <Heading
        eyebrow="Your CardVault"
        title={`A little hello, ${data.profile.name}.`}
        action={
          <Link to="/workspace/new" className="primary">
            Create a card box +
          </Link>
        }
      >
        <p>Your occasions, your people, your memories.</p>
      </Heading>
      <div className="event-grid">
        {data.events.map((event) => (
          <article className="event-tile" key={event.id}>
            <Link to={`/workspace/events/${event.id}/overview`}>
              <img src={`/images/${event.cover}.jpg`} alt="" />
              <div>
                <div className="row-between">
                  <p className="eyebrow">{event.type}</p>
                  <Status>{eventWindow(event)}</Status>
                </div>
                <h2>{event.title}</h2>
                <p>{formatDate(event.date)}</p>
                <div className="event-counts">
                  <span>
                    {data.entries.filter((x) => x.eventId === event.id).length}{" "}
                    cards
                  </span>
                  <span>Open card box ↗</span>
                </div>
              </div>
            </Link>
          </article>
        ))}
      </div>
      <section className="workspace-tip">
        <span className="script-accent">a thoughtful tip</span>
        <p>
          Send your link with a personal invitation. Your card box is never
          listed in a public event directory.
        </p>
      </section>
    </>
  );
}
export function EventForm({ event }: { event?: Occasion }) {
  const { data, actions, notify, busy } = useStore();
  const [type, setType] = useState(
    event?.type ||
      new URLSearchParams(location.search).get("occasion") ||
      "Wedding",
  );
  const [error, setError] = useState("");
  const locked =
    !!event &&
    (!!event.locked || data.entries.some((x) => x.eventId === event.id));
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const date = String(f.get("date") || event?.date);
    const title = String(f.get("title")).trim();
    const hosts = String(f.get("hosts")).trim();
    if (!title || !hosts) {
      setError("Add an occasion title and host name.");
      return;
    }
    if (!date || !Number.isFinite(new Date(date).getTime())) {
      setError("Choose a valid date.");
      return;
    }
    if (type === "One-off occasion" && !locked) {
      const days =
        (new Date(date + "T12:00:00Z").getTime() - Date.now()) / 86400000;
      if (days < 0 || days > 90) {
        setError("Choose a closing date within the next 90 days.");
        return;
      }
    }
    const created: Occasion = {
      id: event?.id || uid(),
      token: event?.token || uid(),
      title,
      hosts,
      type: locked ? event!.type : type,
      date,
      timezone: String(f.get("timezone") || event?.timezone),
      location: String(f.get("location")).trim(),
      welcome: String(f.get("welcome")).trim(),
      cover: String(f.get("cover")),
      status: event?.status || "draft",
      bookLayout: event?.bookLayout,
      destinations: event?.destinations || [],
    };
    const saved = await actions.saveEvent(created);
    if (!saved) return;
    notify(
      event
        ? "Your event details have been saved."
        : "Your card box is ready to make your own.",
    );
    go(`/workspace/events/${saved.id}/overview`);
  }
  if (!event && !data.flags.newEvents)
    return (
      <Empty title="New card boxes are paused">
        <p>Your existing card boxes are still here.</p>
        <Link to="/workspace" className="secondary">
          Back to my card boxes
        </Link>
      </Empty>
    );
  return (
    <>
      <Heading
        eyebrow={event ? "Make it yours" : "Let’s begin"}
        title={
          event ? "The details, thoughtfully." : "What are we celebrating?"
        }
      />
      <form className="panel form-panel" onSubmit={submit}>
        <div className="form-grid">
          <div>
            <label htmlFor="event-type">Occasion</label>
            <select
              id="event-type"
              name="type"
              value={type}
              disabled={locked}
              onChange={(e) => setType(e.target.value)}
            >
              {eventTypes.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="event-title">Card box title</label>
            <input
              id="event-title"
              name="title"
              required
              maxLength={100}
              defaultValue={event?.title}
              placeholder="Alex & Maya"
            />
          </div>
          <div>
            <label htmlFor="event-hosts">Host name or names</label>
            <input
              id="event-hosts"
              name="hosts"
              required
              maxLength={100}
              defaultValue={event?.hosts}
              placeholder="How guests know you"
            />
          </div>
          <div>
            <label htmlFor="event-date">
              {type === "One-off occasion" ? "Closing date" : "Event date"}
            </label>
            <input
              id="event-date"
              name="date"
              type="date"
              required
              disabled={locked}
              defaultValue={event?.date}
              aria-describedby={locked ? "locked-date" : undefined}
            />
          </div>
          <div>
            <label htmlFor="event-timezone">Event time zone</label>
            <select
              id="event-timezone"
              name="timezone"
              disabled={locked}
              defaultValue={event?.timezone || "America/New_York"}
            >
              {[
                "America/New_York",
                "America/Chicago",
                "America/Denver",
                "America/Los_Angeles",
                "Europe/London",
                "Europe/Paris",
                "Asia/Tokyo",
                "Australia/Sydney",
                "UTC",
              ].map((zone) => (
                <option key={zone}>{zone}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="event-location">
              Location <span className="optional">optional</span>
            </label>
            <input
              id="event-location"
              name="location"
              maxLength={160}
              defaultValue={event?.location}
            />
          </div>
        </div>
        {locked && (
          <p className="small" id="locked-date">
            The date and occasion are locked after the first contribution.
            Contact support for a correction.
          </p>
        )}
        <label htmlFor="event-welcome">A welcome for your guests</label>
        <textarea
          id="event-welcome"
          name="welcome"
          rows={4}
          maxLength={800}
          defaultValue={
            event?.welcome ||
            "We’re so glad you’re here. Leave us a little note, a memory, or your wishes for the days ahead."
          }
        />
        <label htmlFor="event-cover">Set the mood</label>
        <select
          name="cover"
          id="event-cover"
          defaultValue={event?.cover || "celebration"}
        >
          <option value="celebration">Candlelit celebration</option>
          <option value="flowers">Soft blooms</option>
          <option value="tea">Quiet moments</option>
        </select>
        <p className="small">
          {type === "One-off occasion"
            ? "Your page accepts contributions until the closing date, within 90 days of publishing."
            : "Cards and photos close 90 days after your event. " +
              (type === "Wedding"
                ? "Wedding gifts can stay open for 12 months."
                : "Gifts close with contributions.")}{" "}
          Your CardVault remains available to you.
        </p>
        {error && (
          <p role="alert" className="field-error">
            {error}
          </p>
        )}
        <div className="buttons">
          <button className="primary" disabled={busy}>
            {busy
              ? "Saving…"
              : event
                ? "Save event details"
                : "Create card box"}
          </button>
          <Link
            className="secondary"
            to={event ? `/workspace/events/${event.id}/overview` : "/workspace"}
          >
            Cancel
          </Link>
        </div>
      </form>
    </>
  );
}
export function EventWorkspace({ id, tab }: { id: string; tab: string }) {
  const { data } = useStore();
  const event = data.events.find((x) => x.id === id);
  if (!event)
    return (
      <Empty title="Card box not found">
        <Link to="/workspace">Back to my card boxes</Link>
      </Empty>
    );
  const base = `/workspace/events/${id}`;
  const tabs = [
    ["overview", "Overview"],
    ["edit", "Event details"],
    ["share", "Invite & share"],
    ["cards", "Cards & notes"],
    ["gifts", "Gift matching"],
    ["book", "Event book"],
    ["settings", "Event settings"],
  ];
  return (
    <div className="workspace-layout">
      <aside className="workspace-sidebar">
        <Link to="/workspace" className="back-link">
          ← All card boxes
        </Link>
        <p className="eyebrow">{event.type}</p>
        <h2>{event.title}</h2>
        <nav aria-label="Manage event">
          {tabs.map(([slug, title]) => (
            <Link
              key={slug}
              to={`${base}/${slug}`}
              aria-current={tab === slug ? "page" : undefined}
            >
              {title}
            </Link>
          ))}
        </nav>
        <div className="sidebar-note">
          <span aria-hidden="true">♡</span>
          <p>
            Keep the words.
            <br />
            Keep the feeling.
          </p>
        </div>
      </aside>
      <div className="workspace-content">
        {tab === "overview" ? (
          <Overview event={event} />
        ) : tab === "edit" ? (
          <EventForm event={event} />
        ) : tab === "share" ? (
          <Share event={event} />
        ) : tab === "cards" ? (
          <CardsInbox event={event} />
        ) : tab === "gifts" ? (
          <Gifts event={event} />
        ) : tab === "book" ? (
          <EventBook event={event} />
        ) : tab === "settings" ? (
          <EventSettings event={event} />
        ) : (
          <Empty title="Page not found">
            <Link to={base + "/overview"}>Back to overview</Link>
          </Empty>
        )}
      </div>
    </div>
  );
}
function Overview({ event }: { event: Occasion }) {
  const { data } = useStore();
  const entries = data.entries.filter((x) => x.eventId === event.id);
  const gifts = data.gifts.filter((x) => x.eventId === event.id);
  const base = `/workspace/events/${event.id}`;
  return (
    <>
      <Heading
        eyebrow={event.type + " · " + formatDate(event.date)}
        title={event.title}
        action={<Status>{eventWindow(event)}</Status>}
      >
        <p>A place for all the love coming your way.</p>
      </Heading>
      <div className="stat-grid">
        <div>
          <strong>{entries.length}</strong>
          <span>Cards & notes</span>
        </div>
        <div>
          <strong>{entries.filter((x) => x.photo).length}</strong>
          <span>Photos to keep</span>
        </div>
        <div>
          <strong>
            {gifts.filter((x) => x.status === "unconfirmed").length}
          </strong>
          <span>Gifts to check</span>
        </div>
      </div>
      {event.status === "draft" && (
        <Notice>
          Your card box is a draft. Review your details, then publish from
          Invite & share.
        </Notice>
      )}
      <div className="dashboard-split">
        <section className="panel">
          <p className="eyebrow">Your next little steps</p>
          <h2>Make it feel like you.</h2>
          <div className="action-list">
            <Link to={base + "/edit"}>
              <span>01</span>
              <div>
                <strong>Perfect the details</strong>
                <p>Add your welcome and set the mood.</p>
              </div>
              <span>↗</span>
            </Link>
            <Link to={base + "/share"}>
              <span>02</span>
              <div>
                <strong>Invite your people</strong>
                <p>One event link. One beautiful gathering.</p>
              </div>
              <span>↗</span>
            </Link>
            <Link to={base + "/book"}>
              <span>03</span>
              <div>
                <strong>Open your event book</strong>
                <p>Watch your memories find their place.</p>
              </div>
              <span>↗</span>
            </Link>
          </div>
        </section>
        <section className="panel">
          <p className="eyebrow">The latest kind words</p>
          {entries.length ? (
            <>
              <blockquote className="featured-quote">
                “{entries[0].note}”
              </blockquote>
              <p className="small">— {entries[0].name}</p>
              <Link to={base + "/cards"} className="text-link">
                Open your CardVault ↗
              </Link>
            </>
          ) : (
            <Empty title="The first note is on its way">
              <p>Share your invitation to bring your people in.</p>
            </Empty>
          )}
        </section>
      </div>
    </>
  );
}
function Share({ event }: { event: Occasion }) {
  const { actions, notify, mode, busy, configuration } = useStore();
  const url =
    (configuration.publicSiteUrl || location.origin) + "/g/" + event.token;
  async function publish() {
    if (await actions.updateEvent(event.id, { status: "published" }))
      notify(
        mode === "server"
          ? "Your guest link is ready to share."
          : "Your guest link is available in this browser.",
      );
  }
  return (
    <>
      <Heading
        eyebrow="Invite & share"
        title="A little invitation. A lot of love."
      />
      <section className="panel">
        <h2>Your guests start here.</h2>
        <p>
          Share your link directly with the people you want to hear from. Your
          event isn’t in a public directory.
        </p>
        {event.status === "draft" ? (
          <>
            <Notice>
              Review the event details before making your invitation available.
            </Notice>
            <button className="primary" onClick={publish} disabled={busy}>
              Publish guest link
            </button>
          </>
        ) : (
          <>
            <label htmlFor="share-link">Guest invitation link</label>
            <div className="input-action">
              <input id="share-link" value={url} readOnly />
              <button className="primary" onClick={() => copy(url, notify)}>
                Copy link
              </button>
            </div>
            <div className="buttons">
              <Link className="secondary" to={"/g/" + event.token}>
                See what guests see ↗
              </Link>
              <button
                className="secondary"
                onClick={() =>
                  copy(
                    `We’d love a little note from you. Join ${event.title}: ${url}`,
                    notify,
                  )
                }
              >
                Copy invitation wording
              </button>
            </div>
            <div className="share-qr">
              <QR url={url} />
              <div>
                <h3>At the table. On the invitation.</h3>
                <p>
                  Download your QR for a place card or event sign. It opens the
                  same guest invitation as your link.
                </p>
                <p className="small">
                  {mode === "server"
                    ? configuration.hosted
                      ? "This live invitation opens on another phone or browser. The QR contains the same private guest link; it never contains a payment identifier."
                      : "Use the network address shown when the app starts for another phone on the same Wi-Fi. A localhost address cannot open on someone else’s phone."
                    : "For this design review, open the link in the same browser and device. Custom card boxes are stored on this device."}
                </p>
              </div>
            </div>
          </>
        )}
      </section>
    </>
  );
}
function CardsInbox({ event }: { event: Occasion }) {
  const { data, actions, notify, busy } = useStore();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [opened, setOpened] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const entries = data.entries.filter(
    (x) =>
      x.eventId === event.id &&
      `${x.name} ${x.note}`.toLowerCase().includes(query.toLowerCase()) &&
      (filter === "all" ||
        (filter === "book" && x.consent && !x.hidden) ||
        (filter === "hidden" && x.hidden)),
  );
  async function exportCards() {
    const cards = data.entries.filter(
      (x) => x.eventId === event.id && !x.hidden,
    );
    setExporting(true);
    setExportError("");
    try {
      const saved = await cardArchive(event.title, cards);
      download(
        "TheDigitalCardBox-CardVault.json",
        JSON.stringify(saved, null, 2),
        "application/json",
      );
      notify(
        "Your cards and animations are saved together. Keep the file somewhere private.",
      );
    } catch (error) {
      setExportError(
        error instanceof Error
          ? error.message
          : "Your cards could not be exported. Please try again.",
      );
    } finally {
      setExporting(false);
    }
  }
  return (
    <>
      <Heading
        eyebrow="Your CardVault"
        title="Every word, kept close."
        action={
          <button
            className="secondary"
            disabled={exporting}
            onClick={exportCards}
          >
            {exporting ? "Saving animations…" : "Export cards ↓"}
          </button>
        }
      />
      {exportError && <p role="alert">{exportError}</p>}
      <div className="filter-bar">
        <div>
          <label htmlFor="card-search">Find a card</label>
          <input
            id="card-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search names or words"
          />
        </div>
        <div>
          <label htmlFor="card-filter">Show</label>
          <select
            id="card-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All cards</option>
            <option value="book">Included in book</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>
      </div>
      {entries.length ? (
        <div className="inbox-grid">
          {entries.map((entry) => (
            <section className="inbox-item" key={entry.id}>
              <Card small entry={entry} />
              <div className="row-between">
                <h3>{entry.name}</h3>
                <Status>
                  {entry.hidden
                    ? "Hidden"
                    : entry.consent
                      ? "In event book"
                      : "Host only"}
                </Status>
              </div>
              <button
                className="text-link"
                onClick={() => setOpened(opened === entry.id ? "" : entry.id)}
                aria-expanded={opened === entry.id}
              >
                Read & manage card {opened === entry.id ? "−" : "+"}
              </button>
              {opened === entry.id && (
                <div className="card-management">
                  <p>{entry.note}</p>
                  <p className="small">
                    {entry.consent
                      ? "The sender agreed to include this card in the event book."
                      : "The sender chose host-only visibility. This card is excluded from the event book."}
                  </p>
                  <div className="buttons">
                    <button
                      className="secondary"
                      disabled={busy}
                      onClick={() =>
                        actions.moderateCard(
                          entry.id,
                          entry.hidden ? "restore" : "hide",
                        )
                      }
                    >
                      {entry.hidden ? "Restore card" : "Hide from book"}
                    </button>
                    <button
                      className="text-link danger"
                      disabled={busy}
                      onClick={async () => {
                        if (
                          window.confirm(
                            "Remove this card? This cannot be undone.",
                          ) &&
                          (await actions.moderateCard(entry.id, "remove"))
                        )
                          notify("The card was removed.");
                      }}
                    >
                      Remove card
                    </button>
                  </div>
                </div>
              )}
            </section>
          ))}
        </div>
      ) : (
        <Empty title="No cards found">
          <p>Try a different name or filter.</p>
        </Empty>
      )}
    </>
  );
}
function Gifts({ event }: { event: Occasion }) {
  const { data, actions, notify } = useStore();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [checking, setChecking] = useState("");
  const [checked, setChecked] = useState(false);
  const gifts = data.gifts.filter(
    (x) =>
      x.eventId === event.id &&
      `${x.name} ${x.alias} ${x.reference}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (filter === "all" || x.status === filter),
  );
  return (
    <>
      <Heading
        eyebrow="Gift matching"
        title="A name. A note. A clearer connection."
      />
      <Notice>
        Check your own payment account before marking receipt. Guest details and
        reference codes help you match a gift; they do not verify a transfer.
      </Notice>
      <div className="filter-bar">
        <div>
          <label htmlFor="gift-search">Find a gift</label>
          <input
            id="gift-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name, payment name, or reference"
          />
        </div>
        <div>
          <label htmlFor="gift-filter">Receipt status</label>
          <select
            id="gift-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All gifts</option>
            <option value="unconfirmed">Needs checking</option>
            <option value="host-confirmed">Host confirmed</option>
          </select>
        </div>
      </div>
      <div className="gift-list">
        {gifts.map((gift) => (
          <section className="panel gift-item" key={gift.id}>
            <div className="row-between">
              <div>
                <p className="eyebrow">
                  {gift.service} · {gift.date}
                </p>
                <h2>{gift.name}</h2>
              </div>
              <Status>
                {gift.status === "host-confirmed"
                  ? "Host confirmed"
                  : "Unconfirmed"}
              </Status>
            </div>
            <dl className="detail-grid">
              <div>
                <dt>Payment-app name</dt>
                <dd>{gift.alias || "Not provided"}</dd>
              </div>
              <div>
                <dt>Intended gift</dt>
                <dd>{gift.amount ? "$" + gift.amount : "Not specified"}</dd>
              </div>
              <div>
                <dt>Matching reference</dt>
                <dd>
                  <code>{gift.reference}</code>
                </dd>
              </div>
              <div>
                <dt>Linked card</dt>
                <dd>
                  {data.entries.find((x) => x.id === gift.entryId)?.name ||
                    "Gift without a card"}
                </dd>
              </div>
            </dl>
            {checking === gift.id ? (
              <div className="receipt-review">
                <label className="check">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => setChecked(e.target.checked)}
                  />
                  <span>
                    I checked the matching sender and amount inside my{" "}
                    {gift.service} account and received this gift.
                  </span>
                </label>
                <div className="buttons">
                  <button
                    className="primary"
                    disabled={!checked}
                    onClick={async () => {
                      if (!(await actions.confirmGift(gift.id, true))) return;
                      setChecking("");
                      notify(
                        "Recorded as host confirmed. This is your confirmation, not a provider verification.",
                      );
                    }}
                  >
                    Mark host confirmed
                  </button>
                  <button className="secondary" onClick={() => setChecking("")}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : gift.status === "unconfirmed" ? (
              <button
                className="secondary"
                onClick={() => {
                  setChecking(gift.id);
                  setChecked(false);
                }}
              >
                Check receipt
              </button>
            ) : (
              <button
                className="text-link"
                onClick={() => actions.confirmGift(gift.id, false)}
              >
                Undo host confirmation
              </button>
            )}
          </section>
        ))}
        {!gifts.length && (
          <Empty title="No gifts to show">
            <p>
              A card never needs a gift. Gift details appear here when a guest
              chooses to share them.
            </p>
          </Empty>
        )}
      </div>
      <section className="panel">
        <h2>When two guests share a name.</h2>
        <p>
          Compare the guest’s full name, their payment-app name, the intended
          amount and the DCB reference in the payment memo. Open their linked
          card for context.
        </p>
        <p className="small">
          Provider transaction imports are not connected. No transaction is
          automatically matched or marked received.
        </p>
      </section>
    </>
  );
}
function DestinationForm({
  event,
  destination,
}: {
  event: Occasion;
  destination: Destination;
}) {
  const { actions, notify, busy } = useStore();
  const [identifier, setIdentifier] = useState(destination.identifier);
  const [recipient, setRecipient] = useState(destination.recipient);
  const [repeat, setRepeat] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [previewOnly, setPreviewOnly] = useState(
    destination.previewOnly !== false,
  );
  const [error, setError] = useState("");
  useEffect(() => {
    setIdentifier(destination.identifier);
    setRecipient(destination.recipient);
    setRepeat("");
    setConfirm(false);
    setPreviewOnly(destination.previewOnly !== false);
  }, [destination.identifier, destination.recipient, destination.version]);
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!identifier.trim() || identifier !== repeat) {
      setError("The two identifiers must match exactly.");
      return;
    }
    if (!validIdentifier(destination.service, identifier)) {
      setError(
        "Enter a valid " +
          destination.service +
          " identifier. For a Zelle phone number, use 10 U.S. digits, optionally prefixed with +1.",
      );
      return;
    }
    if (!previewOnly && fictionalIdentifier(identifier)) {
      setError("Keep fictional recipients in preview mode.");
      return;
    }
    if (!confirm) {
      setError(
        "Confirm that you checked the recipient inside the payment service.",
      );
      return;
    }
    if (
      await actions.saveDestination(
        event.id,
        {
          ...destination,
          recipient: recipient.trim(),
          identifier,
          previewOnly,
          confirmed: true,
          enabled: true,
        },
        repeat,
        confirm,
      )
    ) {
      setError("");
      notify(destination.service + " details saved and host confirmed.");
    }
  }
  return (
    <form className="panel destination-form" onSubmit={save}>
      <div className="row-between">
        <h2>{destination.service}</h2>
        <Status>
          {destination.enabled && destination.confirmed
            ? "Host confirmed"
            : "Paused"}
        </Status>
      </div>
      <label htmlFor={"recipient-" + destination.service}>
        Recipient shown in the service
      </label>
      <input
        id={"recipient-" + destination.service}
        value={recipient}
        required
        maxLength={100}
        onChange={(e) => {
          setRecipient(e.target.value);
          setConfirm(false);
        }}
      />
      <label htmlFor={"identifier-" + destination.service}>
        Exact account identifier
      </label>
      <input
        id={"identifier-" + destination.service}
        value={identifier}
        required
        maxLength={100}
        onChange={(e) => {
          setIdentifier(e.target.value);
          setConfirm(false);
        }}
      />
      <label htmlFor={"repeat-" + destination.service}>Enter it again</label>
      <input
        id={"repeat-" + destination.service}
        value={repeat}
        required
        onChange={(e) => setRepeat(e.target.value)}
        autoComplete="off"
      />
      <label className="check">
        <input
          type="checkbox"
          checked={confirm}
          onChange={(e) => setConfirm(e.target.checked)}
        />
        <span>
          I checked this exact recipient and identifier inside{" "}
          {destination.service}.
        </span>
      </label>
      <label className="check">
        <input
          type="checkbox"
          checked={previewOnly}
          onChange={(e) => {
            setPreviewOnly(e.target.checked);
            setConfirm(false);
          }}
        />
        <span>
          Preview only: keep this fictional recipient inside the website.
        </span>
      </label>
      <p className="small">
        Uncheck only for your own real recipient, verified in{" "}
        {destination.service}. Guests may then open the service. No money is
        sent by this website.
      </p>
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}
      <div className="buttons">
        <button className="primary" disabled={busy}>
          Save & confirm service
        </button>
        <button
          type="button"
          className="secondary"
          disabled={busy || !destination.enabled}
          onClick={async () => {
            if (
              await actions.saveDestination(
                event.id,
                { ...destination, enabled: false },
                "",
                false,
              )
            )
              notify(
                destination.service +
                  " is paused. Other services are unchanged.",
              );
          }}
        >
          Pause service
        </button>
      </div>
      <p className="small">
        Only this service changes. Guests must review updated details again.
      </p>
    </form>
  );
}
function EventSettings({ event }: { event: Occasion }) {
  const { actions, notify, busy } = useStore();
  const services: Service[] = ["Venmo", "Cash App", "Zelle"];
  return (
    <>
      <Heading
        eyebrow="Event settings"
        title="Thoughtful control, in your hands."
      />
      <section className="panel">
        <h2>Guest access</h2>
        <p>
          Pause your invitation when you need a moment. Rotating the guest link
          invalidates the previous link and QR.
        </p>
        <div className="buttons">
          <button
            className="secondary"
            disabled={busy}
            onClick={() =>
              actions.updateEvent(event.id, {
                status: event.status === "paused" ? "published" : "paused",
              })
            }
          >
            {event.status === "paused"
              ? "Resume invitation"
              : "Pause invitation"}
          </button>
          <button
            className="secondary"
            disabled={busy}
            onClick={async () => {
              if (
                window.confirm(
                  "Replace this guest link? The previous link and QR will stop opening this event.",
                ) &&
                (await actions.rotateLink(event.id))
              )
                notify(
                  "Your previous guest link has been replaced. Share the new invitation.",
                );
            }}
          >
            Rotate guest link
          </button>
        </div>
      </section>
      <h2>Optional external gifts</h2>
      <p>
        Choose the services you use. Keep fictional recipients in preview mode.
        TheDigitalCardBox does not process or independently verify transfers.
      </p>
      {services.map((service) => (
        <DestinationForm
          key={service}
          event={event}
          destination={
            event.destinations.find((x) => x.service === service) || {
              service,
              recipient: event.hosts,
              identifier: "",
              enabled: false,
              confirmed: false,
              version: 0,
              previewOnly: true,
            }
          }
        />
      ))}
    </>
  );
}
export function Account() {
  const { data, setData, actions, notify, mode, busy, account } = useStore();
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name")).trim();
    if (!name) {
      notify("Please add a name.");
      return;
    }
    if (
      await actions.saveProfile({
        ...data.profile,
        name,
        email: String(f.get("email")).trim(),
      })
    )
      notify("Your preferences are saved.");
  }
  return (
    <>
      <Heading eyebrow="Account & preferences" title="Make yourself at home." />
      <div className="two-column">
        <form className="panel" onSubmit={save}>
          <h2>Your details</h2>
          <label htmlFor="profile-name">Name</label>
          <input
            id="profile-name"
            name="name"
            defaultValue={data.profile.name}
            maxLength={80}
            required
          />
          <label htmlFor="profile-email">Email</label>
          <input
            id="profile-email"
            name="email"
            defaultValue={data.profile.email}
            type="email"
            readOnly={mode === "server"}
            required
          />
          <p className="small">
            {mode === "server"
              ? "Your name and motion preference are saved on the test server. This test account email cannot be changed."
              : "Saved on this device. This does not create or update a connected account."}
          </p>
          <button className="primary" disabled={busy}>
            Save preferences
          </button>
        </form>
        <section className="panel">
          <h2>A comfortable experience</h2>
          <label className="check">
            <input
              type="checkbox"
              disabled={busy}
              checked={data.profile.reducedMotion}
              onChange={(e) =>
                actions.saveProfile({
                  ...data.profile,
                  reducedMotion: e.target.checked,
                })
              }
            />
            <span>Reduce motion and keep GIFs still</span>
          </label>
          <p>
            Cards can always be read as text. Animations respect your motion
            preference.
          </p>
          <Link className="text-link" to="/accessibility">
            Accessibility statement ↗
          </Link>
          <hr />
          {mode === "server" ? (
            <>
              <h3>Your test account</h3>
              <p className="small">
                Your events and accepted cards remain on this test server when
                you sign out.
              </p>
              <button
                className="secondary"
                disabled={busy}
                onClick={async () => {
                  await actions.logout();
                  go("/start");
                }}
              >
                Sign out
              </button>
              {account?.role === "operator" && (
                <p>
                  <Link to="/admin" className="text-link">
                    Open administrator workspace ↗
                  </Link>
                </p>
              )}
            </>
          ) : (
            <>
              <h3>Design workspace</h3>
              <p className="small">
                All records are fictional and editable without signing in.
                Resetting restores the original fictional events and removes
                your local changes.
              </p>
              <button
                className="secondary danger"
                onClick={() => {
                  if (
                    window.confirm(
                      "Reset all workspace changes on this device?",
                    )
                  ) {
                    setData(initialStore());
                    notify("The design workspace was reset.");
                  }
                }}
              >
                Reset workspace
              </button>
              <div className="buttons">
                <Link to="/admin" className="text-link">
                  Open administrator workspace ↗
                </Link>
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}
