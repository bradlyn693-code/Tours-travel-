"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { CheckCircle2, Circle, LoaderCircle, ShieldCheck } from "lucide-react";

type LoginTab = "signin" | "signup";
type LoginUser = { id: string; email: string; fullName?: string; phone?: string };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z]).{8}$/;

export default function LoginPage() {
  const [tab, setTab] = useState<LoginTab>("signin");
  const [user, setUser] = useState<LoginUser | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [busy, setBusy] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);

  const passwordChecks = useMemo(() => ({
    length: password.length === 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    match: password.length > 0 && password === confirmPassword
  }), [password, confirmPassword]);

  const signupReady = Boolean(
    fullName.trim() && emailPattern.test(email.trim()) && phone.trim() &&
    passwordPattern.test(password) && passwordChecks.match
  );
  const signinReady = Boolean(emailPattern.test(email.trim()) && password);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() : null)
      .then((data) => { if (active && data?.user?.email) setUser(data.user); })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setCheckingSession(false); });
    return () => { active = false; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setMessageIsError(false);
    setBusy(true);

    try {
      const signup = tab === "signup";
      const response = await fetch(signup ? "/api/auth/signup" : "/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signup
          ? { fullName, email, phone, password }
          : { email, password })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Unable to complete the request.");

      if (signup) {
        setTab("signin");
        setPassword("");
        setConfirmPassword("");
        setMessage("Account created. Sign in with your email and password.");
        return;
      }

      setUser(data.user);
      setMessage(`Signed in as ${data.user.email}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to complete the request.");
      setMessageIsError(true);
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth/signout", { method: "POST" });
      if (!response.ok) throw new Error("Could not sign out. Please try again.");
      setUser(null);
      setPassword("");
      setMessage("You have been signed out.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not sign out.");
      setMessageIsError(true);
    } finally {
      setBusy(false);
    }
  }

  const inputClass = "w-full rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#00A651] focus:ring-4 focus:ring-emerald-100";
  const checks = [
    ["Exactly 8 chars", passwordChecks.length],
    ["Has uppercase", passwordChecks.uppercase],
    ["Has lowercase", passwordChecks.lowercase],
    ["Passwords match", passwordChecks.match]
  ] as const;

  return (
    <section className="mx-auto flex min-h-[68vh] max-w-6xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-emerald-950/5 bg-white shadow-card md:grid-cols-[0.9fr_1.1fr]">
        <div className="hidden flex-col justify-between bg-[#00A651] p-10 text-white md:flex lg:p-12">
          <div>
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15"><ShieldCheck aria-hidden="true" size={25} /></span>
            <h1 className="mt-8 text-3xl font-black tracking-tight">Your next Kenyan adventure starts here.</h1>
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/85">Sign in to keep your SafariBookings account details close at hand.</p>
          </div>
          <p className="text-xs font-medium text-white/75">SafariBookings.com · Discover Magical Kenya</p>
        </div>

        <div className="p-6 sm:p-9 lg:p-12">
          {checkingSession ? (
            <div className="flex min-h-72 items-center justify-center text-sm font-medium text-slate-500" role="status">
              <LoaderCircle aria-hidden="true" className="mr-2 animate-spin" size={18} /> Checking your session…
            </div>
          ) : user ? (
            <div className="mx-auto flex min-h-72 max-w-md flex-col justify-center">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-[#00A651]"><CheckCircle2 aria-hidden="true" size={26} /></span>
              <h2 className="mt-5 text-2xl font-extrabold tracking-tight text-slate-900">You’re signed in</h2>
              <p className="mt-2 text-sm text-slate-600">Signed in as <strong className="font-bold text-slate-900">{user.email}</strong></p>
              <button type="button" onClick={signOut} disabled={busy} className="mt-7 inline-flex h-12 items-center justify-center rounded-full bg-[#00A651] px-7 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60">
                {busy ? "Signing out…" : "Sign Out"}
              </button>
              {message ? <p role="status" className="mt-4 text-sm text-slate-600">{message}</p> : null}
            </div>
          ) : (
            <div className="mx-auto max-w-md">
              <p className="text-xs font-bold uppercase tracking-[0.17em] text-[#00A651]">SafariBookings account</p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">Good to see you</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Sign in or create an account to continue.</p>

              <div className="mt-6 grid grid-cols-2 rounded-full bg-slate-100 p-1" role="tablist" aria-label="Account access">
                <button type="button" role="tab" aria-selected={tab === "signin"} onClick={() => { setTab("signin"); setMessage(""); }} className={`rounded-full px-4 py-3 text-sm font-bold transition ${tab === "signin" ? "bg-[#00A651] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>
                  Sign In
                </button>
                <button type="button" role="tab" aria-selected={tab === "signup"} onClick={() => { setTab("signup"); setMessage(""); }} className={`rounded-full px-4 py-3 text-sm font-bold transition ${tab === "signup" ? "bg-[#00A651] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>
                  Create Account
                </button>
              </div>

              <form onSubmit={submit} className="mt-6 space-y-4">
                {tab === "signup" ? (
                  <>
                    <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Full Name</span><input className={inputClass} name="fullName" autoComplete="name" required maxLength={120} value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Your full name" /></label>
                    <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Email</span><input className={inputClass} name="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>
                    <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Phone</span><input className={inputClass} name="phone" type="tel" autoComplete="tel" required maxLength={40} value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Phone number" /></label>
                    <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Password</span><input className={inputClass} name="password" type="password" autoComplete="new-password" required maxLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="8 characters" /></label>
                    <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Confirm Password</span><input className={inputClass} name="confirmPassword" type="password" autoComplete="new-password" required maxLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Enter password again" /></label>
                    <ul className="grid gap-2 rounded-2xl bg-slate-50 p-4 text-xs sm:grid-cols-2" aria-label="Password requirements">
                      {checks.map(([label, passed]) => <li key={label} className={`flex items-center gap-2 font-semibold ${passed ? "text-emerald-700" : "text-slate-500"}`}>
                        {passed ? <CheckCircle2 aria-hidden="true" size={16} /> : <Circle aria-hidden="true" size={16} />}{label}
                      </li>)}
                    </ul>
                    <button type="submit" disabled={busy || !signupReady} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#00A651] px-6 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-45">
                      {busy ? <><LoaderCircle aria-hidden="true" className="animate-spin" size={17} /> Creating account…</> : "Create Account"}
                    </button>
                  </>
                ) : (
                  <>
                    <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Email</span><input className={inputClass} name="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>
                    <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Password</span><input className={inputClass} name="password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your password" /></label>
                    <button type="submit" disabled={busy || !signinReady} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#00A651] px-6 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-45">
                      {busy ? <><LoaderCircle aria-hidden="true" className="animate-spin" size={17} /> Signing in…</> : "Sign In"}
                    </button>
                  </>
                )}
              </form>

              {message ? <p role={messageIsError ? "alert" : "status"} className={`mt-4 rounded-xl px-4 py-3 text-sm ${messageIsError ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"}`}>{message}</p> : null}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
