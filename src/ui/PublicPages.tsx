import { CardCarousel } from "./CardCarousel";
import { useState } from "react";
import type { FormEvent } from "react";
import { Card, Heading, InstagramLink, Link, Notice, go, copy } from "./shared";
import { ConnectedStart } from "./AuthPages";
import { occasionChoices } from "../modules/events/occasions";
import { HomeComparison } from "./HomeComparison";
import { useStore } from "./state";

export function Home() {
  const [occasion, setOccasion] = useState("");
  return (
    <section
      className="discovery-home"
      aria-label="Digital cards and lasting memories"
    >
      <div className="discovery-intro">
        <p className="eyebrow">Digital cards. Lasting memories.</p>
        <h1>Smart Event Planning. Seamless Gifting.</h1>
        <p>
          Ditch the physical card box for a unified platform that connects
          invitations, custom QR codes, and secure payments.
        </p>
      </div>
      <div className="discovery-card">
        <CardCarousel />
        <p className="card-preview-caption">
          A little look at what your host receives.
        </p>
      </div>
      <div className="discovery-create">
        <label className="eyebrow" htmlFor="home-occasion">
          Every occasion
        </label>
        <div className="home-occasion-picker">
          <select
            id="home-occasion"
            aria-label="Every occasion"
            value={occasion}
            onChange={(e) => setOccasion(e.target.value)}
          >
            <option value="">Every occasion</option>
            {occasionChoices.map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
          <Link
            className="primary"
            to={
              "/invitations?occasion=" +
              encodeURIComponent(occasion || "Wedding")
            }
          >
            Explore invitations ↗
          </Link>
        </div>
        <Link
          className="text-link"
          to={"/start?occasion=" + encodeURIComponent(occasion || "Wedding")}
        >
          Create a card box
        </Link>
      </div>
      <div className="discovery-value">
        <HomeComparison />
      </div>
    </section>
  );
}

export function Start() {
  const { notify, mode } = useStore();
  const [manual, setManual] = useState(false);
  const occasion =
    new URLSearchParams(location.search).get("occasion") || "Wedding";
  if (mode === "server") return <ConnectedStart />;
  return (
    <div className="onboarding-grid">
      <div className="onboarding-story">
        <p className="eyebrow">A new beginning</p>
        <h1>
          Let’s make
          <br />
          something
          <br />
          <em>worth keeping.</em>
        </h1>
        <p>Your people. Their words. All together.</p>
        <Card
          small
          entry={{
            name: "The people who love you",
            style: "ribbon",
            note: "For the big days, and all the little things that make them yours.",
          }}
        />
      </div>
      <section className="panel account-panel">
        <p className="eyebrow">Welcome to TheDigitalCardBox</p>
        <h2>Create your space</h2>
        <p>Start a card box for your {occasion.toLowerCase()}.</p>
        <div className="provider-list">
          {["Apple", "Google", "Amazon"].map((provider, i) => (
            <button
              key={provider}
              className="provider-button"
              onClick={() =>
                notify(
                  `${provider} sign-in is not connected. Choose “Continue without signing in” to review the experience.`,
                )
              }
            >
              <span aria-hidden="true">{["●", "G", "a"][i]}</span>Continue with{" "}
              {provider}
            </button>
          ))}
        </div>
        <div className="or-rule">
          <span>or</span>
        </div>
        <button
          className="secondary full"
          onClick={() => setManual(!manual)}
          aria-expanded={manual}
          aria-controls="email-entry"
        >
          Continue with email
        </button>
        {manual && (
          <form
            id="email-entry"
            onSubmit={(e) => {
              e.preventDefault();
              notify(
                "Account creation is not connected. Continue without signing in below.",
              );
            }}
          >
            <label htmlFor="account-name">Your name</label>
            <input
              id="account-name"
              autoComplete="name"
              required
              maxLength={80}
            />
            <label htmlFor="account-email">Email address</label>
            <input
              id="account-email"
              type="email"
              autoComplete="email"
              required
            />
            <p className="small">
              Account connections are being prepared. No password is collected
              here.
            </p>
            <button className="secondary">Review account choice</button>
          </form>
        )}
        <div className="account-skip">
          <Link
            to={
              "/workspace/new?occasion=" +
              encodeURIComponent(occasion) +
              (new URLSearchParams(location.search).get("design") ===
              "invitation"
                ? "&design=invitation"
                : "")
            }
            className="primary full"
          >
            Continue without signing in ↗
          </Link>
          <p className="small">
            Design workspace · No account needed. Changes stay in this browser.
          </p>
        </div>
        <p className="small">
          Read our <Link to="/privacy">privacy notice</Link> and{" "}
          <Link to="/terms">terms</Link>.
        </p>
        <Link to="/workspace" className="text-link">
          Open existing card boxes
        </Link>
      </section>
    </div>
  );
}
export function Informational({ page }: { page: string }) {
  const { mode } = useStore();

  if (page === "pricing")
    return (
      <>
        <Heading
          eyebrow="Simple, thoughtful choices"
          title="The words are always enough."
        >
          <p>
            Every guest can leave a note. A gift and a polished event book are
            separate, optional choices.
          </p>
        </Heading>
        <div className="pricing-grid">
          <section className="panel">
            <p className="eyebrow">Your card box</p>
            <h2>Keep the kind words.</h2>
            <div className="price">Free</div>
            <p>
              Guest cards, a private CardVault and basic export. No contribution
              cap and no gift required.
            </p>
            <Link className="primary" to="/start">
              Create your card box
            </Link>
          </section>
          <section className="panel price-feature">
            <p className="eyebrow">The polished event book</p>
            <h2>Make it a keepsake.</h2>
            <p>
              Final pricing follows the number of included entries when
              contributions close.
            </p>
            <dl className="price-tiers">
              <div>
                <dt>0–99 entries</dt>
                <dd>$15</dd>
              </div>
              <div>
                <dt>100–299 entries</dt>
                <dd>$30</dd>
              </div>
              <div>
                <dt>300+ entries</dt>
                <dd>$79</dd>
              </div>
            </dl>
            <details className="entry-count-details">
              <summary>About entries &amp; checkout</summary>
              <p className="small">
                One card with its photo counts as one entry. GIFs and cash gifts
                do not add entries. Purchasing is not connected in this
                workspace.
              </p>
            </details>
          </section>
        </div>
      </>
    );
  if (page === "how-it-works")
    return (
      <>
        <Heading
          eyebrow="A thoughtful little process"
          title="From a shared link to a lasting memory."
        />
        <div className="steps-grid">
          {[
            [
              "Set up your digital card box",
              "Choose your occasion, customize your welcome page, and design an elegant digital box that perfectly matches the aesthetic of your event.",
            ],
            [
              "Send your invites",
              "Skip the physical invitations. Share a secure link or custom QR code directly with your guest list. Your celebration remains private, accessible only to the people you invite.",
            ],
            [
              "Collect cards & gifts",
              "Gather digital notes, photos, and frictionless monetary gifts all in one secure portal. Guests can easily compose meaningful cards without the last-minute ATM run.",
            ],
            [
              "Preserve your memories",
              "Access your lifetime CardVault, curate a beautifully bound physical event book, and relive your favorite milestone moments whenever you want. Enjoy storage that protects your sentimental notes and financial registries forever.",
            ],
          ].map(([title, description], i) => (
            <section className="panel" key={title}>
              <span className="tile-number">0{i + 1}</span>
              <h2>{title}</h2>
              <p>{description}</p>
            </section>
          ))}
        </div>
        <p className="how-it-works-availability small">
          DEV availability: invitations share by private link or QR. Gifts open
          the host’s external payment service; this site never moves money.
          Private photo uploads, physical book fulfillment and permanent
          account-backed storage are planned services. Anonymous review access
          lasts seven days.
        </p>
        <div className="center-section">
          <Link to="/invitations" className="primary">
            Let’s begin
          </Link>
        </div>
      </>
    );
  if (page === "about")
    return (
      <>
        <Heading eyebrow="Our story" title="About TheDigitalCardBox" />
        <article className="about-story">
          <p className="about-verbatim">
            The Digital Card box is a comprehensive digital event solutions
            platform that modernizes social celebrations by seamlessly
            integrating digital invitations, sentimental e-cards, and
            frictionless cash gifting into a unified web and mobile ecosystem.
            The platform empowers event hosts to design elegant e-invites and
            deploy venue-specific, custom QR codes that replace physical
            envelope boxes at weddings, baby showers, and milestone parties.
            Simultaneously, it provides guests with a secure, all-in-one portal
            to compose meaningful, permanently archived digital notes and
            directly execute secure monetary gifts. By bridging the emotional
            value of traditional greeting cards with the convenience of instant
            mobile payments, the company eliminates the logistical friction of
            ATMs, physical card shopping, and venue storage, offering a
            sustainable, highly secure, and digitally preserved gifting
            experience for the modern era.
          </p>
        </article>
      </>
    );
  const copyByPage: Record<string, [string, string, string[]]> = {
    privacy: [
      "Your privacy",
      "Your words deserve care.",
      [
        mode === "server"
          ? "Test events and accepted cards are saved on this development server. Host and guest access use separate session cookies. Use fictional information; payments are disabled."
          : "This design workspace stores fictional records and the changes you make in your browser’s local storage. It does not create an account, upload a photo, send a note to a server, or connect a payment service. Use fictional information while reviewing it.",
        mode === "server"
          ? "Unsent card drafts stay in this browser tab. Accepted cards remain on the test server until removed by their host or the development database is reset. Clearing browser storage does not erase accepted cards. Private photo uploads are not connected yet. Downloads remain on the device where you save them."
          : "Uploaded photos stay on this device. You can remove your card, clear your browser data, or reset the design workspace in Account settings. An exported file stays on the device where you download it.",
        "Contact drafts open in your own email app. Nothing is sent until you choose to send it there. No advertising trackers or external GIF searches are loaded by this interface.",
      ],
    ],
    terms: [
      "Using TheDigitalCardBox",
      "A thoughtful place, used thoughtfully.",
      [
        "Share only words and images that you have permission to use. Keep payment credentials, financial documents and sensitive personal information out of notes.",
        "External gift activity is separate from a card. A guest report or an app handoff does not verify receipt. The host checks their own payment service before marking a gift as received.",
        mode === "server"
          ? "Local test accounts support card and event-book review. This environment does not process payments, transfer money or accept purchases. Production account providers and database hosting remain separate implementation work."
          : "This account-free design workspace does not process payments or purchases. Features that require connected accounts will be available after the corresponding services are implemented.",
      ],
    ],
    accessibility: [
      "Accessibility",
      "A place for everyone.",
      [
        "We are building toward WCAG 2.2 Level AA with keyboard navigation, visible focus, text alternatives, sufficient contrast, labeled controls and layouts that adapt to zoom and small screens.",
        "Cards have a readable text version. Composer GIFs stay still until you press Play. The home card has a brief opening preview; reduced-motion settings keep it still. You can also reduce motion in Account settings.",
        "If something gets in your way, email support@digitalcardbox.com with the page and what you were trying to do. Please leave out private guest or payment information.",
      ],
    ],
  };
  const content = copyByPage[page];
  return (
    <>
      <Heading eyebrow={content[0]} title={content[1]} />
      <article className="panel reading-width">
        {content[2].map((p) => (
          <p key={p}>{p}</p>
        ))}
        <p>
          <Link to="/contact">Get in touch ↗</Link>
        </p>
      </article>
    </>
  );
}
export function Contact() {
  const { notify } = useStore();
  const [draft, setDraft] = useState<{
    to: string;
    subject: string;
    body: string;
  } | null>(null);
  function prepare(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const topic = String(f.get("topic"));
    setDraft({
      to:
        topic === "Support"
          ? "support@digitalcardbox.com"
          : "info@digitalcardbox.com",
      subject: "TheDigitalCardBox · " + topic,
      body: `${f.get("message")}\n\nFrom: ${f.get("name")}\nReply to: ${f.get("email")}`,
    });
  }
  return (
    <>
      <Heading eyebrow="A note away" title="Let’s keep in touch." />
      <div className="contact-layout">
        <section className="panel contact-form">
          <h2>Send a little hello</h2>
          <form
            aria-label="Contact form"
            onSubmit={prepare}
            onChange={() => setDraft(null)}
          >
            <div className="contact-fields">
              <div>
                <label htmlFor="contact-name">Your name</label>
                <input
                  id="contact-name"
                  name="name"
                  autoComplete="name"
                  required
                  maxLength={80}
                />
              </div>
              <div>
                <label htmlFor="contact-email">Email address</label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                />
              </div>
              <div className="contact-wide">
                <label htmlFor="contact-topic">What’s on your mind?</label>
                <select id="contact-topic" name="topic">
                  <option>General question</option>
                  <option>Support</option>
                  <option>Hosting</option>
                  <option>Feedback</option>
                </select>
              </div>
              <div className="contact-wide">
                <label htmlFor="contact-message">Your message</label>
                <textarea
                  id="contact-message"
                  name="message"
                  required
                  rows={3}
                  maxLength={3000}
                />
              </div>
            </div>
            <p className="small">
              Leave out passwords, payment details and private guest
              information.
            </p>
            <button className="primary">Prepare email draft</button>
          </form>
          {draft && (
            <div className="draft-preview">
              <h3>Your email draft</h3>
              <p>
                To: {draft.to}
                <br />
                Subject: {draft.subject}
              </p>
              <pre>{draft.body}</pre>
              <div className="buttons">
                <button
                  className="secondary"
                  onClick={() =>
                    copy(draft.subject + "\n" + draft.body, notify)
                  }
                >
                  Copy draft
                </button>
                <a
                  className="primary"
                  href={`mailto:${draft.to}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`}
                >
                  Open email app
                </a>
              </div>
              <Notice>Your draft is ready. Nothing has been sent.</Notice>
            </div>
          )}
        </section>
        <aside className="panel contact-info" aria-label="Contact details">
          <h2>We’re a note away.</h2>
          <div className="contact-addresses">
            <p>
              Support
              <br />
              <a href="mailto:support@digitalcardbox.com">
                support@digitalcardbox.com
              </a>
            </p>
            <p>
              General information
              <br />
              <a href="mailto:info@digitalcardbox.com">
                info@digitalcardbox.com
              </a>
            </p>
          </div>
          <InstagramLink />
          <details>
            <summary>Looking for an event or a gift?</summary>
            <p>
              Use the private link or QR from your host. For a gift question,
              check the service you used and contact your host through a channel
              you know.
            </p>
          </details>
        </aside>
      </div>
    </>
  );
}
export function Missing() {
  return (
    <div className="empty">
      <span className="script-accent">a little lost?</span>
      <h1>This page isn’t here.</h1>
      <p>If you’re joining an event, use the complete link from your host.</p>
      <Link to="/" className="primary">
        Back to home
      </Link>
      <button className="secondary" onClick={() => go("/workspace")}>
        My card boxes
      </button>
    </div>
  );
}
