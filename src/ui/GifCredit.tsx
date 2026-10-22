import { findGif } from "../modules/media/catalog";
export function GifCredit({ id }: { id?: string }) {
  const gif = findGif(id);
  if (gif?.origin !== "noto") return null;
  return (
    <p className="gif-credit">
      Animation:{" "}
      <a href="/media-credits.html" target="_blank" rel="noopener noreferrer">
        Google Fonts · Noto Emoji
      </a>{" "}
      ·{" "}
      <a href={gif.licenseUrl} target="_blank" rel="noopener noreferrer">
        {gif.license}
      </a>
      <span className="sr-only">
        . Resized and re-encoded; static poster derived from the animation.
      </span>
    </p>
  );
}
