import { templates, findGif } from "../media/catalog.ts";
import type { TemplateId } from "../media/catalog.ts";
import { eventTypes } from "../events/occasions.ts";
export type DesignKind = "card" | "invitation";
export const palettes = {
  blush: {
    name: "Blush & copper",
    paper: "#f9eeea",
    ink: "#573d39",
    accent: "#ac756a",
  },
  ivory: {
    name: "Ivory & gold",
    paper: "#fff9ed",
    ink: "#51422f",
    accent: "#ac884e",
  },
  sage: {
    name: "Sage garden",
    paper: "#edf0e7",
    ink: "#354b3d",
    accent: "#6e8769",
  },
  midnight: {
    name: "Midnight sky",
    paper: "#263b50",
    ink: "#fff5de",
    accent: "#d9bc79",
  },
  lilac: {
    name: "Soft lilac",
    paper: "#f0e7f3",
    ink: "#553d5d",
    accent: "#a57ba9",
  },
  ocean: {
    name: "Coastal blue",
    paper: "#e7eef1",
    ink: "#354e60",
    accent: "#738c9d",
  },
} as const;
export const fontChoices = {
  serif: "Editorial serif",
  sans: "Modern sans",
  script: "Handwritten",
} as const;
export interface DesignBlock {
  id: string;
  label: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  size: number;
  align: "left" | "center" | "right";
}
export interface DesignDocument {
  version: 1;
  kind: DesignKind;
  occasion: string;
  template: TemplateId;
  palette: keyof typeof palettes;
  font: keyof typeof fontChoices;
  blocks: DesignBlock[];
  gif?: string;
  artId?: string;
}
const plain = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const only = (v: Record<string, unknown>, keys: string[]) =>
  Object.keys(v).every((key) => keys.includes(key));
