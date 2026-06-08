export const dynamic = "force-dynamic";

import { Header } from "@/components/layout/header";
import { getInvoices } from "@/app/actions/invoices";
import { getStudents } from "@/app/actions/students";
import { getBranches } from "@/app/actions/branches";
import { InvoicesClient } from "./invoices-client";

export default async function InvoicesPage() {
  const [invoices, students, branches] = await Promise.all([
    getInvoices().catch(() => []),
    getStudents().catch(() => []),
    getBranches().catch(() => []),
  ]);

  return (
    <>
      <Header title="Manajemen Invoice" />
      <div className="flex flex-1 flex-col gap-5 p-5">
        <InvoicesClient invoices={invoices} students={students} branches={branches} />
      </div>
    </>
  );
}

