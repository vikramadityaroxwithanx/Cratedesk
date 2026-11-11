import { config } from "./config";

export const SESSION_COOKIE = "cd_session";

/** Session token = SHA-256 of the credentials. Works in Edge (middleware) and Node. */
export async function sessionToken() {
  const data = new TextEncoder().encode(`${config.user}:${config.password}:cratedesk`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
