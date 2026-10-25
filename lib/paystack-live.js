import "server-only";
import { randomUUID } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const PAYSTACK_MIN_USD_CENTS = 200;

export class WalletError extends Error {
  constructor(code, status = 400) {
    super(code);
    this.name = "WalletError";
    this.code = code;
    this.status = status;
  }
}

export function parseUsdCents(value) {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const input = String(value).trim();
  if (!/^\d{1,9}(?:\.\d{1,2})?$/.test(input)) return null;
  const [whole, fraction = ""] = input.split(".");
  const cents = Number(whole) * 100 + Number((fraction + "00").slice(0, 2));
  if (!Number.isSafeInteger(cents) || cents <= 0) return null;
  return cents;
}

export function makeWalletReference() {
  return `SBW-${randomUUID().replaceAll("-", "")}`;
}

function getLivePublicKey() {
  return process.env["NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY"] || "";
}

export function isLiveProductionRuntime() {
  const vercelEnvironment = process.env.VERCEL_ENV;
  return process.env.NODE_ENV === "production" &&
    (!vercelEnvironment || vercelEnvironment === "production") &&
    process.env.SUPABASE_ENVIRONMENT === "production" &&
    /^pk_live_[A-Za-z0-9]+$/.test(getLivePublicKey()) &&
    /^sk_live_[A-Za-z0-9]+$/.test(process.env.PAYSTACK_LIVE_SECRET_KEY || "");
}

export function requireLiveProductionRuntime() {
  if (!isLiveProductionRuntime()) throw new WalletError("production_wallet_unavailable", 403);
  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch {
    throw new WalletError("production_supabase_unavailable", 503);
  }
  return { supabase, publicKey: getLivePublicKey(), secretKey: process.env.PAYSTACK_LIVE_SECRET_KEY };
}

export async function paystackRequest(secretKey, path, options = {}) {
  const response = await fetch(`https://api.paystack.co${path}`, {
    ...options,
    cache: "no-store",
    headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json", ...(options.headers || {}) },
    signal: AbortSignal.timeout(12000)
  });
  let result;
  try { result = await response.json(); } catch { throw new WalletError("paystack_unavailable", 502); }
  if (!response.ok || result?.status !== true || !result?.data) throw new WalletError("paystack_unavailable", 502);
  return result.data;
}

export function walletErrorResponse(error, fallback = "wallet_unavailable") {
  const status = Number.isInteger(error?.status) ? error.status : 503;
  const code = typeof error?.code === "string" ? error.code : fallback;
  return Response.json({ error: code }, { status, headers: { "Cache-Control": "no-store" } });
}
