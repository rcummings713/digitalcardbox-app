import type {
  PaymentService,
  DisplayedDestination,
} from "../modules/gifts/public";

export type CardStyle =
  | "botanical"
  | "arch"
  | "midnight"
  | "ribbon"
  | "garden"
  | "photo"
  | "little-star";
export type Service = PaymentService;
export type Feature = "gifts" | "gifs" | "assistance" | "books" | "newEvents";
export interface Destination extends DisplayedDestination {
  previewOnly?: boolean;
  confirmed: boolean;
  enabled: boolean;
}
export interface Occasion {
  revision?: number;
  locked?: boolean;
  id: string;
  token: string;
  title: string;
  hosts: string;
  type: string;
  date: string;
  timezone: string;
  location: string;
  welcome: string;
  status: "draft" | "published" | "paused";
  cover: string;
  bookLayout?: "editorial" | "collage";
  destinations: Destination[];
}
export interface Entry {
  id: string;
  eventId: string;
  name: string;
  note: string;
  style: CardStyle;
  photo?: string;
  gif?: string;
  consent: boolean;
  hidden: boolean;
  createdAt: string;
}
export interface Gift {
  id: string;
  eventId: string;
  entryId?: string;
  previewOnly?: boolean;
  name: string;
  alias: string;
  service: Service;
  amount: string;
  reference: string;
  status: "unconfirmed" | "host-confirmed";
  date: string;
}
export interface Store {
  version: 1;
  events: Occasion[];
  entries: Entry[];
  gifts: Gift[];
  flags: Record<Feature, boolean>;
  profile: { name: string; email: string; reducedMotion: boolean };
  audit: string[];
}
export const STORAGE_KEY = "thedigitalcardbox-ui-v1";
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
export const designs: { id: CardStyle; name: string; description: string }[] = [
  {
    id: "little-star",
    name: "A Little Star",
    description: "An opening baby card, starlight and your own note",
  },
  {
    id: "botanical",
    name: "Pressed Peony",
    description: "Fine botanical lines on warm ivory",
  },
  {
    id: "arch",
    name: "Golden Hour",
    description: "Sculptural arches, champagne and blush",
  },
  {
    id: "midnight",
    name: "Written in the Stars",
    description: "A constellation of wishes in midnight ink",
  },
  {
    id: "ribbon",
    name: "With Love",
    description: "A generous bow and a handwritten sentiment",
  },
  {
    id: "garden",
    name: "Wildflower Letter",
    description: "An illustrated garden with room for your words",
  },
  {
    id: "photo",
    name: "A Moment to Keep",
    description: "A photograph, a little white space, a lasting note",
  },
];
export const gifCollection = [
  {
    id: "cosmic",
    name: "A universe of little stars",
    tags: "space universe galaxy stars baby boy little sparkle starlight",
    symbol: "✧",
  },
  {
    id: "hearts",
    name: "Sending love",
    tags: "love hearts wedding anniversary",
    symbol: "♥",
  },
  {
    id: "confetti",
    name: "Time to celebrate",
    tags: "celebrate party birthday graduation confetti",
    symbol: "✦",
  },
  {
    id: "flowers",
    name: "A little bouquet",
    tags: "flowers thanks thank you love garden",
    symbol: "✿",
  },
  {
    id: "stars",
    name: "You are a star",
    tags: "stars congrats congratulations graduation sparkle",
    symbol: "✧",
  },
  {
    id: "cheers",
    name: "Here’s to you",
    tags: "cheers party celebrate wedding",
    symbol: "♧",
  },
  {
    id: "hug",
    name: "A warm hug",
    tags: "hug comfort sympathy friendship love",
    symbol: "♡",
  },
];
export function uid() {
  return crypto.randomUUID();
}
export function reference() {
  return "DCB-" + uid().replaceAll("-", "").slice(0, 8).toUpperCase();
}
export function initialStore(): Store {
  const event: Occasion = {
    id: "alex-maya",
    token: "7a9c0e78-2da1-4dc8-a13e-68c422b479a0",
    title: "Alex & Maya",
    hosts: "Alex & Maya",
    type: "Wedding",
    date: "2026-10-24",
    timezone: "America/New_York",
    location: "The Glasshouse · Brooklyn, NY",
    welcome:
      "Our favorite people, all in one place. Leave us a little love, a memory, or words for the years ahead.",
    status: "published",
    cover: "celebration",
    destinations: [
      {
        service: "Venmo",
        recipient: "Alex & Maya",
        identifier: "@alex-maya-design",
        previewOnly: true,
        enabled: true,
        confirmed: true,
        version: 1,
      },
      {
        service: "Cash App",
        recipient: "Alex & Maya",
        identifier: "$AlexMayaDesign",
        previewOnly: true,
        enabled: true,
        confirmed: true,
        version: 1,
      },
      {
        service: "Zelle",
        recipient: "Alex & Maya",
        identifier: "alex-maya@example.invalid",
        previewOnly: true,
        enabled: true,
        confirmed: true,
        version: 1,
      },
    ],
  };
  const messages = [
    [
      "Jordan Lee",
      "May you keep finding each other in the little things. The coffee made just right, the long way home, the quiet Sunday mornings. So happy to be here for the beginning.",
      "botanical",
      "flowers",
    ],
    [
      "Mom & Dad",
      "Of all the beautiful things we have watched you become, this is our favorite. Here is to a lifetime of being each other’s home. All our love, always.",
      "arch",
      "",
    ],
    [
      "Sam Rivera",
      "From that very first road trip to the best dance floor of the year. You two make ordinary days feel like the good part. Never stop taking the scenic route.",
      "midnight",
      "cheers",
    ],
    [
      "Alex Kim",
      "A whole lifetime of adventures starts here. Wishing you laughter in the kitchen, stories at the table, and a home full of people you love.",
      "garden",
      "",
    ],
    [
      "Taylor James",
      "Some people just fit. You are our favorite proof. So much love to you both!",
      "ribbon",
      "hearts",
    ],
    [
      "Alex Morgan",
      "For the small moments that become the big memories. Wishing you every kind of happiness.",
      "photo",
      "",
    ],
    [
      "Nana Rose",
      "Be kind, keep dancing, and never forget to say the lovely things out loud. You have so much life ahead of you.",
      "botanical",
      "",
    ],
    [
      "Morgan & Casey",
      "To the best team we know. We cannot wait for all the dinners, holidays and adventures still to come.",
      "arch",
      "confetti",
    ],
  ];
  return {
    version: 1,
    events: [
      event,
      {
        ...event,
        id: "baby-bloom",
        token: "b6e162d9-27f1-45fc-a9d2-a7c8e24eca27",
        title: "A little one on the way",
        hosts: "Jamie & Riley",
        type: "Baby shower",
        date: "2026-11-14",
        status: "draft",
        cover: "flowers",
        destinations: [],
      },
      {
        ...event,
        id: "birthday",
        token: "0f864866-12e8-4c72-a187-a1df64736c91",
        title: "A birthday in full bloom",
        hosts: "Charlie",
        type: "Birthday",
        date: "2026-01-10",
        cover: "tea",
        destinations: [],
      },
    ],
    entries: messages.map(([name, note, style, gif], i) => ({
      id: `card-${i + 1}`,
      eventId: event.id,
      name,
      note,
      style: style as CardStyle,
      gif: gif || undefined,
      photo:
        i === 0
          ? "/images/celebration.jpg"
          : i === 5
            ? "/images/flowers.jpg"
            : undefined,
      consent: i !== 6,
      hidden: false,
      createdAt: `2026-10-${String(8 + (i % 5)).padStart(2, "0")}T12:00:00Z`,
    })),
    gifts: [
      {
        id: "gift-1",
        eventId: event.id,
        entryId: "card-1",
        name: "Jordan Lee",
        alias: "J. Lee",
        service: "Venmo",
        amount: "75",
        reference: "DCB-7B3A20F1",
        status: "host-confirmed",
        date: "2026-10-12",
      },
      {
        id: "gift-2",
        eventId: event.id,
        entryId: "card-4",
        name: "Alex Kim",
        alias: "AK",
        service: "Cash App",
        amount: "100",
        reference: "DCB-921FC6D0",
        status: "unconfirmed",
        date: "2026-10-12",
      },
      {
        id: "gift-3",
        eventId: event.id,
        entryId: "card-6",
        name: "Alex Morgan",
        alias: "Alex M",
        service: "Venmo",
        amount: "50",
        reference: "DCB-C54E71A8",
        status: "unconfirmed",
        date: "2026-10-11",
      },
    ],
    flags: {
      gifts: true,
      gifs: true,
      assistance: true,
      books: true,
      newEvents: true,
    },
    profile: {
      name: "Maya",
      email: "maya@example.invalid",
      reducedMotion: false,
    },
    audit: ["Design workspace initialized with fictional event records."],
  };
}
export function loadStore(): Store {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (
      value?.version === 1 &&
      Array.isArray(value.events) &&
      Array.isArray(value.entries) &&
      Array.isArray(value.gifts) &&
      value.flags &&
      value.profile &&
      Array.isArray(value.audit)
    )
      return value;
  } catch {
    /* Storage unavailable or stale: use the isolated fixture state. */
  }
  return initialStore();
}
export function eventWindow(event: Occasion, now = new Date()) {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: event.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const date = new Date(event.date + "T12:00:00Z");
  const open = new Date(date);
  open.setUTCMonth(open.getUTCMonth() - 6);
  const cutoff = new Date(date);
  cutoff.setUTCDate(cutoff.getUTCDate() + 90);
  const end = new Date(date);
  end.setUTCFullYear(end.getUTCFullYear() + 1);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  if (event.status === "draft") return "draft";
  if (event.status === "paused") return "paused";
  if (event.type === "One-off occasion")
    return today <= event.date ? "open" : "closed";
  if (today < iso(open)) return "scheduled";
  if (today <= iso(cutoff)) return "open";
  if (event.type === "Wedding" && today <= iso(end)) return "gift-only";
  return "closed";
}
export function formatDate(date: string) {
  return new Date(date + "T12:00:00Z").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
export function bookEntries(store: Store, id: string) {
  return store.entries.filter(
    (x) => x.eventId === id && x.consent && !x.hidden,
  );
}
