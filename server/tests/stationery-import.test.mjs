import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  copyFileSync,
  readFileSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { planImport, applyImport } from "../../scripts/import-stationery.mjs";
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "dcb-licensed-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const path of ["src/modules/media", "docs/licensing", "incoming"])
    mkdirSync(join(root, path), { recursive: true });
  writeFileSync(join(root, "src/modules/media/imported-templates.json"), "[]");
  writeFileSync(join(root, "docs/licensing/template-imports.json"), "[]");
  copyFileSync(
    new URL("../../public/gifs/noto/1f970.png", import.meta.url),
    join(root, "incoming/background.png"),
  );
  const entry = {
    id: "licensed-test-art",
    name: "Licensed test art",
    description: "An import-test fixture, not a published template.",
    category: "Everyday",
    palette: "ivory",
    sourceFile: "background.png",
    sourceUrl: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f970/512.png",
    creator: "Google Fonts",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    grant: "CC-BY-4.0",
    backgroundOnly: true,
    territory: "Worldwide",
    licenseEvidence: "Existing reviewed Noto manifest and CC BY 4.0.",
    rights: {
      commercial: true,
      derivatives: true,
      templateRedistribution: true,
      permanentStorage: true,
      portableExport: true,
    },
  };
  const manifest = join(root, "incoming/manifest.json");
  return {
    root,
    entry,
    manifest,
    write: (entry) => writeFileSync(manifest, JSON.stringify([entry])),
  };
}
test("approved background import records immutable bytes, source and redistribution rights; duplicates cannot overwrite", (t) => {
  const f = fixture(t);
  f.write(f.entry);
  const plan = planImport(f.manifest, f.root);
  assert.equal(plan.assets.length, 1);
  applyImport(plan);
  const saved = JSON.parse(
    readFileSync(join(f.root, "src/modules/media/imported-templates.json")),
  );
  assert.equal(saved[0].sourceUrl, f.entry.sourceUrl);
  assert.deepEqual(
    readFileSync(plan.assets[0].destination),
    readFileSync(join(f.root, "incoming/background.png")),
  );
  const proof = JSON.parse(
    readFileSync(join(f.root, "docs/licensing/template-imports.json")),
  )[0];
  assert.equal(proof.rights.templateRedistribution, true);
  assert.equal(proof.sha256.length, 64);
  assert.throws(() => planImport(f.manifest, f.root), /unique/);
});
test("missing rights, Pro catalog assets, executable artwork and file traversal fail before any catalog mutation", (t) => {
  const f = fixture(t);
  for (const entry of [
    { ...f.entry, grant: "canva-pro" },
    { ...f.entry, backgroundOnly: false },
    { ...f.entry, rights: { ...f.entry.rights, portableExport: false } },
    { ...f.entry, sourceFile: "../outside.png" },
  ]) {
    f.write(entry);
    assert.throws(() => planImport(f.manifest, f.root));
    assert.equal(
      readFileSync(
        join(f.root, "src/modules/media/imported-templates.json"),
        "utf8",
      ),
      "[]",
    );
  }
  writeFileSync(
    join(f.root, "incoming/bad.svg"),
    '<svg onload="alert(1)"></svg>',
  );
  f.write({ ...f.entry, sourceFile: "bad.svg" });
  assert.throws(() => planImport(f.manifest, f.root), /PNG\/JPG/);
  writeFileSync(
    join(f.root, "private.png"),
    readFileSync(join(f.root, "incoming/background.png")),
  );
  symlinkSync(join(f.root, "private.png"), join(f.root, "incoming/linked.png"));
  f.write({ ...f.entry, sourceFile: "linked.png" });
  assert.throws(() => planImport(f.manifest, f.root), /manifest directory/);
});
