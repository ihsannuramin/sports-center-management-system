"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const CourtSchema = z.object({
  name: z.string().min(2),
  courtNumber: z.number().int().positive(),
  type: z.enum(["INDOOR", "OUTDOOR"]),
  description: z.string().optional(),
  branchId: z.string().min(1),
});

const ScheduleSchema = z.object({
  courtId: z.string().min(1),
  branchId: z.string().min(1),
  title: z.string().min(2),
  type: z.enum(["MAINTENANCE", "ACADEMY", "RENTAL"]),
  startTime: z.string(),
  endTime: z.string(),
  isRecurring: z.boolean().default(false),
  recurDay: z.number().int().min(0).max(6).optional(),
  notes: z.string().optional(),
});

export async function getCourts(branchId?: string) {
  return prisma.court.findMany({
    where: branchId ? { branchId } : {},
    include: { branch: true },
    orderBy: { courtNumber: "asc" },
  });
}

export async function createCourt(data: z.infer<typeof CourtSchema>) {
  const parsed = CourtSchema.parse(data);
  const court = await prisma.court.create({ data: parsed });
  revalidatePath("/dashboard/courts");
  return { success: true, court };
}

export async function updateCourt(id: string, data: z.infer<typeof CourtSchema>) {
  const parsed = CourtSchema.parse(data);
  const court = await prisma.court.update({ where: { id }, data: parsed });
  revalidatePath("/dashboard/courts");
  return { success: true, court };
}

export async function toggleCourtStatus(id: string, isActive: boolean) {
  await prisma.court.update({ where: { id }, data: { isActive } });
  revalidatePath("/dashboard/courts");
  return { success: true };
}

export async function getCourtSchedules(courtId?: string) {
  return prisma.courtSchedule.findMany({
    where: courtId ? { courtId } : {},
    include: { court: true },
    orderBy: { startTime: "asc" },
  });
}

export async function createCourtSchedule(data: z.infer<typeof ScheduleSchema>) {
  const parsed = ScheduleSchema.parse(data);
  const schedule = await prisma.courtSchedule.create({
    data: {
      ...parsed,
      startTime: new Date(parsed.startTime),
      endTime: new Date(parsed.endTime),
    },
  });
  revalidatePath("/dashboard/courts");
  return { success: true, schedule };
}
