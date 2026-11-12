import { PremiumCardChoices } from "./PremiumCardChoices";
import { premiumEditions } from "../modules/cards/premium";
import { useEffect, useRef, useState } from "react";
import {
  cardTemplates as templates,
  aiOptions,
} from "../modules/media/catalog";
import type { AiCardChoices } from "../modules/media/catalog";
import { occasionChoices, eventTypes } from "../modules/events/occasions";
import {
  createDesign,
  applyTemplate,
  validateDesign,
  withDesignGif,
  templatePalette,
  invitationTemplates,
  draftKey,
} from "../modules/design/contracts";
import type {
  DesignDocument,
  DesignKind,
  DesignVariant,
} from "../modules/design/contracts";
import type { Occasion } from "./model";
import { formatDate } from "./model";
import {
  DesignCanvas,
  DesignEditor,
  designArtworkUrl,
  readDesignDraft,
} from "./DesignEditor";
import { Heading, Link, go, download } from "./shared";
import { GifPicker } from "./GifPicker";
import { useStore } from "./state";
import { request } from "./api";

function seedInvitation(event: Occasion, variant?: DesignVariant) {
  const value = createDesign("invitation", event.type, "botanical", variant);
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
  variant,
}: {
  kind: DesignKind;
  event?: Occasion;
  variant?: DesignVariant;
}) {
  const { configuration, data, actions, account, mode, busy, notify } =
    useStore();
  const requested =
    new URLSearchParams(location.search).get("occasion") || "Wedding";
  const [value, setValue] = useState<DesignDocument>(() => {
    if (event)
      return (
        (variant ? event.saveTheDate : event.invitation) ||
        seedInvitation(event, variant)
      );
    const saved = readDesignDraft(kind, variant);
    if (saved)
      return new URLSearchParams(location.search).has("occasion") &&
        eventTypes.includes(requested)
        ? { ...saved, occasion: requested }
        : saved;
    return createDesign(
      kind,
      eventTypes.includes(requested) ? requested : "Wedding",
      "botanical",
      variant,
    );
  });
  const [source, setSource] = useState<"ai" | "templates" | "premium">(
    event ? "templates" : "ai",
  );
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [category, setCategory] = useState("Recommended");
  const [query, setQuery] = useState("");
  const [visibleTemplates, setVisibleTemplates] = useState(12);
  const editorRef = useRef<HTMLDivElement>(null);
  useEffect(() => setVisibleTemplates(12), [query, category, value.occasion]);
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
      localStorage.setItem(draftKey(kind, variant), JSON.stringify(value));
      setStorageError("");
    } catch {
      setStorageError(
        "Your browser could not save this draft. Keep this page open while you edit.",
      );
    }
  }, [value, kind, variant]);
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
  const items = [
    ...(kind === "invitation" ? invitationTemplates : templates),
  ].sort(
    (a, b) =>
      Number("artwork" in b) - Number("artwork" in a) ||
      Number("layout" in b) - Number("layout" in a),
  );
  const desiredCategory = /baby|gender/i.test(value.occasion)
    ? "Baby"
    : /wedding|engagement|bridal/i.test(value.occasion)
      ? "Wedding"
      : /graduation/i.test(value.occasion)
        ? "Graduation"
        : /birthday|sixteen|16|quince/i.test(value.occasion)
          ? "Birthday"
          : /wake|remembr|celebration of life/i.test(value.occasion)
            ? "Remembrance"
            : "Everyday";
  const filtered = items.filter(
    (t) =>
      (category === "All designs" ||
        t.category === desiredCategory ||
        t.category === "Everyday") &&
      `${t.name} ${t.description} ${t.category}`
        .toLowerCase()
        .includes(query.toLowerCase().trim()),
  );
  async function saveToEvent() {
    if (!destination) return;
    const result = await actions.updateEvent(
      destination,
      variant ? { saveTheDate: value } : { invitation: value },
    );
    if (result) {
      setSaved(true);
      notify(
        "Your " +
          (variant ? "save-the-date" : "invitation") +
          " design is saved to this card box. Publish the event to share it.",
      );
      go(`/workspace/events/${destination}/share`);
    }
  }
  return (
    <div className="studio-page">
      <Heading
        eyebrow={
          kind === "card"
            ? "The card collection"
            : variant
              ? "Save the date"
              : "The invitation collection"
        }
        title={
          kind === "card"
            ? "Your words. Your kind of beautiful."
            : variant
              ? event
                ? "Design your save-the-date."
                : "Make room for a beautiful day."
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
          aria-current={kind === "invitation" && !variant ? "page" : undefined}
        >
          Invitations
        </Link>
        <Link to="/save-the-dates" aria-current={variant ? "page" : undefined}>
          Save the dates
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
              : variant
                ? "Create your own save-the-date"
                : "Create your own invitation"}
          </strong>
          <small>AI artwork. Your personal touch.</small>
        </button>
        <button
          type="button"
          aria-pressed={source === "templates"}
          onClick={() => {
            setSource("templates");
            edit({ ...value, premiumEdition: undefined });
            setLibraryOpen(true);
          }}
        >
          <span aria-hidden="true">✉</span>
          <strong>
            {kind === "card"
              ? "Generic cards"
              : variant
                ? "Save-the-date templates"
                : "Invitation templates"}
          </strong>
          <small>Thoughtfully designed. Ready to personalize.</small>
        </button>
        {kind === "card" && (
          <button
            type="button"
            aria-pressed={source === "premium"}
            onClick={() => {
              setSource("premium");
              setLibraryOpen(true);
              if (!value.premiumEdition)
                edit({ ...value, premiumEdition: "gilded" });
            }}
          >
            <span aria-hidden="true">✧</span>
            <strong>Premium cards</strong>
            <small>Six Signature editions · $4.99 before sending.</small>
          </button>
        )}
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
            {source === "premium"
              ? "Explore Signature editions"
              : source === "ai"
                ? "AI artwork options"
                : "Browse design templates"}
          </summary>
          {source === "premium" ? (
            <PremiumCardChoices
              value={value.premiumEdition}
              onChange={(edition) => {
                const option = premiumEditions.find((e) => e.id === edition);
                if (!edition) setSource("templates");
                edit({
                  ...(option ? applyTemplate(value, option.template) : value),
                  premiumEdition: edition,
                });
              }}
            />
          ) : source === "ai" ? (
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
              <label htmlFor="template-search">Search templates</label>
              <input
                id="template-search"
                type="search"
                placeholder="Try botanical, disco, wedding…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <p className="small">
                {filtered.length} designs · personalize every text layer
              </p>
              <div className="studio-template-grid">
                {filtered.slice(0, visibleTemplates).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    aria-pressed={value.template === t.id && !value.artId}
                    onClick={() => {
                      edit(applyTemplate(value, t.id));
                      requestAnimationFrame(() => {
                        editorRef.current?.scrollIntoView({
                          block: "start",
                          behavior: matchMedia(
                            "(prefers-reduced-motion: reduce)",
                          ).matches
                            ? "instant"
                            : "smooth",
                        });
                        editorRef.current?.focus({ preventScroll: true });
                      });
                    }}
                  >
                    <div
                      className="studio-template-mini"
                      aria-hidden="true"
                      inert
                    >
                      <DesignCanvas
                        value={{
                          ...createDesign(kind, value.occasion, t.id, variant),
                          palette: templatePalette(t.id),
                        }}
                      />
                    </div>
                    <strong>{t.name}</strong>
                  </button>
                ))}
              </div>
              {filtered.length > visibleTemplates && (
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setVisibleTemplates((n) => n + 12)}
                >
                  Show more templates ({filtered.length - visibleTemplates}{" "}
                  more)
                </button>
              )}
            </>
          )}
        </details>
      </div>
      <div
        ref={editorRef}
        tabIndex={-1}
        role="region"
        aria-label="Personalize selected template"
      >
        <DesignEditor
          value={value}
          onChange={edit}
          artUrl={designArtworkUrl(
            value,
            undefined,
            Boolean(
              event &&
              (variant ? event.saveTheDate : event.invitation)?.artId ===
                value.artId,
            ),
          )}
        />
      </div>
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
      <details className="studio-file-tools panel">
        <summary>Save or open an editable design file</summary>
        <p className="small">
          Keep a private copy of your text, layout and effects, or continue a
          file exported by this editor. Artwork availability follows its
          original library or private artwork access.
        </p>
        <button
          type="button"
          className="secondary"
          onClick={() =>
            download(
              "TheDigitalCardBox-" + (variant || kind) + ".dcb.json",
              JSON.stringify(
                {
                  format: "TheDigitalCardBox-editable-design",
                  version: 1,
                  design: value,
                },
                null,
                2,
              ),
              "application/json",
            )
          }
        >
          Export editable design
        </button>
        <label htmlFor="import-editable-design">
          Import editable design (.dcb.json)
        </label>
        <input
          id="import-editable-design"
          type="file"
          accept=".json,application/json"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              if (file.size > 120000)
                throw new Error("Choose an editable design file below 120 KB.");
              const parsed = JSON.parse(await file.text());
              if (
                parsed.format !== "TheDigitalCardBox-editable-design" ||
                parsed.version !== 1
              )
                throw new Error(
                  "Choose a file exported by this editor. A Canva image does not contain editable text layers.",
                );
              const next = validateDesign(parsed.design, kind);
              if (next.variant !== variant)
                throw new Error(
                  "Open this file in its matching card, invitation or save-the-date studio.",
                );
              edit(next);
              setStorageError("");
              notify("Your editable design is ready.");
            } catch (error) {
              setStorageError(
                error instanceof Error
                  ? error.message
                  : "This design could not be opened.",
              );
            }
            e.target.value = "";
          }}
        />
      </details>
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
              to={`${account ? "/workspace/new" : "/start"}?occasion=${encodeURIComponent(value.occasion)}&design=${variant || "invitation"}`}
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
