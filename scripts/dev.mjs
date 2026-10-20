import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
const api = spawn(process.execPath, ["server/index.mjs"], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});
const ui = spawn(
  process.execPath,
  ["node_modules/vite/bin/vite.js", ...process.argv.slice(2)],
  {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, VITE_DATA_MODE: "server" },
  },
);
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  api.kill("SIGTERM");
  ui.kill("SIGTERM");
  process.exitCode = code;
}
for (const child of [api, ui]) {
  child.on("error", (error) => {
    console.error(error.message);
    stop(1);
  });
  child.on("exit", (code) => stop(code ?? 1));
}
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => stop());
