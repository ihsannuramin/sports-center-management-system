"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { TrialStatus } from "@prisma/client";

export async function getTrialClasses() {
  return prisma.trialClass.findMany({
    include: {
      class: { select: { name: true, branch: { select: { name: true } } } },
      _count: { select: { participants: true } },
    },
    orderBy: { date: "desc" },
  });
}

export async function createTrialClass(data: { classId: string; date: string; maxSlots: number; notes?: string }) {
  const trial = await prisma.trialClass.create({
    data: { ...data, date: new Date(data.date) },
  });
  revalidatePath("/dashboard/trial-classes");
  return trial;
}

export async function getTrialParticipants(trialClassId: string) {
  return prisma.trialParticipant.findMany({
    where: { trialClassId },
    include: { lead: { select: { fullName: true, stage: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function addTrialParticipant(data: {
  trialClassId: string;
  name: string;
  phone: string;
  email?: string;
  leadId?: string;
}) {
  await prisma.trialParticipant.create({ data });
  revalidatePath("/dashboard/trial-classes");
}

export async function updateParticipantStatus(id: string, status: TrialStatus, coachNote?: string) {
  const data: any = { status };
  if (status === "ATTENDED") data.attended = true;
  if (status === "CONVERTED") data.convertedAt = new Date();
  if (coachNote) data.coachNote = coachNote;
  await prisma.trialParticipant.update({ where: { id }, data });
  revalidatePath("/dashboard/trial-classes");
}

export async function deleteTrialClass(id: string) {
  await prisma.trialClass.delete({ where: { id } });
  revalidatePath("/dashboard/trial-classes");
}
