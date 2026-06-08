"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getClassWaitlists(classId?: string) {
  return prisma.classWaitlist.findMany({
    where: classId ? { classId } : undefined,
    include: { class: { select: { name: true } } },
    orderBy: [{ classId: "asc" }, { position: "asc" }],
  });
}

export async function addToClassWaitlist(data: { classId: string; name: string; phone: string; email?: string }) {
  const last = await prisma.classWaitlist.findFirst({
    where: { classId: data.classId },
    orderBy: { position: "desc" },
  });
  const position = (last?.position ?? 0) + 1;
  await prisma.classWaitlist.create({ data: { ...data, position } });
  revalidatePath("/dashboard/waitlists");
}

export async function getRentalWaitlists(courtId?: string) {
  return prisma.rentalWaitlist.findMany({
    where: courtId ? { courtId } : undefined,
    include: { court: { select: { name: true } } },
    orderBy: [{ courtId: "asc" }, { position: "asc" }],
  });
}

export async function addToRentalWaitlist(data: {
  courtId: string;
  name: string;
  phone: string;
  date: string;
  startTime: string;
  endTime: string;
}) {
  const last = await prisma.rentalWaitlist.findFirst({
    where: { courtId: data.courtId },
    orderBy: { position: "desc" },
  });
  const position = (last?.position ?? 0) + 1;
  await prisma.rentalWaitlist.create({
    data: {
      ...data,
      date: new Date(data.date),
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
      position,
    },
  });
  revalidatePath("/dashboard/waitlists");
}

export async function promoteFromWaitlist(id: string, type: "class" | "rental") {
  if (type === "class") {
    await prisma.classWaitlist.update({ where: { id }, data: { status: "PROMOTED", notifiedAt: new Date() } });
  } else {
    await prisma.rentalWaitlist.update({ where: { id }, data: { status: "PROMOTED", notifiedAt: new Date() } });
  }
  revalidatePath("/dashboard/waitlists");
}

export async function cancelWaitlist(id: string, type: "class" | "rental") {
  if (type === "class") {
    await prisma.classWaitlist.update({ where: { id }, data: { status: "CANCELLED" } });
  } else {
    await prisma.rentalWaitlist.update({ where: { id }, data: { status: "CANCELLED" } });
  }
  revalidatePath("/dashboard/waitlists");
}
