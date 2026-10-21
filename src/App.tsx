import { FeedbackPage } from "./ui/FeedbackPages";
import { useEffect, useRef, useState } from "react";
import { Account, EventForm, EventWorkspace, Workspace } from "./ui/HostPages";
import { Contact, Home, Informational, Missing, Start } from "./ui/PublicPages";
import { GuestPage } from "./ui/GuestPages";
import { Admin } from "./ui/AdminPages";
import { InstagramLink, Link, Logo } from "./ui/shared";
import { StoreProvider, useStore } from "./ui/state";
import { SignIn } from "./ui/AuthPages";

function locationKey() {
  return location.pathname + location.search;
}
function Shell() {
  const [route, setRoute] = useState(locationKey);
  const { message, storageError, notify, mode, account, ready, actions, busy } =
    useStore();
  const main = useRef<HTMLElement>(null);
  const previousRoute = useRef(route);
  useEffect(() => {
    const change = () => setRoute(locationKey());
    window.addEventListener("popstate", change);
    return () => window.removeEventListener("popstate", change);
  }, []);
  const path = route.split("?")[0].replace(/\/$/, "") || "/";
  const parts = path.split("/").filter(Boolean);
  const guest = parts[0] === "g";
  const workspace = parts[0] === "workspace";
  const admin = parts[0] === "admin";
  useEffect(() => {
    if (path === "/prototype/index.html" || path === "/host") {
      window.history.replaceState({}, "", "/workspace");
      setRoute(locationKey());
    }
  }, [path]);
  useEffect(() => {
    const timer = setTimeout(() => {
      const h1 = main.current?.querySelector("h1");
      document.title =
        (h1?.textContent || "Cards, gifts & memories") + " · TheDigitalCardBox";
      if (previousRoute.current !== route) {
        previousRoute.current = route;
        main.current?.focus({ preventScroll: true });
        window.scrollTo({ top: 0, behavior: "instant" });
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [route, ready, account]);
  let content;
  if (guest)
    content = <GuestPage token={parts[1] || ""} step={parts[2] || "landing"} />;
  else if (path === "/") content = <Home />;
  else if (path === "/start") content = <Start />;
  else if (path === "/workspace") content = <Workspace />;
  else if (path === "/workspace/new") content = <EventForm />;
  else if (path === "/workspace/account") content = <Account />;
  else if (parts[0] === "workspace" && parts[1] === "events" && parts[2])
    content = (
      <EventWorkspace
        key={parts[2]}
        id={parts[2]}
        tab={parts[3] || "overview"}
      />
    );
  else if (admin) content = <Admin tab={parts[1] || "overview"} />;
  else if (path === "/contact") content = <Contact />;
  else if (path === "/feedback") content = <FeedbackPage />;
  else if (
    [
      "about",
      "how-it-works",
      "cards",
      "pricing",
      "privacy",
      "terms",
      "accessibility",
    ].includes(parts[0]) &&
    parts.length === 1
  )
    content = <Informational page={parts[0]} />;
  else content = <Missing />;
  if (mode === "server" && (workspace || admin)) {
    if (!ready)
      content = (
        <div className="empty" role="status">
          <h1>Opening your workspace…</h1>
        </div>
      );
    else if (!account) content = <SignIn returnTo={route} />;
  }
  return (
    <div
      className={
        "shell " +
        (!workspace && !admin && !guest ? "public-shell " : "") +
        (workspace || admin ? "app-shell" : "") +
        (guest ? " guest-shell" : "")
      }
    >
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="site-header">
        {!guest && (
          <div className="navigation-bar">
            <nav aria-label="Main navigation">
              {[
                ["/", "Home"],
                ["/how-it-works", "How it works"],
                ["/cards", "The cards"],
                ["/pricing", "Pricing"],
                ["/about", "About"],
              ].map(([to, title]) => (
                <Link
                  key={to}
                  to={to}
                  aria-current={path === to ? "page" : undefined}
                >
                  {title}
                </Link>
              ))}
            </nav>
            <Link to="/workspace" className="workspace-link">
              My card boxes <span aria-hidden="true">↗</span>
            </Link>
          </div>
        )}
        <div className="masthead">
          <Link to="/" className="wordmark">
            <Logo compact={workspace || admin || guest} />
          </Link>
        </div>
      </header>
      {(workspace || admin) && (
        <div className="workspace-reviewbar">
          <span>
            {mode === "server"
              ? account
                ? (account.id.startsWith("visitor-") ? "Private test workspace · Saved to this browser" : `Test workspace · ${account.email}`)
                : "Private host workspace"
              : "Design workspace · Changes stay on this device"}
          </span>
          <div>
            <Link to="/workspace">My card boxes</Link>
            <Link to="/workspace/account">Preferences</Link>
            {admin && <Link to="/workspace/account">Return to host tools</Link>}
            {mode === "server" && account && (
              <>
                <button
                  className="text-link"
                  disabled={busy}
                  onClick={() => actions.refresh()}
                >
                  Refresh
                </button>
                <button
                  className="text-link"
                  disabled={busy}
                  onClick={() => actions.logout()}
                >
                  Sign out
                </button>
              </>
            )}
          </div>
        </div>
      )}
      <main id="main-content" ref={main} tabIndex={-1}>
        {storageError && (
          <p className="notice" role="alert">
            {storageError}
          </p>
        )}
        {content}
      </main>
      <div
        className="toast-region"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {message && (
          <div className="toast" key={message}>
            {message}
            <button
              aria-label="Dismiss notification"
              onClick={() => notify("")}
            >
              ×
            </button>
          </div>
        )}
      </div>
      <footer className="site-footer">
        <Link to="/" className="footer-wordmark">
          <Logo compact />
        </Link>
        <p>For the people. For the words. For the memories.</p>
        <nav aria-label="Footer navigation">
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/feedback">Feedback</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/accessibility">Accessibility</Link>
          <InstagramLink />
        </nav>
        <p className="copyright">
          © {new Date().getFullYear()} TheDigitalCardBox. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
