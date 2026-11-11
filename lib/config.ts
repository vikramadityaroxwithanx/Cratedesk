export const config = {
  brand: "CrateDesk",
  user: process.env.DEMO_USER || "volopay",
  password: process.env.DEMO_PASSWORD || "crate2026",
  handle: (process.env.DEALER_HANDLE || "groove-and-pixel").toLowerCase(),
  business: process.env.DEALER_NAME || "Groove & Pixel Collectibles (demo)",
  city: process.env.DEALER_CITY || "Bengaluru",
  /** Gross margin the dealer wants on resale, e.g. 0.3 = 30%. */
  targetMargin: Number(process.env.TARGET_MARGIN || "0.3"),
};

/** Absolute base URL of the deployment, derived from the incoming request. */
export function baseUrlFrom(headers: Headers) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const host = headers.get("x-forwarded-host") || headers.get("host") || "localhost:3000";
  const proto = headers.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
