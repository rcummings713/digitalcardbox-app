import { fail, keys } from "./domain/events.mjs";

export async function authHttp({
  auth,
  app,
  session,
  jar,
  path,
  method,
  request,
  response,
  readBody,
  throttle,
  cookie,
  secureCookies,
}) {
  if (!path.startsWith("/api/auth/")) return false;
  const operation = path.slice("/api/auth/".length);
  if (operation === "config" && method === "GET") {
    response.statusCode = 200;
    response.end(JSON.stringify(await auth.provider.settings()));
    return true;
  }
  if (method !== "POST") fail(405, "Use POST for account actions.");
  throttle("auth:" + request.socket.remoteAddress, 12, 15 * 60000);
  const input = await readBody(request);
  let value;
  if (operation === "register") value = await auth.register(input);
  else if (operation === "login") value = await auth.login(input, session);
  else if (operation === "oauth") {
    const flow = await auth.begin(input, session);
    response.setHeader(
      "Set-Cookie",
      cookie(
        "dcb_auth_flow",
        flow.token,
        "/api/auth",
        secureCookies,
        600,
      ).replace("SameSite=Strict", "SameSite=Lax"),
    );
    value = { url: flow.url };
  } else if (operation === "callback")
    value = await auth.callback(input, jar.dcb_auth_flow, session);
  else if (operation === "recover") value = await auth.recover(input);
  else if (operation === "reset") value = await auth.reset(input);
  else if (operation === "verify") {
    keys(input, ["tokenHash"]);
    if (
      typeof input.tokenHash !== "string" ||
      !/^[A-Za-z0-9_-]{20,256}$/.test(input.tokenHash)
    )
      fail(422, "Open a valid email confirmation link.");
    await auth.provider.call("verify", {
      token_hash: input.tokenHash,
      type: "signup",
    });
    value = { message: "Your email is confirmed. You can now sign in." };
  } else fail(404, "Account action not found.");
  if (value.token) {
    if (jar.dcb_host)
      app.repo.dropHostSession(
        (await import("./domain/identity.mjs")).hash(jar.dcb_host),
      );
    response.setHeader("Set-Cookie", [
      cookie("dcb_host", value.token, "/api", secureCookies, 604800),
      cookie("dcb_auth_flow", "", "/api/auth", secureCookies, 0).replace(
        "SameSite=Strict",
        "SameSite=Lax",
      ),
    ]);
    const { token, ...safe } = value;
    value = safe;
  }
  response.statusCode = 200;
  response.end(JSON.stringify(value));
  return true;
}
