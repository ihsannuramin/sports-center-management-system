"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const StudentSchema = z.object({
  name: z.string().min(2),
  birthDate: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE"]),
  phone: z.string().optional(),
  parentName: z.string().optional(),
  parentPhone: z.string().optional(),
  address: z.string().optional(),
  branchId: z.string().min(1),
  classId: z.string().optional(),
});

function generateStudentNumber() {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `STD-${year}-${random}`;
}

export async function getStudents(branchId?: string, search?: string) {
  return prisma.student.findMany({
    where: {
      ...(branchId ? { branchId } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { studentNumber: { contains: search, mode: "insensitive" } },
              { parentName: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { class: true, branch: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createStudent(data: z.infer<typeof StudentSchema>) {
  const parsed = StudentSchema.parse(data);
  const studentNumber = generateStudentNumber();

  const student = await prisma.student.create({
    data: {
      ...parsed,
      studentNumber,
      birthDate: parsed.birthDate ? new Date(parsed.birthDate) : undefined,
    },
  });

  revalidatePath("/dashboard/students");
  return { success: true, student };
}

export async function updateStudent(id: string, data: z.infer<typeof StudentSchema>) {
  const parsed = StudentSchema.parse(data);

  const student = await prisma.student.update({
    where: { id },
    data: {
      ...parsed,
      birthDate: parsed.birthDate ? new Date(parsed.birthDate) : undefined,
    },
  });

  revalidatePath("/dashboard/students");
  return { success: true, student };
}

export async function suspendStudent(id: string) {
  await prisma.student.update({
    where: { id },
    data: { status: "SUSPENDED" },
  });
  revalidatePath("/dashboard/students");
  return { success: true };
}

export async function activateStudent(id: string) {
  await prisma.student.update({
    where: { id },
    data: { status: "ACTIVE" },
  });
  revalidatePath("/dashboard/students");
  return { success: true };
}

export async function deleteStudent(id: string) {
  await prisma.student.delete({ where: { id } });
  revalidatePath("/dashboard/students");
  return { success: true };
}
