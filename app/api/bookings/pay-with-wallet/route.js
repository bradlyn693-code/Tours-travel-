import { NextRequest, NextResponse } from "next/server";
import tourData from "@/data/tours.json";
import { isAllowedOrigin } from "@/lib/origin-guard";
import { getUserFromRequest } from "@/lib/supabase-auth";
import { requireLiveProductionRuntime, walletErrorResponse } from "@/lib/paystack-live";

export const runtime = "nodejs";
const tours = tourData;

export async function POST(request) {
  if (!isAllowedOrigin(request)) return NextResponse.json({ error: "origin_not_allowed" }, { status: 403, headers: { "Cache-Control": "no-store" } });
  try {
    const { supabase } = requireLiveProductionRuntime();
    const { user } = await getUserFromRequest(request);
    if (!user?.id) return NextResponse.json({ error: "authentication_required" }, { status: 401, headers: { "Cache-Control": "no-store" } });

    const body = await request.json().catch(() => null);
    const tourId = Number(body?.tourId);
    const guests = Number(body?.guests);
    const travelDate = typeof body?.travelDate === "string" ? body.travelDate : "";
    const idempotencyKey = typeof body?.idempotencyKey === "string" ? body.idempotencyKey : "";
    if (!Number.isInteger(tourId) || !Number.isInteger(guests) || guests < 1 || guests > 6) return NextResponse.json({ error: "invalid_booking_details" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(travelDate) || Number.isNaN(Date.parse(`${travelDate}T00:00:00Z`)) || new Date(`${travelDate}T00:00:00Z`).toISOString().slice(0, 10) !== travelDate) return NextResponse.json({ error: "invalid_travel_date" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    const requestedDate = new Date(`${travelDate}T00:00:00Z`);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    if (requestedDate < today) return NextResponse.json({ error: "travel_date_must_not_be_in_the_past" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    if (!/^[A-Fa-f0-9-]{36}$/.test(idempotencyKey)) return NextResponse.json({ error: "invalid_idempotency_key" }, { status: 400, headers: { "Cache-Control": "no-store" } });

    const tour = tours.find((item) => item.id === tourId);
    if (!tour || !Number.isFinite(Number(tour.price))) return NextResponse.json({ error: "tour_not_found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
    const amountCents = Math.round(Number(tour.price) * 100) * guests;
    if (!Number.isSafeInteger(amountCents) || amountCents <= 0) return NextResponse.json({ error: "invalid_tour_price" }, { status: 400, headers: { "Cache-Control": "no-store" } });

    const { data, error } = await supabase.rpc("book_tour_with_wallet", {
      p_user_id: user.id,
      p_tour_id: tour.id,
      p_tour_title: tour.title,
      p_location: tour.location,
      p_travel_date: travelDate,
      p_guests: guests,
      p_amount_cents: amountCents,
      p_idempotency_key: idempotencyKey
    });
    if (error) {
      if (error.message?.includes("insufficient_wallet_balance")) return NextResponse.json({ error: "insufficient_wallet_balance" }, { status: 402, headers: { "Cache-Control": "no-store" } });
      if (error.message?.includes("idempotency_key_conflict")) return NextResponse.json({ error: "idempotency_key_conflict" }, { status: 409, headers: { "Cache-Control": "no-store" } });
      return NextResponse.json({ error: "booking_unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.json({ ok: true, bookingId: data?.booking_id, balance: Number(data?.balance_cents || 0) / 100, currency: "USD" }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error?.code === "production_wallet_unavailable") return walletErrorResponse(error);
    return walletErrorResponse(error, "booking_unavailable");
  }
}
