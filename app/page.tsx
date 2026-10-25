import Link from "next/link";
import { ArrowRight, Compass, HeartHandshake, ShieldCheck, Sparkles } from "lucide-react";
import toursData from "@/data/tours.json";
import { TourCard, type Tour } from "@/components/TourCard";

const featuredTours = [0, 30, 45, 60, 70, 80].map((index) => (toursData as Tour[])[index]);

const benefits = [
  {
    title: "Local knowledge, real care",
    description: "Find experiences shaped by guides who know Kenya beyond the guidebook.",
    icon: Compass
  },
  {
    title: "Thoughtful, trusted tours",
    description: "Clear details and consistently well-rated experiences make planning easier.",
    icon: ShieldCheck
  },
  {
    title: "Travel that feels personal",
    description: "From a first safari to a quiet coast escape, choose a trip that feels like yours.",
    icon: HeartHandshake
  }
];

export default function HomePage() {
  return (
    <>
      <section className="relative isolate overflow-hidden bg-[#183321]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=2000&auto=format&fit=crop&q=90"
          alt="Golden light over the open Kenyan savannah"
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#10251a]/90 via-[#10251a]/60 to-[#10251a]/10" />
        <div className="mx-auto grid min-h-[600px] max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-24">
          <div className="max-w-2xl text-white">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-100 backdrop-blur-sm">
              <Sparkles aria-hidden="true" size={14} /> Kenya, your way
            </span>
            <h1 className="mt-6 text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Discover <span className="text-emerald-300">Magical Kenya</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/85 sm:text-xl">
              From the wild heart of the savannah to the warm Indian Ocean, find the moments that stay with you.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-medium text-white/80">
              <span>Curated local experiences</span>
              <span className="hidden h-1 w-1 rounded-full bg-emerald-300 sm:block" />
              <span>Made for memorable days</span>
            </div>
          </div>

          <div className="w-full lg:justify-self-end lg:max-w-xl">
            <form action="/tours" method="get" className="rounded-3xl bg-white p-5 shadow-2xl shadow-black/25 sm:p-7">
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-safari">Your next great day</p>
                <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-ink">Where will Kenya take you?</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-xs font-bold text-slate-600">Location</span>
                  <input name="location" type="search" placeholder="Try Masai Mara, Diani…" className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-ink placeholder:text-slate-400 focus:border-safari focus:bg-white focus:outline-none" />
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-xs font-bold text-slate-600">Date</span>
                  <input name="date" type="date" className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-600 focus:border-safari focus:bg-white focus:outline-none" />
                </label>
              </div>
              <button type="submit" className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-safari px-6 text-sm font-bold text-white transition hover:bg-safari-dark focus-visible:outline-offset-4">
                Search tours <ArrowRight aria-hidden="true" size={17} />
              </button>
              <p className="mt-4 text-center text-xs text-slate-400">A little planning. A lot of wonder.</p>
            </form>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-safari">Made for your kind of wild</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Featured Tours</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">Start with a few of Kenya’s most-loved ways to explore.</p>
          </div>
          <Link href="/tours" className="inline-flex items-center gap-2 text-sm font-bold text-safari transition hover:text-safari-dark">
            Browse all tours <ArrowRight aria-hidden="true" size={17} />
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featuredTours.map((tour) => <TourCard key={tour.id} tour={tour} ctaLabel="Explore tour" />)}
        </div>
      </section>

      <section className="border-y border-emerald-950/5 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-safari">Good journeys start with good people</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Why Choose Us</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">A little more thought in the planning means more room to enjoy the moment.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {benefits.map(({ title, description, icon: Icon }, index) => (
              <article key={title} className="rounded-2xl border border-slate-100 bg-mist p-6 sm:p-7">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-safari">
                  <Icon aria-hidden="true" size={23} />
                </span>
                <span className="mt-6 block text-xs font-bold uppercase tracking-[0.16em] text-slate-400">0{index + 1}</span>
                <h3 className="mt-2 text-xl font-extrabold text-ink">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
