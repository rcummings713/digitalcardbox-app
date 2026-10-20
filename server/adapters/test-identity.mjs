import { scryptSync, timingSafeEqual } from "node:crypto";
// Seeded local identities only. Managed identity must replace this adapter before production.
export class LocalTestIdentity {
  constructor(repository) {
    this.repository = repository;
  }
  authenticate(email, password) {
    const host = this.repository.findHost(email);
    const actual = scryptSync(
      password,
      host?.password_salt ?? "00000000000000000000000000000000",
      64,
    );
    const expected = Buffer.from(host?.password_hash ?? "00".repeat(64), "hex");
    const matches = timingSafeEqual(actual, expected);
    return host && matches ? host : null;
  }
}
