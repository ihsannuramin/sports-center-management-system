"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getAttendingStudentIds } from "@/lib/period";

export async function getSppBatches() {
  const batches = await prisma.sppBatch.findMany({
    include: { class: { select: { id: true, name: true } }, details: true },
    orderBy: [{ period: "desc" }, { createdAt: "desc" }],
  });

  return batches.map((b) => {
    const totalStudents = b.details.length;
    const paidCount = b.details.filter((d) => d.status === "PAID").length;
    const totalBilled = b.details.reduce((s, d) => s + Number(d.amount), 0);
    const totalPaid = b.details
      .filter((d) => d.status === "PAID")
      .reduce((s, d) => s + Number(d.amount), 0);
    return {
      id: b.id,
      period: b.period,
      classId: b.classId,
      className: b.class.name,
      totalStudents,
      paidCount,
      unpaidCount: totalStudents - paidCount,
      totalBilled,
      totalPaid,
    };
  });
}

export async function getSppBatchDetail(batchId: string) {
  const batch = await prisma.sppBatch.findUnique({
    where: { id: batchId },
    include: {
      class: { select: { id: true, name: true, sppAmount: true } },
      details: {
        include: { student: { select: { id: true, name: true, studentNumber: true } } },
        orderBy: { student: { name: "asc" } },
      },
    },
  });
  if (!batch) return null;

  return {
    id: batch.id,
    period: batch.period,
    classId: batch.classId,
    className: batch.class.name,
    rows: batch.details.map((d) => ({
      id: d.id,
      studentId: d.studentId,
      studentName: d.student.name,
      studentNumber: d.student.studentNumber,
      baseAmount: Number(d.baseAmount),
      discountAmount: Number(d.discountAmount),
      amount: Number(d.amount),
      status: d.status,
      proofUrl: d.proofUrl,
      paidAt: d.paidAt,
    })),
  };
}

export async function previewSppGeneration(classId: string, period: string) {
  const cls = await prisma.class.findUnique({ where: { id: classId } });
  if (!cls) throw new Error("Kelas tidak ditemukan");

  const activeStudents = await prisma.student.findMany({
    where: { classId, status: "ACTIVE" },
    select: { id: true, name: true, studentNumber: true },
    orderBy: { name: "asc" },
  });

  const sppAmount = cls.sppAmount != null ? Number(cls.sppAmount) : null;
  if (activeStudents.length === 0) return { sppAmount, rows: [] };

  const attendingIds = await getAttendingStudentIds(classId, period);
  const students = activeStudents.filter((s) => attendingIds.has(s.id));
  if (students.length === 0) return { sppAmount, rows: [] };

  const billedElsewhere = await prisma.sppBatchDetail.findMany({
    where: { studentId: { in: students.map((s) => s.id) }, batch: { period } },
    select: { studentId: true },
  });
  const billedIds = new Set(billedElsewhere.map((b) => b.studentId));

  const rows = students.map((s) => ({
    studentId: s.id,
    studentName: s.name,
    studentNumber: s.studentNumber,
    baseAmount: sppAmount ?? 0,
    billedElsewhere: billedIds.has(s.id),
  }));

  return { sppAmount, rows };
}

export async function generateSppBatch(classId: string, period: string) {
  const cls = await prisma.class.findUnique({ where: { id: classId } });
  if (!cls) throw new Error("Kelas tidak ditemukan");
  if (cls.sppAmount == null) throw new Error("Biaya SPP kelas ini belum diisi. Lengkapi dulu di Data Kelas.");

  const activeStudents = await prisma.student.findMany({
    where: { classId, status: "ACTIVE" },
    select: { id: true },
  });
  if (activeStudents.length === 0) {
    return { success: false, error: "Tidak ada siswa aktif di kelas ini", created: 0, skipped: 0 };
  }

  const attendingIds = await getAttendingStudentIds(classId, period);
  const students = activeStudents.filter((s) => attendingIds.has(s.id));
  if (students.length === 0) {
    return {
      success: false,
      error: "Tidak ada siswa yang hadir minimal 1x di kelas ini untuk periode ini",
      created: 0,
      skipped: 0,
    };
  }

  const billedElsewhere = await prisma.sppBatchDetail.findMany({
    where: { studentId: { in: students.map((s) => s.id) }, batch: { period } },
    select: { studentId: true },
  });
  const billedIds = new Set(billedElsewhere.map((b) => b.studentId));
  const toBill = students.filter((s) => !billedIds.has(s.id));

  if (toBill.length === 0) {
    return {
      success: false,
      error: "Semua siswa aktif di kelas ini sudah ditagih untuk periode ini",
      created: 0,
      skipped: billedIds.size,
    };
  }

  const batch = await prisma.sppBatch.upsert({
    where: { classId_period: { classId, period } },
    create: { classId, period },
    update: {},
  });

  await prisma.$transaction(
    toBill.map((s) =>
      prisma.sppBatchDetail.create({
        data: {
          batchId: batch.id,
          studentId: s.id,
          baseAmount: cls.sppAmount!,
          discountAmount: 0,
          amount: cls.sppAmount!,
          status: "UNPAID",
        },
      })
    )
  );

  revalidatePath("/dashboard/spp");
  return { success: true, created: toBill.length, skipped: billedIds.size, totalStudents: students.length };
}

export async function setSppDiscount(detailId: string, discountAmount: number) {
  const detail = await prisma.sppBatchDetail.findUnique({ where: { id: detailId } });
  if (!detail) throw new Error("Data tidak ditemukan");
  if (detail.status === "PAID") throw new Error("Batalkan status lunas dulu sebelum mengubah diskon");

  const base = Number(detail.baseAmount);
  if (discountAmount < 0 || discountAmount > base) throw new Error("Nilai diskon tidak valid");
  const amount = Math.max(0, base - discountAmount);

  await prisma.sppBatchDetail.update({ where: { id: detailId }, data: { discountAmount, amount } });
  revalidatePath("/dashboard/spp");
  return { success: true };
}

export async function markSppPaid(detailId: string, proofUrl?: string) {
  await prisma.sppBatchDetail.update({
    where: { id: detailId },
    data: { status: "PAID", paidAt: new Date(), proofUrl: proofUrl ?? undefined },
  });
  revalidatePath("/dashboard/spp");
  return { success: true };
}

export async function markSppUnpaid(detailId: string) {
  await prisma.sppBatchDetail.update({
    where: { id: detailId },
    data: { status: "UNPAID", paidAt: null },
  });
  revalidatePath("/dashboard/spp");
  return { success: true };
}
