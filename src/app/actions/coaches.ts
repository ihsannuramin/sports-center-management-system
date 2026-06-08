"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const CoachSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  specialty: z.string().optional(),
  branchId: z.string().min(1),
  userId: z.string().min(1),
});

export async function getCoaches(branchId?: string) {
  return prisma.coach.findMany({
    where: branchId ? { branchId } : {},
    include: { branch: true, user: true, classes: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createCoach(data: z.infer<typeof CoachSchema>) {
  const parsed = CoachSchema.parse(data);
  const coach = await prisma.coach.create({ data: parsed });
  revalidatePath("/dashboard/coaches");
  return { success: true, coach };
}

export async function updateCoach(id: string, data: z.infer<typeof CoachSchema>) {
  const parsed = CoachSchema.parse(data);
  const coach = await prisma.coach.update({ where: { id }, data: parsed });
  revalidatePath("/dashboard/coaches");
  return { success: true, coach };
}

export async function toggleCoachStatus(id: string, isActive: boolean) {
  await prisma.coach.update({ where: { id }, data: { isActive } });
  revalidatePath("/dashboard/coaches");
  return { success: true };
}
