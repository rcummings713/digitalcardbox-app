import { createHash, randomBytes } from "node:crypto";
export const hash = (value) => createHash("sha256").update(value).digest("hex");
export const secret = () => randomBytes(32).toString("base64url");
export const publicHost = (host) => ({
  id: host.id,
  name: host.name,
  email: host.email,
  role: host.role,
  reducedMotion: !!host.reduced_motion,
});
