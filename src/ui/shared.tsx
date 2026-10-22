import { TemplateArt } from "./TemplateArt";
import type { OccasionCard } from "./KeepsakeCard";
import type { CSSProperties } from "react";
import { useReducedMotion } from "./KeepsakeCard";
import { GifCredit } from "./GifCredit";
import { templates } from "../modules/media/catalog";
import { useEffect, useId, useState } from "react";
import type { MouseEvent, ReactNode } from "react";
import QRCode from "qrcode";
import type { CardStyle, Entry } from "./model";
import { gifCollection } from "./model";
import { KeepsakeCard } from "./KeepsakeCard";

export function go(path: string) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
export function Link({
  to,
  children,
  className = "",
  ...rest
}: {
  to: string;
  children: ReactNode;
  className?: string;
  "aria-current"?: "page";
  "aria-label"?: string;
}) {
  function click(e: MouseEvent<HTMLAnchorElement>) {
    if (e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    go(to);
  }
  return (
    <a href={to} className={className} onClick={click} {...rest}>
      {children}
    </a>
  );
}
export function Logo({ compact = false }: { compact?: boolean }) {
  const toneId = `brand-logo-tone-${useId()}`;
  return (
    <span className={`brand-logo${compact ? " brand-logo-compact" : ""}`}>
      <svg
        className="brand-logo-treatment"
        width="0"
        height="0"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          {/* Lift the baked-in cream to white before CSS blends it into the page. */}
          <filter id={toneId} colorInterpolationFilters="sRGB">
            <feComponentTransfer>
              <feFuncR type="linear" slope="1.07" />
              <feFuncG type="linear" slope="1.16" />
              <feFuncB type="linear" slope="1.27" />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>
      <img
        src="/images/company-logo.png?brand=thedigitalcardbox"
        alt="TheDigitalCardBox — Elevating events & memories"
        width="1742"
        height="903"
        style={{ filter: `url("#${toneId}")` }}
      />
    </span>
  );
}
export function Heading({
  eyebrow,
  title,
  children,
  action,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {children && <div className="heading-copy">{children}</div>}
      </div>
      {action && <div className="heading-action">{action}</div>}
    </div>
  );
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="empty">
      <span aria-hidden="true">✉</span>
      <h2>{title}</h2>
      {children}
    </div>
  );
}
export function Status({ children }: { children: ReactNode }) {
  return <span className="badge">{children}</span>;
}
export function Notice({ children }: { children: ReactNode }) {
  return (
    <p className="notice" role="status">
      {children}
    </p>
  );
}
export function Botanical({ kind = "botanical" }: { kind?: CardStyle }) {
  return (
    <svg
      className="card-art"
      viewBox="0 0 400 520"
      fill="none"
      aria-hidden="true"
    >
      {kind === "botanical" || kind === "garden" ? (
        <g stroke="currentColor" strokeWidth="1.1" opacity=".72">
          {[0, 1, 2].map((v) => (
            <g
              key={v}
              transform={`translate(${v * 110 - 35} ${v % 2 ? 20 : 300}) rotate(${v * 34 - 25} 100 80)`}
            >
              <path d="M90 220Q120 150 90 75M110 165Q55 155 44 120Q88 117 110 165M108 150Q152 133 166 99Q123 103 108 150M100 112Q62 99 67 65Q99 77 100 112M108 159L54 126M112 145L155 107M100 106L73 73" />
              <g transform="translate(88 55)">
                {[0, 60, 120, 180, 240, 300].map((a) => (
                  <path
                    key={a}
                    d="M0 7C-10-3-27-10-25-26C-23-41-8-43 0-31C8-43 25-36 25-24C25-10 10-3 0 7Z"
                    transform={`rotate(${a})`}
                  />
                ))}
                {[30, 120, 210, 300].map((a) => (
                  <path
                    key={a}
                    d="M0 3C-13-8-15-20-7-23C0-28 9-20 10-13C10-4 3 0 0 3Z"
                    transform={`rotate(${a}) scale(.65)`}
                  />
                ))}
                <circle r="4" />
              </g>
            </g>
          ))}
        </g>
      ) : kind === "arch" ? (
        <g stroke="currentColor" opacity=".5">
          {[0, 1, 2, 3].map((v) => (
            <path
              key={v}
              d={`M${32 + v * 14} 490V205a${168 - v * 14} ${168 - v * 14} 0 0 1 ${336 - v * 28} 0V490`}
            />
          ))}
          <circle cx="310" cy="92" r="43" fill="currentColor" opacity=".12" />
        </g>
      ) : kind === "midnight" ? (
        <g stroke="currentColor" opacity=".8">
          <path d="M37 120L110 75 175 138 260 61 360 104M175 138L228 222 348 241M40 431L111 387 183 455 320 410" />
          {[
            [37, 120],
            [110, 75],
            [175, 138],
            [260, 61],
            [360, 104],
            [228, 222],
            [348, 241],
            [40, 431],
            [111, 387],
            [183, 455],
            [320, 410],
          ].map(([x, y], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r="3" fill="currentColor" />
              <path d={`M${x - 7} ${y}h14M${x} ${y - 7}v14`} />
            </g>
          ))}
          <path
            d="M316 147a25 25 0 1 1-35-34 22 22 0 0 0 35 34Z"
            fill="currentColor"
          />
        </g>
      ) : kind === "ribbon" ? (
        <g stroke="currentColor" strokeWidth="1.2" opacity=".8">
          <path d="M200 139C126 27 51 78 133 122Q167 139 200 139C274 27 349 78 267 122Q233 139 200 139M194 140Q166 192 126 213L156 213 149 242Q192 202 204 143M206 140Q250 184 260 225L274 202 299 214Q279 159 206 140" />
          <ellipse cx="200" cy="139" rx="10" ry="7" />
          <path d="M24 280V25h352v470H24V300" />
        </g>
      ) : (
        <g stroke="currentColor" opacity=".5">
          <rect x="28" y="28" width="344" height="464" />
          <path d="M40 42h35M42 40v35M325 478h35M358 445v35" />
        </g>
      )}
    </svg>
  );
}
export function MotionSticker({
  id,
  animate = false,
}: {
  id: string;
  animate?: boolean;
}) {
  const item = gifCollection.find((g) => g.id === id);
  if (!item) return null;
  return (
    <img
      className="motion-sticker"
      src={animate ? item.url : item.poster}
      alt={item.name}
      width="180"
      height="180"
    />
  );
}
export function Card({
  entry,
  small = false,
  animate,
  guestToken,
}: {
  entry: Pick<Entry, "style" | "name" | "note" | "photo" | "gif" | "artId">;
  small?: boolean;
  animate?: boolean;
  guestToken?: string;
}) {
  const reduced = useReducedMotion();
  const [autoPlaying, setAutoPlaying] = useState(false);
  useEffect(() => {
    if (!entry.gif || small || reduced || animate !== undefined) {
      setAutoPlaying(false);
      return;
    }
    setAutoPlaying(true);
    const stop = setTimeout(() => setAutoPlaying(false), 4400);
    return () => clearTimeout(stop);
  }, [entry.gif, entry.style, small, reduced, animate]);
  const motion = !reduced && !small && (animate ?? autoPlaying);
  const opening: Partial<Record<CardStyle, OccasionCard>> = {
    "little-star": "baby",
    "wedding-vows": "wedding",
    "sweet-sixteen": "sixteen",
    graduation: "graduation",
  };
  const occasion = opening[entry.style];
  const design = templates.find((item) => item.id === entry.style);
  if (occasion)
    return (
      <article aria-label={`Card from ${entry.name || "you"}`}>
        <KeepsakeCard
          name={entry.name}
          note={entry.note}
          gif={entry.gif}
          animate={motion}
          occasion={occasion}
          small={small}
        />
        <GifCredit id={entry.gif} />
      </article>
    );
  return (
    <article
      className={`keepsake-card card-${entry.style}${small ? " card-small" : ""}${design && !["botanical", "arch", "midnight", "ribbon", "garden", "photo"].includes(entry.style) ? " card-curated" : ""}`}
      style={
        design
          ? ({
              "--card-paper": design.paper,
              "--card-ink": design.ink,
              "--card-accent": design.accent,
            } as CSSProperties)
          : undefined
      }
      aria-label={`Card from ${entry.name || "you"}`}
    >
      {entry.style === "ai-art" && entry.artId ? (
        <img
          className="card-art ai-card-art"
          src={
            guestToken
              ? `/api/invitations/${encodeURIComponent(guestToken)}/art/${encodeURIComponent(entry.artId)}`
              : `/api/host/art/${encodeURIComponent(entry.artId)}`
          }
          alt="Personalized greeting-card artwork"
        />
      ) : design &&
        ![
          "botanical",
          "arch",
          "midnight",
          "ribbon",
          "garden",
          "photo",
        ].includes(entry.style) ? (
        <TemplateArt id={design.id} />
      ) : (
        <Botanical kind={entry.style} />
      )}
      <div className="card-content">
        <span className="card-kicker">A little love, always</span>
        {entry.photo && (
          <img
            className="card-photo"
            src={entry.photo}
            alt={`A memory shared by ${entry.name || "the sender"}`}
          />
        )}
        <p className="card-message">
          {entry.note || "Your words belong somewhere beautiful."}
        </p>
        {entry.gif && <MotionSticker id={entry.gif} animate={motion} />}
        <span className="card-signature">
          {entry.name ? `With love, ${entry.name}` : "With love, you"}
        </span>
        <GifCredit id={entry.gif} />
      </div>
    </article>
  );
}
export function QR({ url }: { url: string }) {
  const [src, setSrc] = useState("");
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    setError(false);
    setSrc("");
    QRCode.toDataURL(url, {
      width: 1280,
      margin: 4,
      errorCorrectionLevel: "M",
      color: { dark: "#222222", light: "#ffffff" },
    })
      .then((v) => {
        if (active) setSrc(v);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [url]);
  return (
    <div className="qr-panel">
      {src ? (
        <>
          <img
            src={src}
            width="224"
            height="224"
            alt="QR code for this event’s guest link"
          />
          <a
            className="text-link"
            href={src}
            download="TheDigitalCardBox-event-QR.png"
          >
            Download QR code
          </a>
        </>
      ) : (
        <p role="status">
          {error
            ? "QR could not load. Use the guest link instead."
            : "Preparing your QR code…"}
        </p>
      )}
    </div>
  );
}
export async function copy(text: string, notify: (value: string) => void) {
  try {
    await navigator.clipboard.writeText(text);
    notify("Copied to your clipboard.");
  } catch {
    notify("Copy is unavailable. Select and copy the text instead.");
  }
}
export function download(filename: string, value: string, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([value], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function InstagramLink() {
  return (
    <a
      className="instagram-link"
      href="https://www.instagram.com/thedigitalcardbox/"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Instagram — @thedigitalcardbox (opens in a new tab)"
    >
      <svg
        viewBox="0 0 24 24"
        width="17"
        height="17"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r=".7" fill="currentColor" />
      </svg>
      <span>Instagram</span>
    </a>
  );
}
