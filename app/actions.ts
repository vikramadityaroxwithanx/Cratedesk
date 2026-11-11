"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { SESSION_COOKIE, sessionToken } from "@/lib/auth";
import { config } from "@/lib/config";
import {
  STATUSES, addPricePoint, createListing, createOffer, createWant, deleteListing, deleteWant,
  getWant, setOfferStatus, updateListing, updateWant,
} from "@/lib/repo";

async function requireAuth() {
  const jar = await cookies();
  if (jar.get(SESSION_COOKIE)?.value !== (await sessionToken())) redirect("/login");
}

const str = (f: FormData, k: string) => {
  const v = f.get(k);
  if (v == null) return undefined;
  const s = String(v).trim();
  return s === "" ? null : s;
};
const num = (f: FormData, k: string) => {
  const v = str(f, k);
  if (v === undefined) return undefined;
  if (v === null) return null;
  const n = Math.round(Number(v.replace(/[₹,\s]/g, "")));
  return Number.isFinite(n) ? n : null;
};

function listingFromForm(f: FormData) {
  const status = str(f, "status");
  return {
    title: str(f, "title") ?? undefined,
    platform: str(f, "platform"),
    region: str(f, "region"),
    condition: str(f, "condition"),
    completeness: str(f, "completeness"),
    price_inr: num(f, "price_inr"),
    fair_low_inr: num(f, "fair_low_inr"),
    fair_high_inr: num(f, "fair_high_inr"),
    source: str(f, "source"),
    source_url: str(f, "source_url"),
    seller: str(f, "seller"),
    location: str(f, "location"),
    claude_notes: str(f, "claude_notes"),
    my_notes: str(f, "my_notes"),
    max_bid_inr: num(f, "max_bid_inr"),
    status: status && (STATUSES as readonly string[]).includes(status) ? (status as (typeof STATUSES)[number]) : undefined,
  };
}

// ---------- auth ----------

export async function login(_: unknown, f: FormData) {
  if (str(f, "user") !== config.user || str(f, "password") !== config.password) {
    return { error: "Wrong username or password." };
  }
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await sessionToken(), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });
  const next = str(f, "next");
  redirect(next && next.startsWith("/") ? next : "/");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}

// ---------- listings ----------

export async function saveListing(f: FormData) {
  await requireAuth();
  const id = Number(f.get("id"));
  await updateListing(id, listingFromForm(f), "human", str(f, "price_note") ?? "Edited by owner");
  revalidatePath("/");
  revalidatePath(`/listing/${id}`);
  redirect(`/listing/${id}?saved=1`);
}

export async function quickStatus(f: FormData) {
  await requireAuth();
  const id = Number(f.get("id"));
  const status = str(f, "status");
  if (status && (STATUSES as readonly string[]).includes(status)) {
    await updateListing(id, { status: status as (typeof STATUSES)[number] }, "human");
  }
  revalidatePath("/");
}

export async function newListing(f: FormData) {
  await requireAuth();
  const data = listingFromForm(f);
  if (!data.title) return;
  const row = await createListing({ ...data, title: data.title }, "human");
  revalidatePath("/");
  redirect(`/listing/${row.id}`);
}

export async function logPrice(f: FormData) {
  await requireAuth();
  const id = Number(f.get("id"));
  const price = num(f, "price_inr");
  if (price != null) await addPricePoint(id, price, str(f, "note") ?? null, "human");
  revalidatePath(`/listing/${id}`);
  revalidatePath("/");
}

export async function removeListing(f: FormData) {
  await requireAuth();
  await deleteListing(Number(f.get("id")), "human");
  revalidatePath("/");
  redirect("/");
}

// ---------- wants ----------

function wantFromForm(f: FormData) {
  return {
    title: str(f, "title") ?? undefined,
    platform: str(f, "platform"),
    region: str(f, "region"),
    min_condition: str(f, "min_condition"),
    max_price_inr: num(f, "max_price_inr"),
    notes: str(f, "notes"),
    active: f.has("active_present") ? f.get("active") === "on" : undefined,
  };
}

export async function saveWant(f: FormData) {
  await requireAuth();
  const id = Number(f.get("id"));
  await updateWant(id, wantFromForm(f), "human");
  revalidatePath("/wants");
  revalidatePath(`/w/${config.handle}`);
}

export async function newWant(f: FormData) {
  await requireAuth();
  const data = wantFromForm(f);
  if (!data.title) return;
  await createWant({ ...data, title: data.title }, "human");
  revalidatePath("/wants");
  revalidatePath(`/w/${config.handle}`);
}

export async function removeWant(f: FormData) {
  await requireAuth();
  await deleteWant(Number(f.get("id")), "human");
  revalidatePath("/wants");
  revalidatePath(`/w/${config.handle}`);
}

export async function markOffer(f: FormData) {
  await requireAuth();
  const status = str(f, "status");
  if (status === "accepted" || status === "declined" || status === "new") {
    await setOfferStatus(Number(f.get("id")), status, "human");
  }
  revalidatePath("/wants");
}

// ---------- public ----------

export async function submitOffer(_: unknown, f: FormData) {
  const wantId = Number(f.get("want_id"));
  const want = await getWant(wantId);
  const seller_name = str(f, "seller_name");
  const contact = str(f, "contact");
  if (!want || !want.active) return { error: "This item is no longer on the list." };
  if (!seller_name || !contact) return { error: "Please add your name and a phone number or email." };
  if (String(f.get("website") ?? "") !== "") return { ok: true }; // honeypot
  await createOffer({
    want_id: wantId,
    seller_name: seller_name.slice(0, 80),
    contact: contact.slice(0, 120),
    price_inr: num(f, "price_inr") ?? null,
    condition: str(f, "condition") ?? null,
    message: (str(f, "message") ?? null)?.slice(0, 1000) ?? null,
  });
  revalidatePath("/wants");
  return { ok: true };
}
