import { premiumEditions } from "../cards/premium.ts";
import type { PremiumEdition } from "../cards/premium.ts";
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
export const motionChoices = {
  none: "Still",
  fade: "Soft fade",
  rise: "Gentle rise",
  zoom: "Slow zoom",
  stagger: "One after another",
  drift: "Paper float",
} as const;
export type DesignMotion = keyof typeof motionChoices;
export const motionSpeeds = {
  standard: { label: "Standard", duration: 1800, stagger: 260 },
  slow: { label: "Slow", duration: 3200, stagger: 450 },
  relaxed: { label: "Very slow", duration: 5200, stagger: 700 },
} as const;
export type MotionSpeed = keyof typeof motionSpeeds;
export type DesignVariant = "save-the-date";
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
  font?: keyof typeof fontChoices;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  motion?: DesignMotion;
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
  variant?: DesignVariant;
  motion?: DesignMotion;
  artworkMotion?: DesignMotion;
  motionSpeed?: MotionSpeed;
  premiumEdition?: PremiumEdition;
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
      "variant",
      "motion",
      "artworkMotion",
      "motionSpeed",
      "premiumEdition",
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
        "font",
        "bold",
        "italic",
        "underline",
        "motion",
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
    if (
      (block.font !== undefined &&
        (typeof block.font !== "string" ||
          !Object.hasOwn(fontChoices, block.font))) ||
      (block.motion !== undefined &&
        (typeof block.motion !== "string" ||
          !Object.hasOwn(motionChoices, block.motion))) ||
      ["bold", "italic", "underline"].some(
        (key) => block[key] !== undefined && typeof block[key] !== "boolean",
      )
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
      ...(b.font ? { font: b.font } : {}),
      ...(b.bold ? { bold: true } : {}),
      ...(b.italic ? { italic: true } : {}),
      ...(b.underline ? { underline: true } : {}),
      ...(b.motion ? { motion: b.motion } : {}),
    };
  });
  if (
    (value.variant !== undefined &&
      (value.variant !== "save-the-date" || value.kind !== "invitation")) ||
    ["motion", "artworkMotion"].some(
      (key) =>
        value[key] !== undefined &&
        (typeof value[key] !== "string" ||
          !Object.hasOwn(motionChoices, String(value[key]))),
    ) ||
    (value.motionSpeed !== undefined &&
      !Object.hasOwn(motionSpeeds, String(value.motionSpeed))) ||
    (value.premiumEdition !== undefined &&
      (value.kind !== "card" ||
        !premiumEditions.some((e) => e.id === value.premiumEdition))) ||
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
    ...(value.variant ? { variant: "save-the-date" as const } : {}),
    ...(value.motion ? { motion: value.motion as DesignMotion } : {}),
    ...(value.premiumEdition
      ? { premiumEdition: value.premiumEdition as PremiumEdition }
      : {}),
    ...(value.motionSpeed
      ? { motionSpeed: value.motionSpeed as MotionSpeed }
      : {}),
    ...(value.artworkMotion
      ? { artworkMotion: value.artworkMotion as DesignMotion }
      : {}),
  };
}
export function templatePalette(id: TemplateId): DesignDocument["palette"] {
  const item = templates.find((template) => template.id === id)!;
  if ("palette" in item) return item.palette;
  if (["little-star", "midnight", "graduation"].includes(id)) return "midnight";
  if (item.motif === "olive" || item.motif === "garden") return "sage";
  if (item.motif === "lavender" || item.motif === "orchid") return "lilac";
  if (item.category === "Baby") return "ocean";
  if (item.category === "Birthday") return "blush";
  return "ivory";
}
function createBaseDesign(
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
const originalInvitationTemplates = [
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
export const invitationTemplates = [
  ...originalInvitationTemplates,
  ...templates.filter((t) => "layout" in t),
];
export const draftKey = (kind: DesignKind, variant?: DesignVariant) =>
  "dcb-design-studio-" + (variant || kind) + "-v1";

export function createDesign(
  kind: DesignKind,
  occasion = "Wedding",
  template: TemplateId = "botanical",
  variant?: DesignVariant,
): DesignDocument {
  let value = createBaseDesign(kind, occasion, template);
  value = applyTemplate(value, template);
  const item = templates.find((item) => item.id === template)!;
  const recipe = "textLayouts" in item ? item.textLayouts?.[kind] : undefined;
  if (recipe)
    value = { ...value, blocks: recipe.map((block) => ({ ...block })) };
  if (kind === "invitation" && variant === "save-the-date")
    value = {
      ...value,
      variant,
      blocks: value.blocks.map((b) =>
        b.id === "heading"
          ? {
              ...b,
              text: "Save the date",
            }
          : b.id === "message"
            ? {
                ...b,
                text: recipe
                  ? "Invitation to follow."
                  : "Keep a little space for a beautiful day.\nYour invitation will follow.",
              }
            : b,
      ),
    };
  return recipe && variant ? fitAnnouncement(value) : value;
}
function fitAnnouncement(value: DesignDocument): DesignDocument {
  const titleY = value.blocks.find((block) => block.id === "title")?.y || 40;
  return {
    ...value,
    blocks: value.blocks.map((block) =>
      block.id === "heading"
        ? {
            ...block,
            size: Math.min(block.size, 22),
            height: 12,
            y: Math.max(3, Math.min(block.y, titleY - 14)),
          }
        : block.id === "message"
          ? {
              ...block,
              label: "Invitation note",
              size: Math.min(block.size, 14),
            }
          : block,
    ),
  };
}
export function applyTemplate(
  value: DesignDocument,
  template: TemplateId,
): DesignDocument {
  const item = templates.find((t) => t.id === template)!;
  const base = createBaseDesign(value.kind, value.occasion, template);
  const previous = templates.find((item) => item.id === value.template)!;
  const previousRecipe =
    "textLayouts" in previous ? previous.textLayouts?.[value.kind] : undefined;
  const recipe =
    "textLayouts" in item ? item.textLayouts?.[value.kind] : undefined;
  const previousBase = createBaseDesign(
    value.kind,
    value.occasion,
    value.template,
  );

  const layout = "layout" in item ? item.layout : "portrait";
  const positions: Record<string, number[]> =
    value.kind === "invitation"
      ? layout === "editorial"
        ? {
            heading: [10, 12, 80, 10, 16],
            title: [10, 28, 80, 24, 34],
            details: [10, 59, 80, 18, 17],
            message: [10, 81, 80, 12, 15],
          }
        : layout === "arch"
          ? {
              heading: [16, 24, 68, 9, 16],
              title: [16, 37, 68, 22, 30],
              details: [17, 63, 66, 16, 16],
              message: [17, 82, 66, 11, 15],
            }
          : layout === "postcard"
            ? {
                heading: [10, 13, 80, 10, 16],
                title: [10, 29, 80, 22, 32],
                details: [12, 58, 76, 18, 17],
                message: [12, 80, 76, 13, 15],
              }
            : {}
      : layout === "editorial"
        ? {
            heading: [10, 21, 80, 18, 32],
            message: [10, 45, 80, 30, 19],
            signature: [10, 81, 80, 12, 17],
          }
        : layout === "arch"
          ? {
              heading: [17, 30, 66, 16, 26],
              message: [17, 49, 66, 27, 18],
              signature: [17, 81, 66, 12, 17],
            }
          : layout === "postcard"
            ? {
                heading: [12, 24, 76, 17, 28],
                message: [12, 46, 76, 29, 19],
                signature: [12, 81, 76, 12, 17],
              }
            : {};
  const next = {
    ...value,
    template,
    palette: templatePalette(template),
    artId: undefined,
    blocks: value.blocks
      .filter((block) => {
        const original = previousRecipe?.find((seed) => seed.id === block.id);
        return (
          !original ||
          original.text !== block.text ||
          (recipe || base.blocks).some((seed) => seed.id === block.id)
        );
      })
      .map((b): DesignBlock => {
        const imported =
          "textLayouts" in item
            ? item.textLayouts?.[value.kind]?.find((seed) => seed.id === b.id)
            : undefined;
        if (imported) {
          const original =
            previousRecipe?.find((seed) => seed.id === b.id) ||
            previousBase.blocks.find((seed) => seed.id === b.id);
          const unchangedAnnouncement =
            value.variant === "save-the-date" &&
            b.id === "message" &&
            b.text ===
              "Keep a little space for a beautiful day.\nYour invitation will follow.";
          return {
            ...imported,
            text: unchangedAnnouncement
              ? "Invitation to follow."
              : b.text === original?.text
                ? imported.text
                : b.text,
          };
        }
        const seed = base.blocks.find((seed) => seed.id === b.id);
        if (!seed) return b;
        const p = positions[b.id];
        if (value.kind === "invitation") {
          const index = ["heading", "title", "details", "message"].indexOf(
            b.id,
          );
          const ribbon = /ribbon|bow|pearls/.test(item.motif);
          const y = ribbon ? [32, 44, 68, 85] : [26, 38, 64, 83];
          const height = ribbon ? [8, 20, 13, 11] : [8, 22, 15, 11];
          const size = [16, layout === "arch" ? 29 : 32, 16, 15];
          if (index >= 0)
            return {
              ...b,
              x: layout === "arch" ? 16 : 11,
              y: y[index],
              width: layout === "arch" ? 68 : 78,
              height: height[index],
              size: size[index],
              align: layout === "editorial" ? "left" : "center",
              ...(layout === "editorial" && b.id === "details"
                ? { font: "sans" as const }
                : {}),
            };
        }
        return {
          ...b,
          ...(p
            ? { x: p[0], y: p[1], width: p[2], height: p[3], size: p[4] }
            : {
                x: seed.x,
                y: seed.y,
                width: seed.width,
                height: seed.height,
                size: seed.size,
              }),
          ...(layout !== "portrait"
            ? {
                font: (b.id === "details"
                  ? "sans"
                  : "serif") as DesignBlock["font"],
              }
            : {}),
        };
      }),
  };
  if (recipe) {
    const missing = recipe.filter(
      (seed) => !next.blocks.some((block) => block.id === seed.id),
    );
    next.blocks = [
      ...next.blocks,
      ...missing
        .slice(0, 6 - next.blocks.length)
        .map((block) => ({ ...block })),
    ];
  }
  const fitted = value.variant && recipe ? fitAnnouncement(next) : next;
  return value.gif
    ? withDesignGif({ ...fitted, gif: undefined }, value.gif)
    : fitted;
}

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
              heading: [26, 8, 14],
              title: [36, 16, 27],
              details: [55, 10, 13],
              message: [82, 10, 14],
            }
          : {
              heading: [26, 12, 24],
              message: [41, 20, 17],
              signature: [82, 10, 17],
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

export function designContinuation(search: string): string {
  const choice = new URLSearchParams(search).get("design");
  return choice === "invitation" || choice === "save-the-date"
    ? "&design=" + choice
    : "";
}
