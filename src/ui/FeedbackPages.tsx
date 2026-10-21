import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { request } from "./api";
import { useStore } from "./state";
import { Heading, Link } from "./shared";
let feedbackRequest: Promise<{ csrfToken: string }> | null = null;
function openFeedbackSession() {
  if (!feedbackRequest)
    feedbackRequest = request<{ csrfToken: string }>(
      "/api/feedback/session",
    ).finally(() => {
      feedbackRequest = null;
    });
  return feedbackRequest;
}
export interface FeedbackItem {
  id: string;
  rating: number;
  category: string;
  message: string;
  email: string;
  contactConsent: boolean;
  state: "new" | "reviewed" | "archived";
  createdAt: string;
}
export function FeedbackPage() {
  const [rating, setRating] = useState(0),
    [category, setCategory] = useState("Overall experience"),
    [message, setMessage] = useState(""),
    [email, setEmail] = useState("");
  const [contactConsent, setContactConsent] = useState(false),
    [website, setWebsite] = useState("");
  const [csrf, setCsrf] = useState(""),
    [busy, setBusy] = useState(false),
    [sent, setSent] = useState(false),
    [error, setError] = useState("");
  const [reference] = useState(() => crypto.randomUUID());
  useEffect(() => {
    let active = true;
    openFeedbackSession()
      .then((value) => {
        if (active) setCsrf(value.csrfToken);
      })
      .catch(() => {
        if (active)
          setError(
            "Feedback is temporarily unavailable. Please try again shortly.",
          );
      });
    return () => {
      active = false;
    };
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!rating) {
      setError("Choose a rating before submitting your feedback.");
      return;
    }
    setBusy(true);
    try {
      await request(
        "/api/feedback",
        {
          method: "POST",
          body: JSON.stringify({
            requestKey: reference,
            rating,
            category,
            message,
            email,
            contactConsent,
            website,
          }),
        },
        csrf,
      );
      setSent(true);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Your feedback could not be saved. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (sent)
    return (
      <section className="feedback-thanks">
        <span className="script-accent">a little note, a real difference</span>
        <h1>Thank you for helping us grow.</h1>
        <p>Your feedback has been saved for our team to review.</p>
        <Link to="/" className="primary">
          Back to the card box
        </Link>
      </section>
    );
  return (
    <div className="feedback-page">
      <Heading
        eyebrow="We’re listening"
        title="Help make this feel even better."
      />
      <form className="panel feedback-form" onSubmit={submit}>
        <fieldset className="feedback-rating">
          <legend>How was your experience?</legend>
          <div>
            {[1, 2, 3, 4, 5].map((value) => (
              <label key={value} className={rating === value ? "selected" : ""}>
                <input
                  type="radio"
                  name="rating"
                  value={value}
                  checked={rating === value}
                  onChange={() => setRating(value)}
                />
                <span>
                  {value}
                  <span className="sr-only"> out of 5</span>
                </span>
              </label>
            ))}
          </div>
          <p className="small">
            1 · Needs work<span>5 · Loved it</span>
          </p>
        </fieldset>
        <label htmlFor="feedback-category">What would you like to share?</label>
        <select
          id="feedback-category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          {[
            "Overall experience",
            "Card designs",
            "GIFs and AI",
            "Invitations and QR",
            "Something went wrong",
            "Suggestion",
          ].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
        <label htmlFor="feedback-message">Your feedback</label>
        <textarea
          id="feedback-message"
          minLength={10}
          maxLength={2000}
          rows={4}
          required
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="What felt clear? What was confusing? What would make this better?"
          aria-describedby="feedback-count"
        />
        <p id="feedback-count" className="small">
          {message.length}/2,000 characters · Shared privately with our team.
        </p>
        <details className="feedback-contact">
          <summary>
            Let us follow up <span className="optional">optional</span>
          </summary>
          <label htmlFor="feedback-email">Email address</label>
          <input
            id="feedback-email"
            type="email"
            autoComplete="email"
            maxLength={254}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <label className="check">
            <input
              type="checkbox"
              checked={contactConsent}
              onChange={(event) => setContactConsent(event.target.checked)}
            />
            <span>You may contact me about this feedback.</span>
          </label>
        </details>
        <div className="feedback-honeypot" aria-hidden="true">
          <label htmlFor="feedback-website">Website</label>
          <input
            id="feedback-website"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
          />
        </div>
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
        <button className="primary" disabled={busy || !csrf}>
          {busy ? "Saving your feedback…" : "Send feedback"}
        </button>
      </form>
    </div>
  );
}
export function FeedbackInbox() {
  const { actions } = useStore();
  const [items, setItems] = useState<FeedbackItem[]>([]),
    [error, setError] = useState(""),
    [filter, setFilter] = useState("new");
  function load() {
    return request<{ feedback: FeedbackItem[] }>("/api/admin/feedback")
      .then((value) => setItems(value.feedback))
      .catch((failure) => setError(failure.message));
  }
  useEffect(() => {
    void load();
  }, []);
  return (
    <section className="feedback-inbox">
      <h2>Tester feedback</h2>
      <p>
        Private comments and helpful criticism. Email appears only when the
        sender permits follow-up.
      </p>
      <label htmlFor="feedback-filter">Review status</label>
      <select
        id="feedback-filter"
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
      >
        <option value="new">New</option>
        <option value="reviewed">Reviewed</option>
        <option value="archived">Archived</option>
        <option value="all">All feedback</option>
      </select>
      {error && <p role="alert">{error}</p>}
      {items
        .filter((item) => filter === "all" || item.state === filter)
        .map((item) => (
          <article className="panel" key={item.id}>
            <div className="row-between">
              <strong>
                {item.rating}/5 · {item.category}
              </strong>
              <time dateTime={item.createdAt}>
                {new Date(item.createdAt).toLocaleDateString()}
              </time>
            </div>
            <p className="feedback-message">{item.message}</p>
            {!!item.contactConsent && item.email && (
              <p>Follow-up permitted: {item.email}</p>
            )}
            <div className="buttons">
              {(["new", "reviewed", "archived"] as const)
                .filter((state) => state !== item.state)
                .map((state) => (
                  <button
                    className="secondary"
                    key={state}
                    onClick={async () => {
                      if (await actions.reviewFeedback(item.id, state))
                        void load();
                    }}
                  >
                    Mark {state}
                  </button>
                ))}
            </div>
          </article>
        ))}
      {!items.some((item) => filter === "all" || item.state === filter) && (
        <p className="empty">No feedback in this view yet.</p>
      )}
    </section>
  );
}
