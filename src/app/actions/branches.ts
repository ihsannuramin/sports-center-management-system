"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const BranchSchema = z.object({
  name: z.string().min(2),
  address: z.string().optional(),
  phone: z.string().optional(),
});

export async function getBranches() {
  return prisma.branch.findMany({
    include: {
      _count: {
        select: { students: true, coaches: true, courts: true },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function createBranch(data: z.infer<typeof BranchSchema>) {
  const parsed = BranchSchema.parse(data);
  const branch = await prisma.branch.create({ data: parsed });
  revalidatePath("/dashboard/branches");
  return { success: true, branch };
}

export async function updateBranch(id: string, data: z.infer<typeof BranchSchema>) {
  const parsed = BranchSchema.parse(data);
  const branch = await prisma.branch.update({ where: { id }, data: parsed });
  revalidatePath("/dashboard/branches");
  return { success: true, branch };
}

export async function toggleBranchStatus(id: string, isActive: boolean) {
  await prisma.branch.update({ where: { id }, data: { isActive } });
  revalidatePath("/dashboard/branches");
  return { success: true };
}
