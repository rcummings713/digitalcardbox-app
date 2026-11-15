export const premiumEditions = [
  {
    id: "gilded",
    name: "Gilded Garden",
    template: "studio-rosewater-v1",
    detail: "Botanical borders, warm ivory and a fine gold frame.",
  },
  {
    id: "garden",
    name: "Sage & Silk",
    template: "studio-sage-press-v1",
    detail: "Soft garden green, pressed-leaf detail and a silk ribbon finish.",
  },
  {
    id: "celestial",
    name: "Written in the Stars",
    template: "studio-moon-baby-v1",
    detail: "Midnight blue, a constellation border and a warm metallic seal.",
  },
  {
    id: "pearl",
    name: "Pearl Keepsake",
    template: "studio-pearl-v1",
    detail: "Pearl accents, an elegant arch and a wedding-inspired finish.",
  },
  {
    id: "celebration",
    name: "A Golden Celebration",
    template: "studio-fiesta-v1",
    detail: "Blush paper, playful gold confetti and a celebration frame.",
  },
  {
    id: "classic",
    name: "The Signature Letter",
    template: "studio-linen-v1",
    detail: "Quiet ivory, an editorial double border and a ribbon detail.",
  },
] as const;
export type PremiumEdition = (typeof premiumEditions)[number]["id"];
