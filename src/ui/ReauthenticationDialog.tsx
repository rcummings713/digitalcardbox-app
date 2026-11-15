import { useEffect, useRef, useState } from "react";
import { request } from "./api";
import { registerReauthenticationChallenge } from "./reauthentication";
import { useStore } from "./state";
import { go } from "./shared";

// The request broker retains the original form/action while the server checks
// a password for the current session's account. No cookie or CSRF is replaced.
export function ReauthenticationDialog() {
  const { account } = useStore();
  const dialog = useRef<HTMLDialogElement>(null);
  const pending = useRef<((confirmed: boolean) => void)[]>([]);
  const activeToken = useRef("");
  const generation = useRef(0);
  const authenticationRequest = useRef<AbortController | null>(null);
  const previousAccount = useRef(account?.id);
  const [csrfToken, setCsrfToken] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const temporary = account?.id.startsWith("visitor-") && !account.registered;
  function finish(confirmed: boolean) {
    generation.current++;
    authenticationRequest.current?.abort();
    authenticationRequest.current = null;
    const callbacks = pending.current.splice(0);
    activeToken.current = "";
    setPassword("");
    setError("");
    setCsrfToken("");
    setBusy(false);
    dialog.current?.close();
    for (const callback of callbacks) callback(confirmed);
  }
  useEffect(() => {
    const unregister = registerReauthenticationChallenge(
      (token) => new Promise<boolean>((resolve) => {
        if (activeToken.current && activeToken.current !== token) {
          generation.current++;
          authenticationRequest.current?.abort();
          for (const callback of pending.current.splice(0)) callback(false);
          setPassword("");
          setError("");
          setBusy(false);
        }
        pending.current.push(resolve);
        activeToken.current = token;
        setCsrfToken(token);
      }),
    );
    return () => {
      unregister();
      generation.current++;
      authenticationRequest.current?.abort();
      for (const callback of pending.current.splice(0)) callback(false);
    };
  }, []);
  useEffect(() => {
    if (csrfToken && !dialog.current?.open) dialog.current?.showModal();
  }, [csrfToken]);
  useEffect(() => {
    if (previousAccount.current !== account?.id) {
      previousAccount.current = account?.id;
      if (pending.current.length) finish(false);
      else setPassword("");
    }
  }, [account?.id]);
  async function confirm(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const currentGeneration = generation.current;
    const token = csrfToken;
    const controller = new AbortController();
    authenticationRequest.current = controller;
    try {
      await request(
        "/api/auth/reauthenticate",
        { method: "POST", body: JSON.stringify({ password }), signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]) },
        csrfToken,
      );
      if (generation.current !== currentGeneration || activeToken.current !== token) return;
      finish(true);
    } catch (failure) {
      if (generation.current !== currentGeneration || activeToken.current !== token) return;
      setPassword("");
      setError(failure instanceof Error ? failure.message : "Your password could not be confirmed.");
      setBusy(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      className="panel sign-in-panel"
      aria-labelledby="reauthentication-title"
      onCancel={(event) => { event.preventDefault(); if (!busy) finish(false); }}
    >
      <h2 id="reauthentication-title">Confirm it’s you.</h2>
      <p>Confirm your current password before publishing, changing gift destinations or exporting private cards.</p>
      {account && <p className="small">Account: {account.email}</p>}
      {!temporary && <form onSubmit={confirm}>
        <label htmlFor="reauthentication-password">Current password</label>
        <input
          id="reauthentication-password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={200}
          autoFocus
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={busy}
        />
        {error && <p role="alert">{error}</p>}
        <div className="button-row">
          <button className="primary" disabled={busy}>{busy ? "Confirming…" : "Confirm password"}</button>
          <button className="secondary" type="button" disabled={busy} onClick={() => finish(false)}>Cancel</button>
        </div>
      </form>}
      {temporary ? <>
        <p>Link this temporary workspace to a verified host account before continuing. Your saved events stay with it.</p>
        <button className="primary" onClick={() => { finish(false); go("/auth/register"); }}>Create a host account</button>
        <button className="secondary" onClick={() => finish(false)}>Cancel</button>
      </> : <p className="small">Signed in with Google or Apple? Use a TheDigitalCardBox password here. You can cancel, sign out and choose Forgot password to set one; never enter your Google or Apple password.</p>}
    </dialog>
  );
}
