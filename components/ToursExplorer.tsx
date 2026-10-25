"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { TourCard, type Tour } from "@/components/TourCard";

const locations = ["All", "Masai Mara", "Amboseli", "Diani", "Mombasa", "Wasini", "Tsavo", "Nairobi", "Naivasha", "Nakuru", "Mt Kenya"];
const PAGE_SIZE = 20;

type ToursExplorerProps = {
  tours: Tour[];
  initialQuery?: string;
  initialLocation?: string;
};

export function ToursExplorer({ tours, initialQuery = "", initialLocation = "All" }: ToursExplorerProps) {
  const [query, setQuery] = useState(initialQuery);
  const [location, setLocation] = useState(locations.includes(initialLocation) ? initialLocation : "All");
  const [maxPrice, setMaxPrice] = useState(800);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedLocation = params.get("location") ?? initialLocation;
    setQuery(params.get("q") ?? params.get("location") ?? initialQuery);
    setLocation(locations.includes(requestedLocation) ? requestedLocation : "All");
  }, [initialLocation, initialQuery]);

  const filteredTours = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return tours.filter((tour) => {
      const matchesLocation = location === "All" || tour.location.toLowerCase() === location.toLowerCase();
      const matchesSearch = !normalizedQuery || [tour.title, tour.location, tour.category].some((value) => value.toLowerCase().includes(normalizedQuery));
      return matchesLocation && matchesSearch && tour.price <= maxPrice;
    });
  }, [location, maxPrice, query, tours]);

  const visibleTours = filteredTours.slice(0, visibleCount);

  function clearFilters() {
    setQuery("");
    setLocation("All");
    setMaxPrice(800);
    setVisibleCount(PAGE_SIZE);
  }

  return (
    <>
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card sm:p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_250px]">
          <label className="relative block">
            <span className="sr-only">Search tours</span>
            <Search aria-hidden="true" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(event) => { setQuery(event.target.value); setVisibleCount(PAGE_SIZE); }} type="search" placeholder="Search by tour, place, or experience" className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-ink placeholder:text-slate-400 focus:border-safari focus:bg-white focus:outline-none" />
          </label>
          <label className="relative block">
            <span className="sr-only">Filter by location</span>
            <SlidersHorizontal aria-hidden="true" size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-safari" />
            <select value={location} onChange={(event) => { setLocation(event.target.value); setVisibleCount(PAGE_SIZE); }} className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold text-slate-700 focus:border-safari focus:bg-white focus:outline-none">
              {locations.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
        </div>
        <div className="mt-5 rounded-xl bg-slate-50 px-4 py-3">
          <div className="mb-2 flex items-center justify-between gap-4">
            <label htmlFor="price-filter" className="text-sm font-bold text-slate-700">Maximum price</label>
            <span className="text-sm font-extrabold text-safari">${maxPrice.toLocaleString("en-US")}</span>
          </div>
          <input id="price-filter" type="range" min="0" max="800" step="10" value={maxPrice} onChange={(event) => { setMaxPrice(Number(event.target.value)); setVisibleCount(PAGE_SIZE); }} className="h-2 w-full cursor-pointer accent-safari" />
          <div className="mt-1 flex justify-between text-[11px] font-medium text-slate-400"><span>$0</span><span>$800</span></div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
        <p aria-live="polite" className="text-sm font-semibold text-slate-600">Showing {filteredTours.length} tours</p>
        <span className="text-xs font-medium text-slate-400">{visibleTours.length < filteredTours.length ? `Showing ${visibleTours.length} on this page` : "Handpicked across Kenya"}</span>
      </div>

      {visibleTours.length > 0 ? (
        <>
          <div className="mt-5 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visibleTours.map((tour) => <TourCard key={tour.id} tour={tour} />)}
          </div>
          {visibleCount < filteredTours.length ? (
            <div className="mt-9 flex justify-center">
              <button type="button" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)} className="rounded-xl border border-emerald-200 bg-white px-7 py-3 text-sm font-bold text-safari shadow-sm transition hover:border-safari hover:bg-emerald-50">
                Load More Tours
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-emerald-200 bg-white px-6 py-16 text-center">
          <p className="text-lg font-bold text-ink">No tours found just yet.</p>
          <p className="mt-2 text-sm text-slate-500">Try another place or raise your price limit to see more experiences.</p>
          <button type="button" onClick={clearFilters} className="mt-5 rounded-xl bg-safari px-5 py-2.5 text-sm font-bold text-white hover:bg-safari-dark">Show all tours</button>
        </div>
      )}
    </>
  );
}
