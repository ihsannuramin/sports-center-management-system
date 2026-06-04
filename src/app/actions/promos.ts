"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { DiscountType } from "@/generated/prisma";

export async function getPromotions() {
  return prisma.promotion.findMany({
    include: { rules: true, _count: { select: { rules: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function createPromotion(data: {
  code: string;
  name: string;
  discountType: DiscountType;
  discountValue: number;
  maxUses?: number;
  startDate?: string;
  endDate?: string;
  conditions?: { condition: string; value?: string }[];
}) {
  const { conditions, startDate, endDate, ...rest } = data;
  const promo = await prisma.promotion.create({
    data: {
      ...rest,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    },
  });

  if (conditions && conditions.length > 0) {
    await prisma.promotionRule.createMany({
      data: conditions.map((c) => ({ ...c, promotionId: promo.id })),
    });
  }

  revalidatePath("/dashboard/promos");
  return promo;
}

export async function updatePromotion(id: string, data: Partial<{ name: string; isActive: boolean; maxUses: number; endDate: string }>) {
  await prisma.promotion.update({
    where: { id },
    data: { ...data, endDate: data.endDate ? new Date(data.endDate) : undefined },
  });
  revalidatePath("/dashboard/promos");
}

export async function validatePromoCode(code: string): Promise<{ valid: boolean; promo?: any; message?: string }> {
  const promo = await prisma.promotion.findUnique({
    where: { code: code.toUpperCase() },
    include: { rules: true },
  });

  if (!promo) return { valid: false, message: "Kode promo tidak ditemukan" };
  if (!promo.isActive) return { valid: false, message: "Kode promo tidak aktif" };
  if (promo.maxUses && promo.usedCount >= promo.maxUses) return { valid: false, message: "Kuota promo telah habis" };

  const now = new Date();
  if (promo.startDate && now < promo.startDate) return { valid: false, message: "Promo belum dimulai" };
  if (promo.endDate && now > promo.endDate) return { valid: false, message: "Promo sudah berakhir" };

  return { valid: true, promo };
}

export async function deletePromotion(id: string) {
  await prisma.promotion.delete({ where: { id } });
  revalidatePath("/dashboard/promos");
}
