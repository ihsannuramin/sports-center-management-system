"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getAssets(branchId?: string) {
  return prisma.asset.findMany({
    where: branchId ? { branchId } : undefined,
    include: {
      branch: { select: { name: true } },
      _count: { select: { maintenanceTickets: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createAsset(data: {
  name: string;
  category: string;
  branchId: string;
  purchaseDate?: string;
  cost?: number;
  depreciation?: number;
  warrantyExpiry?: string;
  condition?: string;
  description?: string;
}) {
  await prisma.asset.create({
    data: {
      ...data,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
      warrantyExpiry: data.warrantyExpiry ? new Date(data.warrantyExpiry) : undefined,
    },
  });
  revalidatePath("/dashboard/assets");
}

export async function updateAsset(id: string, data: Partial<{
  name: string;
  category: string;
  condition: string;
  depreciation: number;
  warrantyExpiry: string;
  description: string;
}>) {
  await prisma.asset.update({
    where: { id },
    data: {
      ...data,
      warrantyExpiry: data.warrantyExpiry ? new Date(data.warrantyExpiry) : undefined,
    },
  });
  revalidatePath("/dashboard/assets");
}

export async function deleteAsset(id: string) {
  await prisma.asset.delete({ where: { id } });
  revalidatePath("/dashboard/assets");
}
