import { NextResponse } from "next/server";
import { isLiveProductionRuntime, requireLiveProductionRuntime } from "@/lib/paystack-live";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const base = { mode: "production_only", minimumUsd: 2, currency: "USD" };
  if (!isLiveProductionRuntime()) {
    return NextResponse.json({ ...base, enabled: false, message: "Live wallet actions are available only on the published production site." }, { headers: { "Cache-Control": "no-store" } });
  }

  try {
    const { supabase, publicKey } = requireLiveProductionRuntime();
    const { data, error } = await supabase.rpc("wallet_runtime_ready");
    if (error || data !== true) {
      return NextResponse.json({ ...base, enabled: false, message: "Production wallet setup is not complete yet." }, { headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.json({ ...base, enabled: true, publicKey }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ...base, enabled: false, message: "Production wallet setup is not complete yet." }, { headers: { "Cache-Control": "no-store" } });
  }
}
