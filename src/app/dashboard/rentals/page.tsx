export const dynamic = "force-dynamic";

import { Header } from "@/components/layout/header";
import { getRentals } from "@/app/actions/rentals";
import { getCourts } from "@/app/actions/courts";
import { getBranches } from "@/app/actions/branches";
import { RentalsWrapper } from "./rentals-wrapper";

export default async function RentalsPage() {
  const [rentals, courts, branches] = await Promise.all([
    getRentals().catch(() => []),
    getCourts().catch(() => []),
    getBranches().catch(() => []),
  ]);

  return (
    <>
      <Header title="Sewa Lapangan" />
      <div className="flex flex-1 flex-col gap-5 p-5">
        <RentalsWrapper rentals={rentals} courts={courts} branches={branches} />
      </div>
    </>
  );
}

