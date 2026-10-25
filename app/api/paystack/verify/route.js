import { NextRequest, NextResponse } from "next/server";
import { isAllowedOrigin } from "@/lib/origin-guard";
import { getUserFromRequest } from "@/lib/supabase-auth";
import { paystackRequest, requireLiveProductionRuntime, WalletError, walletErrorResponse } from "@/lib/paystack-live";

export const runtime = "nodejs";

export async function POST(request) {
  if (!isAllowedOrigin(request)) return NextResponse.json({ error: "origin_not_allowed" }, { status: 403, headers: { "Cache-Control": "no-store" } });
  try {
    const { supabase, secretKey } = requireLiveProductionRuntime();
    const { user } = await getUserFromRequest(request);
    if (!user?.id) return NextResponse.json({ error: "authentication_required" }, { status: 401, headers: { "Cache-Control": "no-store" } });

    const body = await request.json().catch(() => null);
    const reference = typeof body?.reference === "string" ? body.reference : "";
    if (!/^SBW-[A-Fa-f0-9]{32}$/.test(reference)) return NextResponse.json({ error: "invalid_reference" }, { status: 400, headers: { "Cache-Control": "no-store" } });

    const { data: pending, error: lookupError } = await supabase.from("wallet_transactions")
      .select("user_id,type,amount_cents,currency,status,customer_email")
      .eq("reference", reference).eq("user_id", user.id).eq("type", "deposit").maybeSingle();
    if (lookupError) return NextResponse.json({ error: "wallet_database_unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
    if (!pending) return NextResponse.json({ error: "payment_reference_not_found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
    if (pending.status === "posted") {
      const { data: wallet } = await supabase.from("wallets").select("balance_cents").eq("user_id", user.id).maybeSingle();
      return NextResponse.json({ ok: true, credited: false, status: "posted", balance: Number(wallet?.balance_cents || 0) / 100, currency: "USD" }, { headers: { "Cache-Control": "no-store" } });
    }
    if (pending.status !== "pending") return NextResponse.json({ error: "payment_not_pending" }, { status: 409, headers: { "Cache-Control": "no-store" } });

    const provider = await paystackRequest(secretKey, `/transaction/verify/${encodeURIComponent(reference)}`, { method: "GET" });
    const expectedCents = Number(pending.amount_cents);
    if (provider.reference !== reference || provider.status !== "success" || provider.domain !== "live" || provider.currency !== "USD" || !Number.isSafeInteger(provider.amount) || provider.amount !== expectedCents || provider.customer?.email?.toLowerCase() !== pending.customer_email?.toLowerCase()) {
      throw new WalletError("payment_not_verified", 409);
    }

    const { data: result, error: creditError } = await supabase.rpc("credit_wallet_topup", {
      p_user_id: user.id,
      p_reference: reference,
      p_amount_cents: provider.amount,
      p_currency: provider.currency,
      p_domain: provider.domain
    });
    if (creditError || !result) return NextResponse.json({ error: "wallet_credit_failed" }, { status: 503, headers: { "Cache-Control": "no-store" } });
    return NextResponse.json({ ok: true, credited: Boolean(result.credited), status: "posted", balance: Number(result.balance_cents || 0) / 100, currency: "USD" }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return walletErrorResponse(error, "payment_verification_failed");
  }
}
