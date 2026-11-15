// Read-only synthetic security assessment probe.
// Run: node docs/security/evidence/browser-draft-probe.mjs [repository-root]
// Bundles actual application functions in memory; no server, browser or real user data.
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const repositoryRoot = resolve(process.argv[2] || fileURLToPath(new URL('../../../', import.meta.url)));
const require = createRequire(repositoryRoot + '/package.json');
const { build } = require('esbuild');
const built = await build({
  stdin: {
    contents: 'export {readDesignDraft} from "./src/ui/DesignEditor.tsx"; export {createDesign,draftKey} from "./src/modules/design/contracts.ts";',
    resolveDir: repositoryRoot,
    loader: 'ts',
  },
  bundle: true,
  platform: 'node',
  format: 'cjs',
  packages: 'external',
  write: false,
  logLevel: 'silent',
});
const stored = new Map();
const module = { exports: {} };
vm.runInNewContext(built.outputFiles[0].text, {
  module,
  exports: module.exports,
  require,
  localStorage: { getItem: (key) => stored.get(key) ?? null },
  console,
  URL,
  TextEncoder,
  TextDecoder,
  setTimeout,
  clearTimeout,
});
const { createDesign, draftKey, readDesignDraft } = module.exports;
const draft = createDesign('invitation');
const marker = 'PRIVATE SYNTHETIC HOME ADDRESS';
draft.blocks.find((block) => block.id === 'details').text = marker;
stored.set(draftKey('invitation'), JSON.stringify(draft));
const recovered = readDesignDraft('invitation');
assert.ok(recovered.blocks.some((block) => block.text === marker));
console.log('Private draft available without account/session context: true');
console.log('Storage key:', draftKey('invitation'));
console.log('Evidence: actual application draft reader restores synthetic private text from a global browser key.');
console.log('Limit: this is a unit-level runtime probe; account logout/public routing are source-reviewed separately.');
