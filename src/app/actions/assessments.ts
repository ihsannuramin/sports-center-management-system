"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const AssessmentSchema = z.object({
  studentId: z.string().min(1),
  period: z.string().min(1),
  dribbling: z.number().int().min(0).max(100),
  passing: z.number().int().min(0).max(100),
  shooting: z.number().int().min(0).max(100),
  defense: z.number().int().min(0).max(100),
  stamina: z.number().int().min(0).max(100),
  attitude: z.number().int().min(0).max(100),
  notes: z.string().optional(),
});

export async function getAssessments(studentId?: string) {
  return prisma.assessment.findMany({
    where: studentId ? { studentId } : {},
    include: { student: true },
    orderBy: { assessedAt: "desc" },
  });
}

export async function createAssessment(data: z.infer<typeof AssessmentSchema>) {
  const parsed = AssessmentSchema.parse(data);
  const assessment = await prisma.assessment.create({ data: parsed });
  revalidatePath("/dashboard/assessments");
  return { success: true, assessment };
}

export async function updateAssessment(id: string, data: z.infer<typeof AssessmentSchema>) {
  const parsed = AssessmentSchema.parse(data);
  const assessment = await prisma.assessment.update({ where: { id }, data: parsed });
  revalidatePath("/dashboard/assessments");
  return { success: true, assessment };
}

export async function deleteAssessment(id: string) {
  await prisma.assessment.delete({ where: { id } });
  revalidatePath("/dashboard/assessments");
  return { success: true };
}
