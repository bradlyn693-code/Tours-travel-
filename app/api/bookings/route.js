import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase-auth";
import { requireLiveProductionRuntime, walletErrorResponse } from "@/lib/paystack-live";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const { supabase } = requireLiveProductionRuntime();
    const { user } = await getUserFromRequest(request);
    if (!user?.id) return NextResponse.json({ error: "authentication_required" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    const { data, error } = await supabase.from("bookings").select("id,tour_id,tour_title,location,travel_date,guests,amount_cents,currency,status,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);
    if (error) return NextResponse.json({ error: "booking_history_unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
    return NextResponse.json({ bookings: (data || []).map((row) => ({ id: row.id, tourId: row.tour_id, title: row.tour_title, location: row.location, travelDate: row.travel_date, guests: row.guests, amount: Number(row.amount_cents) / 100, currency: row.currency, status: row.status, createdAt: row.created_at })) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return walletErrorResponse(error, "booking_history_unavailable");
  }
}
