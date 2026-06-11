"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { PayrollType, PayrollStatus } from "@prisma/client";
import { serializeDecimals } from "@/lib/serialize";

export async function getPayrolls(period?: string) {
  const data = await prisma.coachPayroll.findMany({
    where: period ? { period } : undefined,
    include: { coach: { select: { name: true, branch: { select: { name: true } } } }, verifier: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return serializeDecimals(data);
}

export async function createPayroll(data: {
  coachId: string;
  period: string;
  payrollType: PayrollType;
  sessions?: number;
  hours?: number;
  rateAmount: number;
  notes?: string;
}) {
  let total = 0;
  if (data.payrollType === "PER_SESSION") total = data.rateAmount * (data.sessions ?? 0);
  else if (data.payrollType === "PER_HOUR") total = data.rateAmount * (data.hours ?? 0);
  else total = data.rateAmount;

  await prisma.coachPayroll.create({
    data: { ...data, totalAmount: total },
  });
  revalidatePath("/dashboard/payroll");
}

export async function approvePayroll(id: string) {
  await prisma.coachPayroll.update({ where: { id }, data: { status: "APPROVED" } });
  revalidatePath("/dashboard/payroll");
}

export async function markPayrollPaid(id: string) {
  await prisma.coachPayroll.update({ where: { id }, data: { status: "PAID", paidAt: new Date() } });
  revalidatePath("/dashboard/payroll");
}

export async function deletePayroll(id: string) {
  await prisma.coachPayroll.delete({ where: { id } });
  revalidatePath("/dashboard/payroll");
}

export async function getCoachRates(coachId: string) {
  const data = await prisma.coachRate.findMany({ where: { coachId }, orderBy: { effectiveFrom: "desc" } });
  return serializeDecimals(data);
}

export async function setCoachRate(data: { coachId: string; payrollType: PayrollType; rateAmount: number }) {
  await prisma.coachRate.create({ data });
  revalidatePath("/dashboard/payroll");
}