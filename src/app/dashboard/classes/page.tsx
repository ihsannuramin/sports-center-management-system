export const dynamic = "force-dynamic";

import { Header } from "@/components/layout/header";
import { getClasses } from "@/app/actions/classes";
import { getBranches } from "@/app/actions/branches";
import { getCoaches } from "@/app/actions/coaches";
import { getCourts } from "@/app/actions/courts";
import { ClassesClient } from "./classes-client";

export default async function ClassesPage() {
  const [classes, branches, coaches, courts] = await Promise.all([
    getClasses().catch(() => []),
    getBranches().catch(() => []),
    getCoaches().catch(() => []),
    getCourts().catch(() => []),
  ]);

  return (
    <>
      <Header title="Manajemen Kelas" />
      <div className="flex flex-1 flex-col gap-5 p-5">
        <ClassesClient classes={classes} branches={branches} coaches={coaches} courts={courts} />
      </div>
    </>
  );
}

