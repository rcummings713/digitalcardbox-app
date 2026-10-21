import { FeedbackInbox } from "./FeedbackPages";
import { useEffect, useState } from "react";
import type { Feature } from "./model";
import { Heading, Link, Notice, Status } from "./shared";
import { useStore } from "./state";
import { request } from "./api";
import type { AdminSummary } from "./api";
const flags: { key: Feature; title: string; description: string }[] = [
  {
    key: "newEvents",
    title: "New card boxes",
    description: "Allow hosts to start a new occasion.",
  },
  {
    key: "gifts",
    title: "External gift choices",
    description:
      "Offer gift details in the guest journey. Existing gift records remain visible to hosts.",
  },
  {
    key: "gifs",
    title: "GIF library",
    description:
      "Allow guests to choose an optional animated sticker. Existing cards are preserved.",
  },
  {
    key: "assistance",
    title: "Writing and card assistance",
    description:
      "Offer optional writing prompts and configured AI artwork without blocking manual cards.",
  },
  {
    key: "books",
    title: "Event books",
    description: "Allow hosts to arrange and read their consented event book.",
  },
];
function ReviewAdmin({ tab }: { tab: string }) {
  const { data, setData, notify } = useStore();
  const [query, setQuery] = useState("");
  return (
    <>
      <Heading
        eyebrow="Administrator workspace"
        title="A thoughtful view of the whole picture."
      />
      <Notice>
        Design access · No sign-in is required here. Controls affect fictional
        records on this device only. Production administration requires separate
        operator access and server enforcement.
      </Notice>
      <nav className="admin-tabs" aria-label="Administrator pages">
        {[
          ["overview", "Overview"],
          ["features", "Feature controls"],
          ["events", "Event directory"],
          ["activity", "Activity"],
          ["feedback", "Feedback"],
        ].map(([slug, label]) => (
          <Link
            key={slug}
            to={"/admin/" + slug}
            aria-current={tab === slug ? "page" : undefined}
          >
            {label}
          </Link>
        ))}
      </nav>
      {tab === "features" ? (
        <section className="panel">
          <h2>Feature availability</h2>
          <p>
            Turn a feature off to review its unavailable state throughout this
            workspace.
          </p>
          {flags.map((flag) => (
            <div className="flag-row" key={flag.key}>
              <div>
                <h3>{flag.title}</h3>
                <p>{flag.description}</p>
              </div>
              <button
                className={"toggle " + (data.flags[flag.key] ? "enabled" : "")}
                role="switch"
                aria-checked={data.flags[flag.key]}
                aria-label={flag.title}
                onClick={() => {
                  setData((d) => ({
                    ...d,
                    flags: { ...d.flags, [flag.key]: !d.flags[flag.key] },
                    audit: [
                      `${flag.title} ${data.flags[flag.key] ? "disabled" : "enabled"} in design workspace.`,
                      ...d.audit,
                    ],
                  }));
                  notify(flag.title + " updated on this device.");
                }}
              >
                <span aria-hidden="true" />
                {data.flags[flag.key] ? "On" : "Off"}
              </button>
            </div>
          ))}
        </section>
      ) : tab === "events" ? (
        <section className="panel">
          <h2>Event directory</h2>
          <p className="small">
            Administrative metadata only. Private card text and recipient
            identifiers are not shown here.
          </p>
          <label htmlFor="admin-search">Find an event</label>
          <input
            id="admin-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="admin-event-list">
            {data.events
              .filter((e) =>
                e.title.toLowerCase().includes(query.toLowerCase()),
              )
              .map((e) => (
                <div key={e.id}>
                  <div>
                    <h3>{e.title}</h3>
                    <p>
                      {e.type} · {e.date}
                    </p>
                  </div>
                  <Status>{e.status}</Status>
                </div>
              ))}
          </div>
        </section>
      ) : tab === "activity" ? (
        <section className="panel">
          <h2>Workspace activity</h2>
          <p className="small">
            Device-only feature and receipt changes. No private card text or
            payment identifiers are recorded here.
          </p>
          <ol className="activity-list">
            {data.audit.map((text, i) => (
              <li key={i}>{text}</li>
            ))}
          </ol>
        </section>
      ) : (
        <>
          <div className="stat-grid">
            <div>
              <strong>{data.events.length}</strong>
              <span>Card boxes</span>
            </div>
            <div>
              <strong>{data.entries.length}</strong>
              <span>Cards created</span>
            </div>
            <div>
              <strong>
                {data.gifts.filter((g) => g.status === "unconfirmed").length}
              </strong>
              <span>Unconfirmed gift records</span>
            </div>
          </div>
          <div className="two-column">
            <section className="panel">
              <p className="eyebrow">Participation</p>
              <h2>The kind words, at a glance.</h2>
              {data.events.map((event) => {
                const count = data.entries.filter(
                  (x) => x.eventId === event.id,
                ).length;
                return (
                  <div className="metric-bar" key={event.id}>
                    <div className="row-between">
                      <span>{event.title}</span>
                      <strong>{count} cards</strong>
                    </div>
                    <div className="bar-track">
                      <span
                        style={{
                          width:
                            Math.max(
                              3,
                              (count / Math.max(1, data.entries.length)) * 100,
                            ) + "%",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
              <p className="small">
                Totals describe this device’s fictional workspace, not live
                customer traffic or verified revenue.
              </p>
            </section>
            <section className="panel">
              <p className="eyebrow">Workspace health</p>
              <h2>Room to make considered choices.</h2>
              <p>
                {Object.values(data.flags).filter(Boolean).length} of{" "}
                {flags.length} features enabled.
              </p>
              <Link className="primary" to="/admin/features">
                Manage feature availability
              </Link>
              <p className="small">
                Sign-in, live transaction data and licensed GIF search each have
                separate integration work tracked in the backlog.
              </p>
            </section>
          </div>
        </>
      )}
    </>
  );
}

export function Admin({ tab }: { tab: string }) {
  const { mode } = useStore();
  return mode === "server" ? (
    <ConnectedAdmin tab={tab} />
  ) : (
    <ReviewAdmin tab={tab} />
  );
}
function ConnectedAdmin({ tab }: { tab: string }) {
  const { account, actions, data, busy } = useStore();
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    if (account?.role === "operator")
      request<AdminSummary>("/api/admin/summary")
        .then((value) => {
          if (active) setSummary(value);
        })
        .catch((error) => {
          if (active) setError(error.message);
        });
    return () => {
      active = false;
    };
  }, [account?.id, tab, data.flags]);
  if (account?.role !== "operator")
    return (
      <section className="panel">
        <h1>Site administrator access required.</h1>
        <p>
          Host sign-in does not grant site administration or access to other
          hosts’ private cards.
        </p>
        <Link to="/workspace/account" className="secondary">
          Return to your account
        </Link>
      </section>
    );
  return (
    <>
      <Heading
        eyebrow="Site administration"
        title="The whole picture, thoughtfully."
      />
      <Notice>
        Server controls · Private card text and payment identifiers are excluded
        from this view. Money movement is disabled.
      </Notice>
      <nav className="admin-tabs" aria-label="Administrator pages">
        {[
          ["overview", "Overview"],
          ["features", "Feature controls"],
          ["events", "Event directory"],
          ["activity", "Activity"],
          ["feedback", "Feedback"],
        ].map(([slug, title]) => (
          <Link
            key={slug}
            to={"/admin/" + slug}
            aria-current={tab === slug ? "page" : undefined}
          >
            {title}
          </Link>
        ))}
      </nav>
      {error && <p role="alert">{error}</p>}
      {tab === "feedback" ? (
        <FeedbackInbox />
      ) : tab === "features" ? (
        <section className="panel">
          <h2>Feature availability</h2>
          <AiMediaControl />
          {flags.map((flag) => (
            <div className="flag-row" key={flag.key}>
              <div>
                <h3>{flag.title}</h3>
                <p>
                  {flag.key === "gifts"
                    ? "Allow gift matching and reviewed provider handoffs. This service never sends money."
                    : flag.description}
                </p>
              </div>
              <button
                className={"toggle " + (data.flags[flag.key] ? "enabled" : "")}
                role="switch"
                aria-label={flag.title}
                aria-checked={data.flags[flag.key]}
                disabled={busy}
                onClick={() => actions.setFlag(flag.key, !data.flags[flag.key])}
              >
                <span aria-hidden="true" />
                {data.flags[flag.key] ? "On" : "Off"}
              </button>
            </div>
          ))}
        </section>
      ) : !summary ? (
        <p role="status">Loading server statistics…</p>
      ) : tab === "events" ? (
        <section className="panel">
          <h2>Event directory</h2>
          <p className="small">
            Event metadata only. No invitation tokens, recipient accounts or
            private card text.
          </p>
          <div className="admin-event-list">
            {summary.events.map((event) => (
              <div key={event.id}>
                <div>
                  <h3>{event.title}</h3>
                  <p>
                    {event.type} · {event.date}
                  </p>
                </div>
                <Status>{event.status}</Status>
              </div>
            ))}
          </div>
        </section>
      ) : tab === "activity" ? (
        <section className="panel">
          <h2>Server activity</h2>
          <ol className="activity-list">
            {summary.audit.map((item, index) => (
              <li key={index}>{item.action}</li>
            ))}
          </ol>
        </section>
      ) : (
        <div className="stat-grid">
          <div>
            <strong>{summary.totals.events}</strong>
            <span>Card boxes</span>
          </div>
          <div>
            <strong>{summary.totals.cards}</strong>
            <span>Accepted test cards</span>
          </div>
          <div>
            <strong>0</strong>
            <span>Payment services connected</span>
          </div>
        </div>
      )}
    </>
  );
}

function AiMediaControl() {
  const { actions } = useStore();
  const [status, setStatus] = useState<{
    configured: boolean;
    available: boolean;
    usedToday: number;
    dailyLimit: number;
    estimatedDailyCeilingUsd: number;
  } | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const load = () =>
    request<{ ai: NonNullable<typeof status> }>("/api/admin/media")
      .then((value) => setStatus(value.ai))
      .catch((failure) => setError(failure.message));
  useEffect(() => {
    void load();
  }, []);
  return (
    <div className="flag-row">
      <div>
        <h3>AI card artwork</h3>
        <p>
          {status?.configured
            ? `${status.usedToday} of ${status.dailyLimit} daily attempts used. Estimated daily reserve: $${status.estimatedDailyCeilingUsd.toFixed(2)}. Provider charges can vary.`
            : "Set the private server-side API key to enable artwork generation. Collection cards are always available."}
        </p>
        {error && <p role="alert">{error}</p>}
      </div>
      <button
        className={"toggle " + (status?.available ? "enabled" : "")}
        role="switch"
        aria-label="AI card artwork"
        aria-checked={!!status?.available}
        disabled={pending || !status?.configured}
        onClick={async () => {
          setPending(true);
          if (await actions.setAiEnabled(!status?.available)) await load();
          setPending(false);
        }}
      >
        <span aria-hidden="true" />
        {status?.available ? "On" : "Off"}
      </button>
    </div>
  );
}
