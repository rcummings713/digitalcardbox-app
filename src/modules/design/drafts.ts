import { draftKey, validateDesign } from "./contracts.ts";
import type { DesignDocument, DesignKind, DesignVariant } from "./contracts.ts";

export const ANONYMOUS_DRAFT_TTL = 7 * 86400000;
const formats: [DesignKind, DesignVariant?][] = [
  ["card"],
  ["invitation"],
  ["invitation", "save-the-date"],
];
type SavedDraft = {
  version: 2;
  expiresAt: number;
  design: DesignDocument;
  owner?: string;
};
let account: string | null = null;
const OWNER_KEY = "dcb-design-draft-owner-v2";

export const anonymousDraftKey = (kind: DesignKind, variant?: DesignVariant) =>
  draftKey(kind, variant) + "-anonymous-v2";
export const privateDraftKey = (kind: DesignKind, variant?: DesignVariant) =>
  "dcb-private-design-" + (variant || kind) + "-v2";

function removeStored(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // In-memory editing still works when browser storage is unavailable.
  }
}

export function clearLegacyDesignDrafts() {
  // Old raw drafts could contain private event designs. Do not migrate them into
  // the anonymous cache, whose contents are intentionally available on a device.
  for (const [kind, variant] of formats) removeStored(draftKey(kind, variant));
}

function savedDraft(value: unknown, kind: DesignKind, now: number): SavedDraft {
  if (!value || typeof value !== "object") throw new Error("Invalid draft.");
  const saved = value as SavedDraft;
  if (
    saved.version !== 2 ||
    !Number.isFinite(saved.expiresAt) ||
    saved.expiresAt <= now ||
    saved.expiresAt > now + ANONYMOUS_DRAFT_TTL
  )
    throw new Error("Expired draft.");
  return { ...saved, design: validateDesign(saved.design, kind) };
}

export function readDesignDraft(
  kind: DesignKind,
  variant?: DesignVariant,
  now = Date.now(),
): DesignDocument | null {
  clearLegacyDesignDrafts();
  const key = anonymousDraftKey(kind, variant);
  try {
    let value: unknown;
    const raw = account
      ? sessionStorage.getItem(privateDraftKey(kind, variant))
      : localStorage.getItem(key);
    if (!raw) return null;
    if (raw.length > 120000) throw new Error("Oversized draft.");
    value = JSON.parse(raw);
    const saved = savedDraft(value, kind, now);
    if (account && saved.owner !== account) throw new Error("Wrong draft owner.");
    if (!account && saved.owner !== undefined) throw new Error("Private draft.");
    if (saved.design.variant !== variant) throw new Error("Wrong draft kind.");
    return saved.design;
  } catch {
    if (account) {
      try {
        sessionStorage.removeItem(privateDraftKey(kind, variant));
      } catch {}
    }
    else removeStored(key);
    return null;
  }
}

export function writeDesignDraft(value: DesignDocument, now = Date.now()) {
  clearLegacyDesignDrafts();
  const design = validateDesign(value, value.kind);
  const key = anonymousDraftKey(design.kind, design.variant);
  const saved: SavedDraft = {
    version: 2,
    expiresAt: now + ANONYMOUS_DRAFT_TTL,
    design,
  };
  if (account)
    sessionStorage.setItem(
      privateDraftKey(design.kind, design.variant),
      JSON.stringify({ ...saved, owner: account }),
    );
  else localStorage.setItem(key, JSON.stringify(saved));
}

function clearPrivateDrafts() {
  try {
    for (const [kind, variant] of formats)
      sessionStorage.removeItem(privateDraftKey(kind, variant));
    sessionStorage.removeItem(OWNER_KEY);
  } catch {}
}

export function clearDesignDrafts() {
  clearPrivateDrafts();
  for (const [kind, variant] of formats) {
    removeStored(draftKey(kind, variant));
    removeStored(anonymousDraftKey(kind, variant));
  }
  try {
    for (const key of Object.keys(sessionStorage))
      if (key.startsWith("dcb-draft-") || key.startsWith("dcb-purchase-"))
        sessionStorage.removeItem(key);
  } catch {
    // A denied storage API cannot expose a draft through the application.
  }
}

export function setDesignDraftAccount(next: string | null) {
  clearLegacyDesignDrafts();
  if (account === next) {
    if (next === null) clearPrivateDrafts();
    return;
  }
  // Preserve the anonymous-design -> account-setup journey in this tab only.
  // Private drafts survive a same-account tab reload after the verified session
  // is resolved, but never an account change, logout, or anonymous session.
  const handoff =
    account === null && next !== null
      ? formats.map(([kind, variant]) => readDesignDraft(kind, variant))
      : [];
  let previousOwner: string | null = null;
  try {
    previousOwner = sessionStorage.getItem(OWNER_KEY);
  } catch {}
  if (!next || previousOwner !== next) clearPrivateDrafts();
  for (const [kind, variant] of formats)
    removeStored(anonymousDraftKey(kind, variant));
  account = next;
  if (next)
    try {
      sessionStorage.setItem(OWNER_KEY, next);
    } catch {}
  for (const design of handoff)
    if (design)
      try {
        writeDesignDraft(design);
      } catch {
        // Browser storage is optional and must never prevent authentication.
        // The editor reports denied saves; do not fall back to a public cache.
      }
}
