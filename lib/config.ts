export const config = {
  user: process.env.DEMO_USER || "volopay",
  password: process.env.DEMO_PASSWORD || "retro2026",
  handle: (process.env.COLLECTOR_HANDLE || "vikram").toLowerCase(),
  name: process.env.COLLECTOR_NAME || "Vikram",
};

/** Absolute base URL of the deployment, derived from the incoming request. */
export function baseUrlFrom(headers: Headers) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const host = headers.get("x-forwarded-host") || headers.get("host") || "localhost:3000";
  const proto = headers.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
