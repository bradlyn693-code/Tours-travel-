import type { Metadata } from "next";
import { BookingsClient } from "@/components/BookingsClient";

export const metadata: Metadata = { title: "My Bookings | SafariBookings.com", description: "View your SafariBookings tour bookings." };

export default function BookingsPage() {
  return <BookingsClient />;
}
