import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { MediaService } from "./media-service.mjs";
if (existsSync(".env.server")) loadEnvFile(".env.server");
import { SqliteReviewRepository } from "./adapters/sqlite.mjs";
import { createApiServer } from "./http.mjs";
if (process.env.NODE_ENV === "production" || process.env.DCB_ENV === "prod")
  throw new Error(
    "The local test identity/database adapters cannot run in production.",
  );
const port = Number(process.env.DCB_API_PORT || 8787);
const repo = new SqliteReviewRepository(
  resolve(process.env.DCB_DATABASE_PATH || ".data/review.sqlite"),
);
const server = createApiServer(repo, {
  publicSiteUrl: process.env.DCB_PUBLIC_SITE_URL || "",
  services: {
    media: new MediaService(repo, {
      apiKey: process.env.OPENAI_API_KEY || "",
      aiEnabled: process.env.AI_CARDS_ENABLED === "true",
    }),
  },
});
server.listen(port, "127.0.0.1", () =>
  console.log(
    `TheDigitalCardBox test API: http://127.0.0.1:${port} (persistent local records; no payments)`,
  ),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () =>
    server.close(() => {
      repo.close();
      process.exit(0);
    }),
  );
