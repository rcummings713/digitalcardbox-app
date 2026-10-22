import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { cardArchive } from "../../src/modules/media/archive.ts";
import { findGif } from "../../src/modules/media/catalog.ts";

test("card exports embed actual animations/posters once per selection, with license and source", async () => {
  const calls = [];
  const fetcher = async (path) => {
    calls.push(path);
    assert(path.startsWith("/gifs/"));
    const media = await readFile(
      new URL("../../public" + path, import.meta.url),
    );
    return new Response(media, {
      headers: {
        "Content-Type": path.endsWith(".webp") ? "image/webp" : "image/png",
      },
    });
  };
  const cards = [
    { name: "Guest One", note: "A private note.", gif: "noto-1f970" },
    { name: "Guest Two", note: "A second private note.", gif: "noto-1f970" },
  ];
  const saved = await cardArchive("A keepsake", cards, fetcher);
  assert.equal(saved.format, "TheDigitalCardBox-card-archive");
  assert.deepEqual(saved.cards, cards);
  assert.equal(saved.animations.length, 1);
  assert.equal(calls.length, 2);
  const animation = saved.animations[0];
  assert.equal(animation.creator, "Google Fonts");
  assert.equal(animation.license, "CC BY 4.0");
  assert(animation.credit.includes("Resized"));
  assert(animation.animation.startsWith("data:image/webp;base64,"));
  assert(animation.poster.startsWith("data:image/png;base64,"));
  assert.deepEqual(
    Buffer.from(animation.animation.split(",")[1], "base64"),
    await readFile(
      new URL("../../public" + findGif("noto-1f970").url, import.meta.url),
    ),
  );
  // Reopening the JSON needs no provider or application request to recover these bytes.
  const reopened = JSON.parse(JSON.stringify(saved));
  assert.equal(reopened.animations[0].animation, animation.animation);
});
test("export failures and unknown animation IDs cannot create an incomplete archive or fetch arbitrary URLs", async () => {
  await assert.rejects(
    () =>
      cardArchive("Private", [{ gif: "https://example.com/track.gif" }], () => {
        throw new Error("must not fetch");
      }),
    /not available/,
  );
  await assert.rejects(
    () =>
      cardArchive(
        "Private",
        [{ gif: "noto-1f970" }],
        async () => new Response("unavailable", { status: 503 }),
      ),
    /could not be saved/,
  );
  await assert.rejects(
    () =>
      cardArchive(
        "Private",
        [{ gif: "noto-1f970" }],
        async () =>
          new Response("<html>fallback</html>", {
            headers: { "Content-Type": "text/html" },
          }),
      ),
    /could not be saved/,
  );
  const empty = await cardArchive(
    "Plain notes",
    [{ note: "No animation is required." }],
    () => {
      throw new Error("must not fetch");
    },
  );
  assert.equal(empty.animations.length, 0);
});
