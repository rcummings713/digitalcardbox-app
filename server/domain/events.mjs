import { templates, gifStore } from "../../src/modules/media/catalog.ts";
export class Problem extends Error {
  constructor(status, message, code = "request_rejected") {
    super(message);
    this.status = status;
    this.code = code;
  }
}
export const fail = (status, message, code) => {
  throw new Problem(status, message, code);
};
export const styles = [...templates.map((d) => d.id), "ai-art"];
export const gifIds = gifStore.map((g) => g.id);
export const eventTypes = [
  "Wedding",
  "Baby shower",
  "Birthday",
  "Anniversary",
  "Graduation",
  "Other dated event",
  "One-off occasion",
  "Gender reveal party",
  "Sip and see",
  "First Communion / Confirmation",
  "Debutante ball / Cotillion",
  "Prom / Pre-prom party",
  "College Decision Day",
  "Bridal shower",
  "Bachelor / Bachelorette party",
  "Rehearsal dinner",
  "Housewarming",
  "Retirement",
  "Career promotion / Professional graduation",
  "Bat Mitzvah",
  "Wake / Celebration of Life",
];
export function object(value) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    fail(422, "Send a JSON object.");
  return value;
}
export function keys(value, allowed) {
  object(value);
  if (Object.keys(value).some((k) => !allowed.includes(k)))
    fail(422, "This request contains unsupported fields.");
}
export function text(value, name, max, required = true) {
  if (typeof value !== "string") fail(422, `Add a valid ${name}.`);
  const result = value.trim();
  if (
    (required && !result) ||
    result.length > max ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(result)
  )
    fail(
      422,
      `Check ${name}; use ${required ? "1–" : "up to "}${max} characters.`,
    );
  return result;
}
export function dayInZone(now, timezone) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function shiftDays(day, n) {
  const d = new Date(day + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export function shiftMonths(day, n) {
  const date = new Date(day + "T12:00:00Z");
  const original = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + n);
  const last = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
  ).getUTCDate();
  date.setUTCDate(Math.min(original, last));
  return date.toISOString().slice(0, 10);
}
export function windowFor(event, now = new Date()) {
  if (event.status === "draft" || event.status === "paused")
    return event.status;
  const today = dayInZone(now, event.timezone);
  if (event.type === "One-off occasion")
    return today <= event.date ? "open" : "closed";
  if (today < shiftMonths(event.date, -6)) return "scheduled";
  if (today <= shiftDays(event.date, 90)) return "open";
  if (event.type === "Wedding" && today <= shiftMonths(event.date, 12))
    return "gift-only";
  return "closed";
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
];
export function validateEvent(input, current, now) {
  keys(input, eventFields);
  const value = { ...current, ...input };
  const result = {
    title: text(value.title, "card box title", 100),
    hosts: text(value.hosts, "host name", 100),
    type: text(value.type, "occasion", 80),
    date: text(value.date, "date", 10),
    timezone: text(value.timezone, "time zone", 80),
    location: text(value.location ?? "", "location", 160, false),
    welcome: text(value.welcome ?? "", "welcome", 800, false),
    status: value.status ?? "draft",
    cover: value.cover ?? "celebration",
    bookLayout: value.bookLayout ?? "editorial",
  };
  if (!eventTypes.includes(result.type))
    fail(422, "Choose an available occasion.");
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(result.date) ||
    !Number.isFinite(Date.parse(result.date + "T12:00:00Z")) ||
    new Date(result.date + "T12:00:00Z").toISOString().slice(0, 10) !==
      result.date
  )
    fail(422, "Choose a valid event date.");
  try {
    dayInZone(now, result.timezone);
  } catch {
    fail(422, "Choose a valid time zone.");
  }
  if (
    !["draft", "published", "paused"].includes(result.status) ||
    !["celebration", "flowers", "tea"].includes(result.cover) ||
    !["editorial", "collage"].includes(result.bookLayout)
  )
    fail(422, "Choose valid event settings.");
  if (
    current?.locked_at &&
    (result.date !== current.date ||
      result.type !== current.type ||
      result.timezone !== current.timezone)
  )
    fail(
      409,
      "The event date, occasion and time zone are locked after the first card.",
    );
  if (result.type === "One-off occasion" && !current?.locked_at) {
    const today = dayInZone(now, result.timezone);
    if (result.date < today || result.date > shiftDays(today, 90))
      fail(422, "Choose a closing date within the next 90 days.");
  }
  return result;
}
export function validateCard(input, flags) {
  keys(input, [
    "requestKey",
    "name",
    "note",
    "style",
    "gif",
    "consent",
    "artId",
  ]);
  const card = {
    requestKey: text(input.requestKey, "submission reference", 80),
    name: text(input.name, "name", 80),
    note: text(input.note, "note", 5000),
    style: input.style,
    artId: input.artId ?? null,
    gif: input.gif || null,
    consent: input.consent,
  };
  if (!/^[a-zA-Z0-9_-]{8,80}$/.test(card.requestKey))
    fail(422, "The submission reference is invalid.");
  if (!styles.includes(card.style))
    fail(422, "Choose a card from the collection.");
  if (
    (card.style === "ai-art" &&
      (typeof card.artId !== "string" ||
        !/^[a-f0-9-]{36}$/.test(card.artId))) ||
    (card.style !== "ai-art" && card.artId !== null)
  )
    fail(422, "Choose approved artwork or a collection design.");
  if (card.gif !== null && (!gifIds.includes(card.gif) || !flags.gifs))
    fail(422, "Choose an available GIF from the library.");
  if (typeof card.consent !== "boolean")
    fail(422, "Choose whether this card may appear in the event book.");
  return card;
}
