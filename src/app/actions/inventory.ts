"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const InventorySchema = z.object({
  name: z.string().min(2),
  category: z.enum(["BALL", "CONE", "JERSEY", "EQUIPMENT", "OTHER"]),
  quantity: z.number().int().min(0),
  minStock: z.number().int().min(0),
  unit: z.string().default("pcs"),
  description: z.string().optional(),
  branchId: z.string().min(1),
});

export async function getInventory(branchId?: string) {
  return prisma.inventory.findMany({
    where: branchId ? { branchId } : {},
    include: { branch: true },
    orderBy: { category: "asc" },
  });
}

export async function createInventoryItem(data: z.infer<typeof InventorySchema>) {
  const parsed = InventorySchema.parse(data);
  const item = await prisma.inventory.create({ data: parsed });
  revalidatePath("/dashboard/inventory");
  return { success: true, item };
}

export async function updateInventoryItem(id: string, data: z.infer<typeof InventorySchema>) {
  const parsed = InventorySchema.parse(data);
  const item = await prisma.inventory.update({ where: { id }, data: parsed });
  revalidatePath("/dashboard/inventory");
  return { success: true, item };
}

export async function deleteInventoryItem(id: string) {
  await prisma.inventory.delete({ where: { id } });
  revalidatePath("/dashboard/inventory");
  return { success: true };
}
