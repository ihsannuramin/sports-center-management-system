export const dynamic = "force-dynamic";

import { Header } from "@/components/layout/header";
import { getCoaches } from "@/app/actions/coaches";
import { getBranches } from "@/app/actions/branches";
import { CoachesClient } from "./coaches-client";

export default async function CoachesPage() {
  const [coaches, branches] = await Promise.all([
    getCoaches().catch(() => []),
    getBranches().catch(() => []),
  ]);

  return (
    <>
      <Header title="Manajemen Pelatih" />
      <div className="flex flex-1 flex-col gap-5 p-5">
        <CoachesClient coaches={coaches} branches={branches} />
      </div>
    </>
  );
}

