import { request } from "./api";
import type { Entry } from "./model";
import { templates, findGif, gifCreditText } from "../modules/media/catalog";
export async function savePaidBook(
  endpoint: string,
  layout: "editorial" | "collage",
) {
  const book = await request<{
    event: { title: string; hosts: string; date: string };
    entries: Entry[];
  }>(endpoint);
  const escape = (value: string) =>
    value.replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c]!,
    );
  const assets = new Map<string, string>();
  let total = 0,
    embeddedCharacters = 0;
  function bounded(uri: string) {
    embeddedCharacters += uri.length;
    if (embeddedCharacters > 40000000)
      throw new Error(
        "This edition exceeds the portable media budget. Contact the site owner; your original cards and purchase have been preserved.",
      );
    return uri;
  }
  async function embed(path: string) {
    if (assets.has(path)) return bounded(assets.get(path)!);
    if (
      !/^\/(?:gifs\/[a-zA-Z0-9_/-]+\.(?:gif|webp|png)|templates\/imported\/[a-z0-9-]+\.png|api\/host\/(?:art|studio-art)\/[a-f0-9-]{36})$/.test(
        path,
      )
    )
      throw new Error("This edition contains an unknown artwork source.");
    const response = await fetch(path, {
      credentials: "same-origin",
      signal: AbortSignal.timeout(15000),
    });
    const mime = response.headers.get("Content-Type")?.split(";")[0];
    if (
      !response.ok ||
      !["image/png", "image/webp", "image/gif", "image/jpeg"].includes(
        mime || "",
      )
    )
      throw new Error(
        "Artwork could not be saved. Your purchase is still available; please retry the download.",
      );
    const reader = response.body?.getReader();
    if (!reader) throw new Error("Artwork could not be read.");
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      total += value.length;
      if (size > 5000000 || total > 40000000) {
        await reader.cancel();
        throw new Error(
          "This edition exceeds the portable media budget. Contact the site owner; your original cards and purchase have been preserved.",
        );
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    let raw = "";
    for (let i = 0; i < bytes.length; i += 0x8000)
      raw += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    const uri = `data:${mime};base64,${btoa(raw)}`;
    assets.set(path, uri);
    return bounded(uri);
  }
  const pages: string[] = [];
  for (const [index, entry] of book.entries.entries()) {
    const template = templates.find(
      (item) => item.id === (entry.design?.template || entry.style),
    );
    const artwork = entry.artId
      ? "/api/host/art/" + entry.artId
      : entry.design?.artId
        ? "/api/host/studio-art/" + entry.design.artId
        : template && "artwork" in template
          ? template.artwork
          : undefined;
    const gif = findGif(entry.gif);
    const credit =
      template && "credit" in template
        ? template.credit
        : "Original TheDigitalCardBox stationery";
    pages.push(
      `<article><span class="folio">${String(index + 1).padStart(2, "0")}</span>${artwork ? `<img class="art" src="${await embed(artwork)}" alt="Card artwork">` : '<div class="ornament" aria-hidden="true">✧</div>'}<h2>A note from ${escape(entry.name)}</h2><p class="note">${escape(entry.note)}</p>${entry.premium ? '<p class="signature">Signature Edition</p>' : ""}${gif ? `<picture><source media="(prefers-reduced-motion: reduce)" srcset="${await embed(gif.poster)}"><img class="gif" src="${await embed(gif.url)}" alt="${escape(gif.name)}"></picture>` : ""}<p class="credit">${escape(credit)}${gif ? "<br>" + escape(gifCreditText(gif.id)) : ""}</p></article>`,
    );
  }
  // The portable artifact contains escaped personal text and retained images only.
  // No scripts, remote assets, public card URLs or payment data are included.
  const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>${escape(book.event.title)} · Digital keepsake</title><style>*{box-sizing:border-box}body{margin:0;background:#f6f0e7;color:#40362f;font:18px/1.6 Georgia,serif}.cover{padding:12vh 8vw;text-align:center;min-height:75vh;display:grid;align-content:center;border-bottom:1px solid #b99b70}.cover h1{font-size:clamp(38px,7vw,84px);font-weight:normal;margin:18px 0}.eyebrow,.folio,.signature{font:12px/1.5 system-ui,sans-serif;text-transform:uppercase;letter-spacing:.18em}.pages{max-width:1200px;margin:auto;padding:60px;display:grid;gap:60px}article{position:relative;padding:60px;background:#fffcf6;border:1px solid #c6ad853f;break-inside:avoid;box-shadow:0 12px 40px #58442a0c}h2{font-size:30px;font-weight:normal}.note{white-space:pre-wrap;overflow-wrap:anywhere}.art{max-width:32%;max-height:300px;float:right;margin:0 0 30px 30px;object-fit:contain}.gif{max-width:140px;max-height:100px;object-fit:contain}.credit{font:10px/1.6 system-ui,sans-serif;color:#63574c;clear:both}.folio{color:#796244}.ornament{color:#af8e57;font-size:40px}.signature{border-top:1px solid #b99b70;padding-top:15px}.collage .pages{grid-template-columns:1fr 1fr;gap:30px}.collage article:nth-child(3n+1){background:#edeedc}.collage article:nth-child(3n+2){background:#f5e7e0}.collage article:nth-child(3n){background:#e9edf1}.collage article{padding:36px}.collage .art{float:none;max-width:100%;display:block;margin:0 auto 25px}@media(max-width:700px){.pages{padding:20px;gap:20px}.collage .pages{grid-template-columns:1fr}article{padding:28px}.art{max-width:40%;margin-left:15px}}@media print{body{background:#fff}.pages{display:block!important;padding:0}article{break-before:page;box-shadow:none;border:0;min-height:90vh;padding:25mm}.cover{height:95vh}.credit{color:#40362f}.gif{display:none}}</style><body class="${layout}"><header class="cover"><p class="eyebrow">TheDigitalCardBox · ${layout === "editorial" ? "The Editorial" : "The Collage"}</p><h1>${escape(book.event.title)}</h1><p>${escape(book.event.hosts)} · ${escape(book.event.date)}</p><p>${book.entries.length} notes, kept with love.</p></header><main class="pages">${pages.join("") || "<article><h2>A little space for memories</h2><p>No currently consented, visible cards remain in this snapshot.</p></article>"}</main><footer class="cover"><p>Made of moments. Kept with love.</p><p class="credit">© ${new Date().getFullYear()} TheDigitalCardBox. Personal notes remain their senders’ words. Artwork notices are retained with each entry.</p></footer></body></html>`;
  const url = URL.createObjectURL(
    new Blob([html], { type: "text/html;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "TheDigitalCardBox-" + layout + "-keepsake.html";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
