export const dynamic = "force-dynamic";

import { Header } from "@/components/layout/header";
import { getCourts, getCourtSchedules } from "@/app/actions/courts";
import { getBranches } from "@/app/actions/branches";
import { CourtsClient } from "./courts-client";

export default async function CourtsPage() {
  const [courts, schedules, branches] = await Promise.all([
    getCourts().catch(() => []),
    getCourtSchedules().catch(() => []),
    getBranches().catch(() => []),
  ]);

  return (
    <>
      <Header title="Manajemen Lapangan" />
      <div className="flex flex-1 flex-col gap-5 p-5">
        <CourtsClient courts={courts} schedules={schedules} branches={branches} />
      </div>
    </>
  );
}

