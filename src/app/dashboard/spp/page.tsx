export const dynamic = "force-dynamic";
import { Header } from "@/components/layout/header";
import { getSppBatches } from "@/app/actions/spp";
import { getClasses } from "@/app/actions/classes";
import { SppClient } from "./spp-client";

export default async function SppPage() {
  const [batches, classes] = await Promise.all([
    getSppBatches().catch(() => []),
    getClasses().catch(() => []),
  ]);

  return (
    <>
      <Header title="Input SPP Siswa" />
      <div className="flex flex-1 flex-col gap-5 p-5">
        <SppClient batches={batches} classes={classes} />
      </div>
    </>
  );
}
