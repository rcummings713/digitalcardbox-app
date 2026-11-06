import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { importedTemplates } from "../../src/modules/media/imported-catalog.ts";
import { cardTemplates } from "../../src/modules/media/catalog.ts";
import { createDesign, applyTemplate, validateDesign, invitationTemplates } from "../../src/modules/design/contracts.ts";
import { cardArchive } from "../../src/modules/media/archive.ts";

test("the one-time Canva collection retains 100 real backgrounds with editable invitation and save-the-date recipes", () => {
  const records = JSON.parse(readFileSync(new URL("../../docs/licensing/template-imports.json", import.meta.url)));
  assert.equal(importedTemplates.length, 100);
  assert.equal(invitationTemplates.length, 195);
  assert.equal(cardTemplates.length, 106);
  assert.equal(new Set(importedTemplates.map((item) => item.category)).size, 8);
  for (const item of importedTemplates) {
    assert.deepEqual(item.kinds, ["invitation"]);
    const bytes = readFileSync(new URL("../../public" + item.artwork, import.meta.url));
    assert.ok(bytes.length > 1000 && bytes.length <= 2_000_000);
    assert.equal(bytes.subarray(1, 4).toString(), "PNG");
    assert.equal(createHash("sha256").update(bytes).digest("hex"), records.find((record) => record.id === item.id).sha256);
    assert.ok(!item.artwork.includes("canva.com"));
    for (const variant of [undefined, "save-the-date"]) {
      const doc = createDesign("invitation", "Baby shower", item.id, variant);
      assert.equal(validateDesign(doc).template, item.id);
      assert.ok(doc.blocks.length >= 4 && doc.blocks.length <= 6);
      if (variant) assert.equal(doc.blocks.find((block) => block.id === "heading").text, "Save the date");
    }
  }
});

test("switching imported designs preserves personal words, replaces untouched labels, and cannot mutate source recipes", () => {
  const a = importedTemplates.find((item) => item.name === "Honeycomb Hello");
  const b = importedTemplates.find((item) => item.name === "Cloud Cradle");
  const c = importedTemplates.find((item) => item.name === "Olive & Linen");
  const before = JSON.stringify(a.textLayouts);
  const doc = createDesign("invitation", "Baby shower", a.id);
  doc.blocks.find((block) => block.id === "title").text = "Camille’s baby shower";
  const announcement = applyTemplate(createDesign("invitation", "Wedding", "botanical", "save-the-date"), a.id);
  assert.equal(announcement.blocks.find((block) => block.id === "heading").text, "Save the date");
  assert.equal(announcement.blocks.find((block) => block.id === "message").text, "Invitation to follow.");
  assert.equal(validateDesign(announcement).variant, "save-the-date");
  const changed = applyTemplate(doc, b.id);
  assert.equal(changed.blocks.find((block) => block.id === "title").text, "Camille’s baby shower");
  assert.equal(changed.blocks.find((block) => block.id === "heading").text, b.textLayouts.invitation.find((block) => block.id === "heading").text);
  const plain = applyTemplate(changed, c.id);
  assert.ok(!plain.blocks.some((block) => block.id === "eyebrow"));
  assert.equal(validateDesign(plain).blocks.find((block) => block.id === "title").text, "Camille’s baby shower");
  assert.equal(JSON.stringify(a.textLayouts), before);
});

test("portable archives retain selected imported image bytes and credits once, without depending on Canva URLs", async () => {
  const item = importedTemplates[0];
  const archive = await cardArchive("Review", [{ design: { template: item.id } }, { design: { template: item.id } }], async (path) => {
    assert.equal(path, item.artwork);
    return new Response(readFileSync(new URL("../../public" + path, import.meta.url)), { headers: { "Content-Type": "image/png" } });
  });
  assert.equal(archive.backgrounds.length, 1);
  assert.equal(archive.backgrounds[0].credit, item.credit);
  assert.deepEqual(Buffer.from(archive.backgrounds[0].image.split(",")[1], "base64"), readFileSync(new URL("../../public" + item.artwork, import.meta.url)));
});
