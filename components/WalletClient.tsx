"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Script from "next/script";
import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, LoaderCircle, ShieldCheck, WalletCards } from "lucide-react";

type User = { id: string; email: string; fullName?: string };
type WalletTransaction = { id: string; type: string; amount: number; status: string; reference: string; createdAt: string; postedAt: string | null };
type WalletConfig = { enabled: boolean; minimumUsd: number; currency: "USD"; publicKey?: string; message?: string };
type PendingTopup = { reference: string; amountCents: number };

declare global {
  interface Window {
    PaystackPop?: {
      setup(options: { key: string; email: string; amount: number; currency: string; ref: string; callback: (response: { reference?: string }) => void; onClose: () => void }): { openIframe(): void };
    };
  }
}

const money = (value: number) => `$${Number(value || 0).toFixed(2)} USD`;

function humanize(code: string) {
  const messages: Record<string, string> = {
    minimum_topup_is_2_usd: "The minimum USD top-up is $2.00.",
    payment_not_verified: "Paystack has not confirmed this payment yet. If you completed checkout, try verifying again shortly.",
    production_wallet_not_ready: "The production wallet database is not ready yet.",
    wallet_database_unavailable: "The wallet database is temporarily unavailable.",
    insufficient_wallet_balance: "Your wallet balance is not enough for this booking.",
    authentication_required: "Sign in to continue.",
    production_wallet_unavailable: "Wallet actions are available only on the published production site.",
    origin_not_allowed: "This site origin is not authorized for wallet actions."
  };
  return messages[code] || "This wallet action could not be completed. Please try again.";
}

