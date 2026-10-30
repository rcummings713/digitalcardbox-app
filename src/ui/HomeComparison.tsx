import { useRef, useState } from "react";
export function HomeComparison() {
  const [panel, setPanel] = useState<"before" | "after">("after");
  const dialog = useRef<HTMLDialogElement>(null);
  const pan = useRef<HTMLDivElement>(null);
  return (
    <div className="before-after-art home-comparison" data-panel={panel}>
      <div
        className="comparison-switch"
        role="group"
        aria-label="Compare physical and digital cards"
      >
        <button
          type="button"
          aria-pressed={panel === "before"}
          onClick={() => setPanel("before")}
        >
          Before
        </button>
        <button
          type="button"
          aria-pressed={panel === "after"}
          onClick={() => setPanel("after")}
        >
          After
        </button>
      </div>
      <button
        type="button"
        className="before-after-button"
        aria-label="View the card-box comparison at full size"
        onClick={() => {
          dialog.current?.showModal();
          requestAnimationFrame(() => {
            if (pan.current)
              pan.current.scrollLeft = panel === "after" ? 496 : 0;
          });
        }}
      >
        <span className="comparison-artwork">
          <img
            src="/images/card-box-before-after.png"
            width="1080"
            height="593"
            alt="Before: boxes of physical greeting cards. After: meaningful cards and notes organized on your phone."
          />
        </span>
        <span className="comparison-caption">
          View larger · swipe to explore ↗
        </span>
      </button>
      <p className="comparison-reading-copy" aria-live="polite">
        {panel === "before"
          ? "Boxes to carry. Shelves to fill."
          : "Your cards and memories, beautifully together."}
      </p>
      <dialog
        ref={dialog}
        className="image-lightbox"
        aria-label="The card-box comparison"
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current?.close();
        }}
      >
        <button
          type="button"
          className="secondary close-image"
          autoFocus
          onClick={() => dialog.current?.close()}
        >
          Close image
        </button>
        <p className="small">
          Swipe or scroll across the full-size artwork to read every detail.
        </p>
        <div
          className="comparison-zoom"
          ref={pan}
          tabIndex={0}
          aria-label="Scrollable full-size comparison"
        >
          <span className="comparison-artwork">
            <img
              src="/images/card-box-before-after.png"
              width="1080"
              height="593"
              alt="Full-size comparison of physical card storage and an organized digital card box."
            />
          </span>
        </div>
      </dialog>
    </div>
  );
}
