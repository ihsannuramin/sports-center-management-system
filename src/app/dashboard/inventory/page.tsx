export const dynamic = "force-dynamic";

import { Header } from "@/components/layout/header";
import { getInventory } from "@/app/actions/inventory";
import { getBranches } from "@/app/actions/branches";
import { InventoryClient } from "./inventory-client";

export default async function InventoryPage() {
  const [inventory, branches] = await Promise.all([
    getInventory().catch(() => []),
    getBranches().catch(() => []),
  ]);

  return (
    <>
      <Header title="Inventaris" />
      <div className="flex flex-1 flex-col gap-5 p-5">
        <InventoryClient inventory={inventory} branches={branches} />
      </div>
    </>
  );
}