export function WalletClient() {
  const [user, setUser] = useState<User | null>(null);
  const [config, setConfig] = useState<WalletConfig | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [amount, setAmount] = useState("25");
  const [pending, setPending] = useState<PendingTopup | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const refreshWallet = useCallback(async () => {
    const response = await fetch("/api/wallet/balance", { cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error || "wallet_database_unavailable");
    setBalance(Number(data.balance || 0));
    setTransactions(Array.isArray(data.transactions) ? data.transactions : []);
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/auth/me", { cache: "no-store" }).then(async (response) => response.ok ? response.json() : null),
      fetch("/api/wallet/config", { cache: "no-store" }).then((response) => response.json())
    ]).then(([auth, walletConfig]) => {
      if (!active) return;
      setUser(auth?.user || null);
      setConfig(walletConfig);
      if (auth?.user?.id) {
        void fetch("/api/wallet/balance", { cache: "no-store" }).then(async (response) => {
          const data = await response.json().catch(() => ({}));
          if (!active) return;
          if (response.ok) {
            setBalance(Number(data.balance || 0));
            setTransactions(Array.isArray(data.transactions) ? data.transactions : []);
          } else if (walletConfig?.enabled) {
            setMessage(humanize(data?.error || "wallet_database_unavailable"));
            setIsError(true);
          }
        }).catch(() => {
          if (active) { setMessage("Your wallet balance could not be loaded."); setIsError(true); }
        });
      }
    }).catch(() => {
      if (active) { setMessage("Wallet configuration is temporarily unavailable."); setIsError(true); }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function verify(reference: string) {
    setBusy(true);
    setMessage("");
    setIsError(false);
    try {
      const response = await fetch("/api/paystack/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "payment_verification_failed");
      setBalance(Number(data.balance || 0));
      setPending(null);
      await refreshWallet();
      setMessage(data.credited ? "Paystack confirmed the payment and your USD wallet was credited." : "This payment was already credited to your wallet.");
    } catch (error) {
      setMessage(humanize(error instanceof Error ? error.message : "payment_verification_failed"));
      setIsError(true);
    } finally {
      setBusy(false);
    }
  }

  async function startTopup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) { window.location.assign("/login"); return; }
    if (!config?.enabled || !config.publicKey) { setMessage("Production wallet setup is not complete yet."); setIsError(true); return; }
    if (!window.PaystackPop) { setMessage("Paystack checkout is still loading. Please try again."); setIsError(true); return; }
    setBusy(true);
    setMessage("");
    setIsError(false);
    try {
      const response = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountUSD: amount })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "wallet_unavailable");
      const payment = { reference: data.reference as string, amountCents: Number(data.amountCents) };
      setPending(payment);
      const handler = window.PaystackPop.setup({
        key: data.publicKey,
        email: data.email,
        amount: payment.amountCents,
        currency: "USD",
        ref: payment.reference,
        callback: (result) => { void verify(result.reference || payment.reference); },
        onClose: () => { setBusy(false); setMessage("Checkout closed. If you completed payment, verify the pending transaction below."); }
      });
      handler.openIframe();
      setMessage("Secure Paystack checkout opened. Your wallet is credited only after the server verifies the payment.");
    } catch (error) {
      setMessage(humanize(error instanceof Error ? error.message : "wallet_unavailable"));
      setIsError(true);
      setBusy(false);
    }
  }

  const pendingRows = transactions.filter((transaction) => transaction.type === "deposit" && transaction.status === "pending");

  return (
    <>
      {config?.enabled ? <Script src="https://js.paystack.co/v1/inline.js" strategy="afterInteractive" /> : null}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-safari"><WalletCards size={14} aria-hidden="true" /> SafariBookings wallet</span>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Your USD wallet</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Add funds securely, then use your virtual balance for SafariBookings tours.</p>
          </div>
          {user ? <span className="text-sm font-medium text-slate-500">Signed in as {user.email}</span> : null}
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <div className="space-y-6">
            <section className="rounded-3xl bg-gradient-to-br from-[#00A651] via-emerald-600 to-emerald-800 p-6 text-white shadow-card sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-white/80">Available balance</p>
                  <p className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">{loading ? "Loading…" : !user ? "Sign in to view" : !config?.enabled ? "Preview locked" : balance === null ? "Unavailable" : money(balance)}</p>
                  <p className="mt-3 text-sm text-white/75">USD only · updated after verified payment</p>
                </div>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15"><WalletCards size={25} aria-hidden="true" /></span>
              </div>
              <div className="mt-7 flex items-center gap-2 text-xs font-semibold text-white/85"><ShieldCheck size={16} aria-hidden="true" /> Paystack confirms payments before any wallet credit.</div>
            </section>

            {!loading && !user ? <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-card"><h2 className="text-xl font-extrabold text-ink">Sign in to your wallet</h2><p className="mt-2 text-sm leading-6 text-slate-500">Your balance is tied to your verified SafariBookings account.</p><Link href="/login" className="mt-5 inline-flex h-12 items-center justify-center rounded-full bg-[#00A651] px-6 text-sm font-bold text-white">Sign In</Link></section> : null}

            {user && config && !config.enabled ? <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6"><h2 className="text-lg font-extrabold text-amber-950">Live wallet unavailable in Preview</h2><p className="mt-2 text-sm leading-6 text-amber-900">This development Preview uses the test Supabase project. Real-money top-ups and wallet bookings are disabled here. Live wallet actions are available only on the published site after production Supabase setup is complete.</p></section> : null}

            {user && config?.enabled ? <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-card sm:p-7">
              <h2 className="text-xl font-extrabold text-ink">Add funds</h2>
              <p className="mt-1 text-sm text-slate-500">Choose an amount in USD. Paystack's minimum is $2.00.</p>
              <form onSubmit={startTopup} className="mt-5 space-y-4">
                <label className="block"><span className="mb-2 block text-xs font-bold text-slate-600">Amount (USD)</span><span className="relative block"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">$</span><input value={amount} onChange={(event) => setAmount(event.target.value)} type="number" inputMode="decimal" min="2" step="0.01" required className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-4 text-sm font-semibold text-ink outline-none transition focus:border-safari focus:bg-white" /></span><span className="mt-1.5 block text-xs text-slate-400">Minimum $2.00 USD · payments open in the inline Paystack popup.</span></label>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">{[5, 10, 25, 50, 100, 250].map((value) => <button key={value} type="button" onClick={() => setAmount(String(value))} className={`rounded-xl border px-2 py-2.5 text-xs font-bold transition ${amount === String(value) ? "border-safari bg-emerald-50 text-safari" : "border-slate-200 bg-white text-slate-600 hover:border-safari/50"}`}>${value}</button>)}</div>
                <button type="submit" disabled={busy} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-safari px-5 text-sm font-bold text-white transition hover:bg-safari-dark disabled:cursor-wait disabled:opacity-50"><ArrowDownLeft size={17} aria-hidden="true" /> {busy ? "Processing…" : "Top Up Wallet"}</button>
              </form>
            </section> : null}

            {pendingRows.length ? <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><h2 className="font-extrabold text-amber-950">Pending top-ups</h2><p className="mt-1 text-sm text-amber-900">If you completed a Paystack payment but the wallet did not update, verify it here.</p><div className="mt-4 space-y-3">{pendingRows.map((row) => <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3"><div><p className="font-bold text-ink">{money(row.amount)}</p><p className="text-xs text-slate-500">{row.reference}</p></div><button type="button" onClick={() => void verify(row.reference)} disabled={busy} className="rounded-full bg-[#00A651] px-4 py-2 text-xs font-bold text-white disabled:opacity-50">Verify payment</button></div>)}</div></section> : null}
          </div>

          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-card sm:p-7">
            <div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-extrabold text-ink">Wallet activity</h2><p className="mt-1 text-sm text-slate-500">Recent deposits and bookings</p></div><button type="button" aria-label="Refresh wallet history" disabled={!user || busy} onClick={() => void refreshWallet().catch((error) => { setMessage(humanize(error.message)); setIsError(true); })} className="rounded-xl p-2 text-slate-500 hover:bg-emerald-50 hover:text-safari disabled:opacity-40"><LoaderCircle size={18} /></button></div>
            {!user ? <p className="mt-6 text-sm text-slate-500">Sign in to see your wallet activity.</p> : transactions.length ? <ul className="mt-5 divide-y divide-slate-100">{transactions.map((transaction) => <li key={transaction.id} className="flex items-center justify-between gap-3 py-4"><div className="flex items-center gap-3"><span className={`flex h-9 w-9 items-center justify-center rounded-full ${transaction.amount >= 0 ? "bg-emerald-50 text-safari" : "bg-slate-100 text-slate-600"}`}>{transaction.amount >= 0 ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}</span><div><p className="text-sm font-bold text-ink">{transaction.type === "deposit" ? "Wallet top-up" : "Tour booking"}</p><p className="text-xs text-slate-500">{new Date(transaction.createdAt).toLocaleDateString("en-US")} · {transaction.status}</p></div></div><span className="whitespace-nowrap text-sm font-extrabold text-ink">{transaction.amount < 0 ? "−" : "+"}{money(Math.abs(transaction.amount))}</span></li>)}</ul> : <p className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No wallet transactions yet.</p>}
            <Link href="/bookings" className="mt-5 inline-flex text-sm font-bold text-safari hover:underline">View bookings</Link>
          </section>
        </div>
        {message ? <p role={isError ? "alert" : "status"} className={`mt-6 rounded-xl px-4 py-3 text-sm ${isError ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"}`}>{message}</p> : null}
      </section>
    </>
  );
}
