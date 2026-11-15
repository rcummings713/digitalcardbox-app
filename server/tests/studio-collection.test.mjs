import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { studioCollection } from "../../src/modules/media/studio-collection.ts";
import { studioArtwork } from "../../src/modules/media/studio-art.ts";
import { eventTypes } from "../../src/modules/events/occasions.ts";
import {
  createDesign,
  applyTemplate,
  validateDesign,
  withDesignGif,
  storedCardDesign,
  cardDesignWithNote,
} from "../../src/modules/design/contracts.ts";
import { cardArchive } from "../../src/modules/media/archive.ts";

test("the Studio collection supports every occasion, save-the-dates and GIFs without weakening the document contract", () => {
  assert.ok(studioCollection.length >= 24);
  for (const t of studioCollection)
    for (const occasion of eventTypes)
      for (const [kind, variant] of [
        ["card", undefined],
        ["invitation", undefined],
        ["invitation", "save-the-date"],
      ]) {
        const doc = createDesign(kind, occasion, t.id, variant);
        assert.equal(validateDesign(doc).template, t.id);
        assert.equal(validateDesign(doc).occasion, occasion);
        assert.equal(
          validateDesign(withDesignGif(doc, "noto-1f970")).gif,
          "noto-1f970",
        );
        if (variant)
          assert.equal(
            doc.blocks.find((b) => b.id === "heading").text,
            "Save the date",
          );
      }
});

test("personal words and the authoritative note survive new/earlier template switches, GIFs and storage round trips", () => {
  let doc = createDesign("card", "Wedding", "botanical");
  const words = "For Maya & René — a note to keep. <b>Still plain text.</b>";
  doc.blocks = doc.blocks.map((b) =>
    b.id === "message" ? { ...b, text: words } : b,
  );
  for (const t of studioCollection) {
    doc = applyTemplate(doc, t.id);
    assert.equal(doc.blocks.find((b) => b.id === "message").text, words);
    doc = validateDesign(withDesignGif(doc, "noto-1f970"));
    const stored = storedCardDesign(doc);
    assert.equal(stored.blocks.find((b) => b.id === "message").text, "");
    doc = cardDesignWithNote(stored, words);
  }
  doc = applyTemplate(doc, "atelier-porcelain-blue-arch");
  assert.equal(doc.blocks.find((b) => b.id === "message").text, words);
  assert.equal(doc.gif, "noto-1f970");
});

test("original SVG backgrounds are safe, match their rendered source and reject arbitrary colors or motifs", () => {
  for (const t of studioCollection) {
    const bytes = readFileSync(
      new URL("../../public" + t.artwork, import.meta.url),
    );
    assert.ok(bytes.length < 500000);
    if (t.medium === "vector") {
      assert.equal(bytes.toString(), studioArtwork(t.key, t));
      assert.doesNotMatch(
        bytes.toString(),
        /<(?:script|foreignObject)|\bon\w+\s*=|(?:href|src)=["']https?:|url\(https?:|<text\b/i,
      );
    } else {
      assert.equal(bytes.toString("ascii", 0, 4), "RIFF");
      assert.equal(bytes.toString("ascii", 8, 12), "WEBP");
    }
  }
  assert.throws(() =>
    studioArtwork("linen", {
      paper: "url(https://untrusted.test)",
      ink: "#222222",
      accent: "#333333",
    }),
  );
  assert.throws(() =>
    studioArtwork("unknown", {
      paper: "#ffffff",
      ink: "#222222",
      accent: "#333333",
    }),
  );
});

test("portable archives retain actual selected Studio background bytes, deduplicate assets and keep earlier designs readable", async () => {
  const requested = [];
  const archive = await cardArchive(
    "A Studio celebration",
    studioCollection.flatMap((t) => [
      { design: { template: t.id } },
      { design: { template: t.id } },
    ]),
    async (path) => {
      requested.push(path);
      return new Response(
        readFileSync(new URL("../../public" + path, import.meta.url)),
        {
          headers: {
            "Content-Type": path.endsWith(".svg")
              ? "image/svg+xml"
              : "image/webp",
          },
        },
      );
    },
  );
  assert.equal(requested.length, studioCollection.length);
  for (const t of studioCollection) {
    const saved = archive.backgrounds.find((a) => a.id === t.id);
    assert.deepEqual(
      Buffer.from(saved.image.split(",")[1], "base64"),
      readFileSync(new URL("../../public" + t.artwork, import.meta.url)),
    );
  }
});
