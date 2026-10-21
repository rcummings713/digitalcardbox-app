import { DurableObject } from "cloudflare:workers";
import { randomBytes, createHash, timingSafeEqual } from "node:crypto";
import { ReviewRepository } from "../server/adapters/repository.mjs";
import { createApiHandler } from "../server/http.mjs";
import { MediaService } from "../server/media-service.mjs";
import migration1 from "../server/migrations/001-local-review.sql";
import migration2 from "../server/migrations/002-gift-routing.sql";
import migration3 from "../server/migrations/003-media-feedback.sql";

class DurableSqlite {
  constructor(storage) {
    this.storage = storage;
  }
  exec(sql) {
    this.storage.sql.exec(sql);
  }
  prepare(sql) {
    return {
      get: (...values) => this.storage.sql.exec(sql, ...values).toArray()[0],
      all: (...values) => this.storage.sql.exec(sql, ...values).toArray(),
      run: (...values) => {
        const result = this.storage.sql.exec(sql, ...values);
        return { changes: result.rowsWritten };
      },
    };
  }
  close() {}
}
class HostedReviewIdentity {
  constructor(repo, env) {
    this.repo = repo;
    this.env = env;
  }
  authenticate(email, password) {
    const host = this.repo.findHost(email);
    const expected =
      host?.role === "operator"
        ? this.env.DCB_OPERATOR_PASSWORD
        : this.env.DCB_HOST_PASSWORD;
    // Published local credentials never authenticate a hosted operator/host.
    if (
      !host ||
      host.id.startsWith("visitor-") ||
      !expected ||
      expected.length < 20 ||
      expected === "CardBoxReview!2026"
    )
      return null;
    return timingSafeEqual(
      createHash("sha256").update(password).digest(),
      createHash("sha256").update(expected).digest(),
    )
      ? host
      : null;
  }
}
export class ReviewStore extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.ready = ctx.blockConcurrencyWhile(async () => {
      let key = await ctx.storage.get("invitationEncryptionKey");
      if (!key) {
        key = randomBytes(32);
        await ctx.storage.put("invitationEncryptionKey", key);
      }
      this.repo = new ReviewRepository(new DurableSqlite(ctx.storage), {
        key: Buffer.from(key),
        migrations: [migration1, migration2, migration3],
        transactionRunner: (work) => ctx.storage.transactionSync(work),
        passwordHasher: () => "00".repeat(64),
      });
      this.media = new MediaService(this.repo, {
        apiKey: env.OPENAI_API_KEY || "",
        aiEnabled: env.AI_CARDS_ENABLED === "true",
      });
      this.handler = createApiHandler(this.repo, {
        secureCookies: env.DCB_LOCAL_TEST !== "true",
        hosted: true,
        identity: new HostedReviewIdentity(this.repo, env),
        services: { media: this.media },
      });
    });
  }
  async fetch(request) {
    await this.ready;
    const headers = Object.fromEntries(request.headers);
    const url = new URL(request.url);
    headers.host = url.host;
    const incoming = {
      url: request.url,
      method: request.method,
      headers,
      socket: {
        remoteAddress:
          request.headers.get("CF-Connecting-IP") || "local-worker",
      },
      async *[Symbol.asyncIterator]() {
        if (!request.body) return;
        const reader = request.body.getReader();
        try {
          for (;;) {
            const value = await reader.read();
            if (value.done) return;
            yield value.value;
          }
        } finally {
          reader.releaseLock();
        }
      },
    };
    let result;
    const outgoingHeaders = new Headers();
    const outgoing = {
      statusCode: 200,
      setHeader(name, value) {
        outgoingHeaders.set(name, value);
      },
      end(body) {
        result = new Response(body, {
          status: this.statusCode,
          headers: outgoingHeaders,
        });
      },
    };
    await this.handler(incoming, outgoing);
    return result ?? new Response("Unavailable", { status: 503 });
  }
}
export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path.startsWith("/api/")) {
      if (env.DCB_ENV !== "dev" || !env.REVIEW)
        return Response.json(
          {
            error: {
              code: "unavailable",
              message: "This API is not configured for this environment.",
            },
          },
          { status: 503, headers: { "Cache-Control": "no-store" } },
        );
      return env.REVIEW.get(env.REVIEW.idFromName("shared-review-v1")).fetch(
        request,
      );
    }
    const asset = await env.ASSETS.fetch(request);
    const response = new Response(asset.body, asset);
    response.headers.set("Referrer-Policy", "no-referrer");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
    );
    return response;
  },
};
