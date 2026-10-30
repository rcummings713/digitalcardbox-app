import { useRef, useState } from "react";
import type { CSSProperties, PointerEvent } from "react";
import {
  createDesign,
  fontChoices,
  palettes,
  validateDesign,
} from "../modules/design/contracts";
import type {
  DesignBlock,
  DesignDocument,
  DesignKind,
} from "../modules/design/contracts";
import { findGif } from "../modules/media/catalog";
import { TemplateArt } from "./TemplateArt";
import { GifCredit } from "./GifCredit";
import { useReducedMotion } from "./KeepsakeCard";

export function designArtworkUrl(
  value: DesignDocument,
  guestToken?: string,
  hosted = false,
) {
  if (!value.artId) return undefined;
  return guestToken
    ? `/api/invitations/${encodeURIComponent(guestToken)}/studio-art/${value.artId}`
    : hosted
      ? `/api/host/studio-art/${value.artId}`
      : `/api/studio/art/${value.artId}`;
}
export function DesignCanvas({
  value,
  selected,
  onSelect,
  onMove,
  animate = false,
  artUrl,
  label,
}: {
  value: DesignDocument;
  selected?: string;
  onSelect?: (id: string) => void;
  onMove?: (block: DesignBlock) => void;
  animate?: boolean;
  artUrl?: string;
  label?: string;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const drag = useRef<{
    block: DesignBlock;
    x: number;
    y: number;
    next?: DesignBlock;
  } | null>(null);
  const [moving, setMoving] = useState<DesignBlock | null>(null);
  const [badArt, setBadArt] = useState<string>();
  const palette = palettes[value.palette];
  const gif = findGif(value.gif);
  function start(event: PointerEvent<HTMLElement>, block: DesignBlock) {
    if (!onMove || event.button !== 0) return;
    onSelect?.(block.id);
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { block, x: event.clientX, y: event.clientY };
  }
  function move(event: PointerEvent<HTMLElement>) {
    const current = drag.current,
      box = frame.current?.getBoundingClientRect();
    if (!current || !box) return;
    const next = {
      ...current.block,
      x:
        Math.round(
          Math.max(
            3,
            Math.min(
              97 - current.block.width,
              current.block.x + ((event.clientX - current.x) / box.width) * 100,
            ),
          ) * 10,
        ) / 10,
      y:
        Math.round(
          Math.max(
            3,
            Math.min(
              97 - current.block.height,
              current.block.y +
                ((event.clientY - current.y) / box.height) * 100,
            ),
          ) * 10,
        ) / 10,
    };
    current.next = next;
    setMoving(next);
  }
  function finish() {
    if (drag.current?.next) onMove?.(drag.current.next);
    drag.current = null;
    setMoving(null);
  }
  return (
    <div className="design-presentation">
      <div
        ref={frame}
        className={`design-canvas design-font-${value.font}${onSelect ? " is-editable" : ""}`}
        role="group"
        aria-label={
          label ||
          `${value.kind === "invitation" ? "Invitation" : "Card"} design preview`
        }
        style={
          {
            "--design-paper": palette.paper,
            "--design-ink": palette.ink,
            "--design-accent": palette.accent,
          } as CSSProperties
        }
      >
        <TemplateArt id={value.template} accent={palette.accent} />
        {artUrl && badArt !== artUrl && (
          <img
            className="design-ai-art"
            src={artUrl}
            alt="Personalized stationery artwork"
            onError={() => setBadArt(artUrl)}
          />
        )}
        {value.blocks.map((original) => {
          const block = moving?.id === original.id ? moving : original;
          const style = {
            left: `${block.x}%`,
            top: `${block.y}%`,
            width: `${block.width}%`,
            height: `${block.height}%`,
            fontSize: `${block.size / 4}cqw`,
            textAlign: block.align,
          } as CSSProperties;
          return onSelect ? (
            <button
              type="button"
              className={`design-text-layer${selected === block.id ? " is-selected" : ""}`}
              key={block.id}
              style={style}
              aria-label={`Edit ${block.label}`}
              aria-pressed={selected === block.id}
              onClick={() => onSelect(block.id)}
              onPointerDown={(event) => start(event, block)}
              onPointerMove={move}
              onPointerUp={finish}
              onPointerCancel={() => {
                drag.current = null;
                setMoving(null);
              }}
              onKeyDown={(event) => {
                const directions: Record<string, [number, number]> = {
                  ArrowLeft: [-1, 0],
                  ArrowRight: [1, 0],
                  ArrowUp: [0, -1],
                  ArrowDown: [0, 1],
                };
                const vector = directions[event.key];
                if (vector && onMove) {
                  event.preventDefault();
                  onMove({
                    ...block,
                    x: Math.max(
                      3,
                      Math.min(97 - block.width, block.x + vector[0]),
                    ),
                    y: Math.max(
                      3,
                      Math.min(97 - block.height, block.y + vector[1]),
                    ),
                  });
                }
              }}
            >
              {block.text || "Tap to add your words"}
            </button>
          ) : (
            <p
              className="design-text-layer"
              key={block.id}
              style={style}
              tabIndex={block.text.length > 180 ? 0 : undefined}
            >
              {block.text}
            </p>
          );
        })}
        {gif && (
          <img
            className="design-gif"
            src={animate && !reduced ? gif.url : gif.poster}
            alt={gif.name}
            width="180"
            height="120"
          />
        )}
      </div>
      <GifCredit id={value.gif} />
      {artUrl && badArt === artUrl && (
        <p className="small" role="status">
          Your artwork could not load. Your text and template are still here.
        </p>
      )}
    </div>
  );
}
export function DesignEditor({
  value,
  onChange,
  artUrl,
  allowGif = true,
}: {
  value: DesignDocument;
  onChange: (next: DesignDocument) => void;
  artUrl?: string;
  allowGif?: boolean;
}) {
  const [selected, setSelected] = useState(value.blocks[0].id);
  const [history, setHistory] = useState<DesignDocument[]>([]);
  const [future, setFuture] = useState<DesignDocument[]>([]);
  const [playing, setPlaying] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(
    () => matchMedia("(min-width: 901px)").matches,
  );
  const block = value.blocks.find((b) => b.id === selected) || value.blocks[0];
  function commit(next: DesignDocument) {
    setHistory((h) => [...h.slice(-29), value]);
    setFuture([]);
    onChange(next);
  }
  function changeBlock(patch: Partial<DesignBlock>) {
    commit({
      ...value,
      blocks: value.blocks.map((b) =>
        b.id === block.id ? { ...b, ...patch } : b,
      ),
    });
  }
  function reorder(direction: number) {
    const blocks = [...value.blocks],
      index = blocks.findIndex((b) => b.id === block.id),
      next = index + direction;
    if (next < 0 || next >= blocks.length) return;
    [blocks[index], blocks[next]] = [blocks[next], blocks[index]];
    commit({ ...value, blocks });
  }
  return (
    <section className="design-editor" aria-label="Personalize your design">
      <div className="editor-toolbar">
        <div>
          <button
            type="button"
            className="secondary"
            disabled={!history.length}
            onClick={() => {
              const previous = history[history.length - 1];
              setFuture((f) => [value, ...f]);
              setHistory((h) => h.slice(0, -1));
              onChange(previous);
            }}
          >
            ↶ Undo
          </button>
          <button
            type="button"
            className="secondary"
            disabled={!future.length}
            onClick={() => {
              setHistory((h) => [...h, value]);
              onChange(future[0]);
              setFuture((f) => f.slice(1));
            }}
          >
            ↷ Redo
          </button>
        </div>
        <button
          type="button"
          className="text-link"
          onClick={() => {
            if (window.confirm("Reset this layout? You can undo the reset."))
              commit(createDesign(value.kind, value.occasion, value.template));
          }}
        >
          Reset layout
        </button>
      </div>
      <div className="editor-layout">
        <div className="editor-stage">
          <DesignCanvas
            value={value}
            selected={block.id}
            onSelect={(id) => {
              setSelected(id);
              setToolsOpen(true);
            }}
            onMove={(b) =>
              commit({
                ...value,
                blocks: value.blocks.map((item) =>
                  item.id === b.id ? b : item,
                ),
              })
            }
            artUrl={artUrl}
            animate={playing}
          />
          <p className="editor-hint">
            Tap text to select it. Drag to move, or use the position controls.
          </p>
          <button
            type="button"
            className="secondary editor-tools-toggle"
            aria-expanded={toolsOpen}
            aria-controls={`editor-tools-${value.kind}`}
            onClick={() => setToolsOpen(!toolsOpen)}
          >
            {toolsOpen ? "Hide editing tools" : "Edit text & layout"}
          </button>
          {value.gif && (
            <button
              type="button"
              className="text-link"
              onClick={() => setPlaying(!playing)}
            >
              {playing ? "Pause GIF" : "Play GIF"}
            </button>
          )}
        </div>
        <div
          className="editor-inspector"
          id={`editor-tools-${value.kind}`}
          hidden={!toolsOpen}
        >
          <div className="editor-field-row">
            <div>
              <label htmlFor={`palette-${value.kind}`}>Colors</label>
              <select
                id={`palette-${value.kind}`}
                value={value.palette}
                onChange={(e) =>
                  commit({
                    ...value,
                    palette: e.target.value as DesignDocument["palette"],
                  })
                }
              >
                {Object.entries(palettes).map(([id, p]) => (
                  <option value={id} key={id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={`font-${value.kind}`}>Typography</label>
              <select
                id={`font-${value.kind}`}
                value={value.font}
                onChange={(e) =>
                  commit({
                    ...value,
                    font: e.target.value as DesignDocument["font"],
                  })
                }
              >
                {Object.entries(fontChoices).map(([id, name]) => (
                  <option value={id} key={id}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <label htmlFor={`layer-${value.kind}`}>Text layer</label>
          <select
            id={`layer-${value.kind}`}
            value={block.id}
            onChange={(e) => setSelected(e.target.value)}
          >
            {value.blocks.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </select>
          <label htmlFor={`layer-text-${value.kind}`}>{block.label}</label>
          <textarea
            id={`layer-text-${value.kind}`}
            rows={4}
            maxLength={block.id === "message" ? 5000 : 200}
            value={block.text}
            onChange={(e) => changeBlock({ text: e.target.value })}
          />
          <div className="editor-field-row">
            <div>
              <label htmlFor={`text-size-${value.kind}`}>Text size</label>
              <input
                id={`text-size-${value.kind}`}
                type="range"
                min="12"
                max="40"
                value={block.size}
                onChange={(e) => changeBlock({ size: Number(e.target.value) })}
              />
            </div>
            <div>
              <label htmlFor={`text-align-${value.kind}`}>Alignment</label>
              <select
                id={`text-align-${value.kind}`}
                value={block.align}
                onChange={(e) =>
                  changeBlock({ align: e.target.value as DesignBlock["align"] })
                }
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
          </div>
          <details className="editor-position">
            <summary>Position, size & layers</summary>
            <div
              className="editor-nudges"
              role="group"
              aria-label="Move selected text"
            >
              {[
                ["←", -1, 0, "Move text left"],
                ["↑", 0, -1, "Move text up"],
                ["↓", 0, 1, "Move text down"],
                ["→", 1, 0, "Move text right"],
              ].map(([label, x, y, title]) => (
                <button
                  type="button"
                  className="secondary"
                  key={String(title)}
                  aria-label={String(title)}
                  onClick={() =>
                    changeBlock({
                      x: Math.max(
                        3,
                        Math.min(97 - block.width, block.x + Number(x)),
                      ),
                      y: Math.max(
                        3,
                        Math.min(97 - block.height, block.y + Number(y)),
                      ),
                    })
                  }
                >
                  {label}
                </button>
              ))}
            </div>
            <label htmlFor={`layer-width-${value.kind}`}>Text width</label>
            <input
              id={`layer-width-${value.kind}`}
              type="range"
              min="30"
              max={97 - block.x}
              value={block.width}
              onChange={(e) => changeBlock({ width: Number(e.target.value) })}
            />
            <label htmlFor={`layer-height-${value.kind}`}>
              Text area height
            </label>
            <input
              id={`layer-height-${value.kind}`}
              type="range"
              min="8"
              max={Math.min(70, 97 - block.y)}
              value={block.height}
              onChange={(e) => changeBlock({ height: Number(e.target.value) })}
            />
            <div className="buttons">
              <button
                type="button"
                className="text-link"
                onClick={() => reorder(-1)}
              >
                Send backward
              </button>
              <button
                type="button"
                className="text-link"
                onClick={() => reorder(1)}
              >
                Bring forward
              </button>
              <button
                type="button"
                className="text-link"
                disabled={value.blocks.length <= 1 || block.id === "message"}
                onClick={() => {
                  commit({
                    ...value,
                    blocks: value.blocks.filter((b) => b.id !== block.id),
                  });
                  setSelected(value.blocks.find((b) => b.id !== block.id)!.id);
                }}
              >
                Remove text
              </button>
            </div>
          </details>
          <button
            type="button"
            className="secondary full"
            disabled={value.blocks.length >= 6}
            onClick={() => {
              const id = "text-" + crypto.randomUUID().slice(0, 8);
              commit({
                ...value,
                blocks: [
                  ...value.blocks,
                  {
                    id,
                    label: "Extra text",
                    text: "Your words here",
                    x: 15,
                    y: 42,
                    width: 70,
                    height: 12,
                    size: 18,
                    align: "center",
                  },
                ],
              });
              setSelected(id);
            }}
          >
            + Add text
          </button>
          {allowGif && value.gif && (
            <p className="small">
              The animation has its own space below the message. Move or resize
              text to leave room for it.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
export function readDesignDraft(kind: DesignKind): DesignDocument | null {
  try {
    const raw = localStorage.getItem("dcb-design-studio-" + kind + "-v1");
    if (!raw) return null;
    return validateDesign(JSON.parse(raw), kind);
  } catch {
    return null;
  }
}
