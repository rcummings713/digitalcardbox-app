import { TemplateCredit } from "./TemplateCredit";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent } from "react";
import {
  createDesign,
  fontChoices,
  palettes,
  motionChoices,
  draftKey,
  withDesignGif,
  validateDesign,
} from "../modules/design/contracts";
import type {
  DesignBlock,
  DesignDocument,
  DesignKind,
  DesignMotion,
  DesignVariant,
} from "../modules/design/contracts";
import { findGif, templates } from "../modules/media/catalog";
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
  onText,
  animate = false,
  artUrl,
  label,
}: {
  value: DesignDocument;
  selected?: string;
  onSelect?: (id: string) => void;
  onMove?: (block: DesignBlock) => void;
  onText?: (id: string, text: string) => void;
  animate?: boolean;
  artUrl?: string;
  label?: string;
}) {
  const frame = useRef<HTMLDivElement>(null),
    reduced = useReducedMotion();
  const drag = useRef<{
    block: DesignBlock;
    x: number;
    y: number;
    resize: boolean;
    next?: DesignBlock;
    moved?: boolean;
  } | null>(null);
  const lastTap = useRef({ id: "", at: 0 });
  const suppressClick = useRef(false),
    cancelEdit = useRef(false);
  const [moving, setMoving] = useState<DesignBlock | null>(null),
    [editing, setEditing] = useState<{ id: string; text: string } | null>(null);
  const [badArt, setBadArt] = useState<string>(),
    [motionPlaying, setMotionPlaying] = useState(false),
    [replay, setReplay] = useState(0);
  const template = templates.find((item) => item.id === value.template)!;
  const imported = "artwork" in template;
  const palette =
      imported && value.palette === template.palette
        ? {
            ...palettes[value.palette],
            paper: template.paper,
            ink: template.ink,
            accent: template.accent,
          }
        : palettes[value.palette],
    gif = findGif(value.gif),
    isEditable = !!onSelect;
  const hasMotion = !!(
    (value.motion && value.motion !== "none") ||
    (value.artworkMotion && value.artworkMotion !== "none") ||
    value.blocks.some((b) => b.motion && b.motion !== "none")
  );
  useEffect(() => {
    if (!hasMotion || isEditable || reduced) {
      setMotionPlaying(false);
      return;
    }
    setMotionPlaying(true);
    const timer = setTimeout(() => setMotionPlaying(false), 4400);
    return () => clearTimeout(timer);
  }, [hasMotion, isEditable, reduced, replay]);
  function motionStyle(
    preset: DesignMotion | undefined,
    index = 0,
  ): CSSProperties {
    const choice = preset || value.motion || "none";
    return motionPlaying && choice !== "none"
      ? {
          animationName: `dcb-motion-${choice === "stagger" ? "rise" : choice}`,
          animationDuration: "1100ms",
          animationTimingFunction: "cubic-bezier(.2,.7,.2,1)",
          animationFillMode: "both",
          animationDelay: `${value.motion === "stagger" || choice === "stagger" ? index * 160 : 0}ms`,
        }
      : {};
  }
  function start(
    event: PointerEvent<HTMLElement>,
    block: DesignBlock,
    resize = false,
  ) {
    if (!onMove || event.button !== 0) return;
    onSelect?.(block.id);
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { block, x: event.clientX, y: event.clientY, resize };
  }
  function move(event: PointerEvent<HTMLElement>) {
    const current = drag.current,
      box = frame.current?.getBoundingClientRect();
    if (!current || !box) return;
    const dx = event.clientX - current.x,
      dy = event.clientY - current.y;
    current.moved = Math.hypot(dx, dy) > 3;
    const round = (v: number) => Math.round(v * 10) / 10;
    const b = current.block;
    const next = current.resize
      ? {
          ...b,
          width: round(
            Math.max(30, Math.min(97 - b.x, b.width + (dx / box.width) * 100)),
          ),
          height: round(
            Math.max(
              8,
              Math.min(70, 97 - b.y, b.height + (dy / box.height) * 100),
            ),
          ),
        }
      : {
          ...b,
          x: round(
            Math.max(3, Math.min(97 - b.width, b.x + (dx / box.width) * 100)),
          ),
          y: round(
            Math.max(3, Math.min(97 - b.height, b.y + (dy / box.height) * 100)),
          ),
        };
    current.next = next;
    setMoving(next);
  }
  function finish() {
    if (drag.current?.moved && drag.current.next) onMove?.(drag.current.next);
    suppressClick.current = !!drag.current?.moved;
    drag.current = null;
    setMoving(null);
  }
  function beginEdit(block: DesignBlock) {
    if (!onText) return;
    cancelEdit.current = false;
    onSelect?.(block.id);
    setEditing({ id: block.id, text: block.text });
  }
  function finishEdit() {
    if (!cancelEdit.current && editing) {
      const original = value.blocks.find((b) => b.id === editing.id);
      if (original?.text !== editing.text) onText?.(editing.id, editing.text);
    }
    cancelEdit.current = false;
    setEditing(null);
  }
  const selectedBlock = moving || value.blocks.find((b) => b.id === selected);
  return (
    <div className="design-presentation">
      <div
        key={replay}
        ref={frame}
        className={`design-canvas design-font-${value.font}${imported ? " is-imported" : ""}${isEditable ? " is-editable" : ""}`}
        role="group"
        aria-label={
          label ||
          `${value.variant ? "Save-the-date" : value.kind === "invitation" ? "Invitation" : "Card"} design preview`
        }
        style={
          {
            "--design-paper": palette.paper,
            "--design-ink": palette.ink,
            "--design-accent": palette.accent,
          } as CSSProperties
        }
      >
        <div
          className="design-artwork-layer"
          style={motionStyle(value.artworkMotion)}
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
        </div>
        {value.blocks.map((original, index) => {
          const block = moving?.id === original.id ? moving : original;
          const fonts = {
            serif: "var(--font-heading)",
            sans: "var(--font-body)",
            script: "var(--font-script)",
          };
          const style = {
            left: `${block.x}%`,
            top: `${block.y}%`,
            width: `${block.width}%`,
            height: `${block.height}%`,
            fontSize: `${block.size / 4}cqw`,
            textAlign: block.align,
            ...(block.font ? { fontFamily: fonts[block.font] } : {}),
            fontWeight: block.bold ? 700 : 400,
            fontStyle: block.italic ? "italic" : "normal",
            textDecoration: block.underline ? "underline" : "none",
            ...motionStyle(block.motion, index),
          } as CSSProperties;
          return editing?.id === block.id ? (
            <textarea
              key={block.id}
              className="design-text-layer design-inline-input"
              style={style}
              aria-label={`Type ${block.label} on design`}
              autoFocus
              rows={1}
              maxLength={block.id === "message" ? 5000 : 200}
              value={editing.text}
              onChange={(e) =>
                setEditing({ id: block.id, text: e.target.value })
              }
              onBlur={finishEdit}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  cancelEdit.current = true;
                  setEditing(null);
                }
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                  event.preventDefault();
                  event.currentTarget.blur();
                }
              }}
            />
          ) : onSelect ? (
            <button
              type="button"
              className={`design-text-layer${selected === block.id ? " is-selected" : ""}`}
              key={block.id}
              style={style}
              aria-label={`Edit ${block.label}`}
              aria-pressed={selected === block.id}
              onClick={() => {
                if (suppressClick.current) {
                  suppressClick.current = false;
                  return;
                }
                const now = performance.now();
                if (
                  onText &&
                  lastTap.current.id === block.id &&
                  now - lastTap.current.at < 450
                )
                  beginEdit(block);
                else onSelect(block.id);
                lastTap.current = { id: block.id, at: now };
              }}
              onDoubleClick={() => beginEdit(block)}
              onPointerDown={(event) => start(event, block)}
              onPointerMove={move}
              onPointerUp={finish}
              onPointerCancel={() => {
                drag.current = null;
                setMoving(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === "F2") {
                  event.preventDefault();
                  beginEdit(block);
                  return;
                }
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
            src={(animate || motionPlaying) && !reduced ? gif.url : gif.poster}
            alt={gif.name}
            width="180"
            height="120"
          />
        )}
        {onMove && selectedBlock && !editing && (
          <button
            type="button"
            className="design-resize-handle"
            aria-label={`Resize ${selectedBlock.label}`}
            style={{
              left: `clamp(0px, calc(${selectedBlock.x + selectedBlock.width}% - 13px), calc(100% - 26px))`,
              top: `clamp(0px, calc(${selectedBlock.y + selectedBlock.height}% - 13px), calc(100% - 26px))`,
            }}
            onPointerDown={(e) => start(e, selectedBlock, true)}
            onPointerMove={move}
            onPointerUp={finish}
            onKeyDown={(e) => {
              const delta =
                e.key === "ArrowRight" || e.key === "ArrowDown"
                  ? 1
                  : e.key === "ArrowLeft" || e.key === "ArrowUp"
                    ? -1
                    : 0;
              if (!delta) return;
              e.preventDefault();
              onMove({
                ...selectedBlock,
                ...(e.key === "ArrowLeft" || e.key === "ArrowRight"
                  ? {
                      width: Math.max(
                        30,
                        Math.min(
                          97 - selectedBlock.x,
                          selectedBlock.width + delta,
                        ),
                      ),
                    }
                  : {
                      height: Math.max(
                        8,
                        Math.min(
                          70,
                          97 - selectedBlock.y,
                          selectedBlock.height + delta,
                        ),
                      ),
                    }),
              });
            }}
          >
            <span aria-hidden="true">↘</span>
          </button>
        )}
      </div>
      {isEditable && selectedBlock && onText && (
        <div>
          <button
            type="button"
            className="text-link design-type-action"
            disabled={!!editing}
            onClick={() => beginEdit(selectedBlock)}
          >
            Type directly on design
          </button>
          {editing && (
            <p className="small" role="status">
              Tap outside the text to finish. Escape cancels; Control/Command +
              Enter finishes.
            </p>
          )}
        </div>
      )}
      {hasMotion && !isEditable && (
        <button
          type="button"
          className="text-link"
          disabled={reduced}
          onClick={() =>
            motionPlaying ? setMotionPlaying(false) : setReplay((r) => r + 1)
          }
        >
          {reduced
            ? "Animations off · reduced motion"
            : motionPlaying
              ? "Show still design"
              : "Replay animation"}
        </button>
      )}
      <TemplateCredit id={value.template} />
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
  const [selected, setSelected] = useState("");
  const [preview, setPreview] = useState(false);
  const seen = useRef(value);
  const [history, setHistory] = useState<DesignDocument[]>([]);
  const [future, setFuture] = useState<DesignDocument[]>([]);
  const [playing, setPlaying] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(
    () => matchMedia("(min-width: 901px)").matches,
  );
  const block = value.blocks.find((b) => b.id === selected) || value.blocks[0];
  useEffect(() => {
    if (JSON.stringify(seen.current) === JSON.stringify(value)) return;
    const previous = seen.current;
    seen.current = value;
    setHistory((h) => [...h.slice(-29), previous]);
    setFuture([]);
  }, [value]);
  function emit(next: DesignDocument) {
    seen.current = next;
    onChange(next);
  }
  function commit(next: DesignDocument) {
    if (JSON.stringify(next) === JSON.stringify(value)) return;
    setHistory((h) => [...h.slice(-29), value]);
    setFuture([]);
    emit(next);
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
              emit(previous);
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
              emit(future[0]);
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
            if (
              window.confirm(
                "Reset layout and typography? Your words and artwork stay. You can undo the reset.",
              )
            ) {
              const base = createDesign(
                value.kind,
                value.occasion,
                value.template,
                value.variant,
              );
              const reset = {
                ...value,
                palette: base.palette,
                font: base.font,
                blocks: value.blocks.map((block) => {
                  const seed = base.blocks.find((b) => b.id === block.id);
                  return seed ? { ...seed, text: block.text } : block;
                }),
              };
              commit(
                value.gif
                  ? withDesignGif({ ...reset, gif: undefined }, value.gif)
                  : reset,
              );
            }
          }}
        >
          Reset layout
        </button>
      </div>
      <div className="editor-layout">
        <div className="editor-stage">
          <DesignCanvas
            value={value}
            selected={selected}
            onSelect={
              preview
                ? undefined
                : (id) => {
                    setSelected(id);
                    setToolsOpen(true);
                  }
            }
            onText={(id, text) =>
              commit({
                ...value,
                blocks: value.blocks.map((b) =>
                  b.id === id ? { ...b, text } : b,
                ),
              })
            }
            onMove={
              preview
                ? undefined
                : (b) =>
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
            Tap text to select. Double-tap or press Enter to type directly. Drag
            to move; use the corner handle to resize.
          </p>
          <button
            type="button"
            className="secondary editor-tools-toggle"
            onClick={() => setPreview(!preview)}
          >
            {preview ? "Back to editing" : "Preview design"}
          </button>
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
          hidden={!toolsOpen || preview}
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
                    blocks: value.blocks.map((b) => ({
                      ...b,
                      font: undefined,
                    })),
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
          <div className="editor-field-row">
            <div>
              <label htmlFor={`page-motion-${value.kind}`}>
                Page animation
              </label>
              <select
                id={`page-motion-${value.kind}`}
                value={value.motion || "none"}
                onChange={(e) =>
                  commit({ ...value, motion: e.target.value as DesignMotion })
                }
              >
                {Object.entries(motionChoices).map(([id, name]) => (
                  <option value={id} key={id}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={`art-motion-${value.kind}`}>
                Artwork animation
              </label>
              <select
                id={`art-motion-${value.kind}`}
                value={value.artworkMotion || ""}
                onChange={(e) =>
                  commit({
                    ...value,
                    artworkMotion: (e.target.value || undefined) as
                      DesignMotion | undefined,
                  })
                }
              >
                <option value="">Use page animation</option>
                {Object.entries(motionChoices).map(([id, name]) => (
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
          <div className="editor-field-row">
            <div>
              <label htmlFor={`layer-font-${value.kind}`}>
                Layer typography
              </label>
              <select
                id={`layer-font-${value.kind}`}
                value={block.font || ""}
                onChange={(e) =>
                  changeBlock({
                    font: (e.target.value || undefined) as DesignBlock["font"],
                  })
                }
              >
                <option value="">Use design typography</option>
                {Object.entries(fontChoices).map(([id, name]) => (
                  <option value={id} key={id}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={`layer-motion-${value.kind}`}>
                Text animation
              </label>
              <select
                id={`layer-motion-${value.kind}`}
                value={block.motion || ""}
                onChange={(e) =>
                  changeBlock({
                    motion: (e.target.value || undefined) as
                      DesignMotion | undefined,
                  })
                }
              >
                <option value="">Use page animation</option>
                {Object.entries(motionChoices).map(([id, name]) => (
                  <option value={id} key={id}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div
            className="editor-text-style"
            role="group"
            aria-label="Text formatting"
          >
            {(
              [
                ["bold", "B", "Bold text"],
                ["italic", "I", "Italic text"],
                ["underline", "U", "Underline text"],
              ] as const
            ).map(([key, text, label]) => (
              <button
                type="button"
                className="secondary"
                key={key}
                aria-label={label}
                aria-pressed={!!block[key]}
                onClick={() => changeBlock({ [key]: !block[key] })}
              >
                {text}
              </button>
            ))}
            <button
              type="button"
              className="secondary"
              disabled={value.blocks.length >= 6}
              onClick={() => {
                const id = "text-" + crypto.randomUUID().slice(0, 8);
                commit({
                  ...value,
                  blocks: [
                    ...value.blocks,
                    {
                      ...block,
                      id,
                      label: "Copied text",
                      x: Math.min(97 - block.width, block.x + 2),
                      y: Math.min(97 - block.height, block.y + 2),
                    },
                  ],
                });
                setSelected(id);
              }}
            >
              Duplicate
            </button>
          </div>
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
export function readDesignDraft(
  kind: DesignKind,
  variant?: DesignVariant,
): DesignDocument | null {
  try {
    const raw = localStorage.getItem(draftKey(kind, variant));
    if (!raw) return null;
    return validateDesign(JSON.parse(raw), kind);
  } catch {
    return null;
  }
}
