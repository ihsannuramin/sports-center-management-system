"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { PayrollType } from "@prisma/client";
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

function periodRange(period: string) {
  const [year, month] = period.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);
  return { start, end };
}

async function buildPayrollPreview(period: string) {
  const { start, end } = periodRange(period);

  const [coaches, sessionCounts, existing] = await Promise.all([
    prisma.coach.findMany({
      where: { isActive: true },
      include: { incentives: { where: { isActive: true } } },
    }),
    prisma.attendance.groupBy({
      by: ["coachId"],
      where: { coachId: { not: null }, status: "PRESENT", date: { gte: start, lte: end } },
      _count: true,
    }),
    prisma.coachPayroll.findMany({ where: { period }, select: { coachId: true } }),
  ]);

  const sessionByCoach = new Map(sessionCounts.map((s) => [s.coachId as string, s._count]));
  const existingCoachIds = new Set(existing.map((e) => e.coachId));

  return coaches
    .map((coach) => {
      const sessionCount = sessionByCoach.get(coach.id) ?? 0;
      const sessionRate = coach.sessionRate ? Number(coach.sessionRate) : 0;
      const base = sessionCount * sessionRate;
      const incentiveDetail = coach.incentives.map((i) => ({ name: i.name, amount: Number(i.amount) }));
      const incentiveAmount = incentiveDetail.reduce((sum, i) => sum + i.amount, 0);
      return {
        coachId: coach.id,
        coachName: coach.name,
        sessionCount,
        sessionRate,
        base,
        incentiveAmount,
        incentiveDetail,
        total: base + incentiveAmount,
        alreadyExists: existingCoachIds.has(coach.id),
      };
    })
    .filter((row) => row.sessionCount > 0 || row.incentiveAmount > 0);
}

export async function previewPayrollForPeriod(period: string) {
  return buildPayrollPreview(period);
}

export async function generatePayrollForPeriod(period: string) {
  const rows = await buildPayrollPreview(period);
  const toCreate = rows.filter((r) => !r.alreadyExists);

  await prisma.$transaction(
    toCreate.map((row) =>
      prisma.coachPayroll.create({
        data: {
          coachId: row.coachId,
          period,
          payrollType: "PER_SESSION",
          sessions: row.sessionCount,
          rateAmount: row.sessionRate,
          baseAmount: row.base,
          incentiveAmount: row.incentiveAmount,
          incentiveDetail: row.incentiveDetail,
          totalAmount: row.total,
        },
      })
    )
  );

  revalidatePath("/dashboard/payroll");
  return { success: true, created: toCreate.length, skipped: rows.length - toCreate.length };
}