import { notoAnimations } from "./noto-catalog.ts";

// Versioned card artwork and retained animations. IDs are shared by the UI and API.
export const templates = [
  {
    id: "little-star",
    name: "A Little Star",
    description: "An opening baby card, starlight and your own note",
    motif: "baby",
    paper: "#354f68",
    ink: "#fff8e8",
    accent: "#e3c082",
    category: "Baby",
  },
  {
    id: "botanical",
    name: "Pressed Peony",
    description: "Fine botanical lines on warm ivory",
    motif: "flowers",
    paper: "#faf4ed",
    ink: "#473b37",
    accent: "#af7479",
    category: "Wedding",
  },
  {
    id: "arch",
    name: "Golden Hour",
    description: "Sculptural arches, champagne and blush",
    motif: "arch",
    paper: "#ead2bd",
    ink: "#514139",
    accent: "#ac7d51",
    category: "Everyday",
  },
  {
    id: "midnight",
    name: "Written in the Stars",
    description: "A constellation of wishes in midnight ink",
    motif: "stars",
    paper: "#26364d",
    ink: "#fff5df",
    accent: "#dac08b",
    category: "Celebration",
  },
  {
    id: "ribbon",
    name: "With Love",
    description: "A generous bow and a handwritten sentiment",
    motif: "bow",
    paper: "#f8e9e8",
    ink: "#633f46",
    accent: "#ad777d",
    category: "Wedding",
  },
  {
    id: "garden",
    name: "Wildflower Letter",
    description: "An illustrated garden with room for your words",
    motif: "garden",
    paper: "#f1f0df",
    ink: "#3d493f",
    accent: "#819373",
    category: "Everyday",
  },
  {
    id: "photo",
    name: "A Moment to Keep",
    description: "A photograph, a little white space, a lasting note",
    motif: "frame",
    paper: "#f8f4ee",
    ink: "#473c37",
    accent: "#b68c69",
    category: "Everyday",
  },
  {
    id: "wedding-vows",
    name: "Our Forever",
    description: "Interlocking rings and fine gold filigree",
    motif: "rings",
    paper: "#fffaf0",
    ink: "#544538",
    accent: "#ad8449",
    category: "Wedding",
  },
  {
    id: "sweet-sixteen",
    name: "Sixteen Candles",
    description: "A foil sixteen, rose ribbon and birthday sparkle",
    motif: "sixteen",
    paper: "#f4dce5",
    ink: "#6b3550",
    accent: "#aa6979",
    category: "Birthday",
  },
  {
    id: "graduation",
    name: "The Next Chapter",
    description: "A cap, a diploma and a world of possibilities",
    motif: "graduate",
    paper: "#253b4c",
    ink: "#fff6e4",
    accent: "#ddbe79",
    category: "Graduation",
  },
  {
    id: "orchid",
    name: "Orchid Atelier",
    description: "Sculpted orchid petals with a soft lilac wash",
    motif: "orchid",
    paper: "#f1e8f3",
    ink: "#514056",
    accent: "#aa80b3",
    category: "Wedding",
  },
  {
    id: "citrus",
    name: "A Sunny Little Wish",
    description: "Citrus branches and Mediterranean warmth",
    motif: "citrus",
    paper: "#fff4d5",
    ink: "#534832",
    accent: "#c28d31",
    category: "Everyday",
  },
  {
    id: "moon-baby",
    name: "Over the Moon",
    description: "A crescent moon cradling a sky of little stars",
    motif: "moon",
    paper: "#e9edf3",
    ink: "#40526a",
    accent: "#8198b5",
    category: "Baby",
  },
  {
    id: "pearl-bow",
    name: "Pearls & Promises",
    description: "An ivory bow surrounded by delicate pearl dots",
    motif: "pearls",
    paper: "#f7f0e9",
    ink: "#60514c",
    accent: "#a68a78",
    category: "Wedding",
  },
  {
    id: "sunset-palm",
    name: "Somewhere Beautiful",
    description: "Sweeping palms and a terracotta sunset",
    motif: "palm",
    paper: "#f3d7c6",
    ink: "#694d41",
    accent: "#b77957",
    category: "Celebration",
  },
  {
    id: "gilded-rose",
    name: "The Gilded Rose",
    description: "Corner roses etched in warm metallic gold",
    motif: "rose",
    paper: "#f4e4de",
    ink: "#63483d",
    accent: "#ad8057",
    category: "Wedding",
  },
  {
    id: "coastal",
    name: "Letters from the Sea",
    description: "Hand-drawn waves and a little pearl of a memory",
    motif: "waves",
    paper: "#e5eff0",
    ink: "#355b65",
    accent: "#6f9ca6",
    category: "Everyday",
  },
  {
    id: "sakura",
    name: "Cherry Blossom Season",
    description: "Airy blossom branches on warm washi-inspired ivory",
    motif: "blossom",
    paper: "#fff4ec",
    ink: "#634f4a",
    accent: "#c28e91",
    category: "Everyday",
  },
  {
    id: "ivory",
    name: "A Beautiful Simplicity",
    description: "An embossed frame, generous space and your words",
    motif: "frame",
    paper: "#f6f0e6",
    ink: "#514b40",
    accent: "#b8a58b",
    category: "Everyday",
  },
  {
    id: "confetti-party",
    name: "Your Kind of Magic",
    description: "Ribbon confetti and a joyful, modern party palette",
    motif: "confetti",
    paper: "#ede2f1",
    ink: "#56425e",
    accent: "#a980a9",
    category: "Birthday",
  },
  {
    id: "lavender",
    name: "Lavender Letters",
    description: "Slender lavender stems gathered at the edges",
    motif: "lavender",
    paper: "#f0edf5",
    ink: "#51465f",
    accent: "#9681ad",
    category: "Everyday",
  },
  {
    id: "garden-arch",
    name: "Through the Garden Gate",
    description: "An airy arch and climbing greenery",
    motif: "garden-arch",
    paper: "#e9eee0",
    ink: "#46513a",
    accent: "#8b9b70",
    category: "Wedding",
  },
  {
    id: "birthday-cake",
    name: "Make a Little Wish",
    description: "A celebration cake, candles and champagne foil",
    motif: "cake",
    paper: "#fff0df",
    ink: "#6a493b",
    accent: "#bf8b62",
    category: "Birthday",
  },
  {
    id: "starlit-grad",
    name: "Oh, the Places",
    description: "A graduation constellation with a golden tassel",
    motif: "graduate-stars",
    paper: "#ece6d7",
    ink: "#4e4b3e",
    accent: "#a08b57",
    category: "Graduation",
  },
  {
    id: "remembrance",
    name: "Always Remembered",
    description: "A quiet olive branch and gentle room for memories",
    motif: "olive",
    paper: "#eeeae2",
    ink: "#505249",
    accent: "#93977e",
    category: "Remembrance",
  },
  {
    id: "thank-you",
    name: "A Bouquet of Thanks",
    description: "A wrapped bouquet and a generous handwritten thank-you",
    motif: "bouquet",
    paper: "#f2e4da",
    ink: "#694b42",
    accent: "#ba8172",
    category: "Thanks",
  },
] as const;
export type TemplateId = (typeof templates)[number]["id"];
const originalGifStore = [
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
  {
    id: "rings",
    name: "Forever starts here",
    tags: "wedding rings marriage forever engagement anniversary",
    symbol: "◉",
  },
  {
    id: "sixteen",
    name: "Sweet sixteen sparkle",
    tags: "sweet 16 sixteen birthday sparkle party",
    symbol: "16",
  },
  {
    id: "graduate",
    name: "Caps off to you",
    tags: "graduate graduation cap diploma achievement congratulations",
    symbol: "✦",
  },
  {
    id: "cake",
    name: "Make a wish",
    tags: "birthday cake candles wish party sweet sixteen",
    symbol: "✧",
  },
  {
    id: "balloons",
    name: "Up, up and celebrate",
    tags: "balloons birthday party baby congratulations celebrate",
    symbol: "○",
  },
  {
    id: "moon",
    name: "Over the moon",
    tags: "baby moon night newborn welcome little one",
    symbol: "☾",
  },
  {
    id: "butterflies",
    name: "Beautiful beginnings",
    tags: "butterflies new beginning spring birthday baby",
    symbol: "❧",
  },
  {
    id: "bow",
    name: "Tied with love",
    tags: "bow ribbon present gift wedding birthday",
    symbol: "⋈",
  },
  {
    id: "sunshine",
    name: "A little sunshine",
    tags: "sun sunshine joy happy good morning encouragement",
    symbol: "☼",
  },
  {
    id: "leaves",
    name: "Room to grow",
    tags: "leaves plant grow new chapter housewarming garden",
    symbol: "❧",
  },
  {
    id: "doves",
    name: "Peace and love",
    tags: "dove peace love wedding remembrance comfort",
    symbol: "♡",
  },
  {
    id: "rainbow",
    name: "Brighter days ahead",
    tags: "rainbow hope joy baby encouragement colorful",
    symbol: "⌒",
  },
  {
    id: "fireworks",
    name: "Your big moment",
    tags: "fireworks graduation birthday celebrate achievement",
    symbol: "✺",
  },
  {
    id: "letter",
    name: "A little love letter",
    tags: "letter note love mail wedding thanks thank you",
    symbol: "✉",
  },
  {
    id: "champagne",
    name: "A sparkling toast",
    tags: "champagne toast cheers wedding anniversary celebrate",
    symbol: "♧",
  },
  {
    id: "teddy",
    name: "Little one, big love",
    tags: "teddy bear baby newborn boy girl welcome hug",
    symbol: "♡",
  },
  {
    id: "sparkle",
    name: "Something wonderful",
    tags: "sparkle twinkle magic congrats sweet sixteen wedding",
    symbol: "✧",
  },
] as const;
export interface GifAsset {
  id: string;
  name: string;
  tags: string;
  symbol: string;
  url: string;
  poster: string;
  origin: "original" | "owner" | "noto";
  creator: string;
  license: string;
  licenseUrl: string;
  sourceUrl: string;
  changes: string;
}
export const gifStore: readonly GifAsset[] = [
  ...originalGifStore.map(
    (gif): GifAsset => ({
      ...gif,
      url: `/gifs/${gif.id}.gif`,
      poster:
        gif.id === "cosmic" ? "/gifs/cosmic-poster.png" : `/gifs/${gif.id}.svg`,
      origin: gif.id === "cosmic" ? "owner" : "original",
      creator:
        gif.id === "cosmic" ? "Owner-supplied reference" : "TheDigitalCardBox",
      license:
        gif.id === "cosmic"
          ? "Owner-supplied; commercial rights review pending"
          : "Original project artwork",
      licenseUrl: "/media-credits.html",
      sourceUrl: "/media-credits.html",
      changes: "None",
    }),
  ),
  ...notoAnimations.map(
    (gif): GifAsset => ({
      id: gif.id,
      name: gif.name,
      tags: gif.tags,
      symbol: gif.symbol,
      url: `/gifs/noto/${gif.codepoint}.webp`,
      poster: `/gifs/noto/${gif.codepoint}.png`,
      origin: "noto",
      creator: "Google Fonts",
      license: "CC BY 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
      sourceUrl: `https://fonts.gstatic.com/s/e/notoemoji/latest/${gif.rgi}/512.gif`,
      changes:
        "Resized and re-encoded as animated WebP; frame rate reduced with loop timing preserved; static PNG poster extracted.",
    }),
  ),
];
export const findGif = (id?: string) => gifStore.find((gif) => gif.id === id);
export const searchGifs = (query: string) => {
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return gifStore.filter((gif) => {
    const searchable = `${gif.name} ${gif.tags}`.toLocaleLowerCase();
    return words.every((word) => searchable.includes(word));
  });
};
export const gifCreditText = (id?: string) => {
  const gif = findGif(id);
  return gif?.origin === "noto"
    ? `Animation: ${gif.name} by ${gif.creator} (Animated Noto Emoji), ${gif.license} (${gif.licenseUrl}). Source: ${gif.sourceUrl}. Changes: ${gif.changes}`
    : "";
};

export const aiOptions = {
  occasion: [
    "Wedding",
    "Baby shower",
    "Sweet sixteen",
    "Birthday",
    "Graduation",
    "Anniversary",
    "Thank you",
    "Remembrance",
  ],
  palette: [
    "Blush and copper",
    "Ivory and champagne",
    "Sage and cream",
    "Midnight and gold",
    "Lilac and pearl",
    "Terracotta and peach",
  ],
  artwork: [
    "Fine botanical illustration",
    "Elegant paper collage",
    "Soft watercolor florals",
    "Geometric editorial arches",
    "Celestial gold linework",
    "Minimal embossed stationery",
  ],
  motif: [
    "Flowers and leaves",
    "Ribbons and bows",
    "Wedding rings",
    "Stars and moon",
    "Birthday cake and candles",
    "Graduation cap and diploma",
    "Butterflies",
    "Olive branches",
  ],
} as const;
export interface AiCardChoices {
  occasion: string;
  palette: string;
  artwork: string;
  motif: string;
}
