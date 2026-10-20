import { resolve } from "node:path";
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
const server = createApiServer(repo);
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
