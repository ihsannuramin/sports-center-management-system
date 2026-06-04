export const dynamic = "force-dynamic";
import { Header } from "@/components/layout/header";
import { getAssets } from "@/app/actions/assets";
import { getBranches } from "@/app/actions/branches";
import { AssetsClient } from "./assets-client";

export default async function AssetsPage() {
  const [assets, branches] = await Promise.all([
    getAssets().catch(() => []),
    getBranches().catch(() => []),
  ]);

  return (
    <>
      <Header title="Manajemen Aset" />
      <div className="flex flex-1 flex-col gap-5 p-5">
        <AssetsClient assets={assets} branches={branches} />
      </div>
    </>
  );
}