export function validateDesign(
  value: unknown,
  kind?: DesignKind,
): DesignDocument {
  const invalid = () => {
    throw new Error(
      "Choose a valid design with up to six text layers and bounded layout settings.",
    );
  };
  if (
    !plain(value) ||
    !only(value, [
      "version",
      "kind",
      "occasion",
      "template",
      "palette",
      "font",
      "blocks",
      "gif",
      "artId",
    ])
  )
    return invalid();
  if (
    value.version !== 1 ||
    !["card", "invitation"].includes(String(value.kind)) ||
    (kind && value.kind !== kind) ||
    !eventTypes.includes(String(value.occasion)) ||
    !templates.some((t) => t.id === value.template) ||
    !Object.hasOwn(palettes, String(value.palette)) ||
    !Object.hasOwn(fontChoices, String(value.font)) ||
    !Array.isArray(value.blocks) ||
    value.blocks.length < 1 ||
    value.blocks.length > 6
  )
    return invalid();
  const ids = new Set();
  let length = 0;
  const blocks = value.blocks.map((block: unknown) => {
    if (
      !plain(block) ||
      !only(block, [
        "id",
        "label",
        "text",
        "x",
        "y",
        "width",
        "height",
        "size",
        "align",
      ]) ||
      typeof block.id !== "string" ||
      !/^[a-z0-9-]{1,40}$/.test(block.id) ||
      ids.has(block.id) ||
      typeof block.label !== "string" ||
      block.label.length > 40 ||
      typeof block.text !== "string" ||
      block.text.length > 5000 ||
      !["left", "center", "right"].includes(String(block.align))
    )
      return invalid();
    ids.add(block.id);
    length += block.text.length;
    for (const field of ["x", "y", "width", "height", "size"])
      if (typeof block[field] !== "number" || !Number.isFinite(block[field]))
        return invalid();
    const b = block as unknown as DesignBlock;
    if (
      b.x < 3 ||
      b.y < 3 ||
      b.width < 30 ||
      b.width > 94 ||
      b.height < 8 ||
      b.height > 70 ||
      b.x + b.width > 97.1 ||
      b.y + b.height > 97.1 ||
      b.size < 12 ||
      b.size > 40
    )
      return invalid();
    return {
      id: b.id,
      label: b.label,
      text: b.text,
      x: b.x,
      y: b.y,
      width: b.width,
      height: b.height,
      size: b.size,
      align: b.align,
    };
  });
  if (
    length > 8000 ||
    (value.gif !== undefined &&
      (typeof value.gif !== "string" || !findGif(value.gif))) ||
    (value.artId !== undefined &&
      (typeof value.artId !== "string" || !/^[a-f0-9-]{36}$/.test(value.artId)))
  )
    return invalid();
  return {
    version: 1,
    kind: value.kind as DesignKind,
    occasion: String(value.occasion),
    template: value.template as TemplateId,
    palette: value.palette as DesignDocument["palette"],
    font: value.font as DesignDocument["font"],
    blocks,
    ...(value.gif ? { gif: String(value.gif) } : {}),
    ...(value.artId ? { artId: String(value.artId) } : {}),
  };
}
export function templatePalette(id: TemplateId): DesignDocument["palette"] {
  const item = templates.find((template) => template.id === id)!;
  if (["little-star", "midnight", "graduation"].includes(id)) return "midnight";
  if (item.motif === "olive" || item.motif === "garden") return "sage";
  if (item.motif === "lavender" || item.motif === "orchid") return "lilac";
  if (item.category === "Baby") return "ocean";
  if (item.category === "Birthday") return "blush";
  return "ivory";
}
export function createDesign(
  kind: DesignKind,
  occasion = "Wedding",
  template: TemplateId = "botanical",
): DesignDocument {
  const safe = eventTypes.includes(occasion) ? occasion : "Wedding";
  const remembrance = safe === "Wake / Celebration of Life";
  return {
    version: 1,
    kind,
    occasion: safe,
    template,
    palette:
      template === "midnight"
        ? "midnight"
        : template === "garden"
          ? "sage"
          : "ivory",
    font: "serif",
    blocks:
      kind === "invitation"
        ? [
            {
              id: "heading",
              label: "Opening line",
              text: remembrance
                ? "Together, we remember"
                : "You’re warmly invited",
              x: 10,
              y: 17,
              width: 80,
              height: 10,
              size: 17,
              align: "center",
            },
            {
              id: "title",
              label: "Event title",
              text: remembrance
                ? "A life beautifully lived"
                : safe === "Wedding"
                  ? "Alex & Jamie"
                  : safe === "Baby shower"
                    ? "A little one is on the way"
                    : safe === "Sweet 16"
                      ? "Sweet sixteen"
                      : `A special ${safe.toLowerCase()}`,
              x: 10,
              y: 29,
              width: 80,
              height: 22,
              size: 32,
              align: "center",
            },
            {
              id: "details",
              label: "Date & place",
              text: "Saturday, June 12 · 4:00 PM\nThe Garden Room\nYour venue or address",
              x: 12,
              y: 56,
              width: 76,
              height: 18,
              size: 17,
              align: "center",
            },
            {
              id: "message",
              label: "Personal invitation",
              text: remembrance
                ? "Share your memories, stories and love."
                : "Your presence will make it unforgettable.\nWe can’t wait to celebrate with you.",
              x: 12,
              y: 77,
              width: 76,
              height: 14,
              size: 16,
              align: "center",
            },
          ]
        : [
            {
              id: "heading",
              label: "Heading",
              text: "For a beautiful new chapter",
              x: 12,
              y: 26,
              width: 76,
              height: 13,
              size: 26,
              align: "center",
            },
            {
              id: "message",
              label: "Your message",
              text: "Some moments stay with us. Wishing you laughter, love, and all the little things that make life beautiful.",
              x: 13,
              y: 43,
              width: 74,
              height: 29,
              size: 19,
              align: "center",
            },
            {
              id: "signature",
              label: "Sign-off",
              text: "With love,\nYour name",
              x: 15,
              y: 78,
              width: 70,
              height: 12,
              size: 18,
              align: "center",
            },
          ],
  };
}
export const invitationTemplates = [
  "botanical",
  "wedding-vows",
  "moon-baby",
  "ribbon",
  "arch",
  "garden",
  "orchid",
  "citrus",
  "pearl-bow",
  "sunset-palm",
  "midnight",
  "sweet-sixteen",
  "graduation",
  "photo",
  "lavender",
  "olive",
]
  .filter((id) => templates.some((t) => t.id === id))
  .map((id) => templates.find((t) => t.id === id)!);
export const draftKey = (kind: DesignKind) =>
  "dcb-design-studio-" + kind + "-v1";

export function withDesignGif(
  value: DesignDocument,
  gif?: string,
): DesignDocument {
  if (!gif) return { ...value, gif: undefined };
  if (value.gif) return { ...value, gif };
  return {
    ...value,
    gif,
    blocks: value.blocks.map((b) => {
      const positions =
        value.kind === "invitation"
          ? {
              heading: [10, 8, 15],
              title: [22, 18, 28],
              details: [45, 15, 15],
              message: [80, 12, 15],
            }
          : {
              heading: [15, 14, 26],
              message: [33, 27, 18],
              signature: [80, 12, 18],
            };
      const position = positions[b.id as keyof typeof positions];
      return position
        ? { ...b, y: position[0]!, height: position[1]!, size: position[2]! }
        : b;
    }),
  };
}

// The accepted note has one authoritative home in cards.note. Layout JSON
// stores placement/typography, and reads restore that note into its text layer.
export function storedCardDesign(
  value?: DesignDocument | null,
): DesignDocument | null {
  return value
    ? {
        ...value,
        blocks: value.blocks.map((block) =>
          block.id === "message" ? { ...block, text: "" } : block,
        ),
      }
    : null;
}
export function cardDesignWithNote(
  value: DesignDocument,
  note: string,
): DesignDocument {
  return {
    ...value,
    blocks: value.blocks.map((block) =>
      block.id === "message" ? { ...block, text: note } : block,
    ),
  };
}
