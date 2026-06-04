export const dynamic = "force-dynamic";
import { Header } from "@/components/layout/header";
import { getParents } from "@/app/actions/parents";
import { getBranches } from "@/app/actions/branches";
import { ParentsClient } from "./parents-client";

export default async function ParentsPage() {
  const [parents, branches] = await Promise.all([
    getParents().catch(() => []),
    getBranches().catch(() => []),
  ]);

  return (
    <>
      <Header title="CRM Orang Tua" />
      <div className="flex flex-1 flex-col gap-5 p-5">
        <ParentsClient parents={parents} branches={branches} />
      </div>
    </>
  );
}
