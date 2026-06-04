"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const InvoiceSchema = z.object({
  studentId: z.string().min(1),
  type: z.enum(["REGISTRATION", "MONTHLY", "TOURNAMENT", "MERCHANDISE"]),
  amount: z.number().positive(),
  dueDate: z.string(),
  description: z.string().optional(),
});

function generateInvoiceNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `INV-${year}${month}-${random}`;
}

export async function getInvoices(filters?: { studentId?: string; status?: string }) {
  return prisma.invoice.findMany({
    where: {
      ...(filters?.studentId ? { studentId: filters.studentId } : {}),
      ...(filters?.status ? { status: filters.status as any } : {}),
    },
    include: { student: { include: { branch: true } }, payments: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createInvoice(data: z.infer<typeof InvoiceSchema>) {
  const parsed = InvoiceSchema.parse(data);
  const invoiceNumber = generateInvoiceNumber();

  const invoice = await prisma.invoice.create({
    data: {
      ...parsed,
      invoiceNumber,
      amount: parsed.amount,
      dueDate: new Date(parsed.dueDate),
    },
  });

  revalidatePath("/dashboard/invoices");
  return { success: true, invoice };
}

export async function updateInvoiceStatus(id: string, status: string) {
  await prisma.invoice.update({ where: { id }, data: { status: status as any } });
  revalidatePath("/dashboard/invoices");
  return { success: true };
}

export async function deleteInvoice(id: string) {
  await prisma.invoice.delete({ where: { id } });
  revalidatePath("/dashboard/invoices");
  return { success: true };
}

export async function bulkCreateMonthlyInvoices(data: {
  amount: number;
  dueDate: string;
  description?: string;
  branchId?: string;
}) {
  const students = await prisma.student.findMany({
    where: {
      status: "ACTIVE",
      ...(data.branchId ? { branchId: data.branchId } : {}),
    },
    select: { id: true },
  });

  if (students.length === 0) {
    return { success: false, error: "Tidak ada siswa aktif", count: 0 };
  }

  const invoices = await prisma.$transaction(
    students.map((s) =>
      prisma.invoice.create({
        data: {
          invoiceNumber: generateInvoiceNumber(),
          studentId: s.id,
          type: "MONTHLY",
          amount: data.amount,
          dueDate: new Date(data.dueDate),
          description: data.description,
        },
      })
    )
  );

  revalidatePath("/dashboard/invoices");
  return { success: true, count: invoices.length };
}
