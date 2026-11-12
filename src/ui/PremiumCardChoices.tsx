import { premiumEditions } from "../modules/cards/premium";
import type { PremiumEdition } from "../modules/cards/premium";
import { TemplateArt } from "./TemplateArt";

export function PremiumCardChoices({
  value,
  onChange,
}: {
  value?: PremiumEdition;
  onChange: (value?: PremiumEdition) => void;
}) {
  return (
    <fieldset className="premium-selection">
      <legend>Choose your card experience</legend>
      <div className="premium-paths">
        <button
          type="button"
          className="secondary"
          aria-pressed={!value}
          onClick={() => onChange(undefined)}
        >
          Free collection · $0
        </button>
        <button
          type="button"
          className="secondary"
          aria-pressed={!!value}
          onClick={() => onChange(value || "gilded")}
        >
          Signature collection · $4.99
        </button>
      </div>
      <p className="small">
        Choose and personalize before sending. Signature cards stay private
        until checkout is confirmed and you choose Send.
      </p>
      {value && (
        <div className="premium-choice-grid">
          {premiumEditions.map((edition) => (
            <button
              type="button"
              key={edition.id}
              className={"premium-choice premium-edition-" + edition.id}
              aria-pressed={value === edition.id}
              onClick={() => onChange(edition.id)}
            >
              <div className="premium-choice-art" aria-hidden="true">
                <TemplateArt id={edition.template} />
                <span className="premium-preview-caption">
                  a little note
                  <br />
                  <em>a lasting memory</em>
                </span>
              </div>
              <strong>{edition.name}</strong>
              <span>{edition.detail}</span>
              <small>$4.99 · one card</small>
            </button>
          ))}
        </div>
      )}
    </fieldset>
  );
}
