import { useEffect, useState } from "react";
import { templates, aiOptions } from "../modules/media/catalog";
import type { AiCardChoices } from "../modules/media/catalog";
import { occasionChoices, eventTypes } from "../modules/events/occasions";
import {
  createDesign,
  withDesignGif,
  templatePalette,
  invitationTemplates,
  draftKey,
} from "../modules/design/contracts";
import type { DesignDocument, DesignKind } from "../modules/design/contracts";
import type { Occasion } from "./model";
import { formatDate } from "./model";
import {
  DesignCanvas,
  DesignEditor,
  designArtworkUrl,
  readDesignDraft,
} from "./DesignEditor";
import { Heading, Link, go } from "./shared";
import { GifPicker } from "./GifPicker";
import { useStore } from "./state";
import { request } from "./api";

function seedInvitation(event: Occasion) {
  const value = createDesign("invitation", event.type);
  value.blocks = value.blocks.map((b) =>
    b.id === "title"
      ? { ...b, text: event.title }
      : b.id === "details"
        ? {
            ...b,
            text:
              formatDate(event.date) +
              (event.location ? "\n" + event.location : ""),
          }
        : b,
  );
  return value;
}
export function DesignStudio({
  kind,
  event,
}: {
  kind: DesignKind;
  event?: Occasion;
}) {
  const { configuration, data, actions, account, mode, busy, notify } =
    useStore();
  const requested =
    new URLSearchParams(location.search).get("occasion") || "Wedding";
  const [value, setValue] = useState<DesignDocument>(() => {
    if (event) return event.invitation || seedInvitation(event);
    const saved = readDesignDraft(kind);
    if (saved)
      return new URLSearchParams(location.search).has("occasion") &&
        eventTypes.includes(requested)
        ? { ...saved, occasion: requested }
        : saved;
    return createDesign(
      kind,
      eventTypes.includes(requested) ? requested : "Wedding",
    );
  });
  const [source, setSource] = useState<"ai" | "templates">(
    event ? "templates" : "ai",
  );
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [category, setCategory] = useState("Recommended");
  const [gifOpen, setGifOpen] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [artError, setArtError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedArt, setGeneratedArt] = useState("");
  const [saved, setSaved] = useState(false);
  const [destination, setDestination] = useState(event?.id || "");
  const [reference, setReference] = useState<string>(crypto.randomUUID());
  const [choices, setChoices] = useState<Omit<AiCardChoices, "occasion">>({
    palette: "Blush and copper",
    artwork: "Fine botanical illustration",
    motif: "Flowers and leaves",
  });
  useEffect(() => {
    try {
      localStorage.setItem(draftKey(kind), JSON.stringify(value));
      setStorageError("");
    } catch {
      setStorageError(
        "Your browser could not save this draft. Keep this page open while you edit.",
      );
    }
  }, [value, kind]);
  function edit(next: DesignDocument) {
    setValue(next);
    setSaved(false);
  }
  async function generate() {
    if (generating) return;
    setGenerating(true);
    setArtError("");
    try {
      const session = await request<{ csrfToken: string }>(
        "/api/studio/session",
      );
      const result = await request<{ artId: string }>(
        "/api/studio/art",
        {
          method: "POST",
          body: JSON.stringify({
            kind,
            occasion: value.occasion,
            ...choices,
            requestKey: reference,
          }),
          signal: AbortSignal.timeout(120000),
        },
        session.csrfToken,
      );
      setGeneratedArt(result.artId);
    } catch (error) {
      setArtError(
        error instanceof Error
          ? error.message
          : "Your artwork could not be created. All templates and your text are still available.",
      );
    } finally {
      setGenerating(false);
    }
  }
  const items = kind === "invitation" ? invitationTemplates : templates;
  const desiredCategory = /baby|gender/i.test(value.occasion)
    ? "Baby"
    : /wedding|engagement|bridal/i.test(value.occasion)
      ? "Wedding"
      : /graduation/i.test(value.occasion)
        ? "Graduation"
        : /birthday|sixteen|16|quince/i.test(value.occasion)
          ? "Birthday"
          : "Everyday";
  const filtered =
    category === "All designs"
      ? items
      : items.filter(
          (t) => t.category === desiredCategory || t.category === "Everyday",
        );
  async function saveToEvent() {
    if (!destination) return;
    const result = await actions.updateEvent(destination, {
      invitation: value,
    });
    if (result) {
      setSaved(true);
      notify(
        "Your invitation design is saved to this card box. Publish the event to share it.",
      );
      go(`/workspace/events/${destination}/share`);
    }
  }
  return (
    <div className="studio-page">
      <Heading
        eyebrow={
          kind === "card" ? "The card collection" : "The invitation collection"
        }
        title={
          kind === "card"
            ? "Your words. Your kind of beautiful."
            : event
              ? "Design your invitation."
              : "A beautiful beginning starts here."
        }
      >
        <p>
          {kind === "card"
            ? "Create your own card with AI, or make a collection design your own."
            : "Try a design, change every word, and make it yours. No account or card box needed to explore."}
        </p>
      </Heading>
      <div className="studio-navigation">
        <Link to="/cards" aria-current={kind === "card" ? "page" : undefined}>
          Cards
        </Link>
        <Link
          to="/invitations"
          aria-current={kind === "invitation" ? "page" : undefined}
        >
          Invitations
        </Link>
        <span>Design first. Decide later.</span>
      </div>
      <div
        className="studio-start-options"
        role="group"
        aria-label="Choose how to start your design"
      >
        <button
          type="button"
          aria-pressed={source === "ai"}
          onClick={() => {
            setSource("ai");
            setLibraryOpen(true);
          }}
        >
          <span aria-hidden="true">✦</span>
          <strong>
            {kind === "card"
              ? "Create your own card"
              : "Create your own invitation"}
          </strong>
          <small>AI artwork. Your personal touch.</small>
        </button>
        <button
          type="button"
          aria-pressed={source === "templates"}
          onClick={() => {
            setSource("templates");
            setLibraryOpen(true);
          }}
        >
          <span aria-hidden="true">✉</span>
          <strong>
            {kind === "card" ? "Generic cards" : "Invitation templates"}
          </strong>
          <small>Thoughtfully designed. Ready to personalize.</small>
        </button>
      </div>
      <div className="studio-library panel">
        <div className="studio-library-heading">
          <div>
            <label htmlFor={`studio-occasion-${kind}`}>Every occasion</label>
            <select
              id={`studio-occasion-${kind}`}
              value={value.occasion}
              onChange={(e) => {
                edit({ ...value, occasion: e.target.value });
                setReference(crypto.randomUUID());
              }}
            >
              {occasionChoices.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
              {!occasionChoices.some(([id]) => id === value.occasion) && (
                <option>{value.occasion}</option>
              )}
            </select>
          </div>
          <p>
            {source === "ai"
              ? "Choose a few details for custom artwork, then edit your text below."
              : "Choose a design. Your words and layout stay editable."}
          </p>
        </div>
        <details
          className="studio-artwork-options"
          open={libraryOpen}
          onToggle={(e) => setLibraryOpen(e.currentTarget.open)}
        >
          <summary>
            {source === "ai" ? "AI artwork options" : "Browse design templates"}
          </summary>
          {source === "ai" ? (
            <div className="studio-ai-controls">
              <div className="studio-ai-choices">
                {(["palette", "artwork", "motif"] as const).map((field) => (
                  <div key={field}>
                    <label htmlFor={`studio-ai-${field}`}>
                      {field === "artwork"
                        ? "Art style"
                        : field === "motif"
                          ? "Decorative motif"
                          : "Artwork palette"}
                    </label>
                    <select
                      id={`studio-ai-${field}`}
                      disabled={generating}
                      value={choices[field]}
                      onChange={(e) => {
                        setChoices({ ...choices, [field]: e.target.value });
                        setReference(crypto.randomUUID());
                        setArtError("");
                      }}
                    >
                      {aiOptions[field].map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <div className="studio-ai-action">
                <button
                  type="button"
                  className="primary"
                  disabled={
                    generating ||
                    !configuration.ai.available ||
                    mode !== "server"
                  }
                  onClick={generate}
                >
                  {generating
                    ? "Creating your artwork…"
                    : `Generate ${kind} artwork`}
                </button>
                <p className="small">
                  {configuration.ai.available
                    ? "Two studio attempts per browser and IP each day, within the shared site limit."
                    : "AI artwork isn’t enabled yet. You can personalize a design below or choose any template now."}{" "}
                  Personal text is added separately.
                </p>
              </div>
              {generatedArt && (
                <div className="studio-ai-result">
                  <img
                    src={`/api/studio/art/${generatedArt}`}
                    alt="Your reviewed stationery artwork"
                  />
                  <div>
                    <p role="status">
                      Your artwork is ready. Your latest text edits are safe.
                    </p>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => {
                        setValue((current) => ({
                          ...current,
                          artId: generatedArt,
                        }));
                        setSaved(false);
                      }}
                    >
                      Use this artwork
                    </button>
                    <button
                      type="button"
                      className="text-link"
                      disabled={generating}
                      onClick={() => {
                        setReference(crypto.randomUUID());
                        setGeneratedArt("");
                      }}
                    >
                      Try another variation
                    </button>
                  </div>
                </div>
              )}
              {artError && (
                <p className="field-error" role="alert">
                  {artError}
                </p>
              )}
              {generating && (
                <p role="status">
                  Good stationery takes a moment. Your words stay here while the
                  artwork is made.
                </p>
              )}
            </div>
          ) : (
            <>
              <label className="sr-only" htmlFor="studio-filter">
                Filter designs
              </label>
              <select
                id="studio-filter"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option>Recommended</option>
                <option>All designs</option>
              </select>
              <div className="studio-template-grid">
                {filtered.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    aria-pressed={value.template === t.id && !value.artId}
                    onClick={() =>
                      edit({
                        ...value,
                        template: t.id,
                        palette: templatePalette(t.id),
                        artId: undefined,
                      })
                    }
                  >
                    <div
                      className="studio-template-mini"
                      aria-hidden="true"
                      inert
                    >
                      <DesignCanvas
                        value={{
                          ...createDesign(kind, value.occasion, t.id),
                          palette: templatePalette(t.id),
                        }}
                      />
                    </div>
                    <strong>{t.name}</strong>
                  </button>
                ))}
              </div>
            </>
          )}
        </details>
      </div>
      <DesignEditor
        value={value}
        onChange={edit}
        artUrl={designArtworkUrl(
          value,
          undefined,
          Boolean(event && event.invitation?.artId === value.artId),
        )}
      />
      <div className="studio-extras panel">
        <div>
          <h2>A little movement. A little personality.</h2>
          <p className="small">
            Add a searchable, freely licensed animation. You can leave it out,
            too.
          </p>
        </div>
        <div className="buttons">
          <button
            type="button"
            className="secondary"
            aria-expanded={gifOpen}
            disabled={!data.flags.gifs}
            onClick={() => setGifOpen(!gifOpen)}
          >
            {value.gif ? "Change GIF" : "Add a GIF"}
          </button>
          {value.gif && (
            <button
              type="button"
              className="text-link"
              onClick={() => edit(withDesignGif(value))}
            >
              Remove GIF
            </button>
          )}
        </div>
        {gifOpen && (
          <GifPicker
            selected={value.gif}
            onChoose={(id) => {
              edit(withDesignGif(value, id));
              setGifOpen(false);
            }}
          />
        )}
      </div>
      {storageError && (
        <p role="alert" className="field-error">
          {storageError}
        </p>
      )}
      <section className="studio-finish panel">
        <div>
          <p className="eyebrow">
            {kind === "invitation" ? "Love your invitation?" : "Made by you"}
          </p>
          <h2>
            {kind === "invitation"
              ? "Give your celebration a home."
              : "Keep this design for your card."}
          </h2>
          <p>
            {kind === "invitation"
              ? "Your design stays with you through setup. A live guest link and QR become available after you create and publish an event and card box."
              : "Your draft is saved in this browser. Open the invitation from your host, then choose “Use my saved card design” to send it."}
          </p>
        </div>
        {kind === "invitation" ? (
          <div className="studio-finish-actions">
            {(mode === "review" || account) && data.events.length > 0 && (
              <>
                <label htmlFor="invitation-card-box">
                  Use with an existing card box
                </label>
                <select
                  id="invitation-card-box"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                >
                  <option value="">Choose your card box</option>
                  {data.events.map((item) => (
                    <option value={item.id} key={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="primary"
                  disabled={!destination || busy}
                  onClick={saveToEvent}
                >
                  {busy ? "Saving…" : "Save to card box"}
                </button>
              </>
            )}
            <Link
              className="secondary"
              to={`${account ? "/workspace/new" : "/start"}?occasion=${encodeURIComponent(value.occasion)}&design=invitation`}
            >
              Create an event & card box ↗
            </Link>
            <p className="small">
              {saved
                ? "Design saved."
                : "Draft saved on this browser. Sharing requires an event."}
            </p>
          </div>
        ) : (
          <div>
            <button
              type="button"
              className="primary"
              onClick={() => {
                setSaved(true);
                notify(
                  "Your card design is saved in this browser. Open your host’s invitation when you’re ready to send.",
                );
              }}
            >
              Save card draft
            </button>
            <p className="small" role="status">
              {saved
                ? "Your card draft is ready to use."
                : "No account needed to design."}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
