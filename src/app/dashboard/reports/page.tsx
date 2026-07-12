export const dynamic = "force-dynamic";
import { Header } from "@/components/layout/header";
import { getRevenueReport, getPLReport, getCollectionRate, getBranchComparison, getSppProjectionReport } from "@/app/actions/reports";
import { ReportsClient } from "./reports-client";

export default async function ReportsPage() {
  const year = new Date().getFullYear();

  const [revenue, pl, collectionRate, branches, sppProjection] = await Promise.all([
    getRevenueReport(undefined, year).catch(() => []),
    getPLReport(undefined, year).catch(() => ({ revenue: 0, expenses: 0, profit: 0, margin: 0 })),
    getCollectionRate(undefined, year).catch(() => ({ paid: 0, total: 0, rate: 0 })),
    getBranchComparison().catch(() => []),
    getSppProjectionReport(year).catch(() => []),
  ]);

  return (
    <>
      <Header title="Laporan Keuangan" />
      <div className="flex flex-1 flex-col gap-5 p-5">
        <ReportsClient revenue={revenue} pl={pl} collectionRate={collectionRate} branches={branches} sppProjection={sppProjection} year={year} />
      </div>
    </>
  );
}
