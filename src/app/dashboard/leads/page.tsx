export const dynamic = "force-dynamic";
import { Header } from "@/components/layout/header";
import { getLeads, getLeadFunnel } from "@/app/actions/leads";
import { getBranches } from "@/app/actions/branches";
import { LeadsClient } from "./leads-client";

export default async function LeadsPage() {
  const [leads, funnel, branches] = await Promise.all([
    getLeads().catch(() => []),
    getLeadFunnel().catch(() => []),
    getBranches().catch(() => []),
  ]);

  return (
    <>
      <Header title="Manajemen Lead" />
      <div className="flex flex-1 flex-col gap-5 p-5">
        <LeadsClient leads={leads} funnel={funnel} branches={branches} />
      </div>
    </>
  );
}
