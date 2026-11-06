import { fail, keys } from "./domain/events.mjs";
export async function billingHttp({
  billing,
  app,
  session,
  jar,
  path,
  method,
  request,
  readBody,
  throttle,
}) {
  if (path === "/api/billing/stripe/webhook") {
    if (method !== "POST") fail(405, "Use POST for Stripe events.");
    if (
      !/^application\/json(?:\s*;|$)/i.test(
        request.headers["content-type"] || "",
      )
    )
      fail(415, "Use a JSON Stripe event.");
    const chunks = [];
    let size = 0;
    for await (const chunk of request) {
      size += chunk.length;
      if (size > 262144) fail(413, "Stripe event is too large.");
      chunks.push(Buffer.from(chunk));
    }
    return {
      value: await billing.webhook(
        Buffer.concat(chunks),
        request.headers["stripe-signature"],
      ),
    };
  }
  const guest = path.match(
    /^\/api\/invitations\/([A-Za-z0-9_-]{20,100})\/billing(\/.*)$/,
  );
  if (
    !guest &&
    !path.startsWith("/api/billing/") &&
    path !== "/api/admin/billing"
  )
    return null;
  const actor = billing.actor(
    app,
    session,
    guest?.[1],
    jar.dcb_guest,
    request.headers["x-csrf-token"],
    method !== "GET",
  );
  throttle("billing:" + (actor.hostId || actor.guestId), 60);
  if (path === "/api/admin/billing") {
    if (!["GET", "PATCH"].includes(method)) fail(405, "Use GET or PATCH.");
    return {
      value: billing.operator(
        app,
        session,
        method === "PATCH" ? await readBody(request) : undefined,
      ),
    };
  }
  const operation = guest ? guest[2] : path.slice("/api/billing".length);
  if (operation === "/quotes" && method === "POST")
    return {
      status: 201,
      value: {
        order: billing.quote(app, session, actor, await readBody(request)),
      },
    };
  const access = operation.match(/^\/access\/([a-zA-Z0-9-]{1,100})$/);
  if (access && method === "GET")
    return { value: billing.access(app, session, actor, access[1]) };
  const order = operation.match(
    /^\/orders\/([a-f0-9-]{36})(?:\/(checkout|book))?$/,
  );
  if (order) {
    if (!order[2] && method === "GET")
      return { value: { order: await billing.status(actor, order[1]) } };
    if (order[2] === "book" && method === "GET")
      return { value: billing.book(app, session, actor, order[1]) };
    if (order[2] === "checkout" && method === "POST") {
      keys(await readBody(request), []);
      return { value: await billing.checkout(app, session, actor, order[1]) };
    }
  }
  fail(404, "Purchase endpoint not found.");
}
