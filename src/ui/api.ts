import type { BillingConfiguration } from "../modules/billing/public";
import { emptyBilling } from "../modules/billing/public";
import { gifStore } from "../modules/media/catalog";
import { requestReauthentication } from "./reauthentication";
import type { GiftHandoff } from "../modules/gifts/routing";
import type { Feature, Gift, Occasion, Service, Store } from "./model";
export const dataMode =
  import.meta.env.VITE_DATA_MODE === "server" ? "server" : "review";
export interface HostAccount {
  id: string;
  name: string;
  email: string;
  role: "host" | "operator";
  reducedMotion: boolean;
  registered?: boolean;
}
export interface InvitationResponse {
  event: Occasion;
  window: string;
  flags: Record<Feature, boolean>;
  csrfToken: string;
}
export interface SessionResponse {
  configuration?: PublicConfiguration;
  account: HostAccount | null;
  csrfToken: string | null;
  flags: Record<Feature, boolean>;
}
export interface AdminSummary {
  events: {
    id: string;
    title: string;
    type: string;
    date: string;
    status: string;
  }[];
  totals: { events: number; cards: number };
  flags: Record<Feature, boolean>;
  audit: { action: string; created_at: string }[];
}
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export async function request<T>(
  path: string,
  init: RequestInit = {},
  csrfToken?: string | null,
  retryAuthentication = true,
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.method && init.method !== "GET") {
    headers.set("Content-Type", "application/json");
    headers.set("X-DCB-Request", "1");
    if (csrfToken) headers.set("X-CSRF-Token", csrfToken);
  }
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers,
      credentials: "same-origin",
      signal: init.signal ?? AbortSignal.timeout(12000),
    });
  } catch {
    throw new ApiError(
      0,
      "unavailable",
      "The server could not be reached. Your action has not been confirmed. Please try again.",
    );
  }
  let value;
  try {
    value = await response.json();
  } catch {
    throw new ApiError(
      response.status,
      "unavailable",
      "The card server is unavailable. Start the connected development server and try again.",
    );
  }
  if (response.status === 401 && value.error?.code === "reauthentication_required" &&
    retryAuthentication && path !== "/api/auth/reauthenticate" &&
    await requestReauthentication(csrfToken))
    return request<T>(path, init, csrfToken, false);
  if (!response.ok)
    throw new ApiError(
      response.status,
      value.error?.code || "request_failed",
      value.error?.message || "This action could not be completed.",
    );
  return value as T;
}
type WorkspaceGroup = "events" | "entries" | "gifts";
interface WorkspacePage extends Store {
  pagination?: {
    totals: Record<WorkspaceGroup, number>;
    next: Record<WorkspaceGroup, string | null>;
  };
}
export async function workspaceRequest(): Promise<Store> {
  const first = await request<WorkspacePage>("/api/host/workspace");
  const result: Store = { ...first, events: [...first.events], entries: [...first.entries], gifts: [...first.gifts] };
  const groups: WorkspaceGroup[] = ["events", "entries", "gifts"];
  const seenPages = new Set<string>();
  let next = first.pagination?.next;
  while (next && groups.some((group) => next![group])) {
    const query = new URLSearchParams(groups.map((group) => [group, next![group] ?? "end"]));
    if (seenPages.has(query.toString()))
      throw new ApiError(502, "incomplete_workspace", "Your workspace could not be loaded completely. Please refresh.");
    seenPages.add(query.toString());
    const page = await request<WorkspacePage>("/api/host/workspace?" + query);
    if (!page.pagination || groups.some((group) => page.pagination!.totals[group] !== first.pagination!.totals[group]))
      throw new ApiError(409, "incomplete_workspace", "Your workspace changed while loading. Please refresh to load it completely.");
    for (const group of groups) {
      const ids = new Set(result[group].map((item) => item.id));
      // Stable keyset ordering can overlap during concurrent reads. Publish
      // only the finished aggregation; never replace state with a partial page.
      if (group === "events") result.events.push(...page.events.filter((item) => !ids.has(item.id)));
      if (group === "entries") result.entries.push(...page.entries.filter((item) => !ids.has(item.id)));
      if (group === "gifts") result.gifts.push(...page.gifts.filter((item) => !ids.has(item.id)));
    }
    next = page.pagination?.next;
  }
  if (first.pagination && groups.some((group) => result[group].length !== first.pagination!.totals[group]))
    throw new ApiError(409, "incomplete_workspace", "Your workspace changed while loading. Please refresh to load it completely.");
  return result;
}
const eventFields = [
  "title",
  "hosts",
  "type",
  "date",
  "timezone",
  "location",
  "welcome",
  "cover",
  "status",
  "bookLayout",
  "invitation",
  "saveTheDate",
] as const;
export function eventPayload(event: Partial<Occasion>) {
  return Object.fromEntries(
    eventFields
      .filter((key) => event[key] !== undefined)
      .map((key) => [key, event[key]]),
  );
}

export interface GiftIntentInput {
  requestKey: string;
  service: Service;
  version: number;
  name: string;
  alias: string;
  amount: string;
  reference: string;
  entryId?: string;
  acknowledged: boolean;
}
export interface GiftIntentResponse {
  gift: Gift;
  handoff: GiftHandoff;
  repeated: boolean;
}

export interface AuthConfiguration {
  configured: boolean;
  email: boolean;
  google: boolean;
  apple: boolean;
  unavailable?: boolean;
}
export interface PublicConfiguration {
  auth?: AuthConfiguration;
  billing: BillingConfiguration;
  connected: boolean;
  hosted: boolean;
  publicSiteUrl: string;
  reviewSessions: boolean;
  gifCount: number;
  ai: { available: boolean; dailyLimit: number; perGuest: number };
  feedback: boolean;
}
export const initialConfiguration: PublicConfiguration = {
  billing: emptyBilling,
  connected: false,
  hosted: false,
  publicSiteUrl: "",
  reviewSessions: false,
  gifCount: gifStore.length,
  ai: { available: false, dailyLimit: 20, perGuest: 2 },
  feedback: false,
};
