"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";

type Booking = { id: string; title: string; location: string; travelDate: string; guests: number; amount: number; status: string };

export function BookingsClient() {
  const [signedIn, setSignedIn] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/auth/me", { cache: "no-store" }).then(async (response) => response.ok ? response.json() : null),
      fetch("/api/wallet/config", { cache: "no-store" }).then((response) => response.json())
    ]).then(async ([auth, config]) => {
      if (!active) return;
      setSignedIn(Boolean(auth?.user?.id));
      setEnabled(Boolean(config?.enabled));
      if (auth?.user?.id && config?.enabled) {
        const response = await fetch("/api/bookings", { cache: "no-store" });
        const data = await response.json().catch(() => ({}));
        if (active && response.ok) setBookings(Array.isArray(data.bookings) ? data.bookings : []);
      }
    }).catch(() => undefined).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
    <span className="text-xs font-bold uppercase tracking-[0.15em] text-safari">SafariBookings</span>
    <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">My bookings</h1>
    {loading ? <p className="mt-6 text-sm text-slate-500">Loading your bookings…</p> : !signedIn ? <div className="mt-6 rounded-2xl bg-white p-6 shadow-card"><p className="text-slate-600">Sign in to view your bookings.</p><Link href="/login" className="mt-4 inline-flex rounded-full bg-safari px-5 py-3 text-sm font-bold text-white">Sign In</Link></div> : !enabled ? <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">Wallet bookings are disabled in Preview. Bookings from the live wallet are available on the published site only.</p> : bookings.length === 0 ? <div className="mt-6 rounded-2xl bg-white p-6 shadow-card"><p className="text-slate-600">You don’t have any bookings yet.</p><Link href="/tours" className="mt-4 inline-flex rounded-full bg-safari px-5 py-3 text-sm font-bold text-white">Explore tours</Link></div> : <div className="mt-6 space-y-4">{bookings.map((booking) => <article key={booking.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-extrabold text-ink">{booking.title}</h2><p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500"><MapPin size={15} className="text-safari" />{booking.location}, Kenya</p><p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500"><CalendarDays size={15} className="text-safari" />{booking.travelDate} · {booking.guests} guest{booking.guests === 1 ? "" : "s"}</p></div><div className="text-right"><p className="text-lg font-extrabold text-safari">${booking.amount.toFixed(2)} USD</p><p className="text-xs capitalize text-slate-500">{booking.status}</p></div></div></article>)}</div>}
  </section>;
}
