import type { Metadata } from "next";
import { WalletClient } from "@/components/WalletClient";

export const metadata: Metadata = { title: "Wallet | SafariBookings.com", description: "Manage your SafariBookings USD wallet." };

export default function WalletPage() {
  return <WalletClient />;
}
