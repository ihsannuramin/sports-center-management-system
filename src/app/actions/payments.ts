"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const PaymentSchema = z.object({
  invoiceId: z.string().optional(),
  bookingId: z.string().optional(),
  amount: z.number().positive(),
  method: z.enum(["TRANSFER", "CASH"]),
  notes: z.string().optional(),
});

export async function getPayments(status?: string) {
  return prisma.payment.findMany({
    where: status ? { status: status as any } : {},
    include: {
      invoice: { include: { student: true } },
      booking: true,
      verifier: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createPayment(data: z.infer<typeof PaymentSchema>) {
  const parsed = PaymentSchema.parse(data);
  const payment = await prisma.payment.create({ data: parsed });
  revalidatePath("/dashboard/payments");
  return { success: true, payment };
}

export async function verifyPayment(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let verifiedBy: string | undefined;
  if (user) {
    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id }, select: { id: true } });
    verifiedBy = dbUser?.id;
  }

  const payment = await prisma.payment.update({
    where: { id },
    data: {
      status: "VERIFIED",
      verifiedAt: new Date(),
      verifiedBy,
    },
  });

  // Mark invoice as paid if linked
  if (payment.invoiceId) {
    await prisma.invoice.update({
      where: { id: payment.invoiceId },
      data: { status: "PAID" },
    });
  }

  // Confirm booking if linked
  if (payment.bookingId) {
    await prisma.rentalBooking.update({
      where: { id: payment.bookingId },
      data: { status: "CONFIRMED" },
    });
  }

  revalidatePath("/dashboard/payments");
  return { success: true };
}

export async function rejectPayment(id: string) {
  await prisma.payment.update({ where: { id }, data: { status: "REJECTED" } });
  revalidatePath("/dashboard/payments");
  return { success: true };
}
