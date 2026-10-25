import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ChevronRight, MapPin, Star } from "lucide-react";
import toursData from "@/data/tours.json";
import { BookingCard } from "@/components/BookingCard";
import type { Tour } from "@/components/TourCard";

const tours = toursData as Tour[];

type TourDetailProps = {
  params: { id: string };
};

function findTour(id: string) {
  return tours.find((tour) => tour.id === Number(id));
}

export function generateStaticParams() {
  return tours.map((tour) => ({ id: String(tour.id) }));
}

export async function generateMetadata({ params }: TourDetailProps): Promise<Metadata> {
  const tour = findTour(params.id);
  return { title: tour ? `${tour.title} | SafariBookings.com` : "Tour details | SafariBookings.com" };
}

export default function TourDetailPage({ params }: TourDetailProps) {
  const tour = findTour(params.id);
  if (!tour) notFound();

  const galleryImages = tour.images.slice(0, 3);

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-sm text-slate-500">
        <Link href="/tours" className="font-semibold transition hover:text-safari">Tours</Link>
        <ChevronRight aria-hidden="true" size={15} />
        <span className="truncate text-slate-700">{tour.title}</span>
      </nav>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-safari">{tour.category}</span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{tour.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5"><MapPin aria-hidden="true" size={16} className="text-safari" />{tour.location}, Kenya</span>
            <span className="inline-flex items-center gap-1.5"><Star aria-hidden="true" size={16} className="fill-amber-400 text-amber-400" />{tour.rating.toFixed(1)} <span className="text-slate-400">({tour.reviews.toLocaleString("en-US")} reviews)</span></span>
            <span className="text-slate-400">·</span>
            <span>{tour.duration}</span>
          </div>
        </div>
        <div className="rounded-xl bg-emerald-50 px-4 py-2.5 text-right">
          <span className="block text-[11px] font-bold uppercase tracking-wide text-emerald-800/65">From</span>
          <span className="text-xl font-extrabold text-safari">${tour.price.toLocaleString("en-US")}</span>
        </div>
      </div>

      <div className="grid gap-3 overflow-hidden rounded-2xl md:grid-cols-[1.7fr_1fr]">
        <div className="relative min-h-[280px] overflow-hidden bg-emerald-50 md:min-h-[430px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={galleryImages[0]} alt={`${tour.title} main view`} className="absolute inset-0 h-full w-full object-cover" />
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-1 md:grid-rows-2">
          {galleryImages.slice(1).map((image, index) => (
            <div key={image} className="relative min-h-[150px] overflow-hidden bg-emerald-50 md:min-h-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt={`${tour.title} gallery view ${index + 2}`} className="absolute inset-0 h-full w-full object-cover" />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
        <div>
          <section className="border-b border-slate-200 pb-8">
            <h2 className="text-2xl font-extrabold tracking-tight text-ink">About this experience</h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">{tour.description}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">{tour.duration}</span>
              <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">Small-group friendly</span>
              <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">Local guide</span>
            </div>
          </section>

          <section className="grid gap-8 border-b border-slate-200 py-8 sm:grid-cols-2">
            <div>
              <h2 className="text-xl font-extrabold text-ink">Tour highlights</h2>
              <ul className="mt-4 space-y-3">
                {tour.highlights.map((highlight) => (
                  <li key={highlight} className="flex gap-3 text-sm leading-6 text-slate-600">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-safari"><Check aria-hidden="true" size={13} strokeWidth={3} /></span>
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-ink">What’s included</h2>
              <ul className="mt-4 space-y-3">
                {tour.included.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-6 text-slate-600">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-safari"><Check aria-hidden="true" size={13} strokeWidth={3} /></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="py-8">
            <h2 className="text-xl font-extrabold text-ink">A little more about the day</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">Your guide will help you make the most of the route and the time you have. Tour details can vary with weather, wildlife movement, and local conditions.</p>
          </section>
        </div>

        <div>
          <BookingCard price={tour.price} tourId={tour.id} />
        </div>
      </div>
    </section>
  );
}
