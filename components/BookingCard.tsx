"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function BookingCard({ price, tourId }: { price: number; tourId: number }) {
  const router = useRouter();
  const idempotencyKey = useRef<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [walletEnabled, setWalletEnabled] = useState(false);
  const [date, setDate] = useState("");
  const [guests, setGuests] = useState("1");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/auth/me", { cache: "no-store" }).then(async (response) => response.ok ? response.json() : null),
      fetch("/api/wallet/config", { cache: "no-store" }).then((response) => response.json())
    ]).then(([auth, config]) => {
      if (!active) return;
      setSignedIn(Boolean(auth?.user?.id));
      setWalletEnabled(Boolean(config?.enabled));
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  async function book(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!signedIn) { router.push("/login"); return; }
    if (!idempotencyKey.current) idempotencyKey.current = crypto.randomUUID();
    setBusy(true);
    setMessage("");
    setError(false);
    try {
      const response = await fetch("/api/bookings/pay-with-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tourId, travelDate: date, guests: Number(guests), idempotencyKey: idempotencyKey.current })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const copy: Record<string, string> = {
          insufficient_wallet_balance: "Your wallet balance is not enough for this booking. Add funds to your wallet first.",
          production_wallet_unavailable: "Wallet bookings are only available on the published production site.",
          travel_date_must_not_be_in_the_past: "Choose today or a future travel date."
        };
        throw new Error(copy[data?.error] || "This booking could not be completed. Please try again.");
      }
      idempotencyKey.current = null;
      setMessage("Your booking is confirmed.");
      router.push("/bookings");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "This booking could not be completed.");
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <aside className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card sm:p-6 lg:sticky lg:top-6">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Starting from</p>
      <div className="mt-2 flex items-baseline gap-2"><span className="text-3xl font-black tracking-tight text-ink">${price.toLocaleString("en-US")}</span><span className="text-sm text-slate-500">USD / person</span></div>
      {!walletEnabled ? <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm leading-5 text-amber-900">Wallet bookings are disabled in Preview. Live wallet bookings are available on the published site only.</p> : !signedIn ? <><p className="mt-2 text-sm text-slate-500">Sign in to book this tour with your wallet.</p><Link href="/login" className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-full bg-[#00A651] px-5 text-sm font-bold text-white">Sign in to continue</Link></> : (
        <form onSubmit={book} className="mt-5 space-y-4">
          <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-600">Travel date</span><input type="date" min={today} required value={date} onChange={(event) => setDate(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-ink outline-none focus:border-safari" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-600">Guests</span><select value={guests} onChange={(event) => setGuests(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-ink outline-none focus:border-safari">{[1, 2, 3, 4, 5, 6].map((count) => <option key={count} value={count}>{count} guest{count === 1 ? "" : "s"}</option>)}</select></label>
          <p className="text-xs text-slate-500">Total: <strong className="text-ink">${(price * Number(guests)).toLocaleString("en-US")} USD</strong></p>
          <button type="submit" disabled={busy || !date} className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#00A651] px-5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Booking…" : "Book with Wallet"}</button>
        </form>
      )}
      {message ? <p role={error ? "alert" : "status"} className={`mt-3 text-sm ${error ? "text-red-700" : "text-emerald-700"}`}>{message}</p> : null}
    </aside>
  );
}
