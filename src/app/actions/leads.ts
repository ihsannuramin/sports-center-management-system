"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { LeadSource, LeadStage } from "@/generated/prisma";

export async function getLeads(branchId?: string) {
  return prisma.lead.findMany({
    where: branchId ? { branchId } : undefined,
    include: {
      branch: { select: { name: true } },
      assignee: { select: { name: true } },
      _count: { select: { activities: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createLead(data: { fullName: string; phone: string; email?: string; source: LeadSource; notes?: string; branchId?: string }) {
  const lead = await prisma.lead.create({ data });
  await prisma.leadActivity.create({ data: { leadId: lead.id, action: "Lead created", note: `Source: ${data.source}` } });
  revalidatePath("/dashboard/leads");
  return lead;
}

export async function updateLeadStage(id: string, stage: LeadStage, note?: string) {
  const old = await prisma.lead.findUnique({ where: { id }, select: { stage: true } });
  await prisma.lead.update({ where: { id }, data: { stage, convertedAt: stage === "ACTIVE" ? new Date() : undefined } });
  await prisma.leadActivity.create({ data: { leadId: id, action: `Stage: ${old?.stage} → ${stage}`, note } });
  revalidatePath("/dashboard/leads");
}

export async function updateLead(id: string, data: Partial<{ fullName: string; phone: string; email: string; source: LeadSource; notes: string; followUpAt: string; assignedTo: string }>) {
  await prisma.lead.update({
    where: { id },
    data: { ...data, followUpAt: data.followUpAt ? new Date(data.followUpAt) : undefined },
  });
  revalidatePath("/dashboard/leads");
}

export async function addLeadActivity(leadId: string, action: string, note?: string) {
  await prisma.leadActivity.create({ data: { leadId, action, note } });
  revalidatePath("/dashboard/leads");
}

export async function deleteLead(id: string) {
  await prisma.lead.delete({ where: { id } });
  revalidatePath("/dashboard/leads");
}

export async function getLeadFunnel(branchId?: string) {
  const stages = ["LEAD","CONTACTED","TRIAL","REGISTERED","ACTIVE"] as LeadStage[];
  const counts = await prisma.lead.groupBy({
    by: ["stage"],
    where: branchId ? { branchId } : undefined,
    _count: true,
  });
  return stages.map(stage => ({ stage, count: counts.find(c => c.stage === stage)?._count ?? 0 }));
}