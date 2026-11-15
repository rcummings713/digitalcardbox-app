import type { DesignBlock, DesignKind } from "./contracts.ts";
import type { StudioComposition } from "../media/studio-collection.ts";

/** Editable typography, kept separate from all decorative artwork. */
export function studioTextBlocks(
  kind: DesignKind,
  occasion: string,
  composition: StudioComposition,
  key: string,
): DesignBlock[] {
  const baby = /baby|gender reveal|sip and see/i.test(occasion);
  const wedding = /wedding|engagement|bridal/i.test(occasion);
  const birthday = /birthday|sweet 16|quince/i.test(occasion);
  const graduation = /graduation/i.test(occasion);
  const remembrance = /wake|remembrance|celebration of life/i.test(occasion);
  const editorial = composition === "editorial";
  const illustrated = composition === "illustrated";
  const floral = composition === "floral";
  const inset = composition === "arch" || composition === "framed";
  const align = editorial ? "left" : "center";
  const layer = (
    id: string,
    label: string,
    text: string,
    position: number[],
    font: DesignBlock["font"] = "serif",
  ): DesignBlock => ({
    id,
    label,
    text,
    x: position[0]!,
    y: position[1]!,
    width: position[2]!,
    height: position[3]!,
    size: position[4]!,
    align,
    font,
  });
  const typography = (blocks: DesignBlock[]) =>
    blocks.map((b) => {
      if (b.id !== (kind === "card" ? "heading" : "title")) return b;
      if (["linen", "graduate", "confetti", "sunshine", "disco"].includes(key))
        return {
          ...b,
          font: "sans" as const,
          bold: true,
          size: Math.min(b.size, 38),
        };
      if (
        [
          "ribbon",
          "cherry",
          "rosewater",
          "noir-bow",
          "gilded-vows",
          "hydrangea-vows",
          "silk-whisper",
          "garden-collage",
          "olive-monogram",
        ].includes(key)
      )
        return { ...b, font: "script" as const };
      if (["coastal", "candle"].includes(key)) return { ...b, italic: true };
      return b;
    });
  const compose = (blocks: DesignBlock[]) => {
    const positions: Record<string, number[]> =
      composition === "photo-top"
        ? kind === "card"
          ? {
              heading: [12, 51, 76, 17, 31],
              message: [14, 69, 72, 16, 15],
              signature: [16, 86, 68, 11, 15],
            }
          : {
              heading: [12, 50, 76, 8, 12],
              title: [12, 58, 76, 17, 31],
              details: [14, 76, 72, 13, 13],
              message: [14, 89, 72, 8, 12],
            }
        : composition === "photo-split"
          ? kind === "card"
            ? {
                heading: [44, 21, 48, 22, 29],
                message: [44, 46, 48, 31, 16],
                signature: [44, 82, 48, 13, 15],
              }
            : {
                heading: [44, 16, 48, 12, 12],
                title: [44, 33, 48, 23, 30],
                details: [44, 61, 48, 19, 14],
                message: [44, 84, 48, 11, 12],
              }
          : composition === "newspaper"
            ? kind === "card"
              ? {
                  heading: [12, 58, 76, 15, 29],
                  message: [12, 74, 76, 12, 13],
                  signature: [12, 87, 76, 10, 14],
                }
              : {
                  heading: [12, 57, 76, 8, 12],
                  title: [12, 65, 76, 13, 26],
                  details: [12, 78, 76, 12, 12],
                  message: [12, 89, 76, 8, 12],
                }
            : composition === "nocturne"
              ? kind === "card"
                ? {
                    heading: [14, 39, 72, 20, 33],
                    message: [17, 61, 66, 20, 18],
                    signature: [18, 84, 64, 12, 16],
                  }
                : {
                    heading: [14, 41, 72, 8, 13],
                    title: [14, 50, 72, 20, 36],
                    details: [16, 72, 68, 15, 15],
                    message: [16, 89, 68, 8, 12],
                  }
              : {};
    let composed = blocks.map((block) => {
      const p = positions[block.id];
      return p
        ? {
            ...block,
            x: p[0]!,
            y: p[1]!,
            width: p[2]!,
            height: p[3]!,
            size: p[4]!,
            align: "center" as const,
          }
        : block;
    });
    if (composition === "newspaper")
      composed.push(
        layer(
          "masthead",
          "Newspaper masthead",
          /wedding|engagement|bridal/i.test(occasion)
            ? "The Wedding Edit"
            : "The Celebration Edit",
          [8, 5, 84, 10, 25],
        ),
      );
    if (key === "olive-monogram")
      composed.push({
        ...layer(
          "monogram",
          "Your monogram",
          wedding ? "O & J" : "A",
          [34, 8, 32, 14, 36],
          "script",
        ),
        align: "center",
      });
    if (key === "birthday-glam")
      composed.push({
        ...layer(
          "milestone",
          "Age or initial",
          birthday ? "30" : "✦",
          [34, 5, 32, 14, 40],
          "serif",
        ),
        align: "center",
      });
    return typography(composed);
  };
  if (kind === "card") {
    const title = remembrance
      ? "Forever\nin our hearts."
      : baby
        ? "Small wonder.\nEndless love."
        : wedding
          ? "With love,\nalways."
          : graduation
            ? "Dream big.\nShine bright."
            : birthday
              ? "Make a wish.\nMake it yours."
              : "A moment.\nA memory.";
    const message = remembrance
      ? "May the stories we share keep their light close. Thinking of you with love."
      : baby
        ? "A whole world of love is waiting for you. Here’s to the sweetest new beginning."
        : wedding
          ? "Here’s to the quiet mornings, the great adventures, and a lifetime of choosing each other."
          : graduation
            ? "So proud of who you are and excited for where you’re going. The best is still ahead."
            : "Wishing you laughter, a little adventure, and all the people who make life beautiful.";
    return compose([
      layer(
        "heading",
        "Heading",
        title,
        editorial
          ? [12, 23, 76, 22, 38]
          : floral
            ? [20, 30, 60, 20, 35]
            : illustrated
              ? [15, 25, 70, 20, 36]
              : [inset ? 20 : 14, 28, inset ? 60 : 72, 22, 36],
      ),
      layer(
        "message",
        "Your message",
        message,
        editorial
          ? [12, 49, 72, 26, 19]
          : floral
            ? [23, 52, 54, 24, 18]
            : illustrated
              ? [19, 49, 62, 23, 19]
              : [inset ? 22 : 18, 53, inset ? 56 : 64, 23, 19],
      ),
      layer(
        "signature",
        "Sign-off",
        "With love,\nYour name",
        editorial
          ? [12, 87, 72, 10, 16]
          : floral
            ? [24, 77, 52, 12, 16]
            : illustrated
              ? [23, 74, 54, 12, 16]
              : [23, 80, 54, 12, 17],
        "script",
      ),
    ]);
  }
  const heading = remembrance
    ? "In loving memory"
    : wedding
      ? "Together with our families"
      : baby
        ? "A little joy is on the way"
        : graduation
          ? "The future is yours"
          : birthday
            ? "Make a little room for magic"
            : "You’re warmly invited";
  const title = remembrance
    ? "A life\nwell lived"
    : wedding
      ? "Olivia\n& James"
      : baby
        ? "A little\nwonder"
        : occasion === "Sweet 16"
          ? "Sweet\nsixteen"
          : occasion === "Quinceañera"
            ? "Mis quince\naños"
            : graduation
              ? "Here’s to\nwhat’s next"
              : birthday
                ? "Another year.\nMore to love."
                : "Let’s\ncelebrate";
  return compose([
    layer(
      "heading",
      "Opening line",
      heading,
      editorial
        ? [12, 16, 76, 9, 14]
        : floral
          ? [20, 30, 60, 8, 13]
          : illustrated
            ? [18, 25, 64, 8, 13]
            : [inset ? 22 : 16, 24, inset ? 56 : 68, 9, 14],
      "sans",
    ),
    layer(
      "title",
      "Event title",
      title,
      editorial
        ? [11, 32, 78, 24, 40]
        : floral
          ? [20, 39, 60, 20, 38]
          : illustrated
            ? [16, 36, 68, 20, 38]
            : [inset ? 20 : 14, 37, inset ? 60 : 72, 22, 39],
    ),
    layer(
      "details",
      "Date & place",
      "June 12, 2027 · 4:00 PM\nThe Garden Room\nBrooklyn, New York",
      editorial
        ? [12, 64, 76, 17, 17]
        : floral
          ? [23, 60, 54, 16, 16]
          : illustrated
            ? [20, 58, 60, 16, 16]
            : [inset ? 22 : 18, 65, inset ? 56 : 64, 16, 16],
      "sans",
    ),
    layer(
      "message",
      "Personal invitation",
      remembrance ? "Together, we remember." : "Come celebrate with us.",
      editorial
        ? [12, 86, 76, 8, 15]
        : floral
          ? [23, 76, 54, 8, 14]
          : illustrated
            ? [23, 74, 54, 8, 14]
            : [22, 84, 56, 8, 14],
    ),
  ]);
}
