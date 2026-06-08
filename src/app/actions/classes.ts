"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const ClassSchema = z.object({
  name: z.string().min(2),
  ageGroup: z.enum(["U8", "U10", "U12", "U14", "U16", "SENIOR"]),
  schedule: z.string().optional(),
  maxStudents: z.number().int().positive().default(20),
  branchId: z.string().min(1),
  coachId: z.string().optional(),
});

export async function getClasses(branchId?: string) {
  return prisma.class.findMany({
    where: branchId ? { branchId } : {},
    include: { branch: true, coach: true, _count: { select: { students: true } } },
    orderBy: { ageGroup: "asc" },
  });
}

export async function getClassesForAttendance() {
  return prisma.class.findMany({
    where: { isActive: true },
    include: {
      branch: true,
      coach: true,
      students: {
        where: { status: "ACTIVE" },
        select: { id: true, name: true, studentNumber: true },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { ageGroup: "asc" },
  });
}

export async function createClass(data: z.infer<typeof ClassSchema>) {
  const parsed = ClassSchema.parse(data);
  const cls = await prisma.class.create({ data: parsed });
  revalidatePath("/dashboard/classes");
  return { success: true, cls };
}

export async function updateClass(id: string, data: z.infer<typeof ClassSchema>) {
  const parsed = ClassSchema.parse(data);
  const cls = await prisma.class.update({ where: { id }, data: parsed });
  revalidatePath("/dashboard/classes");
  return { success: true, cls };
}

export async function deleteClass(id: string) {
  await prisma.class.delete({ where: { id } });
  revalidatePath("/dashboard/classes");
  return { success: true };
}
