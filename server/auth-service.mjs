import { createHash, randomUUID } from "node:crypto";
import { AuthProvider } from "./auth-provider.mjs";
import { fail, keys, text } from "./domain/events.mjs";
import { hash, secret, publicHost } from "./domain/identity.mjs";

export const authOptions = (env) => ({
  url: env.SUPABASE_URL || "",
  publishableKey: env.SUPABASE_PUBLISHABLE_KEY || "",
  siteOrigin: env.DCB_AUTH_ORIGIN || env.BILLING_RETURN_ORIGIN || "",
});
export function authReturn(value) {
  if (
    typeof value !== "string" ||
    value.length > 1500 ||
    /[\\\r\n]/.test(value)
  )
    return "/workspace";
  try {
    const u = new URL(value, "https://return.invalid");
    if (
      u.origin === "https://return.invalid" &&
      /^\/(?:workspace(?:\/|$)|invitations$|cards$|save-the-dates$)/.test(
        u.pathname,
      )
    )
      return u.pathname + u.search;
  } catch {}
  return "/workspace";
}
export class AuthService {
  constructor(repo, { siteOrigin = "", ...options } = {}) {
    this.repo = repo;
    this.provider = new AuthProvider(options);
    this.pending = new Map();
    try {
      const u = new URL(siteOrigin);
      if (
        u.origin === siteOrigin &&
        (u.protocol === "https:" ||
          (u.protocol === "http:" &&
            ["localhost", "127.0.0.1"].includes(u.hostname)))
      )
        this.origin = u.origin;
    } catch {}
  }
  credentials(input, signup = false) {
    keys(input, signup ? ["email", "password", "name"] : ["email", "password"]);
    const email = text(input.email, "email address", 254).toLowerCase();
    // Preserve the exact password; leading/trailing whitespace is significant.
    const password = input.password;
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      typeof password !== "string" ||
      password.length < (signup ? 12 : 1) ||
      password.length > 128
    )
      fail(
        422,
        signup
          ? "Enter a valid email and a password of 12–128 characters."
          : "Enter your email and password.",
      );
    return {
      email,
      password,
      ...(signup ? { name: text(input.name, "name", 80) } : {}),
    };
  }
  async register(input) {
    const { email, password, name } = this.credentials(input, true);
    await this.provider.call(
      "signup?redirect_to=" +
        encodeURIComponent(this.origin + "/auth/confirmed"),
      { email, password, data: { full_name: name } },
    );
    return {
      message:
        "Check your email to confirm your account, then sign in. If you already have an account, you can sign in or reset your password.",
    };
  }
  async login(input, session) {
    const creds = this.credentials(input);
    const tokens = await this.provider.call("token?grant_type=password", creds);
    return this.finish(tokens, session);
  }
  validateTokens(tokens) {
    if (
      typeof tokens.access_token !== "string" ||
      tokens.access_token.length < 10 ||
      tokens.access_token.length > 16384 ||
      typeof tokens.refresh_token !== "string" ||
      tokens.refresh_token.length < 5 ||
      tokens.refresh_token.length > 4096 ||
      !Number.isInteger(tokens.expires_in) ||
      tokens.expires_in < 60 ||
      tokens.expires_in > 86400
    )
      fail(
        503,
        "The account session could not be verified.",
        "auth_unavailable",
      );
    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in,
    };
  }
  async finish(tokens, prior, recovery = false) {
    tokens = this.validateTokens(tokens);
    const user = await this.provider.verifiedUser(tokens.access_token);
    return this.repo.transaction(() => {
      let link = this.repo.one(
        "SELECT * FROM auth_subjects WHERE issuer=? AND subject=?",
        this.provider.origin,
        user.id,
      );
      const priorHost = prior?.host;
      if (!link) {
        let id = randomUUID();
        const eligible =
          priorHost?.id.startsWith("visitor-") &&
          priorHost.role === "host" &&
          !this.repo.one(
            "SELECT 1 FROM auth_subjects WHERE host_id=?",
            priorHost.id,
          );
        if (eligible) id = priorHost.id;
        const email = user.email.toLowerCase();
        const collision = this.repo.one(
          "SELECT id FROM hosts WHERE email=? COLLATE NOCASE AND id<>?",
          email,
          id,
        );
        if (collision)
          fail(
            409,
            "This email is associated with another account. Contact support; accounts are never merged by email.",
          );
        const name =
          typeof user.user_metadata?.full_name === "string"
            ? user.user_metadata.full_name.trim().slice(0, 80)
            : "My account";
        if (eligible)
          this.repo.run(
            "UPDATE hosts SET email=?,name=? WHERE id=?",
            email,
            name || "My account",
            id,
          );
        else
          this.repo.run(
            "INSERT INTO hosts(id,email,name,role,password_salt,password_hash) VALUES(?,?,?,'host',?,?)",
            id,
            email,
            name || "My account",
            secret(),
            secret(),
          );
        this.repo.run(
          "INSERT INTO auth_subjects VALUES(?,?,?,?,?)",
          this.provider.origin,
          user.id,
          id,
          user.email_confirmed_at,
          this.repo.now(),
        );
        link = { host_id: id };
      }
      const host = this.repo.host(link.host_id);
      if (host.role !== "host")
        fail(403, "Customer sign-in cannot grant administrator access.");
      // Do not silently discard a temporary workspace when signing into a
      // different existing account. A new account can adopt its own live cookie.
      if (
        priorHost?.id.startsWith("visitor-") &&
        !priorHost.registered &&
        priorHost.id !== host.id &&
        this.repo.one(
          "SELECT 1 FROM events WHERE owner_id=? LIMIT 1",
          priorHost.id,
        )
      )
        fail(
          409,
          "This browser has a temporary workspace. Keep it open and sign into your existing account in another browser.",
        );
      const email = user.email.toLowerCase();
      if (
        this.repo.one(
          "SELECT 1 FROM hosts WHERE email=? COLLATE NOCASE AND id<>?",
          email,
          host.id,
        )
      )
        fail(409, "Your verified email needs account support.");
      this.repo.run("UPDATE hosts SET email=? WHERE id=?", email, host.id);
      const token = secret(),
        csrfToken = secret();
      this.repo.putHostSession(
        hash(token),
        host.id,
        csrfToken,
        new Date(this.repo.clock().getTime() + 7 * 86400000).toISOString(),
      );
      this.repo.run(
        "INSERT INTO auth_sessions VALUES(?,?,?,?,?,?,?)",
        hash(token),
        this.repo.encrypt(JSON.stringify(tokens)),
        this.provider.origin,
        user.id,
        new Date(
          this.repo.clock().getTime() + tokens.expires_in * 1000,
        ).toISOString(),
        this.repo.now(),
        Number(recovery),
      );
      return { token, csrfToken, account: publicHost(this.repo.host(host.id)) };
    });
  }
  async resolve(app, token) {
    const session = app.session(token);
    if (!session) return null;
    const key = hash(token),
      bridge = this.repo.one(
        "SELECT * FROM auth_sessions WHERE token_hash=?",
        key,
      );
    if (!bridge || bridge.recovery) return bridge?.recovery ? null : session;
    if (!this.pending.has(key)) {
      const work = (async () => {
        let tokens = JSON.parse(this.repo.decrypt(bridge.tokens_ciphertext));
        try {
          let expires = bridge.access_expires_at;
          if (Date.parse(expires) <= this.repo.clock().getTime() + 60000) {
            tokens = await this.provider.call(
              "token?grant_type=refresh_token",
              { refresh_token: tokens.refresh_token },
            );
            tokens = this.validateTokens(tokens);
            expires = new Date(
              this.repo.clock().getTime() + tokens.expires_in * 1000,
            ).toISOString();
          } else if (
            Date.parse(bridge.checked_at) >
            this.repo.clock().getTime() - 60000
          )
            return session;
          const user = await this.provider.verifiedUser(tokens.access_token);
          if (
            user.id !== bridge.subject ||
            bridge.issuer !== this.provider.origin
          )
            fail(401, "Please sign in again.", "invalid_credentials");
          this.repo.run(
            "UPDATE auth_sessions SET tokens_ciphertext=?,access_expires_at=?,checked_at=? WHERE token_hash=?",
            this.repo.encrypt(JSON.stringify(tokens)),
            expires,
            this.repo.now(),
            key,
          );
          return app.session(token);
        } catch (e) {
          if ([401, 403].includes(e.status)) {
            this.repo.dropHostSession(key);
            return null;
          }
          throw e;
        }
      })();
      this.pending.set(key, work);
      work.finally(() => this.pending.delete(key)).catch(() => {});
    }
    return this.pending.get(key);
  }
  async begin(input, prior) {
    keys(input, ["provider", "returnTo"]);
    if (!["google", "apple"].includes(input.provider))
      fail(422, "Choose Google or Apple.");
    const settings = await this.provider.settings();
    if (!settings[input.provider] || !this.origin)
      fail(
        503,
        "This sign-in option is not available yet.",
        "auth_not_configured",
      );
    const token = secret(),
      verifier = secret() + secret(),
      next = authReturn(input.returnTo);
    this.repo.run(
      "DELETE FROM auth_flows WHERE expires_at<=?",
      this.repo.now(),
    );
    this.repo.run(
      "INSERT INTO auth_flows VALUES(?,?,?,?,?,?)",
      hash(token),
      this.repo.encrypt(verifier),
      input.provider,
      next,
      prior?.host?.id || null,
      new Date(this.repo.clock().getTime() + 600000).toISOString(),
    );
    const url = new URL(this.provider.origin + "/auth/v1/authorize");
    url.searchParams.set("provider", input.provider);
    url.searchParams.set(
      "redirect_to",
      this.origin + "/auth/callback?state=" + token,
    );
    url.searchParams.set(
      "code_challenge",
      createHash("sha256").update(verifier).digest("base64url"),
    );
    url.searchParams.set("code_challenge_method", "s256");
    return { token, url: url.href };
  }
  async callback(input, cookie, prior) {
    keys(input, ["code", "state"]);
    if (
      typeof cookie !== "string" ||
      cookie !== input.state ||
      !/^[A-Za-z0-9_-]{43}$/.test(cookie) ||
      typeof input.code !== "string" ||
      !input.code ||
      input.code.length > 2048
    )
      fail(
        400,
        "This sign-in link is invalid. Start sign-in again.",
        "oauth_state_invalid",
      );
    const flow = this.repo.transaction(() => {
      const value = this.repo.one(
        "SELECT * FROM auth_flows WHERE token_hash=? AND expires_at>?",
        hash(cookie),
        this.repo.now(),
      );
      if (!value)
        fail(
          400,
          "This sign-in link expired or was already used. Start again.",
          "oauth_state_invalid",
        );
      this.repo.run("DELETE FROM auth_flows WHERE token_hash=?", hash(cookie));
      return value;
    });
    if ((flow.prior_host_id || null) !== (prior?.host?.id || null))
      fail(
        403,
        "Your browser account changed during sign-in. Please start again.",
      );
    const tokens = await this.provider.call("token?grant_type=pkce", {
      auth_code: input.code,
      code_verifier: this.repo.decrypt(flow.verifier_ciphertext),
    });
    return {
      ...(await this.finish(tokens, prior)),
      returnTo: flow.return_path,
    };
  }
  async recover(input) {
    keys(input, ["email"]);
    const email = text(input.email, "email address", 254).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      fail(422, "Enter your email address.");
    await this.provider.call(
      "recover?redirect_to=" +
        encodeURIComponent(this.origin + "/auth/recover"),
      { email },
    );
    return {
      message:
        "If that email has an account, you will receive a password-reset link.",
    };
  }
  async reset(input) {
    keys(input, ["tokenHash", "password"]);
    if (
      typeof input.tokenHash !== "string" ||
      !/^[A-Za-z0-9_-]{20,256}$/.test(input.tokenHash) ||
      typeof input.password !== "string" ||
      input.password.length < 12 ||
      input.password.length > 128
    )
      fail(422, "Use a valid reset link and a password of 12–128 characters.");
    const tokens = await this.provider.call("verify", {
      token_hash: input.tokenHash,
      type: "recovery",
    });
    this.validateTokens(tokens);
    const user = await this.provider.verifiedUser(tokens.access_token);
    await this.provider.call(
      "user",
      { password: input.password },
      tokens.access_token,
      "PUT",
    );
    // Password recovery revokes all of this provider subject's local bridges.
    const rows = this.repo.all(
      "SELECT token_hash FROM auth_sessions WHERE issuer=? AND subject=?",
      this.provider.origin,
      user.id,
    );
    for (const row of rows) this.repo.dropHostSession(row.token_hash);
    try {
      await this.provider.call("logout?scope=global", {}, tokens.access_token);
    } catch {}
    return {
      message: "Your password was updated. Sign in with your new password.",
    };
  }
  async logout(token) {
    if (!token) return;
    const key = hash(token),
      row = this.repo.one(
        "SELECT tokens_ciphertext FROM auth_sessions WHERE token_hash=?",
        key,
      );
    this.repo.dropHostSession(key);
    if (row)
      try {
        const tokens = JSON.parse(this.repo.decrypt(row.tokens_ciphertext));
        await this.provider.call(
          "logout?scope=local",
          {},
          tokens.access_token,
          "POST",
          3000,
        );
      } catch {}
  }
}
