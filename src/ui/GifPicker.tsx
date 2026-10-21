import { useEffect, useState } from "react";
import { gifCollection } from "./model";
import { request } from "./api";
import { useStore } from "./state";
export function GifPicker({
  selected,
  onChoose,
}: {
  selected?: string;
  onChoose: (id: string) => void;
}) {
  const { mode } = useStore();
  const [query, setQuery] = useState("");
  const [available, setAvailable] =
    useState<readonly (typeof gifCollection)[number][]>(gifCollection);
  const [status, setStatus] = useState("");
  useEffect(() => {
    if (mode !== "server") return;
    const controller = new AbortController();
    setStatus("Opening the GIF collection…");
    request<{ gifs: readonly (typeof gifCollection)[number][] }>("/api/gifs", {
      signal: controller.signal,
    })
      .then((value) => {
        setAvailable(value.gifs);
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
  const results = available.filter((gif) =>
    (gif.name + " " + gif.tags)
      .toLocaleLowerCase()
      .includes(query.trim().toLocaleLowerCase()),
  );
  return (
    <section id="gif-library" className="gif-library" aria-label="GIF library">
      <div className="gif-library-heading">
        <strong>A little more personality</strong>
        <span className="small">{available.length} curated GIFs</span>
      </div>
      <label htmlFor="gif-search">Find a little feeling</label>
      <input
        id="gif-search"
        type="search"
        value={query}
        maxLength={50}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Wedding, sweet 16, graduation, love…"
      />
      <div className="gif-search-shortcuts" aria-label="GIF search suggestions">
        {["Love", "Wedding", "Birthday", "Baby", "Graduation"].map((word) => (
          <button type="button" key={word} onClick={() => setQuery(word)}>
            {word}
          </button>
        ))}
        <button type="button" onClick={() => setQuery("")}>
          All GIFs
        </button>
      </div>
      {status && (
        <p role="status" className="small">
          {status}
        </p>
      )}
      <p className="small">
        Search, select, and keep writing. GIFs play when the card opens; you can
        pause them or leave them out.
      </p>
      <div className="gif-grid" role="group" aria-label="Available GIFs">
        {results.map((gif) => (
          <button
            key={gif.id}
            type="button"
            aria-pressed={selected === gif.id}
            aria-label={gif.name}
            onClick={() => onChoose(gif.id)}
          >
            <img
              src={
                gif.id === "cosmic"
                  ? "/gifs/cosmic-poster.png"
                  : `/gifs/${gif.id}.svg`
              }
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
        <p role="status">
          No GIFs match that search. Try “love,” “celebrate,” or another
          feeling.
        </p>
      )}
      <p className="gif-attribution small">
        TheDigitalCardBox original GIF store · The supplied space animation
        keeps its original attribution.
      </p>
    </section>
  );
}
