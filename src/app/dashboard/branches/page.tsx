export const dynamic = "force-dynamic";

import { Header } from "@/components/layout/header";
import { getBranches } from "@/app/actions/branches";
import { BranchesClient } from "./branches-client";

export default async function BranchesPage() {
  const branches = await getBranches().catch(() => []);

  return (
    <>
      <Header title="Manajemen Cabang" />
      <div className="flex flex-1 flex-col gap-5 p-5">
        <BranchesClient branches={branches} />
      </div>
    </>
  );
}

