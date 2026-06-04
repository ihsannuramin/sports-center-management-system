"use server";
import { prisma } from "@/lib/prisma";

export async function getRevenueReport(branchId?: string, year?: number) {
  const y = year ?? new Date().getFullYear();
  const results = [];

  for (let month = 0; month < 12; month++) {
    const start = new Date(y, month, 1);
    const end = new Date(y, month + 1, 0, 23, 59, 59);
    const where = { status: "VERIFIED" as const, createdAt: { gte: start, lte: end } };

    const [academy, rental] = await Promise.all([
      prisma.payment.aggregate({ where: { ...where, invoiceId: { not: null } }, _sum: { amount: true } }),
      prisma.payment.aggregate({ where: { ...where, bookingId: { not: null } }, _sum: { amount: true } }),
    ]);

    results.push({
      month: start.toLocaleString("id-ID", { month: "short" }),
      academy: Number(academy._sum.amount ?? 0),
      rental: Number(rental._sum.amount ?? 0),
      total: Number(academy._sum.amount ?? 0) + Number(rental._sum.amount ?? 0),
    });
  }
  return results;
}

export async function getExpenseReport(branchId?: string, year?: number) {
  const y = year ?? new Date().getFullYear();
  const start = new Date(y, 0, 1);
  const end = new Date(y, 11, 31, 23, 59, 59);

  const byCategory = await prisma.expense.groupBy({
    by: ["category"],
    where: {
      status: "APPROVED",
      date: { gte: start, lte: end },
      ...(branchId ? { branchId } : {}),
    },
    _sum: { amount: true },
    _count: true,
  });

  return byCategory.map((c) => ({
    category: c.category,
    total: Number(c._sum.amount ?? 0),
    count: c._count,
  }));
}

export async function getPLReport(branchId?: string, year?: number) {
  const y = year ?? new Date().getFullYear();
  const revenue = await getRevenueReport(branchId, y);
  const totalRevenue = revenue.reduce((sum, r) => sum + r.total, 0);

  const start = new Date(y, 0, 1);
  const end = new Date(y, 11, 31, 23, 59, 59);
  const expenseAgg = await prisma.expense.aggregate({
    where: {
      status: "APPROVED",
      date: { gte: start, lte: end },
      ...(branchId ? { branchId } : {}),
    },
    _sum: { amount: true },
  });

  const totalExpenses = Number(expenseAgg._sum.amount ?? 0);

  return {
    revenue: totalRevenue,
    expenses: totalExpenses,
    profit: totalRevenue - totalExpenses,
    margin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0,
  };
}

export async function getOutstandingInvoices(branchId?: string) {
  const invoices = await prisma.invoice.findMany({
    where: { status: { in: ["UNPAID", "OVERDUE"] } },
    include: { student: { select: { name: true, branch: { select: { name: true } } } } },
    orderBy: { dueDate: "asc" },
  });

  if (branchId) {
    return invoices.filter((i) => i.student.branch.name && i.student.branchId === branchId);
  }
  return invoices;
}

export async function getCollectionRate(branchId?: string, year?: number) {
  const y = year ?? new Date().getFullYear();
  const start = new Date(y, 0, 1);
  const end = new Date(y, 11, 31, 23, 59, 59);

  const [paid, total] = await Promise.all([
    prisma.invoice.count({ where: { status: "PAID", createdAt: { gte: start, lte: end } } }),
    prisma.invoice.count({ where: { createdAt: { gte: start, lte: end } } }),
  ]);

  return { paid, total, rate: total > 0 ? (paid / total) * 100 : 0 };
}

export async function getBranchComparison() {
  const branches = await prisma.branch.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { students: true, coaches: true, courts: true } },
    },
  });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const result = await Promise.all(
    branches.map(async (b) => {
      const revenue = await prisma.payment.aggregate({
        where: {
          status: "VERIFIED",
          createdAt: { gte: monthStart, lte: monthEnd },
          OR: [
            { invoice: { student: { branchId: b.id } } },
            { booking: { branchId: b.id } },
          ],
        },
        _sum: { amount: true },
      });
      return {
        branch: b.name,
        students: b._count.students,
        coaches: b._count.coaches,
        courts: b._count.courts,
        revenue: Number(revenue._sum.amount ?? 0),
      };
    })
  );

  return result;
}
