import test from "node:test";
import assert from "node:assert/strict";
import { createDesign, draftKey } from "../../src/modules/design/contracts.ts";
import {
  ANONYMOUS_DRAFT_TTL,
  anonymousDraftKey,
  privateDraftKey,
  readDesignDraft,
  writeDesignDraft,
  clearDesignDrafts,
  setDesignDraftAccount,
} from "../../src/modules/design/drafts.ts";

function storage() {
  const values = Object.create(null);
  Object.defineProperties(values, {
    getItem: { value: (key) => values[key] ?? null },
    setItem: { value: (key, value) => (values[key] = String(value)) },
    removeItem: { value: (key) => delete values[key] },
  });
  return values;
}

test("drafts expire, discard legacy private data and require the verified account context after login", async (t) => {
  const local = storage(),
    tab = storage();
  Object.defineProperty(globalThis, "localStorage", { value: local, configurable: true });
  Object.defineProperty(globalThis, "sessionStorage", { value: tab, configurable: true });
  t.after(() => {
    clearDesignDrafts();
    setDesignDraftAccount(null);
    delete globalThis.localStorage;
    delete globalThis.sessionStorage;
  });
  clearDesignDrafts();
  setDesignDraftAccount(null);
  const now = Date.now(),
    legacy = createDesign("invitation"),
    anonymous = createDesign("card");
  legacy.blocks.find((b) => b.id === "details").text = "Legacy private address";
  local.setItem(draftKey("invitation"), JSON.stringify(legacy));
  assert.equal(readDesignDraft("invitation", undefined, now), null);
  assert.equal(local.getItem(draftKey("invitation")), null);

  anonymous.blocks.find((b) => b.id === "message").text = "Anonymous chosen wording";
  writeDesignDraft(anonymous, now);
  assert.equal(readDesignDraft("card", undefined, now + 1000).blocks.find((b) => b.id === "message").text, "Anonymous chosen wording");
  assert.equal(readDesignDraft("card", undefined, now + ANONYMOUS_DRAFT_TTL), null);
  assert.equal(local.getItem(anonymousDraftKey("card")), null);

  writeDesignDraft(anonymous);
  setDesignDraftAccount("account-a");
  assert.equal(local.getItem(anonymousDraftKey("card")), null);
  assert.equal(readDesignDraft("card").blocks.find((b) => b.id === "message").text, "Anonymous chosen wording");
  const privateDesign = createDesign("invitation");
  privateDesign.blocks.find((b) => b.id === "details").text = "Account A private address";
  writeDesignDraft(privateDesign);
  assert.equal(local.getItem(anonymousDraftKey("invitation")), null);
  assert.match(tab.getItem(privateDraftKey("invitation")), /Account A private address/);
  assert.equal(readDesignDraft("invitation").blocks.find((b) => b.id === "details").text, "Account A private address");

  const reloaded = await import("../../src/modules/design/drafts.ts?synthetic-reload");
  reloaded.setDesignDraftAccount("account-a");
  assert.equal(reloaded.readDesignDraft("invitation").blocks.find((b) => b.id === "details").text, "Account A private address");
  reloaded.setDesignDraftAccount(null);
  assert.equal(reloaded.readDesignDraft("invitation"), null);
  assert.equal(tab.getItem(privateDraftKey("invitation")), null);

  setDesignDraftAccount("account-b");
  assert.equal(readDesignDraft("invitation"), null);
  assert.equal(tab.getItem(privateDraftKey("invitation")), null);
  tab.setItem("dcb-draft-synthetic-invitation", "private guest draft");
  tab.setItem("dcb-purchase-synthetic-order", "private return context");
  clearDesignDrafts();
  setDesignDraftAccount(null);
  assert.equal(readDesignDraft("card"), null);
  assert.equal(tab.getItem("dcb-draft-synthetic-invitation"), null);
  assert.equal(tab.getItem("dcb-purchase-synthetic-order"), null);

  writeDesignDraft(anonymous);
  Object.defineProperty(globalThis, "sessionStorage", {
    value: {
      getItem() { throw new Error("Storage denied"); },
      setItem() { throw new Error("Storage denied"); },
      removeItem() { throw new Error("Storage denied"); },
    },
    configurable: true,
  });
  assert.doesNotThrow(() => setDesignDraftAccount("account-c"));
  assert.equal(local.getItem(anonymousDraftKey("card")), null);
  assert.equal(readDesignDraft("card"), null);
});
