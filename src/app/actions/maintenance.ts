"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { MaintenanceStatus, Priority } from "@/generated/prisma";

export async function getMaintenanceTickets(branchId?: string, status?: MaintenanceStatus) {
  return prisma.maintenanceTicket.findMany({
    where: {
      ...(branchId ? { branchId } : {}),
      ...(status ? { status } : {}),
    },
    include: {
      branch: { select: { name: true } },
      asset: { select: { name: true, category: true } },
      assignee: { select: { name: true } },
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });
}

export async function createMaintenanceTicket(data: {
  title: string;
  description?: string;
  priority: Priority;
  branchId: string;
  assetId?: string;
  assignedTo?: string;
}) {
  await prisma.maintenanceTicket.create({ data });
  revalidatePath("/dashboard/maintenance");
}

export async function updateTicketStatus(id: string, status: MaintenanceStatus, resolutionNote?: string) {
  await prisma.maintenanceTicket.update({
    where: { id },
    data: {
      status,
      resolvedAt: status === "COMPLETED" ? new Date() : undefined,
      resolutionNote: resolutionNote ?? undefined,
    },
  });
  revalidatePath("/dashboard/maintenance");
}

export async function updateTicket(id: string, data: Partial<{ title: string; description: string; priority: Priority; assignedTo: string; assetId: string }>) {
  await prisma.maintenanceTicket.update({ where: { id }, data });
  revalidatePath("/dashboard/maintenance");
}

export async function deleteTicket(id: string) {
  await prisma.maintenanceTicket.delete({ where: { id } });
  revalidatePath("/dashboard/maintenance");
}
