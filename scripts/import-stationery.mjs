// Owner-reviewed local catalog import. No downloads, OAuth or public uploads.
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  realpathSync,
  statSync,
  existsSync,
  renameSync,
} from "node:fs";
import { resolve, dirname, sep } from "node:path";
import { createHash } from "node:crypto";
import {
  validateDesign,
  createDesign,
  palettes,
} from "../src/modules/design/contracts.ts";
export function planImport(manifestFile, root = process.cwd()) {
  const directory = realpathSync(dirname(resolve(manifestFile))),
    file = resolve(manifestFile);
  if (statSync(file).size > 1000000)
    throw new Error("Keep the manifest below 1 MB.");
  const manifest = JSON.parse(readFileSync(file, "utf8"));
  if (!Array.isArray(manifest) || !manifest.length || manifest.length > 100)
    throw new Error("Supply 1–100 reviewed designs.");
  const catalogPath = resolve(
      root,
      "src/modules/media/imported-templates.json",
    ),
    recordsPath = resolve(root, "docs/licensing/template-imports.json");
  const catalog = JSON.parse(readFileSync(catalogPath, "utf8")),
    records = JSON.parse(readFileSync(recordsPath, "utf8")),
    ids = new Set(catalog.map((t) => t.id)),
    assets = [];
  const text = (value, max) => {
    if (
      typeof value !== "string" ||
      !value.trim() ||
      value.length > max ||
      /[\x00-\x1f]/.test(value)
    )
      throw new Error("Check manifest text fields.");
    return value.trim();
  };
  const url = (value) => {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password)
      throw new Error("Use an HTTPS source/license URL.");
    return parsed.href;
  };
  for (const entry of manifest) {
    const id = text(entry.id, 60);
    if (!/^licensed-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || ids.has(id))
      throw new Error("Use a new unique licensed-* template ID.");
    ids.add(id);
    if (
      ![
        "canva-free",
        "original",
        "written-permission",
        "CC0",
        "CC-BY-4.0",
      ].includes(entry.grant) ||
      entry.backgroundOnly !== true ||
      entry.territory !== "Worldwide" ||
      ![
        "commercial",
        "derivatives",
        "templateRedistribution",
        "permanentStorage",
        "portableExport",
      ].every((key) => entry.rights?.[key] === true)
    )
      throw new Error(
        "Record an appropriate grant and all required rights, including template redistribution/export. Export backgrounds without baked-in text.",
      );
    if (
      ![
        "Wedding",
        "Celebration",
        "Baby",
        "Birthday",
        "Graduation",
        "Remembrance",
        "Thanks",
        "Everyday",
      ].includes(entry.category) ||
      !Object.hasOwn(palettes, entry.palette)
    )
      throw new Error("Choose a known category and palette.");
    if (entry.kinds !== undefined &&
        (!Array.isArray(entry.kinds) || !entry.kinds.length ||
         entry.kinds.length > 2 || new Set(entry.kinds).size !== entry.kinds.length ||
         entry.kinds.some((kind) => !["card", "invitation"].includes(kind))))
      throw new Error("Choose supported template kinds.");
    if (entry.colors !== undefined &&
        (!entry.colors || typeof entry.colors !== "object" ||
         Object.keys(entry.colors).sort().join() !== "accent,ink,paper" ||
         Object.values(entry.colors).some((color) =>
           typeof color !== "string" || !/^#[a-f0-9]{6}$/i.test(color))))
      throw new Error("Use three six-digit template colors.");
    const sourceUrl = url(entry.sourceUrl),
      licenseUrl = url(entry.licenseUrl);
    if (
      entry.grant === "canva-free" &&
      !["www.canva.com", "canva.com"].includes(new URL(sourceUrl).hostname)
    )
      throw new Error("A Canva Free grant needs the exact Canva source.");
    const source = realpathSync(
      resolve(directory, text(entry.sourceFile, 200)),
    );
    if (
      !source.startsWith(directory + sep) ||
      !statSync(source).isFile() ||
      statSync(source).size > 2000000
    )
      throw new Error(
        "Keep PNG/JPG source files in the manifest directory, up to 2 MB each.",
      );
    const bytes = readFileSync(source);
    let extension;
    if (
      bytes.length >= 32 &&
      bytes
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) &&
      bytes.subarray(12, 16).toString() === "IHDR"
    ) {
      const w = bytes.readUInt32BE(16),
        h = bytes.readUInt32BE(20);
      if (
        w < 64 ||
        h < 64 ||
        w > 4096 ||
        h > 4096 ||
        bytes.subarray(-8, -4).toString() !== "IEND"
      )
        throw new Error(
          "Choose a complete PNG between 64 and 4096 pixels per side.",
        );
      extension = "png";
    } else if (
      bytes.length >= 32 &&
      bytes[0] === 255 &&
      bytes[1] === 216 &&
      bytes[2] === 255 &&
      bytes.at(-2) === 255 &&
      bytes.at(-1) === 217
    ) {
      let cursor = 2,
        dimensions;
      while (cursor + 4 < bytes.length) {
        if (bytes[cursor++] !== 255) throw new Error("Invalid JPEG.");
        while (bytes[cursor] === 255) cursor++;
        const marker = bytes[cursor++];
        if (marker === 218) break;
        const length = bytes.readUInt16BE(cursor);
        if (length < 2 || cursor + length > bytes.length)
          throw new Error("Invalid JPEG.");
        if ([192, 193, 194].includes(marker)) {
          dimensions = [
            bytes.readUInt16BE(cursor + 5),
            bytes.readUInt16BE(cursor + 3),
          ];
          break;
        }
        cursor += length;
      }
      if (!dimensions || dimensions.some((n) => n < 64 || n > 4096))
        throw new Error("Choose a JPEG between 64 and 4096 pixels per side.");
      extension = "jpg";
    } else
      throw new Error(
        "Only complete PNG/JPG backgrounds are accepted. SVG, HTML, ZIP and URL imports are not supported.",
      );
    const hash = createHash("sha256").update(bytes).digest("hex"),
      relative = `/templates/imported/${id}-${hash.slice(0, 10)}.${extension}`,
      palette = entry.colors || palettes[entry.palette];
    const textLayouts = {};
    for (const kind of ["card", "invitation"])
      if (entry.textLayouts?.[kind]) {
        const design = validateDesign(
            {
              ...createDesign(kind),
              palette: entry.palette,
              blocks: entry.textLayouts[kind],
            },
            kind,
          ),
          allowed =
            kind === "card"
              ? ["heading", "message", "signature"]
              : ["heading", "title", "details", "message"];
        if (
          !allowed.every((id) => design.blocks.some((b) => b.id === id))
        )
          throw new Error(
            "Include the editor’s standard text-layer IDs; at most six validated layers.",
          );
        textLayouts[kind] = design.blocks;
      }
    const creator = text(entry.creator, 200),
      name = text(entry.name, 100),
      evidence = text(entry.licenseEvidence, 2000);
    catalog.push({
      id,
      name,
      description: text(entry.description, 240),
      motif: "licensed-background",
      category: entry.category,
      layout: "portrait",
      palette: entry.palette,
      paper: palette.paper,
      ink: palette.ink,
      accent: palette.accent,
      artwork: relative,
      credit: `${name} · ${creator} · ${entry.grant}`,
      licenseUrl,
      sourceUrl,
      ...(entry.kinds ? { kinds: entry.kinds } : {}),
      ...(Object.keys(textLayouts).length ? { textLayouts } : {}),
    });
    records.push({
      id,
      creator,
      sourceUrl,
      licenseUrl,
      grant: entry.grant,
      rights: entry.rights,
      licenseEvidence: evidence,
      territory: entry.territory,
      sha256: hash,
      asset: relative,
      importedAt: new Date().toISOString(),
    });
    assets.push({ destination: resolve(root, "public" + relative), bytes });
  }
  return { catalogPath, recordsPath, catalog, records, assets };
}
export function applyImport(plan) {
  for (const asset of plan.assets) {
    mkdirSync(dirname(asset.destination), { recursive: true });
    if (existsSync(asset.destination)) throw new Error("Asset already exists.");
    writeFileSync(asset.destination, asset.bytes, { flag: "wx" });
  }
  for (const [path, value] of [
    [plan.catalogPath, plan.catalog],
    [plan.recordsPath, plan.records],
  ]) {
    writeFileSync(path + ".tmp", JSON.stringify(value, null, 2) + "\n");
    renameSync(path + ".tmp", path);
  }
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === new URL(import.meta.url).pathname
) {
  try {
    const file = process.argv.slice(2).find((a) => !a.startsWith("--"));
    if (!file)
      throw new Error(
        "Usage: npm run import:templates -- /path/manifest.json [--dry-run]",
      );
    const plan = planImport(file);
    if (!process.argv.includes("--dry-run")) applyImport(plan);
    console.log(
      `${process.argv.includes("--dry-run") ? "Validated" : "Imported"} ${plan.assets.length} reviewed backgrounds. Their original Canva text is not automatically converted to editable layers.`,
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
