export const premiumEditions = [
  {
    id: "gilded",
    name: "Gilded Garden",
    template: "botanical",
    detail: "Botanical borders, warm ivory and a fine gold frame.",
  },
  {
    id: "garden",
    name: "Sage & Silk",
    template: "garden",
    detail: "Soft garden green, pressed-leaf detail and a silk ribbon finish.",
  },
  {
    id: "celestial",
    name: "Written in the Stars",
    template: "midnight",
    detail: "Midnight blue, a constellation border and a warm metallic seal.",
  },
  {
    id: "pearl",
    name: "Pearl Keepsake",
    template: "wedding-vows",
    detail: "Pearl accents, an elegant arch and a wedding-inspired finish.",
  },
  {
    id: "celebration",
    name: "A Golden Celebration",
    template: "sweet-sixteen",
    detail: "Blush paper, playful gold confetti and a celebration frame.",
  },
  {
    id: "classic",
    name: "The Signature Letter",
    template: "ribbon",
    detail: "Quiet ivory, an editorial double border and a ribbon detail.",
  },
] as const;
export type PremiumEdition = (typeof premiumEditions)[number]["id"];
