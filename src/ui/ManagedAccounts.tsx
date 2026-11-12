import { useEffect, useRef, useState } from "react";
import { request } from "./api";
import { useStore } from "./state";
import { Link, go } from "./shared";

export function ManagedAccounts({
  returnTo = "/workspace",
  create = false,
}: {
  returnTo?: string;
  create?: boolean;
}) {
  const { configuration, actions, account } = useStore();
  const [mode, setMode] = useState<"login" | "register" | "recover">(
    create ? "register" : "login",
  );
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [name, setName] = useState("");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const auth = configuration.auth;
  async function social(provider: "google" | "apple") {
    setBusy(true);
    setError("");
    try {
      const r = await request<{ url: string }>("/api/auth/oauth", {
        method: "POST",
        body: JSON.stringify({ provider, returnTo }),
      });
      const u = new URL(r.url);
      if (u.protocol !== "https:" || !u.pathname.endsWith("/auth/v1/authorize"))
        throw new Error("The sign-in destination could not be verified.");
      location.assign(u.href);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await request<{ message?: string }>("/api/auth/" + mode, {
        method: "POST",
        body: JSON.stringify(
          mode === "register"
            ? { email, password, name }
            : mode === "recover"
              ? { email }
              : { email, password },
        ),
      });
      setPassword("");
      if (mode === "login") {
        await actions.syncSession();
        go(returnTo);
      } else
        setMessage(result.message || "Check your email for the next step.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel sign-in-panel managed-account-panel">
      <p className="eyebrow">Your private card box</p>
      <h1>
        {mode === "register"
          ? "Make room for a memory."
          : mode === "recover"
            ? "Find your way back."
            : "Welcome back."}
      </h1>
      <p>
        {mode === "register"
          ? "Create an account to keep your card boxes, invitations and memories together."
          : mode === "recover"
            ? "We’ll send a secure link so you can choose a new password."
            : "Sign in to your invitations, card boxes and keepsakes."}
      </p>
      {mode !== "recover" && (
        <>
          <div className="provider-list">
            {(["google", "apple"] as const).map((provider) => (
              <button
                key={provider}
                className="provider-button"
                disabled={busy || !auth?.[provider]}
                onClick={() => social(provider)}
              >
                Continue with {provider === "google" ? "Google" : "Apple"}
              </button>
            ))}
          </div>
          {(!auth?.google || !auth?.apple) && (
            <p className="small">
              Unavailable sign-in options will appear when they’re ready.
            </p>
          )}
          <div className="or-rule">
            <span>or use email</span>
          </div>
        </>
      )}
      {!auth?.email && (
        <p role="status">
          Email sign-in is temporarily unavailable. You can continue without
          signing in.
        </p>
      )}
      <form onSubmit={submit}>
        {mode === "register" && (
          <label>
            Your name
            <input
              name="name"
              autoComplete="name"
              required
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
        )}
        <label>
          Email address
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        {mode !== "recover" && (
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete={
                mode === "register" ? "new-password" : "current-password"
              }
              required
              minLength={mode === "register" ? 12 : 1}
              maxLength={128}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {mode === "register" && (
              <span className="small">Use at least 12 characters.</span>
            )}
          </label>
        )}
        <button className="primary full" disabled={busy || !auth?.email}>
          {busy
            ? "One moment…"
            : mode === "register"
              ? "Create my account"
              : mode === "recover"
                ? "Send reset link"
                : "Sign in"}
        </button>
      </form>
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
      <div className="buttons">
        <button
          className="text-link"
          disabled={busy}
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError("");
            setMessage("");
            setPassword("");
          }}
        >
          {mode === "login" ? "Create an account" : "I already have an account"}
        </button>
        {mode === "login" && (
          <button
            className="text-link"
            disabled={busy}
            onClick={() => {
              setMode("recover");
              setPassword("");
              setMessage("");
              setError("");
            }}
          >
            Forgot password?
          </button>
        )}
      </div>
      <div className="account-skip">
        <button
          className="secondary full"
          disabled={busy}
          onClick={async () => {
            if (account || (await actions.startReview())) go(returnTo);
          }}
        >
          Continue without signing in ↗
        </button>
      </div>
      <p className="small">
        By continuing, you agree to our <Link to="/terms">terms</Link> and{" "}
        <Link to="/privacy">privacy notice</Link>.
      </p>
    </section>
  );
}

export function AccountCallback({ kind }: { kind: string }) {
  const { actions } = useStore();
  const [params] = useState(() => new URLSearchParams(location.search));
  const [status, setStatus] = useState(
      kind === "callback" ? "Finishing your sign-in…" : "",
    ),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [password, setPassword] = useState("");
  const started = useRef(false);
  useEffect(() => {
    history.replaceState({}, "", location.pathname); // remove one-use codes, hashes and fragments from history
    if (kind !== "callback" || started.current) return;
    started.current = true;
    if (params.has("error") || !params.get("code")) {
      setError(
        "Sign-in was cancelled or could not be completed. Please start again.",
      );
      return;
    }
    void request<{ returnTo: string }>("/api/auth/callback", {
      method: "POST",
      body: JSON.stringify({
        code: params.get("code"),
        state: params.get("state"),
      }),
    })
      .then(async (r) => {
        await actions.syncSession();
        go(r.returnTo);
      })
      .catch((e) => setError(e.message));
  }, []);
  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await request<{ message: string }>(
        "/api/auth/" + (kind === "recover" ? "reset" : "verify"),
        {
          method: "POST",
          body: JSON.stringify({
            tokenHash: params.get("token_hash"),
            ...(kind === "recover" ? { password } : {}),
          }),
        },
      );
      setPassword("");
      setStatus(r.message);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel sign-in-panel">
      <p className="eyebrow">Your account</p>
      <h1>
        {kind === "recover"
          ? "Choose a new password."
          : kind === "callback"
            ? "A little closer."
            : "Welcome to your card box."}
      </h1>
      {kind === "confirmed" && (
        <p>Your email confirmation has been processed. Sign in to continue.</p>
      )}
      {status && <p role="status">{status}</p>}
      {error && <p role="alert">{error}</p>}
      {["recover", "verify"].includes(kind) && !status && (
        <form onSubmit={verify}>
          {kind === "recover" && (
            <label>
              New password
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
          )}
          <button className="primary" disabled={busy}>
            {busy
              ? "One moment…"
              : kind === "recover"
                ? "Save new password"
                : "Confirm my email"}
          </button>
        </form>
      )}
      <Link className="secondary" to="/auth/sign-in">
        Back to sign in
      </Link>
    </section>
  );
}
