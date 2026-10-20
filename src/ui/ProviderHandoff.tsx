import { useState } from "react";
import type { GiftHandoff } from "../modules/gifts/routing";
import { providerRoute } from "../modules/gifts/routing";
import { Heading, Link, Notice, copy, go } from "./shared";
import { useStore } from "./state";

export function ProviderHandoff({
  handoff,
  base,
  validate,
}: {
  handoff: GiftHandoff;
  base: string;
  validate: () => Promise<boolean>;
}) {
  const { notify } = useStore();
  const [opened, setOpened] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const route = providerRoute(handoff);
  async function open() {
    setBusy(true);
    setError("");
    try {
      if (!(await validate())) {
        setError(
          "The destination could not be confirmed. Return to gift details and review the current recipient.",
        );
        return;
      }
      setOpened(true);
      if (!handoff.previewOnly) window.location.assign(route);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Heading
        eyebrow="Your optional gift"
        title={"Continue with " + handoff.service}
      />
      <div className="guest-layout handoff-layout">
        <section className="panel provider-handoff">
          <ol className="guest-stepper">
            <li>1 · Review recipient</li>
            <li aria-current="step">
              2 ·{" "}
              {handoff.service === "Zelle" ? "Your bank" : "Your payment app"}
            </li>
            <li>3 · Return here</li>
          </ol>
          <Notice>
            {handoff.previewOnly
              ? "Test recipient · Preview only. No payment app will open and no money will be sent."
              : "Opening the service does not send money. For this test, stop before confirming any payment inside the service."}
          </Notice>
          <h2>{handoff.recipient}</h2>
          <dl className="detail-grid">
            <div>
              <dt>Service</dt>
              <dd>{handoff.service}</dd>
            </div>
            <div>
              <dt>Exact recipient</dt>
              <dd>
                <code>{handoff.identifier}</code>
              </dd>
            </div>
            <div>
              <dt>Intended amount</dt>
              <dd>
                {handoff.amount
                  ? "$" + handoff.amount
                  : "Choose in your payment app"}
              </dd>
            </div>
            <div>
              <dt>Payment memo</dt>
              <dd>
                <code>{handoff.reference}</code>
              </dd>
            </div>
          </dl>
          <div className="buttons">
            <button
              className="secondary"
              onClick={() => copy(handoff.identifier, notify)}
            >
              Copy recipient
            </button>
            <button
              className="secondary"
              onClick={() => copy(handoff.reference, notify)}
            >
              Copy payment memo
            </button>
          </div>
          <button className="primary" disabled={busy} onClick={open}>
            {busy
              ? "Checking recipient…"
              : handoff.previewOnly
                ? "Preview " +
                  (handoff.service === "Zelle"
                    ? "bank handoff"
                    : handoff.service + " handoff")
                : handoff.service === "Zelle"
                  ? "Find my bank on Zelle ↗"
                  : "Open " + handoff.service + " ↗"}
          </button>
          <details className="handoff-instructions-panel">
            <summary>How this handoff works</summary>
            {handoff.service === "Zelle" ? (
              <>
                <h3>Use Zelle in your own banking app</h3>
                <ol className="handoff-instructions">
                  <li>
                    Open your bank’s app and choose “Send money with Zelle.”
                  </li>
                  <li>
                    Enter the exact email or U.S. mobile number above and verify
                    the recipient.
                  </li>
                  <li>
                    Enter the intended amount and reference if your bank
                    supports a memo. Stop before sending during testing.
                  </li>
                  <li>
                    Return here. Your host checks their own account separately.
                  </li>
                </ol>
                <p className="small">
                  The button opens Zelle’s official bank finder. Your recipient
                  details are not passed to it.
                </p>
              </>
            ) : (
              <>
                <h3>What happens in {handoff.service}</h3>
                <ol className="handoff-instructions">
                  <li>
                    Open the host’s profile in {handoff.service}. On supported
                    phones, the service may open its app.
                  </li>
                  <li>
                    Verify the exact username and recipient. If the app does not
                    open, search for the copied identifier.
                  </li>
                  <li>
                    Enter the amount and copied memo. Stop before confirming a
                    payment during testing.
                  </li>
                  <li>
                    Return here to finish. Opening or returning never confirms
                    receipt.
                  </li>
                </ol>
              </>
            )}
            <p className="small route-address">
              {handoff.previewOnly ? "Preview of destination" : "Destination"}:{" "}
              <code>{route}</code>
            </p>
            <p className="small">
              Enter the amount and memo in the service. Your card stays here.
              Only your host can check whether money arrived.
            </p>
          </details>
          {opened && (
            <div role="status" className="handoff-return">
              <h3>
                {handoff.previewOnly
                  ? "This is where you would leave for " +
                    (handoff.service === "Zelle"
                      ? "your bank"
                      : handoff.service) +
                    "."
                  : "Back from your payment service?"}
              </h3>
              <p>
                Your gift details remain unconfirmed. No payment receipt has
                been received from {handoff.service}.
              </p>
              <button className="primary" onClick={() => go(base + "/thanks")}>
                Finish without sending money
              </button>
            </div>
          )}
          {error && (
            <p role="alert" className="field-error">
              {error}
            </p>
          )}
          <div className="buttons">
            <Link to={base + "/gift"} className="text-link">
              Change gift details
            </Link>
            <Link to={base + "/thanks"} className="text-link">
              Finish without a payment
            </Link>
          </div>
        </section>
        <aside className="panel matching-note">
          <span className="script-accent">thoughtfulness, connected</span>
          <h2>Your note and gift details, together.</h2>
          <p>
            Your host sees your name, payment-app name, intended amount and
            matching reference alongside your card.
          </p>
          <p>
            Only the host can check whether funds arrived. TheDigitalCardBox
            cannot read a payment account or verify a transfer.
          </p>
        </aside>
      </div>
    </>
  );
}
