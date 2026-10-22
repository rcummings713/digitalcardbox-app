import { findGif, gifCreditText } from "./catalog.ts";
interface CardRecord {
  gif?: string;
}
// A portable copy contains the actual selected media, never a provider URL alone.
export async function cardArchive<T extends CardRecord>(
  title: string,
  cards: readonly T[],
  fetcher: typeof fetch = fetch,
) {
  let total = 0;
  async function embed(path: string) {
    if (!path.startsWith("/gifs/")) throw new Error("Unknown animation asset.");
    const response = await fetcher(path, {
      credentials: "same-origin",
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok)
      throw new Error("An animation could not be saved. Please try again.");
    const mime = response.headers.get("Content-Type")?.split(";")[0];
    if (
      !mime ||
      !["image/gif", "image/webp", "image/png", "image/svg+xml"].includes(mime)
    )
      throw new Error("An animation could not be saved. Please try again.");
    const bytes = new Uint8Array(await response.arrayBuffer());
    total += bytes.length;
    if (bytes.length > 5000000 || total > 40000000)
      throw new Error(
        "This animation archive is too large. Please export fewer cards.",
      );
    let binary = "";
    for (let offset = 0; offset < bytes.length; offset += 0x8000)
      binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
    return `data:${mime};base64,${btoa(binary)}`;
  }
  const animations = [];
  for (const id of new Set(
    cards.map((card) => card.gif).filter((id): id is string => !!id),
  )) {
    const asset = findGif(id);
    if (!asset)
      throw new Error(
        "A saved animation is not available. Your cards have not changed.",
      );
    // Sequential reads bound memory and avoid a burst of downloads on mobile.
    animations.push({
      id,
      name: asset.name,
      creator: asset.creator,
      license: asset.license,
      licenseUrl: asset.licenseUrl,
      source: asset.sourceUrl,
      changes: asset.changes,
      credit: gifCreditText(id),
      animation: await embed(asset.url),
      poster: await embed(asset.poster),
    });
  }
  return {
    format: "TheDigitalCardBox-card-archive",
    version: 1,
    event: title,
    cards,
    animations,
  };
}
