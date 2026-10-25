import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase-auth";
import { requireLiveProductionRuntime, walletErrorResponse } from "@/lib/paystack-live";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const { supabase } = requireLiveProductionRuntime();
    const { user } = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "authentication_required" }, { status: 401, headers: { "Cache-Control": "no-store" } });

    const { error: seedError } = await supabase.from("wallets").upsert({ user_id: user.id, balance_cents: 0, currency: "USD" }, { onConflict: "user_id", ignoreDuplicates: true });
    if (seedError) return NextResponse.json({ error: "wallet_database_unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });

    const [{ data: wallet, error: walletError }, { data: rows, error: historyError }] = await Promise.all([
      supabase.from("wallets").select("balance_cents,currency").eq("user_id", user.id).maybeSingle(),
      supabase.from("wallet_transactions").select("id,type,amount_cents,currency,status,reference,created_at,posted_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50)
    ]);
    if (walletError || historyError) return NextResponse.json({ error: "wallet_database_unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });

    return NextResponse.json({
      balance: Number(wallet?.balance_cents || 0) / 100,
      currency: "USD",
      transactions: (rows || []).map((row) => ({
        id: row.id,
        type: row.type,
        amount: Number(row.amount_cents) / 100,
        currency: row.currency,
        status: row.status,
        reference: row.reference,
        createdAt: row.created_at,
        postedAt: row.posted_at
      }))
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error?.code === "production_wallet_unavailable") return walletErrorResponse(error);
    return walletErrorResponse(error, "wallet_service_unavailable");
  }
}
