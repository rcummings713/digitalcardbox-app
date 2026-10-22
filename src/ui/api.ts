import { gifStore } from "../modules/media/catalog";
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
  if (!response.ok)
    throw new ApiError(
      response.status,
      value.error?.code || "request_failed",
      value.error?.message || "This action could not be completed.",
    );
  return value as T;
}
export const workspaceRequest = () => request<Store>("/api/host/workspace");
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

export interface PublicConfiguration {
  connected: boolean;
  hosted: boolean;
  publicSiteUrl: string;
  reviewSessions: boolean;
  gifCount: number;
  ai: { available: boolean; dailyLimit: number; perGuest: number };
  feedback: boolean;
}
export const initialConfiguration: PublicConfiguration = {
  connected: false,
  hosted: false,
  publicSiteUrl: "",
  reviewSessions: false,
  gifCount: gifStore.length,
  ai: { available: false, dailyLimit: 20, perGuest: 2 },
  feedback: false,
};
