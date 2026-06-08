export const dynamic = "force-dynamic";
import { Header } from "@/components/layout/header";
import { getPayrolls } from "@/app/actions/payroll";
import { getCoaches } from "@/app/actions/coaches";
import { PayrollClient } from "./payroll-client";

export default async function PayrollPage() {
  const [payrolls, coaches] = await Promise.all([
    getPayrolls().catch(() => []),
    getCoaches().catch(() => []),
  ]);

  return (
    <>
      <Header title="Penggajian Pelatih" />
      <div className="flex flex-1 flex-col gap-5 p-5">
        <PayrollClient payrolls={payrolls} coaches={coaches} />
      </div>
    </>
  );
}
