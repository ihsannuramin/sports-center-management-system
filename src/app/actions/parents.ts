"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { CommChannel, CommDirection } from "@prisma/client";

export async function getParents(branchId?: string) {
  return prisma.parent.findMany({
    where: branchId ? { branchId } : undefined,
    include: {
      branch: { select: { name: true } },
      students: { select: { id: true, name: true, studentNumber: true } },
      _count: { select: { parentNotes: true, parentCommunications: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getParentById(id: string) {
  return prisma.parent.findUnique({
    where: { id },
    include: {
      students: true,
      parentNotes: { orderBy: { createdAt: "desc" } },
      parentCommunications: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function createParent(data: { fullName: string; phone: string; email?: string; address?: string; notes?: string; branchId?: string }) {
  const parent = await prisma.parent.create({ data });
  revalidatePath("/dashboard/parents");
  return parent;
}

export async function updateParent(id: string, data: Partial<{ fullName: string; phone: string; email: string; address: string; notes: string }>) {
  await prisma.parent.update({ where: { id }, data });
  revalidatePath("/dashboard/parents");
}

export async function linkStudentToParent(parentId: string, studentId: string) {
  await prisma.student.update({ where: { id: studentId }, data: { parentId } });
  revalidatePath("/dashboard/parents");
}

export async function addParentNote(parentId: string, note: string) {
  await prisma.parentNote.create({ data: { parentId, note } });
  revalidatePath("/dashboard/parents");
}

export async function addParentCommunication(data: { parentId: string; channel: CommChannel; direction: CommDirection; subject?: string; message: string }) {
  await prisma.parentCommunication.create({ data });
  revalidatePath("/dashboard/parents");
}

export async function deleteParent(id: string) {
  await prisma.parent.delete({ where: { id } });
  revalidatePath("/dashboard/parents");
}