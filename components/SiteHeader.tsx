import Link from "next/link";
import { TreePalm, UserRound } from "lucide-react";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Tours", href: "/tours" },
  { label: "Wallet", href: "/wallet" },
  { label: "Bookings", href: "/bookings" }
];

export function SiteHeader() {
  return (
    <header className="relative z-20 border-b border-emerald-950/5 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" aria-label="SafariBookings.com home" className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-safari text-white shadow-sm"><TreePalm aria-hidden="true" size={23} strokeWidth={2.1} /></span>
          <span className="text-[17px] font-extrabold tracking-tight text-safari sm:text-[19px]">SafariBookings<span className="font-semibold">.com</span></span>
        </Link>
        <nav aria-label="Main navigation" className="order-3 flex w-full items-center justify-center gap-1 border-t border-slate-100 pt-2 text-xs font-semibold sm:order-none sm:w-auto sm:gap-1 sm:border-0 sm:pt-0 sm:text-sm">
          {navItems.map((item) => <Link key={item.label} href={item.href} className="rounded-full px-3 py-2 text-slate-600 transition hover:bg-emerald-50 hover:text-safari">{item.label}</Link>)}
        </nav>
        <Link href="/login" aria-label="Sign in" title="Sign in" className="ml-auto flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-safari hover:text-safari"><UserRound aria-hidden="true" size={19} /></Link>
      </div>
    </header>
  );
}
