import type { Metadata } from "next";
import toursData from "@/data/tours.json";
import { ToursExplorer } from "@/components/ToursExplorer";
import type { Tour } from "@/components/TourCard";
import { Compass } from "lucide-react";

export const metadata: Metadata = {
  title: "Kenya Safari Tours | SafariBookings.com",
  description: "Browse 100 wildlife safaris, coastal cruises and local adventures across Kenya with clear USD prices."
};

export default function ToursPage() {
  return (
    <section className="mx-auto min-h-[70vh] max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-safari">
          <Compass aria-hidden="true" size={14} /> Find your Kenya
        </div>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">Explore Kenya tours</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">Browse 100 Kenya experiences with clear USD prices, from big-sky safaris to salt-air mornings on the coast.</p>
      </div>
      <ToursExplorer
        tours={toursData as Tour[]}
      />
    </section>
  );
}
