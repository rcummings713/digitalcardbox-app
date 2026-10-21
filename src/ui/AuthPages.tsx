import { useState } from "react";
import { Link, go } from "./shared";
import { useStore } from "./state";
export function SignIn({
  returnTo = "/workspace",
  showChoices = false,
}: {
  returnTo?: string;
  showChoices?: boolean;
}) {
  const { actions, busy, notify, account, configuration } = useStore();
  const [email, setEmail] = useState(
    new URLSearchParams(location.search).get("access") === "operator"
      ? "operator@digitalcardbox.test"
      : "host@digitalcardbox.test",
  );
  const [password, setPassword] = useState("");
  const next = /^\/(workspace|admin)(\/|\?|$)/.test(returnTo)
    ? returnTo
    : "/workspace";
  async function signIn(address: string, value: string) {
    if (await actions.login(address, value)) go(next);
  }
  if (account)
    return (
      <section className="panel sign-in-panel">
        <p className="eyebrow">Welcome back</p>
        <h1>Your memories are waiting.</h1>
        <p>Signed in as {account.email}.</p>
        <Link className="primary" to={next}>
          Open your workspace
        </Link>
        <button
          className="text-link"
          disabled={busy}
          onClick={() => actions.logout()}
        >
          Sign out
        </button>
      </section>
    );
  return (
    <section className="panel sign-in-panel">
      <p className="eyebrow">Your private card box</p>
      <h1>{showChoices ? "Make room for a memory." : "Welcome back."}</h1>
      {showChoices && (
        <div className="provider-list">
          {["Apple", "Google", "Amazon"].map((provider) => (
            <button
              key={provider}
              className="provider-button"
              onClick={() =>
                notify(
                  `${provider} sign-in is not connected yet. Use the continue option below.`,
                )
              }
            >
              Continue with {provider}
            </button>
          ))}
        </div>
      )}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void signIn(email, password);
        }}
      >
        <label htmlFor="host-email">Email address</label>
        <input
          id="host-email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={254}
        />
        <label htmlFor="host-password">Password</label>
        <input
          id="host-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          maxLength={200}
        />
        <button className="primary full" disabled={busy}>
          {busy ? "Opening your workspace…" : "Sign in"}
        </button>
      </form>
      <div className="account-skip">
        <button
          className="secondary full"
          disabled={busy}
          onClick={async () => {
            if (configuration.reviewSessions) {
              if (await actions.startReview()) go(next);
            } else
              await signIn("host@digitalcardbox.test", "CardBoxReview!2026");
          }}
        >
          {configuration.reviewSessions
            ? "Continue without signing in ↗"
            : "Continue with test host ↗"}
        </button>
        <p className="small">
          {configuration.reviewSessions
            ? "Start a private test workspace saved to this browser for seven days. Share your invitation to test with guests. Use fictional event information."
            : "Skip account setup. Test cards are saved on this development server; no payments are enabled."}
        </p>
      </div>
      {!configuration.hosted && (
        <details>
          <summary>Test account details</summary>
          <p className="small">
            Host: <code>host@digitalcardbox.test</code>
            <br />
            Second host: <code>other@digitalcardbox.test</code>
            <br />
            Administrator: <code>operator@digitalcardbox.test</code>
            <br />
            Password for these local accounts: <code>CardBoxReview!2026</code>
          </p>
        </details>
      )}
      <p className="small">
        Use fictional information while testing.{" "}
        <Link to="/privacy">Privacy notice</Link>
      </p>
    </section>
  );
}
export function ConnectedStart() {
  const occasion =
    new URLSearchParams(location.search).get("occasion") || "Wedding";
  return (
    <SignIn
      showChoices
      returnTo={"/workspace/new?occasion=" + encodeURIComponent(occasion)}
    />
  );
}
