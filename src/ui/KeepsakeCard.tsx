import { useEffect, useId, useRef, useState } from "react";
import { gifCollection } from "./model";
export const littleStarNote =
  "The universe is full of a million little stars ... but none will shine as much as your beautiful baby Boy !";
export const littleStarVerse =
  "El universo está lleno de miles de estrellitas… pero ninguna brilla tanto como su hermoso bebito.";
function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () =>
      matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.dataset.motion === "reduce",
  );
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () =>
      setReduced(
        query.matches || document.documentElement.dataset.motion === "reduce",
      );
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-motion"],
    });
    query.addEventListener("change", sync);
    sync();
    return () => {
      observer.disconnect();
      query.removeEventListener("change", sync);
    };
  }, []);
  return reduced;
}
export function StarBaby() {
  const id = useId();
  return (
    <svg
      className="star-baby"
      viewBox="0 0 150 145"
      role="img"
      aria-label="A sleeping baby surrounded by a warm starlight glow"
    >
      <defs>
        <radialGradient id={id}>
          <stop stopColor="#ffe7a6" stopOpacity=".9" />
          <stop offset="1" stopColor="#f7d986" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="75" cy="72" r="70" fill={`url(#${id})`} />
      <g
        stroke="#9e6f59"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M48 81Q31 105 65 128Q99 136 111 112Q116 86 89 72Z"
          fill="#f7f0de"
        />
        <path
          d="M47 86Q64 93 101 117M48 111Q76 107 96 87"
          fill="none"
          stroke="#b7bec6"
        />
        <ellipse cx="74" cy="60" rx="25" ry="27" fill="#efd0b4" />
        <path d="M51 48Q51 27 75 28Q99 29 100 50Q77 40 51 48Z" fill="#bccad6" />
        <path
          d="M65 29Q69 15 82 26M59 61q5 5 10 0M79 61q5 5 10 0M72 75q4 3 8-1"
          fill="none"
        />
        <path
          d="M115 28l3 8 8 3-8 3-3 8-3-8-8-3 8-3Z M28 62l2 6 6 2-6 2-2 6-2-6-6-2 6-2Z"
          fill="#e4bc65"
          stroke="#c29645"
        />
      </g>
      <g fill="#b7914f">
        <circle cx="35" cy="32" r="1.8" />
        <circle cx="124" cy="84" r="1.6" />
        <circle cx="25" cy="106" r="1.5" />
        <circle cx="106" cy="128" r="1.4" />
      </g>
    </svg>
  );
}
export function KeepsakeCard({
  name = "Norma",
  note = littleStarNote,
  gif,
  interactive = false,
  animate = false,
  small = false,
}: {
  name?: string;
  note?: string;
  gif?: string;
  interactive?: boolean;
  animate?: boolean;
  small?: boolean;
}) {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(!interactive);
  const [playing, setPlaying] = useState(false);
  const touched = useRef(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const item = gifCollection.find((g) => g.id === gif);
  useEffect(() => {
    if (!interactive || reduced) return;
    const reveal = setTimeout(() => {
      if (!touched.current) {
        setOpen(true);
        setPlaying(true);
      }
    }, 550);
    const pause = setTimeout(() => setPlaying(false), 4400);
    return () => {
      clearTimeout(reveal);
      clearTimeout(pause);
    };
  }, [interactive, reduced]);
  useEffect(() => {
    if (reduced) setPlaying(false);
  }, [reduced]);
  const motion = !reduced && (interactive ? playing && open : animate);
  return (
    <div
      className={`little-star-keepsake${interactive ? " is-interactive" : ""}${open ? " is-open" : ""}${small ? " is-small" : ""}`}
    >
      <div className="little-star-book" id={panelId}>
        <div className="little-star-spread" inert={!open} aria-hidden={!open}>
          <section
            className="little-star-page little-star-letter"
            tabIndex={0}
            aria-label={`Personal message from ${name || "you"}`}
          >
            <span className="little-star-constellation" aria-hidden="true">
              ✧ · ✦ · ✧
            </span>
            <p>{note || "Your words belong somewhere beautiful."}</p>
            <span className="little-star-signature">
              Hugs + Kisses,
              <br />
              {name || "you"}
            </span>
          </section>
          <section
            className="little-star-page little-star-illustrated"
            tabIndex={0}
            aria-label="Printed greeting and keepsake illustration"
          >
            <div className="little-star-inner">
              {item && (
                <img
                  className="little-star-gif"
                  src={
                    motion
                      ? `/gifs/${item.id}.gif`
                      : item.id === "cosmic"
                        ? "/gifs/cosmic-poster.png"
                        : `/gifs/${item.id}.svg`
                  }
                  alt={item.name}
                  width="498"
                  height="205"
                />
              )}
              <div className="little-star-greeting">
                <p lang="es">{littleStarVerse}</p>
                <StarBaby />
              </div>
              <p className="little-star-ribbon" lang="es">
                QUÉ ALEGRÍA TAN GRANDE
              </p>
            </div>
          </section>
        </div>
        {interactive && (
          <button
            className="little-star-cover"
            onFocus={() => {
              touched.current = true;
            }}
            onClick={() => {
              touched.current = true;
              setOpen(true);
              requestAnimationFrame(() => toggle.current?.focus());
            }}
            aria-label="Open the baby card"
            aria-expanded={open}
            aria-controls={panelId}
            tabIndex={open ? -1 : 0}
            aria-hidden={open}
          >
            <span aria-hidden="true" className="little-star-cover-art">
              ✧<br />☾<br />✦
            </span>
            <span className="little-star-cover-title">
              Welcome,
              <br />
              <em>little star.</em>
            </span>
            <span className="little-star-cover-hint">
              a world of love awaits inside
            </span>
          </button>
        )}
      </div>
      {interactive && (
        <div className="keepsake-controls">
          <button
            ref={toggle}
            type="button"
            onClick={() => {
              touched.current = true;
              setOpen(!open);
              setPlaying(false);
            }}
            aria-expanded={open}
            aria-controls={panelId}
          >
            {open ? "Close the card" : "Open the card"}
          </button>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            disabled={reduced || !open}
            onClick={() => {
              touched.current = true;
              setPlaying(!playing);
            }}
          >
            {playing ? "Pause GIF" : "Play GIF"}
          </button>
          {reduced && (
            <span className="sr-only">
              Animation is disabled by your reduced motion preference.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
