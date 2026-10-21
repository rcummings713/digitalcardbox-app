import { useState } from "react";
import { aiOptions } from "../modules/media/catalog";
import type { AiCardChoices } from "../modules/media/catalog";
import { request, ApiError } from "./api";
import { useStore } from "./state";
export function AiCardComposer({
  token,
  csrfToken,
  artId: initialArt,
  onGenerated,
  onChoose,
}: {
  token: string;
  csrfToken?: string;
  artId?: string;
  onGenerated: (id: string) => void;
  onChoose: (id: string) => void;
}) {
  const { configuration } = useStore();
  const [choices, setChoices] = useState<AiCardChoices>({
    occasion: "Wedding",
    palette: "Blush and copper",
    artwork: "Fine botanical illustration",
    motif: "Flowers and leaves",
  });
  const [artId, setArtId] = useState(initialArt || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState<string>(crypto.randomUUID());
  async function generate() {
    setBusy(true);
    setError("");
    try {
      const value = await request<{ artId: string }>(
        `/api/invitations/${encodeURIComponent(token)}/art`,
        {
          method: "POST",
          body: JSON.stringify({ ...choices, requestKey: reference }),
          signal: AbortSignal.timeout(120000),
        },
        csrfToken,
      );
      setArtId(value.artId);
      onGenerated(value.artId);
    } catch (failure) {
      setError(
        failure instanceof ApiError
          ? failure.message
          : "Your artwork could not be created. Your note is safe, and you can choose any collection design.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="ai-card-composer" aria-label="Make a card with AI">
      <h3>A card, made for this moment.</h3>
      <p className="small">
        Choose the occasion and a few beautiful details. We create the artwork;
        your own words stay separate and editable.
      </p>
      <div className="ai-choice-grid">
        {(Object.keys(aiOptions) as (keyof AiCardChoices)[]).map((field) => (
          <div key={field}>
            <label htmlFor={`ai-${field}`}>
              {field === "artwork"
                ? "Art style"
                : field.charAt(0).toUpperCase() + field.slice(1)}
            </label>
            <select
              id={`ai-${field}`}
              value={choices[field]}
              disabled={busy}
              onChange={(event) => {
                setChoices({ ...choices, [field]: event.target.value });
                setReference(crypto.randomUUID());
                setError("");
              }}
            >
              {aiOptions[field].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <p className="small">
        One artwork at a time. Up to two attempts per guest each day. You can
        keep writing or choose a collection card while it is being made.
      </p>
      {!configuration.ai.available && (
        <p className="notice">
          AI artwork is not enabled for this review yet. All 26 collection
          designs are ready to use.
        </p>
      )}
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      <button
        type="button"
        className="secondary"
        onClick={generate}
        disabled={busy || !configuration.ai.available}
      >
        {busy ? "Creating your card…" : "Create one card with AI"}
      </button>
      {busy && (
        <p role="status" className="small">
          This can take a little time. Your note is still yours to edit.
        </p>
      )}
      {artId && (
        <div className="ai-card-result">
          <img
            src={`/api/invitations/${encodeURIComponent(token)}/art/${encodeURIComponent(artId)}`}
            alt="Your safety-screened AI card artwork"
          />
          <div>
            <p className="small">
              Your new artwork is ready. Add your words and an optional GIF.
            </p>
            <button
              type="button"
              className="primary"
              onClick={() => onChoose(artId)}
            >
              Use this card
            </button>
            <button
              type="button"
              className="text-link"
              disabled={busy}
              onClick={() => {
                setReference(crypto.randomUUID());
                setError("");
                setArtId("");
              }}
            >
              Start a different design
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
