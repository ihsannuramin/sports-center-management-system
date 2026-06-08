export const dynamic = "force-dynamic";
import { Header } from "@/components/layout/header";
import { getMaintenanceTickets } from "@/app/actions/maintenance";
import { getAssets } from "@/app/actions/assets";
import { getBranches } from "@/app/actions/branches";
import { MaintenanceClient } from "./maintenance-client";

export default async function MaintenancePage() {
  const [tickets, assets, branches] = await Promise.all([
    getMaintenanceTickets().catch(() => []),
    getAssets().catch(() => []),
    getBranches().catch(() => []),
  ]);

  return (
    <>
      <Header title="Tiket Maintenance" />
      <div className="flex flex-1 flex-col gap-5 p-5">
        <MaintenanceClient tickets={tickets} assets={assets} branches={branches} />
      </div>
    </>
  );
}
