"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { MembershipType } from "@prisma/client";

export async function getMembershipPlans() {
  return prisma.membershipPlan.findMany({
    include: { _count: { select: { studentMemberships: true } } },
    orderBy: { type: "asc" },
  });
}

export async function createMembershipPlan(data: {
  name: string;
  type: MembershipType;
  durationDays: number;
  price: number;
  description?: string;
}) {
  await prisma.membershipPlan.create({ data });
  revalidatePath("/dashboard/memberships");
}

export async function updateMembershipPlan(id: string, data: Partial<{ name: string; price: number; description: string; isActive: boolean }>) {
  await prisma.membershipPlan.update({ where: { id }, data });
  revalidatePath("/dashboard/memberships");
}

export async function getStudentMemberships(studentId?: string) {
  return prisma.studentMembership.findMany({
    where: studentId ? { studentId } : undefined,
    include: {
      student: { select: { name: true, studentNumber: true } },
      plan: { select: { name: true, type: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function assignMembership(data: {
  studentId: string;
  planId: string;
  startDate: string;
  autoRenew?: boolean;
}) {
  const plan = await prisma.membershipPlan.findUnique({ where: { id: data.planId } });
  if (!plan) throw new Error("Plan tidak ditemukan");

  const startDate = new Date(data.startDate);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + plan.durationDays);

  await prisma.studentMembership.create({
    data: {
      studentId: data.studentId,
      planId: data.planId,
      startDate,
      endDate,
      autoRenew: data.autoRenew ?? false,
    },
  });
  revalidatePath("/dashboard/memberships");
}

export async function getRentalPackages() {
  return prisma.rentalPackage.findMany({ orderBy: { hours: "asc" } });
}

export async function createRentalPackage(data: {
  name: string;
  hours: number;
  price: number;
  validDays?: number;
  description?: string;
}) {
  await prisma.rentalPackage.create({ data });
  revalidatePath("/dashboard/memberships");
}

export async function updateRentalPackage(id: string, data: Partial<{ name: string; hours: number; price: number; isActive: boolean }>) {
  await prisma.rentalPackage.update({ where: { id }, data });
  revalidatePath("/dashboard/memberships");
}
