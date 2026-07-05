"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { serializeDecimals } from "@/lib/serialize";

const CoachSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  specialty: z.string().optional(),
  branchId: z.string().min(1),
  userId: z.string().min(1),
  sessionRate: z.number().nonnegative().optional(),
  licenses: z.array(z.string().min(1)).optional(),
  incentives: z
    .array(z.object({ name: z.string().min(1), amount: z.number().nonnegative() }))
    .optional(),
});

export async function getCoaches(branchId?: string) {
  const coaches = await prisma.coach.findMany({
    where: branchId ? { branchId } : {},
    include: { branch: true, user: true, classes: true, incentives: true },
    orderBy: { createdAt: "desc" },
  });
  return serializeDecimals(coaches);
}

export async function createCoach(data: z.infer<typeof CoachSchema>) {
  const { incentives, ...parsed } = CoachSchema.parse(data);
  const coach = await prisma.$transaction(async (tx) => {
    const created = await tx.coach.create({ data: parsed });
    if (incentives?.length) {
      await tx.coachIncentive.createMany({
        data: incentives.map((i) => ({ ...i, coachId: created.id })),
      });
    }
    return created;
  });
  revalidatePath("/dashboard/coaches");
  return { success: true, coach };
}

export async function updateCoach(id: string, data: z.infer<typeof CoachSchema>) {
  const { incentives, ...parsed } = CoachSchema.parse(data);
  const coach = await prisma.$transaction(async (tx) => {
    const updated = await tx.coach.update({ where: { id }, data: parsed });
    await tx.coachIncentive.deleteMany({ where: { coachId: id } });
    if (incentives?.length) {
      await tx.coachIncentive.createMany({
        data: incentives.map((i) => ({ ...i, coachId: id })),
      });
    }
    return updated;
  });
  revalidatePath("/dashboard/coaches");
  return { success: true, coach };
}

export async function toggleCoachStatus(id: string, isActive: boolean) {
  await prisma.coach.update({ where: { id }, data: { isActive } });
  revalidatePath("/dashboard/coaches");
  return { success: true };
}
