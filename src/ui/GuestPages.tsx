import { ProviderHandoff } from "./ProviderHandoff";
import { reviewDestination } from "../modules/gifts/routing";
import type { GiftHandoff } from "../modules/gifts/routing";
import type { GiftIntentInput } from "./api";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  designs,
  eventWindow,
  formatDate,
  gifCollection,
  reference,
  uid,
} from "./model";
import type { CardStyle, Entry, Occasion, Service } from "./model";
import {
  Card,
  Empty,
  Heading,
  Link,
  MotionSticker,
  Notice,
  copy,
  go,
} from "./shared";
import { useStore } from "./state";
import { WritingAssist } from "./WritingAssist";
import type { InvitationResponse } from "./api";

interface Draft {
  id: string;
  name: string;
  note: string;
  style: CardStyle;
  photo?: string;
  gif?: string;
  consent: boolean;
  reference: string;
  submitted: boolean;
  receiptId?: string;
  handoff?: GiftHandoff;
  giftInput?: GiftIntentInput;
}
function freshDraft(): Draft {
  return {
    id: uid(),
    name: "",
    note: "",
    style: "botanical",
    consent: false,
    reference: reference(),
    submitted: false,
  };
}
function loadDraft(token: string): Draft {
  try {
    const draft = JSON.parse(
      sessionStorage.getItem("dcb-draft-" + token) || "null",
    );
    if (
      draft?.id &&
      typeof draft.name === "string" &&
      typeof draft.note === "string" &&
      designs.some((d) => d.id === draft.style) &&
      typeof draft.reference === "string"
    )
      return draft;
  } catch {
    /* A new draft still works when storage is unavailable. */
  }
  return freshDraft();
}
export function GuestPage({ token, step }: { token: string; step: string }) {
  const { data, mode } = useStore();
  if (mode === "server")
    return <ConnectedGuestPage token={token} step={step} />;
  const event = data.events.find((x) => x.token === token);
  if (!event || event.status === "draft")
    return (
      <Empty title="Your invitation is not available.">
        <p>
          Check the complete link with your host. Events cannot be found by
          searching.
        </p>
        <Link to="/" className="secondary">
          Back to home
        </Link>
      </Empty>
    );
  return <GuestJourney key={token} event={event} step={step} />;
}
function ConnectedGuestPage({ token, step }: { token: string; step: string }) {
  const { actions } = useStore();
  const [invitation, setInvitation] = useState<InvitationResponse | null>(null);
  const [failure, setFailure] = useState("");
  useEffect(() => {
    let active = true;
    setInvitation(null);
    setFailure("");
    const load = () =>
      actions
        .loadInvitation(token)
        .then((value) => {
          if (active) {
            setInvitation(value);
            setFailure("");
          }
        })
        .catch((error) => {
          if (active) {
            setInvitation(null);
            setFailure(
              error.status === 404
                ? "Your invitation is not available."
                : error.message,
            );
          }
        });
    void load();
    const timer = setInterval(load, 10000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [token]);
  if (failure)
    return (
      <Empty title="Your invitation is not available.">
        <p>{failure}</p>
        <p>
          Check the complete link with your host. Events cannot be found by
          searching.
        </p>
        <Link to="/" className="secondary">
          Back to home
        </Link>
      </Empty>
    );
  if (!invitation)
    return (
      <div className="empty" role="status">
        <h1>Opening your invitation…</h1>
      </div>
    );
  return (
    <GuestJourney
      key={token}
      event={invitation.event}
      step={step}
      authoritativeWindow={invitation.window}
    />
  );
}
function GuestJourney({
  event,
  step,
  authoritativeWindow,
}: {
  event: Occasion;
  step: string;
  authoritativeWindow?: string;
}) {
  const { data, setData, actions, notify, mode, busy } = useStore();
  const [draft, setDraft] = useState<Draft>(() => loadDraft(event.token));
  const [error, setError] = useState("");
  const [gifSearch, setGifSearch] = useState("");
  const [gifOpen, setGifOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [suggestions, setSuggestions] = useState(false);
  const base = "/g/" + event.token;
  const state = authoritativeWindow || eventWindow(event);
  const canContribute = state === "open";
  const canGift =
    (state === "open" || state === "gift-only") && data.flags.gifts;
  const services = canGift
    ? event.destinations.filter((x) => x.enabled && x.confirmed)
    : [];
  const [service, setService] = useState<Service>(
    () => draft.handoff?.service || "Venmo",
  );
  const selected = services.find((x) => x.service === service) || services[0];
  const [ack, setAck] = useState(false);
  const [alias, setAlias] = useState(draft.giftInput?.alias || "");
  const [amount, setAmount] = useState(draft.giftInput?.amount || "");
  const [giftSaved, setGiftSaved] = useState(false);
  const [draftStorageError, setDraftStorageError] = useState(false);
  const previousVersion = useRef("");
  const gifToggle = useRef<HTMLButtonElement>(null);
  const reduced =
    data.profile.reducedMotion ||
    matchMedia("(prefers-reduced-motion: reduce)").matches;
  useEffect(() => {
    try {
      sessionStorage.setItem("dcb-draft-" + event.token, JSON.stringify(draft));
      setDraftStorageError(false);
    } catch {
      setDraftStorageError(true);
    }
  }, [draft, event.token]);
  useEffect(() => {
    const key = selected ? selected.service + ":" + selected.version : "";
    if (previousVersion.current !== key) {
      setAck(false);
      previousVersion.current = key;
    }
  }, [selected?.service, selected?.version]);
  useEffect(() => {
    setPlaying(false);
  }, [draft.gif, reduced]);
  function update(value: Partial<Draft>) {
    setDraft((d) => ({ ...d, ...value }));
    setError("");
  }
  async function photo(file?: File) {
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 2 * 1024 * 1024
    ) {
      setError("Choose a JPG, PNG or WebP photo up to 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        if (image.width > 8000 || image.height > 8000) {
          setError("Choose a photo smaller than 8,000 pixels on each side.");
          return;
        }
        update({ photo: String(reader.result) });
      };
      image.onerror = () =>
        setError("This photo could not be opened. Choose a different image.");
      image.src = String(reader.result);
    };
    reader.onerror = () =>
      setError("Your photo could not be read. Try another file.");
    reader.readAsDataURL(file);
  }
  function review(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!draft.name.trim() || !draft.note.trim()) {
      setError("Add your name and a few words before continuing.");
      return;
    }
    setPlaying(false);
    go(base + "/review");
  }
  async function submit() {
    if (!canContribute || draft.submitted || busy) return;
    if (!draft.name.trim() || !draft.note.trim()) {
      go(base + "/card");
      return;
    }
    const entry: Entry = {
      id: draft.id,
      eventId: event.id,
      name: draft.name.trim(),
      note: draft.note.trim(),
      style: draft.style,
      photo: draft.photo,
      gif: data.flags.gifs ? draft.gif : undefined,
      consent: draft.consent,
      hidden: false,
      createdAt: new Date().toISOString(),
    };
    if (mode === "server") {
      const receipt = await actions.submitCard(event.token, entry);
      if (!receipt) return;
      setDraft((d) => ({ ...d, submitted: true, receiptId: receipt.id }));
      notify("Your card has been delivered to the host’s card box.");
      go(canGift && services.length ? base + "/gift" : base + "/thanks");
      return;
    }
    setData((d) =>
      d.entries.some((x) => x.id === entry.id)
        ? d
        : {
            ...d,
            entries: [entry, ...d.entries],
            gifts: d.gifts.map((x) =>
              x.reference === draft.reference ? { ...x, entryId: entry.id } : x,
            ),
          },
    );
    setDraft((d) => ({ ...d, submitted: true }));
    notify("Your card has been added to this device’s card box.");
    go(canGift && services.length ? base + "/gift" : base + "/thanks");
  }
  async function saveGift(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canGift || !selected || !ack || busy) return;
    if (!draft.name.trim()) {
      setError("Add the name your host knows you by.");
      return;
    }
    const input: GiftIntentInput = {
      requestKey: draft.giftInput?.requestKey || uid(),
      service: selected.service,
      version: selected.version,
      name: draft.name.trim(),
      alias: alias.trim(),
      amount,
      reference: draft.reference,
      entryId: draft.submitted ? draft.receiptId || draft.id : undefined,
      acknowledged: true,
    };
    if (
      draft.giftInput &&
      [
        "service",
        "version",
        "name",
        "alias",
        "amount",
        "reference",
        "entryId",
      ].some(
        (key) =>
          input[key as keyof GiftIntentInput] !==
          draft.giftInput![key as keyof GiftIntentInput],
      )
    )
      input.requestKey = uid();
    update({ giftInput: input });
    try {
      const current = reviewDestination(
        event.destinations,
        selected.service,
        selected.version,
      );
      let handoff: GiftHandoff;
      if (mode === "server") {
        const result = await actions.prepareGift(event.token, input);
        if (!result) return;
        handoff = result.handoff;
      } else {
        const giftId =
          data.gifts.find((x) => x.reference === draft.reference)?.id || uid();
        handoff = {
          giftId,
          service: current.service,
          recipient: current.recipient,
          identifier: current.identifier,
          version: current.version,
          previewOnly: current.previewOnly !== false,
          reference: draft.reference,
          amount,
        };
        setData((d) => ({
          ...d,
          gifts: [
            {
              id: giftId,
              eventId: event.id,
              entryId: input.entryId,
              name: input.name,
              alias: input.alias,
              service: current.service,
              amount,
              reference: draft.reference,
              previewOnly: current.previewOnly !== false,
              status: "unconfirmed",
              date: new Date().toISOString().slice(0, 10),
            },
            ...d.gifts.filter((x) => x.reference !== draft.reference),
          ],
        }));
      }
      update({ handoff, giftInput: input });
      setGiftSaved(true);
      notify("Gift details recorded as unconfirmed. No transfer was made.");
      go(base + "/handoff");
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Review the current recipient before continuing.",
      );
    }
  }
  async function validateHandoff() {
    if (!draft.handoff || !draft.giftInput || !canGift) return false;
    if (mode === "server")
      return !!(await actions.prepareGift(event.token, draft.giftInput));
    try {
      const current = reviewDestination(
        event.destinations,
        draft.handoff.service,
        draft.handoff.version,
      );
      return (
        current.identifier === draft.handoff.identifier &&
        current.recipient === draft.handoff.recipient &&
        (current.previewOnly !== false) === draft.handoff.previewOnly
      );
    } catch {
      return false;
    }
  }
  if (["paused", "scheduled", "closed"].includes(state))
    return (
      <>
        <Heading eyebrow={event.type} title={event.title} />
        <Empty
          title={
            state === "scheduled"
              ? "A little early, and so welcome."
              : state === "paused"
                ? "This invitation is taking a little pause."
                : "A beautiful chapter, now complete."
          }
        >
          <p>
            {state === "scheduled"
              ? "Your host will let you know when cards open."
              : state === "paused"
                ? "Please check back or reach your host through a channel you know."
                : "This event is no longer accepting cards or gifts. Thank you for being part of it."}
          </p>
        </Empty>
      </>
    );
  if (
    !["landing", "card", "review", "gift", "handoff", "thanks"].includes(step)
  )
    return (
      <Empty title="This page isn’t part of your invitation.">
        <Link className="primary" to={base}>
          Return to the event
        </Link>
      </Empty>
    );
  if ((step === "card" || step === "review") && !canContribute)
    return (
      <Empty title="The cards are gathered. The love continues.">
        <p>
          New cards and photos are closed. Wedding gifts remain optional while
          the gift window is open.
        </p>
        {canGift && services.length > 0 && (
          <Link to={base + "/gift"} className="primary">
            Leave a gift
          </Link>
        )}
      </Empty>
    );
  if (step === "landing")
    return (
      <section className="invitation">
        <div className="invitation-image">
          <img
            src={`/images/${event.cover}.jpg`}
            alt="A setting for this occasion"
          />
        </div>
        <div className="invitation-copy">
          <p className="eyebrow">You’re invited to leave a little love</p>
          <h1>{event.title}</h1>
          <p className="invitation-date">
            {formatDate(event.date)}
            {event.location && (
              <>
                <br />
                {event.location}
              </>
            )}
          </p>
          <div className="fine-rule" />
          <p>{event.welcome}</p>
          {canContribute ? (
            <Link to={base + "/card"} className="primary">
              Choose a card & leave a note ↗
            </Link>
          ) : (
            <Notice>Cards are closed. Wedding gifts are still open.</Notice>
          )}
          {canGift && services.length > 0 && (
            <Link to={base + "/gift"} className="text-link">
              I’d just like to leave a gift
            </Link>
          )}
          <p className="small">
            A note is enough. A gift is always optional.
            <br />
            No account needed to leave your kind words.
          </p>
        </div>
      </section>
    );
  if (step === "handoff") {
    if (!draft.handoff)
      return (
        <Empty title="Review your gift details first.">
          <Link to={base + "/gift"} className="primary">
            Review recipient
          </Link>
        </Empty>
      );
    return (
      <ProviderHandoff
        key={draft.handoff.giftId + draft.handoff.service}
        handoff={draft.handoff}
        base={base}
        validate={validateHandoff}
      />
    );
  }
  if (step === "thanks")
    return (
      <section className="thank-you">
        <span className="script-accent">what a lovely thing to leave</span>
        <h1>
          {draft.submitted
            ? "Your words have a home."
            : giftSaved ||
                data.gifts.some((x) => x.reference === draft.reference)
              ? "Your gift details are with the host."
              : "Thank you for being here."}
        </h1>
        <p>
          {draft.submitted
            ? `A little piece of your love is now in ${event.hosts}’s card box${mode === "server" ? "." : " on this device."}`
            : "Every thoughtful gesture means something."}
        </p>
        {(giftSaved ||
          draft.handoff ||
          data.gifts.some((x) => x.reference === draft.reference)) && (
          <Notice>
            Your gift is unconfirmed until the host checks their payment
            account. No transfer was made here.
          </Notice>
        )}
        {draft.submitted && (
          <div className="thank-you-card">
            <Card entry={draft} />
          </div>
        )}
        <Link to={base} className="secondary">
          Back to the occasion
        </Link>
      </section>
    );
  if (step === "gift")
    return (
      <>
        <Heading
          eyebrow={"For " + event.hosts}
          title="A little extra, if you’d like."
        />
        <div className="guest-stepper" aria-label="Your progress">
          <Link to={base}>Occasion</Link>
          <span aria-current="step">Optional gift</span>
        </div>
        {!canGift || !services.length ? (
          <Empty title="Words are more than enough.">
            <p>Gift services aren’t available for this occasion.</p>
            <Link
              to={canContribute ? base + "/card" : base}
              className="primary"
            >
              {canContribute ? "Leave a card instead" : "Back to the occasion"}
            </Link>
          </Empty>
        ) : (
          <div className="guest-layout">
            <form className="panel" onSubmit={saveGift}>
              <p className="eyebrow">Keep your gift easy to recognize</p>
              <h2>Help your host connect the dots.</h2>
              <label htmlFor="gift-name">The name your host knows you by</label>
              <input
                id="gift-name"
                required
                maxLength={80}
                value={draft.name}
                onChange={(e) => update({ name: e.target.value })}
              />
              <label htmlFor="gift-alias">
                Your name in the payment app{" "}
                <span className="optional">optional</span>
              </label>
              <input
                id="gift-alias"
                value={alias}
                maxLength={80}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="For example, J. Lee"
              />
              <label htmlFor="gift-amount">
                Intended gift amount{" "}
                <span className="optional">optional · USD</span>
              </label>
              <input
                id="gift-amount"
                type="number"
                min="1"
                max="10000"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <fieldset>
                <legend>Choose an available service</legend>
                <div className="segmented">
                  {services.map((s) => (
                    <button
                      type="button"
                      key={s.service}
                      aria-pressed={selected.service === s.service}
                      onClick={() => {
                        setService(s.service);
                        setAck(false);
                      }}
                    >
                      {s.service}
                    </button>
                  ))}
                </div>
              </fieldset>
              <div className="destination">
                <p className="eyebrow">
                  Host-supplied destination · version {selected.version}
                </p>
                <strong>{selected.recipient}</strong>
                <dl>
                  <dt>Service</dt>
                  <dd>{selected.service}</dd>
                  <dt>Exact identifier</dt>
                  <dd>{selected.identifier}</dd>
                </dl>
              </div>
              <label className="check">
                <input
                  type="checkbox"
                  checked={ack}
                  onChange={(e) => setAck(e.target.checked)}
                />
                <span>
                  I will check the exact recipient inside {selected.service}. If
                  it differs, I will stop and contact my host.
                </span>
              </label>
              <p className="small">
                Next, review the handoff to {selected.service}. Fictional
                recipients stay in preview. Host-configured recipients can open
                the service; no payment is submitted by this site.
              </p>
              {error && (
                <p role="alert" className="field-error">
                  {error}
                </p>
              )}
              <button className="primary" disabled={!ack || busy}>
                Save gift details
              </button>
              <div className="buttons">
                <Link
                  to={
                    draft.submitted
                      ? base + "/thanks"
                      : canContribute
                        ? base + "/card"
                        : base
                  }
                  className="text-link"
                >
                  {draft.submitted
                    ? "Skip gift and finish"
                    : canContribute
                      ? "Leave a card instead"
                      : "Back to the occasion"}
                </Link>
              </div>
            </form>
            <aside className="panel matching-note">
              <span className="script-accent">a little detail that helps</span>
              <h2>Make your gift unmistakably yours.</h2>
              <p>
                Copy this reference into the payment memo if your service
                supports one. It helps your host distinguish guests with similar
                names.
              </p>
              <label htmlFor="gift-reference">Your matching reference</label>
              <input id="gift-reference" value={draft.reference} readOnly />
              <button
                className="secondary"
                onClick={() => copy(draft.reference, notify)}
              >
                Copy reference
              </button>
              <p className="small">
                A reference is a matching aid, not a provider transaction ID or
                proof of payment. You never need to share bank details or a
                payment screenshot.
              </p>
            </aside>
          </div>
        )}
      </>
    );
  if (step === "review")
    return (
      <>
        <Heading
          eyebrow="One last little look"
          title="Made by you. Meant for them."
        />
        <div className="guest-layout">
          <div className="live-card">
            <Card
              entry={{ ...draft, gif: data.flags.gifs ? draft.gif : undefined }}
            />
          </div>
          <section className="panel review-panel">
            <h2>Your words, just right.</h2>
            <p className="review-note">{draft.note}</p>
            <p>From {draft.name || "you"}</p>
            <p className="small">
              {draft.consent
                ? "Included in the host’s event book if they choose to keep it."
                : "Visible to the host only. Excluded from the event book."}
            </p>
            <p className="small">
              {mode === "server"
                ? "Sending saves this card to the event’s test inbox. The host can read it from their own signed-in browser. No payment will be made."
                : "Sending adds this card to the card box on this device. Nothing is delivered to a server."}
            </p>
            <div className="buttons">
              {draft.submitted ? (
                <Link to={base + "/thanks"} className="primary">
                  View your sent card
                </Link>
              ) : (
                <button
                  className="primary"
                  disabled={busy || !draft.name.trim() || !draft.note.trim()}
                  onClick={submit}
                >
                  {busy ? "Sending your card…" : "Send my card ↗"}
                </button>
              )}
              <Link to={base + "/card"} className="secondary">
                Keep editing
              </Link>
            </div>
          </section>
        </div>
      </>
    );
  return (
    <>
      <Heading
        eyebrow={"A note for " + event.hosts}
        title="Find the card. Make it yours."
      />
      <ol className="guest-stepper">
        <li aria-current="step">01 · Your card</li>
        <li>02 · Review</li>
        <li>03 · Optional gift</li>
      </ol>
      {draft.submitted ? (
        <Empty title="Your card is already in the box.">
          <Link to={base + "/thanks"} className="primary">
            View your card
          </Link>
        </Empty>
      ) : (
        <form onSubmit={review} className="composer">
          <div className="composer-controls">
            <section className="panel">
              <p className="eyebrow">01 · Start with a little beauty</p>
              <fieldset className="design-choices">
                <legend>Choose your card design</legend>
                {designs.map((design) => (
                  <label
                    key={design.id}
                    className={draft.style === design.id ? "chosen" : ""}
                  >
                    <input
                      type="radio"
                      name="design"
                      value={design.id}
                      checked={draft.style === design.id}
                      onChange={() => update({ style: design.id })}
                    />
                    <span
                      className={"design-swatch swatch-" + design.id}
                      aria-hidden="true"
                    />
                    <span>{design.name}</span>
                  </label>
                ))}
              </fieldset>
            </section>
            <section className="panel">
              <p className="eyebrow">02 · Add the part only you can write</p>
              <label htmlFor="sender-name">Your name</label>
              <input
                id="sender-name"
                required
                maxLength={80}
                autoComplete="name"
                value={draft.name}
                onChange={(e) => update({ name: e.target.value })}
              />
              <label htmlFor="note">Your note</label>
              <textarea
                id="note"
                required
                rows={7}
                maxLength={3000}
                value={draft.note}
                onChange={(e) => update({ note: e.target.value })}
                placeholder="Start with a memory. End with a little love."
                aria-describedby="note-count"
              />
              <p id="note-count" className="small">
                {draft.note.length}/3,000 characters
              </p>
              {data.flags.assistance && (
                <>
                  <button
                    type="button"
                    className="text-link"
                    onClick={() => setSuggestions(!suggestions)}
                    aria-expanded={suggestions}
                    aria-controls="writing-prompts"
                  >
                    Need a little starting point?
                  </button>
                  {suggestions && (
                    <WritingAssist
                      hosts={event.hosts}
                      onChoose={(text) => update({ note: text.slice(0, 3000) })}
                    />
                  )}
                </>
              )}
            </section>
            <section className="panel">
              <p className="eyebrow">03 · A memory, a little personality</p>
              <label htmlFor="card-photo">
                Add a photo <span className="optional">optional</span>
              </label>
              <input
                id="card-photo"
                type="file"
                disabled={mode === "server"}
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => photo(e.target.files?.[0])}
                aria-describedby="photo-help"
              />
              <p id="photo-help" className="small">
                {mode === "server"
                  ? "Private photo uploads are not connected yet. Your note and selected GIF can be sent without a photo."
                  : "One JPG, PNG or WebP, up to 2 MB. Use an image you have permission to share."}
              </p>
              {draft.photo && (
                <button
                  className="text-link"
                  type="button"
                  onClick={() => update({ photo: undefined })}
                >
                  Remove photo
                </button>
              )}
              {data.flags.gifs && (
                <>
                  <div className="buttons">
                    <button
                      type="button"
                      className="secondary"
                      ref={gifToggle}
                      onClick={() => setGifOpen(!gifOpen)}
                      aria-expanded={gifOpen}
                      aria-controls="gif-library"
                    >
                      {draft.gif ? "Change GIF" : "Add a GIF"} +
                    </button>
                    {draft.gif && (
                      <button
                        className="text-link"
                        type="button"
                        onClick={() => update({ gif: undefined })}
                      >
                        Remove GIF
                      </button>
                    )}
                  </div>
                  {gifOpen && (
                    <section
                      id="gif-library"
                      className="gif-library"
                      aria-label="GIF library"
                    >
                      <label htmlFor="gif-search">Find a little feeling</label>
                      <input
                        id="gif-search"
                        type="search"
                        value={gifSearch}
                        onChange={(e) => setGifSearch(e.target.value)}
                        placeholder="Love, celebrate, flowers…"
                      />
                      <p className="small">
                        A curated collection · still until you choose play.
                      </p>
                      <div className="gif-grid">
                        {gifCollection
                          .filter((g) =>
                            (g.name + " " + g.tags)
                              .toLowerCase()
                              .includes(gifSearch.toLowerCase()),
                          )
                          .map((gif) => (
                            <button
                              key={gif.id}
                              type="button"
                              aria-label={gif.name}
                              aria-pressed={draft.gif === gif.id}
                              onClick={() => {
                                update({ gif: gif.id });
                                setGifOpen(false);
                                requestAnimationFrame(() =>
                                  gifToggle.current?.focus(),
                                );
                              }}
                            >
                              <MotionSticker id={gif.id} />
                              <span>{gif.name}</span>
                            </button>
                          ))}
                      </div>
                      {!gifCollection.some((g) =>
                        (g.name + " " + g.tags)
                          .toLowerCase()
                          .includes(gifSearch.toLowerCase()),
                      ) && (
                        <p role="status">
                          No GIFs found. Try “love” or “celebrate”.
                        </p>
                      )}
                    </section>
                  )}
                </>
              )}
              <label className="check">
                <input
                  type="checkbox"
                  checked={draft.consent}
                  onChange={(e) => update({ consent: e.target.checked })}
                />
                <span>
                  Include my card and attached photo in the host’s event book.
                  Otherwise, keep them for the host only.
                </span>
              </label>
            </section>
            {error && (
              <p role="alert" className="field-error">
                {error}
              </p>
            )}
            {draftStorageError && (
              <Notice>
                Your draft cannot be saved by this browser. Keep this page open
                or remove a photo to free space.
              </Notice>
            )}
            <button className="primary full">Review my card ↗</button>
          </div>
          <aside className="card-preview-column">
            <div
              className="live-card"
              role="region"
              aria-label="Your card preview"
              tabIndex={0}
            >
              <p className="eyebrow">Your words, taking shape</p>
              <Card
                entry={{
                  ...draft,
                  gif: data.flags.gifs ? draft.gif : undefined,
                }}
                animate={playing && !reduced}
              />
              {draft.gif && data.flags.gifs && !reduced && (
                <button
                  className="secondary"
                  type="button"
                  onClick={() => setPlaying(!playing)}
                >
                  {playing ? "Pause GIF" : "Play GIF"}
                </button>
              )}
              <p className="small">
                Your note stands on its own.
                <br />
                No gift is ever required.
              </p>
            </div>
          </aside>
        </form>
      )}
    </>
  );
}
