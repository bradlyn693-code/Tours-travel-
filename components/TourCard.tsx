import Link from "next/link";
import { Clock3, MapPin, Star, UsersRound } from "lucide-react";

export type Tour = {
  id: number;
  title: string;
  location: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviews: number;
  duration: string;
  groupSize: string;
  image: string;
  images: string[];
  category: string;
  description: string;
  highlights: string[];
  included: string[];
};

type TourCardProps = {
  tour: Tour;
  ctaLabel?: string;
};

export function TourCard({ tour, ctaLabel = "Book Now" }: TourCardProps) {
  return (
    <article className="group overflow-hidden rounded-2xl bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <Link href={`/tours/${tour.id}`} aria-label={`View ${tour.title}`} className="relative block h-56 overflow-hidden bg-emerald-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={tour.image} alt={tour.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-safari shadow-sm">{tour.category}</span>
      </Link>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/tours/${tour.id}`} className="text-lg font-bold leading-snug text-ink transition hover:text-safari">{tour.title}</Link>
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-sm font-bold text-amber-700">
            <Star aria-hidden="true" size={14} className="fill-amber-400 text-amber-400" /> {tour.rating.toFixed(1)}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-400">{tour.reviews.toLocaleString("en-US")} reviews</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
          <span className="inline-flex items-center gap-1.5"><MapPin aria-hidden="true" size={15} className="text-safari" />{tour.location}</span>
          <span className="inline-flex items-center gap-1.5"><Clock3 aria-hidden="true" size={15} className="text-safari" />{tour.duration}</span>
        </div>
        <div className="mt-5 flex items-end justify-between border-t border-slate-100 pt-4">
          <div>
            <span className="text-xs text-slate-500">From / person</span>
            <div className="mt-0.5 flex items-baseline gap-2">
              <p className="text-lg font-extrabold text-ink">${tour.price.toLocaleString("en-US")}</p>
              {tour.originalPrice > tour.price ? <span className="text-xs text-slate-400 line-through">${tour.originalPrice.toLocaleString("en-US")}</span> : null}
            </div>
          </div>
          <Link href={`/tours/${tour.id}`} className="rounded-xl bg-safari px-4 py-2.5 text-sm font-bold text-white transition hover:bg-safari-dark">
            {ctaLabel}
          </Link>
        </div>
      </div>
    </article>
  );
}
