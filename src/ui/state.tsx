import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { initialStore, loadStore, STORAGE_KEY, uid } from "./model";
import type { Destination, Entry, Feature, Occasion, Store } from "./model";
import {
  ApiError,
  initialConfiguration,
  dataMode,
  eventPayload,
  request,
  workspaceRequest,
} from "./api";
import type {
  PublicConfiguration,
  GiftIntentInput,
  GiftIntentResponse,
  HostAccount,
  InvitationResponse,
  SessionResponse,
} from "./api";
interface Actions {
  startReview: () => Promise<boolean>;
  guestCsrf: (token: string) => string | undefined;
  reviewFeedback: (
    id: string,
    state: "new" | "reviewed" | "archived",
  ) => Promise<boolean>;
  setAiEnabled: (enabled: boolean) => Promise<boolean>;
  saveDestination: (
    eventId: string,
    destination: Destination,
    repeatIdentifier: string,
    checked: boolean,
  ) => Promise<boolean>;
  prepareGift: (
    token: string,
    input: GiftIntentInput,
  ) => Promise<GiftIntentResponse | undefined>;
  confirmGift: (id: string, received: boolean) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  saveEvent: (event: Occasion) => Promise<Occasion | undefined>;
  updateEvent: (
    id: string,
    patch: Partial<Occasion>,
  ) => Promise<Occasion | undefined>;
  rotateLink: (id: string) => Promise<Occasion | undefined>;
  moderateCard: (
    id: string,
    action: "hide" | "restore" | "remove",
  ) => Promise<boolean>;
  saveProfile: (profile: Store["profile"]) => Promise<boolean>;
  setFlag: (key: Feature, enabled: boolean) => Promise<boolean>;
  loadInvitation: (token: string) => Promise<InvitationResponse>;
  submitCard: (
    token: string,
    entry: Entry,
  ) => Promise<{ id: string; createdAt: string } | undefined>;
}
interface State {
  configuration: PublicConfiguration;
  data: Store;
  setData: Dispatch<SetStateAction<Store>>;
  notify: (message: string) => void;
  message: string;
  storageError: string;
  mode: typeof dataMode;
  account: HostAccount | null;
  ready: boolean;
  busy: boolean;
  actions: Actions;
}
const Context = createContext<State | null>(null);
function emptyStore(): Store {
  return {
    ...initialStore(),
    events: [],
    entries: [],
    gifts: [],
    audit: [],
    flags: {
      gifts: false,
      gifs: true,
      assistance: true,
      books: true,
      newEvents: true,
    },
    profile: { name: "", email: "", reducedMotion: false },
  };
}
export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState(() =>
    dataMode === "server" ? emptyStore() : loadStore(),
  );
  const [configuration, setConfiguration] =
    useState<PublicConfiguration>(initialConfiguration);
  const [account, setAccount] = useState<HostAccount | null>(null);
  const [ready, setReady] = useState(dataMode !== "server");
  const [busy, setBusy] = useState(false);
  const [message, notify] = useState("");
  const [storageError, setError] = useState("");
  const csrf = useRef<string | null>(null);
  const guestCsrf = useRef<Record<string, string>>({});
  const invitationRequests = useRef(
    new Map<string, Promise<InvitationResponse>>(),
  );
  const mounted = useRef(true);
  const sessionGeneration = useRef(0);
  const refresh = useCallback(async () => {
    const generation = sessionGeneration.current;
    const value = await workspaceRequest();
    if (mounted.current && generation === sessionGeneration.current)
      setData(value);
  }, []);
  async function perform<T>(work: () => Promise<T>): Promise<T | undefined> {
    setBusy(true);
    setError("");
    try {
      return await work();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "This action could not be completed.",
      );
      if (error instanceof ApiError && error.code === "stale_revision")
        await refresh().catch(() => {});
      if (
        error instanceof ApiError &&
        error.status === 401 &&
        error.code !== "guest_session_required"
      ) {
        sessionGeneration.current++;
        csrf.current = null;
        setAccount(null);
        setData(emptyStore());
      }
      return undefined;
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    mounted.current = true;
    if (dataMode !== "server")
      return () => {
        mounted.current = false;
      };
    const generation = sessionGeneration.current;
    request<SessionResponse>("/api/session")
      .then(async (value) => {
        if (!mounted.current || generation !== sessionGeneration.current)
          return;
        csrf.current = value.csrfToken;
        if (value.configuration) setConfiguration(value.configuration);
        setAccount(value.account);
        setData((d) => ({ ...d, flags: value.flags }));
        if (value.account) await refresh();
      })
      .catch((error) => {
        if (mounted.current) setError(error.message);
      })
      .finally(() => {
        if (mounted.current) setReady(true);
      });
    return () => {
      mounted.current = false;
    };
  }, [refresh]);
  useEffect(() => {
    if (dataMode !== "server" || !account) return;
    const sync = () => {
      if (!document.hidden) refresh().catch((error) => setError(error.message));
    };
    const timer = setInterval(sync, 8000);
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [account, refresh]);
  useEffect(() => {
    if (dataMode === "server") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setError("");
    } catch {
      setError(
        "Your browser could not save these changes. They will last only while this page is open. Remove a photo or free up browser storage.",
      );
    }
  }, [data]);
  useEffect(() => {
    if (dataMode === "server") return;
    const sync = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setData(loadStore());
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.motion = data.profile.reducedMotion
      ? "reduce"
      : "system";
  }, [data.profile.reducedMotion]);
  const actions: Actions = {
    guestCsrf: (token) => guestCsrf.current[token],
    async startReview() {
      return Boolean(
        await perform(async () => {
          const value = await request<SessionResponse>("/api/review/session", {
            method: "POST",
            body: "{}",
          });
          csrf.current = value.csrfToken;
          setAccount(value.account);
          if (value.configuration) setConfiguration(value.configuration);
          await refresh();
          return true;
        }),
      );
    },
    async reviewFeedback(id, state) {
      return Boolean(
        await perform(async () => {
          await request(
            `/api/admin/feedback/${encodeURIComponent(id)}`,
            { method: "PATCH", body: JSON.stringify({ state }) },
            csrf.current,
          );
          return true;
        }),
      );
    },
    async setAiEnabled(enabled) {
      return Boolean(
        await perform(async () => {
          await request(
            "/api/admin/media",
            { method: "PATCH", body: JSON.stringify({ enabled }) },
            csrf.current,
          );
          const value = await request<PublicConfiguration>("/api/config");
          setConfiguration(value);
          return true;
        }),
      );
    },
    async login(email, password) {
      const result = await perform(async () => {
        const value = await request<SessionResponse>("/api/session", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        sessionGeneration.current++;
        csrf.current = value.csrfToken;
        setAccount(value.account);
        await refresh();
        return true;
      });
      return !!result;
    },
    async logout() {
      await perform(async () => {
        await request(
          "/api/session",
          { method: "DELETE", body: "{}" },
          csrf.current,
        );
        sessionGeneration.current++;
        csrf.current = null;
        setAccount(null);
        setData(emptyStore());
      });
    },
    async refresh() {
      await perform(refresh);
    },
    async saveEvent(event) {
      if (data.events.some((e) => e.id === event.id))
        return actions.updateEvent(event.id, eventPayload(event));
      if (dataMode === "review") {
        setData((d) => ({ ...d, events: [event, ...d.events] }));
        return event;
      }
      return perform(async () => {
        const result = await request<{ event: Occasion }>(
          "/api/host/events",
          { method: "POST", body: JSON.stringify(eventPayload(event)) },
          csrf.current,
        );
        await refresh();
        return result.event;
      });
    },
    async updateEvent(id, patch) {
      const current = data.events.find((e) => e.id === id);
      if (!current) return undefined;
      if (dataMode === "review") {
        const event = { ...current, ...patch };
        setData((d) => ({
          ...d,
          events: d.events.map((e) => (e.id === id ? event : e)),
        }));
        return event;
      }
      return perform(async () => {
        const result = await request<{ event: Occasion }>(
          `/api/host/events/${id}`,
          {
            method: "PATCH",
            headers: { "If-Match": String(current.revision) },
            body: JSON.stringify(eventPayload(patch)),
          },
          csrf.current,
        );
        await refresh();
        return result.event;
      });
    },
    async rotateLink(id) {
      if (dataMode === "review")
        return actions.updateEvent(id, { token: uid() });
      const current = data.events.find((e) => e.id === id);
      if (!current) return;
      return perform(async () => {
        const result = await request<{ event: Occasion }>(
          `/api/host/events/${id}/rotate-link`,
          {
            method: "POST",
            headers: { "If-Match": String(current.revision) },
            body: "{}",
          },
          csrf.current,
        );
        await refresh();
        return result.event;
      });
    },
    async moderateCard(id, action) {
      if (dataMode === "review") {
        setData((d) => ({
          ...d,
          entries:
            action === "remove"
              ? d.entries.filter((e) => e.id !== id)
              : d.entries.map((e) =>
                  e.id === id ? { ...e, hidden: action === "hide" } : e,
                ),
        }));
        return true;
      }
      return !!(await perform(async () => {
        await request(
          `/api/host/cards/${id}`,
          {
            method: action === "remove" ? "DELETE" : "PATCH",
            body: JSON.stringify(action === "remove" ? {} : { action }),
          },
          csrf.current,
        );
        await refresh();
        return true;
      }));
    },
    async saveProfile(profile) {
      if (dataMode === "review") {
        setData((d) => ({ ...d, profile }));
        return true;
      }
      return !!(await perform(async () => {
        const value = await request<{ account: HostAccount }>(
          "/api/host/profile",
          {
            method: "PATCH",
            body: JSON.stringify({
              name: profile.name,
              reducedMotion: profile.reducedMotion,
            }),
          },
          csrf.current,
        );
        setAccount(value.account);
        await refresh();
        return true;
      }));
    },
    async setFlag(key, enabled) {
      if (dataMode === "review") {
        setData((d) => ({
          ...d,
          flags: { ...d.flags, [key]: enabled },
          audit: [
            `Feature ${key} ${enabled ? "enabled" : "disabled"}.`,
            ...d.audit,
          ],
        }));
        return true;
      }
      return !!(await perform(async () => {
        const value = await request<{ flags: Store["flags"] }>(
          `/api/admin/flags/${key}`,
          { method: "PATCH", body: JSON.stringify({ enabled }) },
          csrf.current,
        );
        setData((d) => ({ ...d, flags: value.flags }));
        return true;
      }));
    },
    async saveDestination(id, destination, repeatIdentifier, checked) {
      return Boolean(
        await perform(async () => {
          if (dataMode === "review") {
            setData((d) => ({
              ...d,
              events: d.events.map((e) =>
                e.id === id
                  ? {
                      ...e,
                      destinations: [
                        ...e.destinations.filter(
                          (x) => x.service !== destination.service,
                        ),
                        {
                          ...destination,
                          confirmed: destination.enabled,
                          version: destination.version + 1,
                        },
                      ],
                    }
                  : e,
              ),
            }));
            return true;
          }
          const event = data.events.find((e) => e.id === id);
          await request(
            `/api/host/events/${encodeURIComponent(id)}/destinations`,
            {
              method: "PATCH",
              headers: { "If-Match": String(event?.revision) },
              body: JSON.stringify({
                service: destination.service,
                recipient: destination.recipient,
                identifier: destination.identifier,
                version: destination.version,
                enabled: destination.enabled,
                previewOnly: destination.previewOnly !== false,
                repeatIdentifier,
                checked,
              }),
            },
            csrf.current,
          );
          await refresh();
          return true;
        }),
      );
    },
    async prepareGift(token, input) {
      return perform(() =>
        request<GiftIntentResponse>(
          `/api/invitations/${encodeURIComponent(token)}/gift-intents`,
          { method: "POST", body: JSON.stringify(input) },
          guestCsrf.current[token],
        ),
      );
    },
    async confirmGift(id, received) {
      return Boolean(
        await perform(async () => {
          if (dataMode === "review")
            setData((d) => ({
              ...d,
              gifts: d.gifts.map((g) =>
                g.id === id
                  ? {
                      ...g,
                      status: received ? "host-confirmed" : "unconfirmed",
                    }
                  : g,
              ),
              audit: [
                "Host " +
                  (received ? "confirmed" : "undid confirmation of") +
                  " gift receipt; not provider verified.",
                ...d.audit,
              ],
            }));
          else {
            await request(
              `/api/host/gift-intents/${encodeURIComponent(id)}`,
              {
                method: "PATCH",
                body: JSON.stringify({ received, checked: received }),
              },
              csrf.current,
            );
            await refresh();
          }
          return true;
        }),
      );
    },
    async loadInvitation(token) {
      const pending = invitationRequests.current.get(token);
      if (pending) return pending;
      const load = request<InvitationResponse>(
        `/api/invitations/${encodeURIComponent(token)}`,
      )
        .then((value) => {
          guestCsrf.current[token] = value.csrfToken;
          if (mounted.current) setData((d) => ({ ...d, flags: value.flags }));
          return value;
        })
        .finally(() => invitationRequests.current.delete(token));
      invitationRequests.current.set(token, load);
      return load;
    },
    async submitCard(token, entry) {
      return perform(async () => {
        const value = await request<{
          entry: { id: string; createdAt: string };
        }>(
          `/api/invitations/${encodeURIComponent(token)}/cards`,
          {
            method: "POST",
            body: JSON.stringify({
              requestKey: entry.id,
              name: entry.name,
              note: entry.note,
              style: entry.style,
              artId: entry.artId ?? null,
              gif: entry.gif ?? null,
              consent: entry.consent,
            }),
          },
          guestCsrf.current[token],
        );
        return value.entry;
      });
    },
  };
  const reviewSetData: Dispatch<SetStateAction<Store>> =
    dataMode === "review"
      ? setData
      : () =>
          setError("This operation is not connected to the test server yet.");
  return (
    <Context.Provider
      value={{
        data,
        configuration,
        setData: reviewSetData,
        notify,
        message,
        storageError,
        mode: dataMode,
        account,
        ready,
        busy,
        actions,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useStore() {
  const state = useContext(Context);
  if (!state) throw new Error("Missing store");
  return state;
}
