export const dynamic = "force-dynamic";
import { Header } from "@/components/layout/header";
import { getExpenses, getExpenseSummary } from "@/app/actions/expenses";
import { getBranches } from "@/app/actions/branches";
import { ExpensesClient } from "./expenses-client";

export default async function ExpensesPage() {
  const [expenses, summary, branches] = await Promise.all([
    getExpenses().catch(() => []),
    getExpenseSummary().catch(() => ({ total: 0, thisMonth: 0, byCategory: [] })),
    getBranches().catch(() => []),
  ]);

  return (
    <>
      <Header title="Manajemen Pengeluaran" />
      <div className="flex flex-1 flex-col gap-5 p-5">
        <ExpensesClient expenses={expenses} summary={summary} branches={branches} />
      </div>
    </>
  );
}
