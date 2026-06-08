"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";

const RegistrationSchema = z.object({
  // Student data
  studentName: z.string().min(2),
  birthDate: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE"]),
  phone: z.string().optional(),
  address: z.string().optional(),
  classId: z.string().optional(),
  branchId: z.string().min(1),

  // Parent data
  parentName: z.string().min(2),
  parentPhone: z.string().min(8),
  parentEmail: z.string().email().optional().or(z.literal("")),
  parentAddress: z.string().optional(),
});

function generateStudentNumber() {
  const y = new Date().getFullYear();
  const r = Math.floor(Math.random() * 90000) + 10000;
  return `STD-${y}-${r}`;
}

export async function submitRegistration(data: z.infer<typeof RegistrationSchema>) {
  const parsed = RegistrationSchema.parse(data);

  // Create or find parent
  let parent = await prisma.parent.findFirst({
    where: { phone: parsed.parentPhone },
  });

  if (!parent) {
    parent = await prisma.parent.create({
      data: {
        fullName: parsed.parentName,
        phone: parsed.parentPhone,
        email: parsed.parentEmail || null,
        address: parsed.parentAddress || null,
        branchId: parsed.branchId,
      },
    });
  }

  // Create student
  const student = await prisma.student.create({
    data: {
      studentNumber: generateStudentNumber(),
      name: parsed.studentName,
      birthDate: parsed.birthDate ? new Date(parsed.birthDate) : undefined,
      gender: parsed.gender,
      phone: parsed.phone || null,
      address: parsed.address || null,
      parentId: parent.id,
      parentName: parsed.parentName,
      parentPhone: parsed.parentPhone,
      branchId: parsed.branchId,
      classId: parsed.classId || null,
      status: "ACTIVE",
    },
    include: { branch: true, class: true },
  });

  return { success: true, student, parent };
}

export async function getRegistrationData() {
  const [branches, classes, businessName] = await Promise.all([
    prisma.branch.findMany({ where: { isActive: true }, select: { id: true, name: true } }),
    prisma.class.findMany({
      where: { isActive: true },
      select: { id: true, name: true, ageGroup: true, branchId: true, maxStudents: true, _count: { select: { students: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.systemSetting.findUnique({ where: { key: "business_name" } }),
  ]);

  return {
    branches,
    classes,
    businessName: businessName?.value ?? "Sports Center",
  };
}
