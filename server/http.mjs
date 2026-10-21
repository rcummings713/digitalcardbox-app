import { MediaService } from "./media-service.mjs";
import { createServer } from "node:http";
import { ReviewApplication } from "./application.mjs";
import { publicHost, hash } from "./domain/identity.mjs";
import { LocalTestIdentity } from "./adapters/test-identity.mjs";
import { Problem, fail, keys } from "./domain/events.mjs";
const HOST_COOKIE = "dcb_host";
function cookies(request) {
  return Object.fromEntries(
    (request.headers.cookie || "")
      .split(";")
      .map((s) => s.trim().split(/=(.*)/s))
      .filter((p) => p[0] && p[1]),
  );
}
function cookie(name, value, path, secure, maxAge = 28800) {
  return `${name}=${value}; Path=${path}; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure ? "; Secure" : ""}`;
}
async function body(request) {
  if (
    !/^application\/json(?:\s*;|$)/i.test(request.headers["content-type"] || "")
  )
    fail(415, "Use JSON for this request.");
  const chunks = [];
  let length = 0;
  for await (const chunk of request) {
    length += chunk.length;
    if (length > 32768) fail(413, "This request is too large.");
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    fail(400, "The request is not valid JSON.");
  }
}
export function createApiHandler(
  repository,
  {
    secureCookies = false,
    allowedOrigins = [],
    rateLimit = true,
    identity,
    services = {},
    hosted = false,
    publicSiteUrl = "",
  } = {},
) {
  const app = new ReviewApplication(
    repository,
    identity ?? new LocalTestIdentity(repository),
  );
  const media = services.media ?? new MediaService(repository);
  const buckets = new Map();
  function throttle(key, max, period = 60000) {
    if (!rateLimit) return;
    const now = Date.now();
    if (buckets.size > 5000)
      for (const [k, v] of buckets) if (v.until <= now) buckets.delete(k);
    if (buckets.size > 10000) fail(429, "Please try again in a moment.");
    let bucket = buckets.get(key);
    if (!bucket || bucket.until <= now) {
      bucket = { count: 0, until: now + period };
      buckets.set(key, bucket);
    }
    if (++bucket.count > max)
      fail(429, "Please wait a moment before trying again.", "rate_limited");
  }
  return async (request, response) => {
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("Referrer-Policy", "no-referrer");
    response.setHeader(
      "Content-Security-Policy",
      "default-src 'none'; frame-ancestors 'none'",
    );
    const send = (status, value) => {
      response.statusCode = status;
      response.end(JSON.stringify(value));
    };
    try {
      const path = new URL(request.url, "http://local.invalid").pathname;
      const method = request.method;
      const read = method === "GET";
      if (!path.startsWith("/api/")) fail(404, "Endpoint not found.");
      if (!["GET", "POST", "PATCH", "DELETE"].includes(method))
        fail(405, "This method is not supported.");
      throttle(`all:${request.socket.remoteAddress}`, 600);
      if (!read) {
        const origin = request.headers.origin;
        const selfOrigin = `${secureCookies ? "https" : "http"}://${request.headers.host}`;
        if (
          !origin ||
          (origin !== selfOrigin && !allowedOrigins.includes(origin)) ||
          request.headers["x-dcb-request"] !== "1"
        )
          fail(
            403,
            "Open this action from TheDigitalCardBox.",
            "origin_rejected",
          );
      }
      const jar = cookies(request);
      const session = app.session(jar[HOST_COOKIE]);
      const requireCsrf = () => {
        app.requireHost(session);
        if (
          !request.headers["x-csrf-token"] ||
          request.headers["x-csrf-token"] !== session.csrf_token
        )
          fail(403, "Refresh this page before saving.", "csrf_failed");
      };
      const origin = `${secureCookies ? "https" : "http"}://${request.headers.host}`;
      const configuration = () => ({
        connected: true,
        hosted,
        publicSiteUrl: publicSiteUrl || origin,
        reviewSessions: hosted,
        gifCount: media.gifs().length,
        ai: {
          available: media.available && repository.flags().assistance,
          dailyLimit: 20,
          perGuest: 2,
        },
        feedback: true,
      });
      const sendImage = (image) => {
        response.statusCode = 200;
        response.setHeader("Content-Type", image.mime);
        response.setHeader(
          "Content-Disposition",
          "inline; filename=card-art.webp",
        );
        response.end(image.image);
      };
      if (path === "/api/config" && read) return send(200, configuration());
      if (path === "/api/gifs" && read) {
        const query = new URL(request.url, "http://local.invalid").searchParams;
        if ([...query.keys()].some((k) => k !== "q"))
          fail(422, "Use the GIF search field.");
        return send(200, {
          gifs: media.gifs(query.get("q") || ""),
          source: "TheDigitalCardBox curated GIF store",
        });
      }
      if (path === "/api/review/session" && method === "POST") {
        if (!hosted) fail(404, "Endpoint not found.");
        keys(await body(request), []);
        const result = session
          ? { account: publicHost(session.host), csrfToken: session.csrf_token }
          : app.startReview(request.socket.remoteAddress);
        if (result.token)
          response.setHeader(
            "Set-Cookie",
            cookie(HOST_COOKIE, result.token, "/api", secureCookies, 604800),
          );
        return send(200, {
          account: result.account,
          csrfToken: result.csrfToken,
          configuration: configuration(),
        });
      }
      if (path === "/api/feedback/session" && read) {
        throttle(`feedback-session:${request.socket.remoteAddress}`, 20);
        const result = media.feedbackSession(jar.dcb_feedback);
        if (result.cookieToken)
          response.setHeader(
            "Set-Cookie",
            cookie(
              "dcb_feedback",
              result.cookieToken,
              "/api/feedback",
              secureCookies,
              86400,
            ),
          );
        return send(200, { csrfToken: result.csrfToken });
      }
      if (path === "/api/feedback" && method === "POST") {
        const result = media.saveFeedback(
          jar.dcb_feedback,
          request.headers["x-csrf-token"],
          await body(request),
          request.socket.remoteAddress,
        );
        return send(result.repeated ? 200 : 201, { id: result.id });
      }
      if (path === "/api/admin/feedback" && read)
        return send(200, { feedback: media.listFeedback(app, session) });
      let featureMatch = path.match(
        /^\/api\/admin\/feedback\/([A-Za-z0-9-]+)$/,
      );
      if (featureMatch && method === "PATCH") {
        requireCsrf();
        return send(
          200,
          media.reviewFeedback(
            app,
            session,
            featureMatch[1],
            await body(request),
          ),
        );
      }
      if (path === "/api/admin/media" && read) {
        app.requireOperator(session);
        return send(200, { ai: media.status() });
      }
      if (path === "/api/admin/media" && method === "PATCH") {
        requireCsrf();
        app.requireOperator(session);
        const input = await body(request);
        keys(input, ["enabled"]);
        if (typeof input.enabled !== "boolean")
          fail(422, "Choose a card artwork setting.");
        if (input.enabled && !media.status().configured)
          fail(
            409,
            "Configure the server-side AI key before enabling card artwork.",
          );
        repository.transaction(() => {
          repository.run(
            "UPDATE runtime_settings SET value=? WHERE key='ai_cards_enabled'",
            input.enabled ? "1" : "0",
          );
          repository.audit(
            session.host.id,
            "AI card artwork " + (input.enabled ? "enabled" : "paused") + ".",
          );
        });
        return send(200, { ai: media.status() });
      }
      featureMatch = path.match(
        /^\/api\/invitations\/([A-Za-z0-9_-]{20,100})\/art(?:\/([A-Za-z0-9-]+))?$/,
      );
      if (featureMatch) {
        if (method === "POST" && !featureMatch[2]) {
          const result = await media.generate(
            app,
            featureMatch[1],
            jar.dcb_guest,
            request.headers["x-csrf-token"],
            await body(request),
            request.socket.remoteAddress,
          );
          return send(result.repeated ? 200 : 201, result);
        }
        if (read && featureMatch[2])
          return sendImage(
            media.guestArt(
              app,
              featureMatch[1],
              jar.dcb_guest,
              featureMatch[2],
            ),
          );
      }
      featureMatch = path.match(/^\/api\/host\/art\/([A-Za-z0-9-]+)$/);
      if (featureMatch && read)
        return sendImage(media.hostArt(app, session, featureMatch[1]));
      if (path === "/api/health" && read)
        return send(200, {
          ok: true,
          mode: hosted ? "hosted-dev" : "local-test",
          moneyMovement: false,
        });
      if (path === "/api/session" && read)
        return send(200, {
          account: session ? publicHost(session.host) : null,
          csrfToken: session?.csrf_token ?? null,
          flags: repository.flags(),
          configuration: configuration(),
        });
      if (path === "/api/session" && method === "POST") {
        throttle(`login:${request.socket.remoteAddress}`, 12, 15 * 60000);
        const result = app.login(await body(request));
        if (jar[HOST_COOKIE])
          repository.dropHostSession(hash(jar[HOST_COOKIE]));
        response.setHeader(
          "Set-Cookie",
          cookie(HOST_COOKIE, result.token, "/api", secureCookies),
        );
        return send(200, {
          account: result.account,
          csrfToken: result.csrfToken,
        });
      }
      if (path === "/api/session" && method === "DELETE") {
        requireCsrf();
        repository.dropHostSession(hash(jar[HOST_COOKIE]));
        response.setHeader(
          "Set-Cookie",
          cookie(HOST_COOKIE, "", "/api", secureCookies, 0),
        );
        return send(200, { ok: true });
      }
      if (path === "/api/host/workspace" && read) {
        return send(200, repository.workspace(app.requireHost(session)));
      }
      if (path === "/api/host/profile" && method === "PATCH") {
        requireCsrf();
        return send(200, {
          account: app.saveProfile(session, await body(request)),
        });
      }
      if (path === "/api/host/events" && method === "POST") {
        requireCsrf();
        throttle(`create:${session.host.id}`, 20);
        return send(201, {
          event: app.createEvent(session, await body(request)),
        });
      }
      let match = path.match(/^\/api\/host\/events\/([^/]+)\/destinations$/);
      if (match && method === "PATCH") {
        requireCsrf();
        return send(200, {
          event: app.saveDestination(
            session,
            match[1],
            await body(request),
            request.headers["if-match"],
          ),
        });
      }
      match = path.match(/^\/api\/host\/gift-intents\/([^/]+)$/);
      if (match && method === "PATCH") {
        requireCsrf();
        return send(
          200,
          app.confirmGift(session, match[1], await body(request)),
        );
      }
      match = path.match(
        /^\/api\/host\/events\/([^/]+)(?:\/(rotate-link|book))?$/,
      );
      if (match) {
        const [, id, operation] = match;
        if (read && !operation)
          return send(200, {
            event: repository.event(app.ownedEvent(session, id)),
          });
        if (read && operation === "book")
          return send(200, app.book(session, id));
        if (method === "PATCH" && !operation) {
          requireCsrf();
          return send(200, {
            event: app.updateEvent(
              session,
              id,
              await body(request),
              request.headers["if-match"],
            ),
          });
        }
        if (method === "POST" && operation === "rotate-link") {
          requireCsrf();
          keys(await body(request), []);
          return send(200, {
            event: app.rotateLink(session, id, request.headers["if-match"]),
          });
        }
      }
      match = path.match(/^\/api\/host\/cards\/([^/]+)$/);
      if (match && (method === "PATCH" || method === "DELETE")) {
        requireCsrf();
        const input = await body(request);
        keys(input, method === "PATCH" ? ["action"] : []);
        return send(
          200,
          app.moderateCard(
            session,
            match[1],
            method === "DELETE" ? "remove" : input.action,
          ),
        );
      }
      match = path.match(
        /^\/api\/invitations\/([A-Za-z0-9_-]{20,100})(?:\/(cards|gift-intents))?$/,
      );
      if (match) {
        const [, token, operation] = match;
        if (read && !operation) {
          const result = app.invitation(token, jar.dcb_guest);
          if (result.cookieToken)
            response.setHeader(
              "Set-Cookie",
              cookie(
                "dcb_guest",
                result.cookieToken,
                `/api/invitations/${token}`,
                secureCookies,
                86400,
              ),
            );
          const { cookieToken: _, ...value } = result;
          return send(200, value);
        }
        if (method === "POST" && operation === "gift-intents") {
          throttle(
            `gift:${hash(token)}:${request.socket.remoteAddress}`,
            30,
            60000,
          );
          const result = app.prepareGift(
            token,
            jar.dcb_guest,
            request.headers["x-csrf-token"],
            await body(request),
          );
          return send(result.repeated ? 200 : 201, result);
        }
        if (method === "POST" && operation === "cards") {
          throttle(
            `submit:${hash(token)}:${request.socket.remoteAddress}`,
            30,
            60000,
          );
          const result = app.submitCard(
            token,
            jar.dcb_guest,
            request.headers["x-csrf-token"],
            await body(request),
          );
          return send(result.repeated ? 200 : 201, result);
        }
      }
      if (path === "/api/admin/summary" && read) {
        app.requireOperator(session);
        return send(200, repository.adminSummary());
      }
      match = path.match(/^\/api\/admin\/flags\/([a-zA-Z]+)$/);
      if (match && method === "PATCH") {
        requireCsrf();
        return send(200, {
          flags: app.setFlag(session, match[1], await body(request)),
        });
      }
      fail(404, "Endpoint not found.");
    } catch (error) {
      if (error instanceof Problem) {
        if (error.status === 429) response.setHeader("Retry-After", "60");
        send(error.status, {
          error: { code: error.code, message: error.message },
        });
      } else {
        console.error("API operation failed:", error.name);
        send(500, {
          error: {
            code: "server_error",
            message: "This action could not be completed. Please try again.",
          },
        });
      }
    }
  };
}
export function createApiServer(repository, options = {}) {
  const server = createServer(createApiHandler(repository, options));
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  return server;
}
