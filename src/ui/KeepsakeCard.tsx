import { useEffect, useId, useRef, useState } from "react";
import { gifCollection } from "./model";
export const littleStarNote =
  "The universe is full of a million little stars ... but none will shine as much as your beautiful baby Boy !";
export const littleStarVerse =
  "El universo está lleno de miles de estrellitas… pero ninguna brilla tanto como su hermoso bebito.";
export function useReducedMotion() {
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
export type OccasionCard = "baby" | "wedding" | "sixteen" | "graduation";
const occasionCopy = {
  baby: {
    lead: "Welcome,",
    title: "little star.",
    verse: littleStarVerse,
    ribbon: "QUÉ ALEGRÍA TAN GRANDE",
    label: "baby",
  },
  wedding: {
    lead: "Forever,",
    title: "together.",
    verse: "May the ordinary days become your most extraordinary memories.",
    ribbon: "TO A LIFETIME OF LITTLE MOMENTS",
    label: "wedding",
  },
  sixteen: {
    lead: "Hello,",
    title: "sweet sixteen.",
    verse: "Big dreams. A brave heart. A whole beautiful world ahead.",
    ribbon: "YOUR KIND OF MAGIC",
    label: "sweet sixteen",
  },
  graduation: {
    lead: "Here’s to",
    title: "what’s next.",
    verse: "Look how far you have come. Imagine all the places you will go.",
    ribbon: "THE NEXT CHAPTER IS YOURS",
    label: "graduation",
  },
};
function OccasionIllustration({ occasion }: { occasion: OccasionCard }) {
  if (occasion === "baby") return <StarBaby />;
  return (
    <svg
      className="star-baby occasion-illustration"
      viewBox="0 0 150 145"
      role="img"
      aria-label={
        occasion === "wedding"
          ? "Interlocking wedding rings"
          : occasion === "sixteen"
            ? "A sparkling sixteen"
            : "Graduation cap and diploma"
      }
    >
      {occasion === "wedding" ? (
        <g fill="none" stroke="#b28d50">
          <circle cx="57" cy="79" r="29" strokeWidth="4" />
          <circle cx="94" cy="79" r="29" strokeWidth="4" />
          <path d="M82 46L94 32L107 46L94 60Z" strokeWidth="2" />
          <path
            d="M25 29L28 20L31 29L40 32L31 35L28 44L25 35L16 32Z"
            fill="#d5b774"
            stroke="none"
          />
        </g>
      ) : occasion === "sixteen" ? (
        <g fill="#af6c8d">
          <text
            x="75"
            y="100"
            textAnchor="middle"
            fontSize="85"
            fontFamily="Georgia,serif"
          >
            16
          </text>
          <path
            d="M25 25L30 10L35 25L50 30L35 35L30 50L25 35L10 30ZM118 113L122 100L126 113L139 117L126 121L122 134L118 121L105 117Z"
            fill="#bc9c63"
          />
        </g>
      ) : (
        <g stroke="#b19150" strokeWidth="2" strokeLinejoin="round">
          <path d="M13 48L75 19L137 48L75 78Z" fill="#344a61" />
          <path d="M34 59V87Q75 110 116 87V59" fill="#556d82" />
          <path d="M129 53V88" />
          <circle cx="129" cy="92" r="3" fill="#b19150" />
          <path d="M35 116L110 104L116 128L41 139Z" fill="#f3e7cc" />
          <path d="M72 110L77 134" strokeWidth="6" stroke="#b991a0" />
        </g>
      )}
    </svg>
  );
}
export function KeepsakeCard({
  name = "Norma",
  note = littleStarNote,
  gif,
  interactive = false,
  active = true,
  occasion = "baby",
  animate,
  small = false,
}: {
  name?: string;
  note?: string;
  gif?: string;
  interactive?: boolean;
  active?: boolean;
  occasion?: OccasionCard;
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
  const greeting = occasionCopy[occasion];
  useEffect(() => {
    if (!interactive || !active || reduced) return;
    const reveal = setTimeout(() => {
      if (!touched.current) setOpen(true);
    }, 550);
    return () => clearTimeout(reveal);
  }, [interactive, active, reduced]);
  useEffect(() => {
    if (!active) {
      setPlaying(false);
      if (interactive) setOpen(false);
      touched.current = false;
      return;
    }
    if (!open || !item || reduced) {
      setPlaying(false);
      return;
    }
    setPlaying(true);
    const stop = setTimeout(() => setPlaying(false), 4400);
    return () => clearTimeout(stop);
  }, [active, open, item?.id, reduced, interactive]);
  const motion =
    active &&
    !reduced &&
    open &&
    (interactive || animate === undefined ? playing : animate);
  return (
    <div
      className={`little-star-keepsake occasion-${occasion}${interactive ? " is-interactive" : ""}${open ? " is-open" : ""}${small ? " is-small" : ""}`}
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
                  src={motion ? item.url : item.poster}
                  alt={item.name}
                  width="498"
                  height="205"
                />
              )}
              <div className="little-star-greeting">
                <p lang={occasion === "baby" ? "es" : "en"}>{greeting.verse}</p>
                <OccasionIllustration occasion={occasion} />
              </div>
              <p
                className="little-star-ribbon"
                lang={occasion === "baby" ? "es" : "en"}
              >
                {greeting.ribbon}
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
            aria-label={`Open the ${greeting.label} card`}
            aria-expanded={open}
            aria-controls={panelId}
            tabIndex={open ? -1 : 0}
            aria-hidden={open}
          >
            <span aria-hidden="true" className="little-star-cover-art">
              ✧<br />☾<br />✦
            </span>
            <span className="little-star-cover-title">
              {greeting.lead}
              <br />
              <em>{greeting.title}</em>
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
