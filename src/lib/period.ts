import { prisma } from "@/lib/prisma";

export function periodRange(period: string) {
  const [year, month] = period.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);
  return { start, end };
}

export async function getAttendingStudentIds(classId: string, period: string) {
  const { start, end } = periodRange(period);
  const rows = await prisma.attendance.groupBy({
    by: ["studentId"],
    where: { classId, status: "PRESENT", studentId: { not: null }, date: { gte: start, lte: end } },
  });
  return new Set(rows.map((r) => r.studentId as string));
}
