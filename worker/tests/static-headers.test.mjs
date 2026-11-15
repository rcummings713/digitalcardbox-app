import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

test("the static production configuration applies browser security headers to root and deep links", { timeout: 60000 }, async (t) => {
  const socket = createServer();
  await new Promise((resolve) => socket.listen(0, "127.0.0.1", resolve));
  const port = socket.address().port;
  await new Promise((resolve) => socket.close(resolve));
  const directory = await mkdtemp(join(tmpdir(), "dcb-static-headers-"));
  const worker = spawn(process.execPath, [
    "node_modules/wrangler/bin/wrangler.js", "dev", "--config", "wrangler.jsonc", "--env", "prod",
    "--ip", "127.0.0.1", "--port", String(port), "--inspector-port", "0", "--persist-to", directory,
  ], { env: { ...process.env, WRANGLER_SEND_METRICS: "false" }, stdio: ["ignore", "pipe", "pipe"] });
  let logs = "";
  for (const stream of [worker.stdout, worker.stderr]) stream.on("data", (chunk) => { logs = (logs + chunk).slice(-3000); });
  t.after(async () => {
    if (worker.exitCode === null) {
      worker.kill("SIGTERM");
      await Promise.race([new Promise((resolve) => worker.once("exit", resolve)), delay(3000)]);
      if (worker.exitCode === null) worker.kill("SIGKILL");
    }
    await rm(directory, { recursive: true, force: true });
  });
  const base = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let attempt = 0; attempt < 160; attempt++) {
    if (worker.exitCode !== null) throw new Error("Static Worker exited: " + logs);
    try { ready = (await fetch(base)).ok; } catch {}
    if (ready) break;
    await delay(150);
  }
  assert(ready, logs);
  for (const path of ["/", "/workspace/account", "/g/closed-link"]) {
    const response = await fetch(base + path);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-security-policy"), /frame-ancestors 'none'/);
    assert.match(response.headers.get("content-security-policy"), /script-src 'self'/);
    assert.equal(response.headers.get("referrer-policy"), "no-referrer");
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.equal(response.headers.get("strict-transport-security"), "max-age=31536000");
    assert.match(response.headers.get("permissions-policy"), /camera=\(\)/);
  }
});
