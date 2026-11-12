import { createHash, timingSafeEqual } from "node:crypto";
export class HostedReviewIdentity {
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
      !["review-host", "review-other", "review-operator"].includes(host.id) ||
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
