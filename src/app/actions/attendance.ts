"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const AttendanceSchema = z.object({
  classId: z.string().min(1),
  date: z.string(),
  records: z.array(
    z.object({
      studentId: z.string(),
      status: z.enum(["PRESENT", "ABSENT", "SICK", "PERMISSION"]),
      notes: z.string().optional(),
    })
  ),
});

export async function getAttendance(classId: string, date: string) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return prisma.attendance.findMany({
    where: { classId, date: { gte: start, lte: end } },
    include: { student: true },
  });
}

export async function saveAttendance(data: z.infer<typeof AttendanceSchema>) {
  const parsed = AttendanceSchema.parse(data);
  const date = new Date(parsed.date);

  const start = new Date(parsed.date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(parsed.date);
  end.setHours(23, 59, 59, 999);

  // Delete existing for the day, then recreate
  await prisma.attendance.deleteMany({
    where: { classId: parsed.classId, date: { gte: start, lte: end } },
  });

  await prisma.attendance.createMany({
    data: parsed.records.map((r) => ({
      classId: parsed.classId,
      studentId: r.studentId,
      status: r.status,
      notes: r.notes,
      date,
    })),
  });

  revalidatePath("/dashboard/attendance");
  return { success: true };
}

export async function getAttendanceReport(classId: string, month: number, year: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  return prisma.attendance.findMany({
    where: { classId, date: { gte: start, lte: end } },
    include: { student: true },
    orderBy: { date: "asc" },
  });
}

export async function getCoachAttendance(classId: string, date: string) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return prisma.attendance.findMany({
    where: { classId, coachId: { not: null }, date: { gte: start, lte: end } },
    include: { coach: true },
  });
}

export async function saveCoachAttendance(data: {
  classId: string;
  coachId: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "SICK" | "PERMISSION";
  notes?: string;
}) {
  const date = new Date(data.date);
  const start = new Date(data.date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(data.date);
  end.setHours(23, 59, 59, 999);

  await prisma.attendance.deleteMany({
    where: { classId: data.classId, coachId: data.coachId, date: { gte: start, lte: end } },
  });

  await prisma.attendance.create({
    data: {
      classId: data.classId,
      coachId: data.coachId,
      status: data.status,
      notes: data.notes,
      date,
    },
  });

  revalidatePath("/dashboard/attendance");
  return { success: true };
}
