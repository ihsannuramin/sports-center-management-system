"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ExpenseCategory, ApprovalStatus } from "@prisma/client";

export async function getExpenses(branchId?: string) {
  return prisma.expense.findMany({
    where: branchId ? { branchId } : undefined,
    include: {
      branch: { select: { name: true } },
      approver: { select: { name: true } },
    },
    orderBy: { date: "desc" },
  });
}

export async function createExpense(data: {
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  description?: string;
  branchId: string;
}) {
  await prisma.expense.create({
    data: { ...data, amount: data.amount, date: new Date(data.date) },
  });
  revalidatePath("/dashboard/expenses");
}

export async function updateExpense(id: string, data: {
  title?: string;
  category?: ExpenseCategory;
  amount?: number;
  date?: string;
  description?: string;
}) {
  await prisma.expense.update({
    where: { id },
    data: { ...data, date: data.date ? new Date(data.date) : undefined },
  });
  revalidatePath("/dashboard/expenses");
}

export async function approveExpense(id: string, approverId: string) {
  await prisma.expense.update({
    where: { id },
    data: { status: "APPROVED", approvedBy: approverId },
  });
  revalidatePath("/dashboard/expenses");
}

export async function rejectExpense(id: string) {
  await prisma.expense.update({ where: { id }, data: { status: "REJECTED" } });
  revalidatePath("/dashboard/expenses");
}

export async function deleteExpense(id: string) {
  await prisma.expense.delete({ where: { id } });
  revalidatePath("/dashboard/expenses");
}

export async function getExpenseSummary(branchId?: string) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [total, thisMonth, byCategory] = await Promise.all([
    prisma.expense.aggregate({ where: branchId ? { branchId, status: "APPROVED" } : { status: "APPROVED" }, _sum: { amount: true } }),
    prisma.expense.aggregate({ where: { ...(branchId ? { branchId } : {}), status: "APPROVED", date: { gte: monthStart, lte: monthEnd } }, _sum: { amount: true } }),
    prisma.expense.groupBy({ by: ["category"], where: branchId ? { branchId, status: "APPROVED" } : { status: "APPROVED" }, _sum: { amount: true } }),
  ]);

  return { total: Number(total._sum.amount ?? 0), thisMonth: Number(thisMonth._sum.amount ?? 0), byCategory };
}