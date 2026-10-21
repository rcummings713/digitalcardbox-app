import { useEffect, useRef, useState } from "react";
import { KeepsakeCard, littleStarNote } from "./KeepsakeCard";
import type { OccasionCard } from "./KeepsakeCard";
const examples: {
  occasion: OccasionCard;
  title: string;
  name: string;
  note: string;
  gif: string;
}[] = [
  {
    occasion: "baby",
    title: "A little star",
    name: "Norma",
    note: littleStarNote,
    gif: "cosmic",
  },
  {
    occasion: "wedding",
    title: "A wedding to remember",
    name: "Jordan & Avery",
    note: "Here’s to the little moments that become your whole life together. May your home always be full of laughter, kindness, and a love that keeps growing.",
    gif: "rings",
  },
  {
    occasion: "sixteen",
    title: "Sweet sixteen",
    name: "Auntie & Uncle",
    note: "Sixteen looks beautiful on you. Keep your brave heart, your big dreams, and that wonderful spark that makes you you. Your next chapter is going to shine.",
    gif: "sixteen",
  },
  {
    occasion: "graduation",
    title: "The next chapter",
    name: "Your biggest fans",
    note: "You worked for this moment, and we couldn’t be prouder. Take your curiosity, your courage, and everything you’ve learned into the world. There’s so much good ahead.",
    gif: "graduate",
  },
];
export function CardCarousel() {
  const [active, setActive] = useState(0);
  const viewport = useRef<HTMLDivElement>(null);
  const activeRef = useRef(active);
  activeRef.current = active;
  function show(index: number) {
    const next = Math.max(0, Math.min(examples.length - 1, index));
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    viewport.current?.scrollTo({
      left: next * viewport.current.clientWidth,
      behavior: reduced ? "instant" : "smooth",
    });
  }
  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const resize = new ResizeObserver(() =>
      element.scrollTo({
        left: activeRef.current * element.clientWidth,
        behavior: "instant",
      }),
    );
    resize.observe(element);
    return () => resize.disconnect();
  }, []);
  return (
    <section
      className="card-carousel"
      aria-label="Example keepsake cards"
      aria-roledescription="carousel"
    >
      <div
        className="card-carousel-viewport"
        ref={viewport}
        tabIndex={0}
        aria-label="Swipe or use arrow keys to browse example cards"
        onKeyDown={(event) => {
          if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
            event.preventDefault();
            show(active + (event.key === "ArrowRight" ? 1 : -1));
          }
        }}
        onScroll={() => {
          const element = viewport.current;
          if (element)
            setActive(
              Math.max(
                0,
                Math.min(
                  3,
                  Math.round(element.scrollLeft / element.clientWidth),
                ),
              ),
            );
        }}
      >
        {examples.map((example, index) => (
          <div
            className="card-carousel-slide"
            key={example.occasion}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${examples.length}: ${example.title}`}
            aria-hidden={active !== index}
            inert={active !== index}
          >
            <KeepsakeCard
              interactive
              active={active === index}
              occasion={example.occasion}
              name={example.name}
              note={example.note}
              gif={example.gif}
            />
          </div>
        ))}
      </div>
      <div className="card-carousel-navigation">
        <button
          type="button"
          className="carousel-arrow"
          onClick={() => show(active - 1)}
          disabled={active === 0}
          aria-label="Previous example card"
        >
          ←
        </button>
        <div className="carousel-dots">
          {examples.map((example, index) => (
            <button
              key={example.occasion}
              type="button"
              aria-label={`Show ${example.title.toLowerCase()} card`}
              aria-pressed={index === active}
              onClick={() => show(index)}
            >
              <span />
            </button>
          ))}
        </div>
        <span className="carousel-caption" aria-live="polite">
          {examples[active].title}
        </span>
        <button
          type="button"
          className="carousel-arrow"
          onClick={() => show(active + 1)}
          disabled={active === 3}
          aria-label="Next example card"
        >
          →
        </button>
      </div>
    </section>
  );
}
