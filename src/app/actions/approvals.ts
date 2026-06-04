"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ApprovalType } from "@/generated/prisma";

export async function getApprovalRequests(status?: string) {
  return prisma.approvalRequest.findMany({
    where: status ? { status: status as any } : undefined,
    include: {
      requester: { select: { name: true, email: true } },
      approver: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createApprovalRequest(data: {
  type: ApprovalType;
  requesterId?: string;
  entityId?: string;
  entityType?: string;
  reason?: string;
  amount?: number;
}) {
  const req = await prisma.approvalRequest.create({ data });
  revalidatePath("/dashboard/approvals");
  return req;
}

export async function approveRequest(id: string, approverId: string, reviewNote?: string) {
  await prisma.approvalRequest.update({
    where: { id },
    data: { status: "APPROVED", approverId, reviewNote },
  });
  revalidatePath("/dashboard/approvals");
}

export async function rejectRequest(id: string, approverId: string, reviewNote?: string) {
  await prisma.approvalRequest.update({
    where: { id },
    data: { status: "REJECTED", approverId, reviewNote },
  });
  revalidatePath("/dashboard/approvals");
}

export async function deleteApprovalRequest(id: string) {
  await prisma.approvalRequest.delete({ where: { id } });
  revalidatePath("/dashboard/approvals");
}
