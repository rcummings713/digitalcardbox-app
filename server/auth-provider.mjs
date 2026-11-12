import { fail } from "./domain/events.mjs";

// Managed credentials stay with Supabase. Only server-to-server calls use tokens.
export class AuthProvider {
  constructor({
    url = "",
    publishableKey = "",
    fetcher = (...a) => globalThis.fetch(...a),
  } = {}) {
    this.fetcher = fetcher;
    this.key = publishableKey;
    try {
      const u = new URL(url);
      if (
        u.protocol === "https:" &&
        u.origin === url &&
        !u.username &&
        !u.password
      )
        this.origin = u.origin;
    } catch {}
  }
  get configured() {
    if (!this.origin) return false;
    if (/^sb_publishable_[A-Za-z0-9_-]{10,}$/.test(this.key)) return true;
    try {
      return (
        JSON.parse(Buffer.from(this.key.split(".")[1], "base64url")).role ===
        "anon"
      );
    } catch {
      return false;
    }
  }
  async call(path, data, token, method = data ? "POST" : "GET") {
    if (!this.configured)
      fail(
        503,
        "Account sign-in is not available yet. You can continue without signing in.",
        "auth_not_configured",
      );
    let response;
    try {
      response = await this.fetcher(this.origin + "/auth/v1/" + path, {
        method,
        redirect: "manual",
        signal: AbortSignal.timeout(15000),
        headers: {
          apikey: this.key,
          "Content-Type": "application/json",
          ...(token ? { Authorization: "Bearer " + token } : {}),
        },
        ...(data ? { body: JSON.stringify(data) } : {}),
      });
    } catch {
      fail(
        503,
        "The account service is unavailable. Please try again shortly.",
        "auth_unavailable",
      );
    }
    if (response.status >= 300 && response.status < 400) {
      await response.body?.cancel();
      fail(
        502,
        "The account service returned an unexpected redirect.",
        "auth_unavailable",
      );
    }
    if (response.status === 204) return {};
    const reader = response.body?.getReader();
    let size = 0;
    const chunks = [];
    if (!reader)
      fail(503, "The account service is unavailable.", "auth_unavailable");
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 131072) {
        await reader.cancel();
        fail(502, "The account response was too large.", "auth_unavailable");
      }
      chunks.push(Buffer.from(value));
    }
    let value;
    try {
      value = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
      fail(503, "The account service is unavailable.", "auth_unavailable");
    }
    if (!response.ok) {
      const code = value.error_code || value.code;
      if (response.status === 429)
        fail(
          429,
          "Please wait before trying again. Check your email if you requested a link.",
          "auth_rate_limited",
        );
      if (code === "email_not_confirmed")
        fail(
          403,
          "Confirm your email address before signing in.",
          "email_unverified",
        );
      if (code === "user_already_exists" && path.startsWith("signup"))
        return {};
      if (response.status >= 500)
        fail(503, "The account service is unavailable.", "auth_unavailable");
      fail(
        401,
        "Sign-in could not be completed. Check your details or request a new email link.",
        "invalid_credentials",
      );
    }
    return value;
  }
  async settings() {
    if (!this.configured)
      return { configured: false, email: false, google: false, apple: false };
    if (this.cached && this.cached.until > Date.now()) return this.cached.value;
    try {
      const s = await this.call("settings");
      const value = {
        configured: true,
        email: s.external?.email === true,
        google: s.external?.google === true,
        apple: s.external?.apple === true,
      };
      this.cached = { until: Date.now() + 60000, value };
      return value;
    } catch {
      return {
        configured: true,
        email: false,
        google: false,
        apple: false,
        unavailable: true,
      };
    }
  }
  async verifiedUser(access) {
    const user = await this.call("user", undefined, access);
    if (
      !/^[a-f0-9-]{36}$/i.test(user.id || "") ||
      typeof user.email !== "string" ||
      user.email.length > 254 ||
      !user.email_confirmed_at ||
      !Number.isFinite(Date.parse(user.email_confirmed_at))
    )
      fail(
        403,
        "A verified email address is required to keep a host account.",
        "email_unverified",
      );
    return user;
  }
}
