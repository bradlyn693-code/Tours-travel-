import Link from "next/link";
import { TreePalm } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-[#11251a] text-white" id="footer">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr] lg:px-8">
        <div>
          <Link href="/" className="inline-flex items-center gap-2 text-lg font-extrabold tracking-tight">
            <TreePalm aria-hidden="true" className="text-emerald-400" size={23} />
            SafariBookings.com
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-6 text-emerald-100/70">
            Make room for wonder. Find thoughtful local experiences across Kenya, from open savannah to the Indian Ocean coast.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-bold">Explore Kenya</h2>
          <ul className="mt-4 space-y-3 text-sm text-emerald-100/70">
            <li><Link className="transition hover:text-white" href="/tours?location=Masai%20Mara">Masai Mara safaris</Link></li>
            <li><Link className="transition hover:text-white" href="/tours?location=Amboseli">Amboseli tours</Link></li>
            <li><Link className="transition hover:text-white" href="/tours?location=Diani">Diani experiences</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-bold">SafariBookings</h2>
          <ul className="mt-4 space-y-3 text-sm text-emerald-100/70">
            <li><Link className="transition hover:text-white" href="/">Home</Link></li>
            <li><Link className="transition hover:text-white" href="/tours">Browse tours</Link></li>
            <li><Link className="transition hover:text-white" href="/login">Login</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-emerald-100/50 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} SafariBookings.com</span>
          <span>Made for memorable days in Kenya.</span>
        </div>
      </div>
    </footer>
  );
}
