import { useEffect, useRef, useState } from "react";
import { gifCollection } from "./model";
import type { GifAsset } from "../modules/media/catalog";
import { request } from "./api";
import { useStore } from "./state";
const PAGE_SIZE = 24;
export function GifPicker({
  selected,
  onChoose,
}: {
  selected?: string;
  onChoose: (id: string) => void;
}) {
  const { mode } = useStore();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [available, setAvailable] =
    useState<readonly GifAsset[]>(gifCollection);
  const [status, setStatus] = useState("");
  const grid = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (mode !== "server") return;
    const controller = new AbortController();
    setStatus("Opening the GIF collection…");
    request<{ gifs: readonly GifAsset[] }>("/api/gifs", {
      signal: controller.signal,
    })
      .then((value) => {
        // Asset paths and license metadata come from the shipped allowlist, not remote URLs.
        const known = new Set(value.gifs.map((gif) => gif.id));
        setAvailable(gifCollection.filter((gif) => known.has(gif.id)));
        setStatus("");
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setStatus(
            "Showing the included collection. Every GIF below can still be added to your card.",
          );
      });
    return () => controller.abort();
  }, [mode]);
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const results = available.filter((gif) =>
    terms.every((term) =>
      `${gif.name} ${gif.tags}`.toLocaleLowerCase().includes(term),
    ),
  );
  const pages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  function search(value: string) {
    setQuery(value);
    setPage(0);
    if (grid.current) grid.current.scrollTop = 0;
  }
  function turn(next: number) {
    setPage(next);
    if (grid.current) grid.current.scrollTop = 0;
  }
  return (
    <section id="gif-library" className="gif-library" aria-label="GIF library">
      <div className="gif-library-heading">
        <strong>A little more personality</strong>
        <span className="small">{available.length} GIFs & animations</span>
      </div>
      <label htmlFor="gif-search">Find a little feeling</label>
      <input
        id="gif-search"
        type="search"
        value={query}
        maxLength={50}
        onChange={(event) => search(event.target.value)}
        placeholder="Wedding, happy, heart, flowers…"
      />
      <div className="gif-search-shortcuts" aria-label="GIF search suggestions">
        {[
          "Love",
          "Happy",
          "Wedding",
          "Birthday",
          "Baby",
          "Thanks",
          "Graduation",
          "Animals",
        ].map((word) => (
          <button type="button" key={word} onClick={() => search(word)}>
            {word}
          </button>
        ))}
        <button type="button" onClick={() => search("")}>
          All GIFs
        </button>
      </div>
      {status && (
        <p role="status" className="small">
          {status}
        </p>
      )}
      <p className="small">
        Choose a little feeling to keep with your card. Animations play when it
        opens; you can pause them or leave them out.
      </p>
      <p className="gif-results-count small" role="status">
        {results.length} {results.length === 1 ? "match" : "matches"}
        {results.length > PAGE_SIZE ? ` · Page ${current + 1} of ${pages}` : ""}
      </p>
      <div
        className="gif-grid"
        role="group"
        aria-label="Available GIFs"
        ref={grid}
      >
        {results
          .slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE)
          .map((gif) => (
            <button
              key={gif.id}
              type="button"
              aria-pressed={selected === gif.id}
              aria-label={gif.name}
              onClick={() => onChoose(gif.id)}
            >
              <img
                src={gif.poster}
                alt=""
                width="76"
                height="76"
                loading="lazy"
              />
              <span>{gif.name}</span>
            </button>
          ))}
      </div>
      {!results.length && (
        <p>
          No GIFs match that search. Try “love,” “celebrate,” or another
          feeling.
        </p>
      )}
      {pages > 1 && (
        <nav className="gif-pagination" aria-label="GIF result pages">
          <button
            type="button"
            className="secondary"
            disabled={current === 0}
            onClick={() => turn(current - 1)}
          >
            Previous GIFs
          </button>
          <span>
            {current + 1} / {pages}
          </span>
          <button
            type="button"
            className="secondary"
            disabled={current === pages - 1}
            onClick={() => turn(current + 1)}
          >
            Next GIFs
          </button>
        </nav>
      )}
      <p className="gif-attribution small">
        Includes Google Fonts’ Animated Noto Emoji,{" "}
        <a
          href="https://creativecommons.org/licenses/by/4.0/"
          target="_blank"
          rel="noopener noreferrer"
        >
          CC BY 4.0
        </a>
        .{" "}
        <a href="/media-credits.html" target="_blank" rel="noopener noreferrer">
          Animation credits
        </a>
      </p>
    </section>
  );
}
