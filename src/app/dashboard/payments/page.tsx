export const dynamic = "force-dynamic";

import { Header } from "@/components/layout/header";
import { getPayments } from "@/app/actions/payments";
import { getInvoices } from "@/app/actions/invoices";
import { PaymentsClient } from "./payments-client";

export default async function PaymentsPage() {
  const [payments, invoices] = await Promise.all([
    getPayments().catch(() => []),
    getInvoices().catch(() => []),
  ]);

  return (
    <>
      <Header title="Manajemen Pembayaran" />
      <div className="flex flex-1 flex-col gap-5 p-5">
        <PaymentsClient payments={payments} invoices={invoices} />
      </div>
    </>
  );
}

