import { NextRequest, NextResponse } from "next/server";
import { isAllowedOrigin } from "@/lib/origin-guard";
import { getUserFromRequest } from "@/lib/supabase-auth";
import { makeWalletReference, parseUsdCents, PAYSTACK_MIN_USD_CENTS, requireLiveProductionRuntime, walletErrorResponse } from "@/lib/paystack-live";

export const runtime = "nodejs";

export async function POST(request) {
  if (!isAllowedOrigin(request)) return NextResponse.json({ error: "origin_not_allowed" }, { status: 403, headers: { "Cache-Control": "no-store" } });
  try {
    const { supabase, publicKey } = requireLiveProductionRuntime();
    const { user } = await getUserFromRequest(request);
    if (!user?.id || !user.email) return NextResponse.json({ error: "authentication_required" }, { status: 401, headers: { "Cache-Control": "no-store" } });

    const body = await request.json().catch(() => null);
    const amountCents = parseUsdCents(body?.amountUSD);
    if (amountCents === null || amountCents < PAYSTACK_MIN_USD_CENTS) {
      return NextResponse.json({ error: "minimum_topup_is_2_usd" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }
    const { data: ready, error: readyError } = await supabase.rpc("wallet_runtime_ready");
    if (readyError || ready !== true) return NextResponse.json({ error: "production_wallet_not_ready" }, { status: 503, headers: { "Cache-Control": "no-store" } });

    const reference = makeWalletReference();
    const { error } = await supabase.from("wallet_transactions").insert({
      user_id: user.id,
      type: "deposit",
      amount_cents: amountCents,
      currency: "USD",
      reference,
      status: "pending",
      provider: "paystack",
      customer_email: user.email
    });
    if (error) return NextResponse.json({ error: "wallet_database_unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });

    return NextResponse.json({ reference, amountCents, currency: "USD", email: user.email, publicKey }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return walletErrorResponse(error);
  }
}
