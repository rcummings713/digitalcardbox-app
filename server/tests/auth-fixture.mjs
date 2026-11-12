import { randomUUID } from "node:crypto";
export function authFixture() {
  const users = new Map(),
    tokens = new Map(),
    refreshes = new Map(),
    calls = [];
  const configuration = {
    external: { email: true, google: true, apple: true },
  };
  let serial = 0;
  function add(email = "owner@example.invalid", verified = true) {
    const user = {
      id: randomUUID(),
      email,
      email_confirmed_at: verified ? "2026-10-18T16:00:00Z" : null,
      user_metadata: { full_name: "Account Owner", role: "operator" },
      password: "Correct managed password!",
    };
    users.set(email, user);
    return user;
  }
  const initial = add();
  function session(user = initial) {
    const access_token = "access_fixture_" + ++serial,
      refresh_token = "refresh_fixture_" + serial;
    tokens.set(access_token, user);
    refreshes.set(refresh_token, user);
    return { access_token, refresh_token, expires_in: 3600, user };
  }
  const fetcher = async (input, init = {}) => {
    const url = new URL(input),
      path = url.pathname.replace("/auth/v1/", ""),
      body = init.body ? JSON.parse(init.body) : null;
    calls.push({ path, method: init.method, body, headers: init.headers });
    const no = () =>
      Response.json({ error_code: "invalid_credentials" }, { status: 401 });
    if (path === "settings") return Response.json(configuration);
    if (path === "signup") {
      if (!users.has(body.email)) {
        const u = add(body.email, false);
        u.password = body.password;
        u.user_metadata.full_name = body.data.full_name;
      }
      return Response.json({});
    }
    if (path === "token") {
      const grant = url.searchParams.get("grant_type");
      let user;
      if (grant === "password") {
        user = users.get(body.email);
        if (!user || user.password !== body.password) return no();
        if (!user.email_confirmed_at)
          return Response.json(
            { error_code: "email_not_confirmed" },
            { status: 400 },
          );
      } else if (grant === "refresh_token")
        user = refreshes.get(body.refresh_token);
      else if (
        grant === "pkce" &&
        body.auth_code === "valid-oauth-code" &&
        body.code_verifier
      )
        user = initial;
      return user ? Response.json(session(user)) : no();
    }
    if (path === "user") {
      const user = tokens.get(
        init.headers.Authorization?.replace("Bearer ", ""),
      );
      if (!user) return no();
      if (init.method === "PUT") {
        user.password = body.password;
        return Response.json(user);
      }
      const { password, ...safe } = user;
      return Response.json(safe);
    }
    if (path === "recover") return Response.json({});
    if (path === "verify") {
      const user = initial;
      user.email_confirmed_at = "2026-10-18T16:00:00Z";
      return Response.json(session(user));
    }
    if (path === "logout") {
      tokens.delete(init.headers.Authorization?.replace("Bearer ", ""));
      return new Response(null, { status: 204 });
    }
    return no();
  };
  return {
    users,
    tokens,
    refreshes,
    calls,
    configuration,
    initial,
    add,
    session,
    options: {
      url: "https://auth.fixture.invalid",
      publishableKey: "sb_publishable_fixture_key_only",
      siteOrigin: "http://localhost:4175",
      fetcher,
    },
  };
}
