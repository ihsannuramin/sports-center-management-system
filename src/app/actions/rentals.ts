"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { serializeDecimals } from "@/lib/serialize";

const RentalSchema = z.object({
  courtId: z.string().min(1),
  branchId: z.string().min(1),
  customerName: z.string().min(2),
  customerPhone: z.string().min(8),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  pricePerHour: z.number().positive(),
  notes: z.string().optional(),
});

function generateBookingNumber() {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const r = Math.floor(Math.random() * 9000) + 1000;
  return `BK-${y}${m}${d}-${r}`;
}

function findClassConflict(
  classes: { id: string; name: string; schedule: string | null }[],
  courtId: string,
  date: string,
  startTime: string,
  endTime: string
) {
  const dayOfWeek = new Date(`${date}T${startTime}`).getDay();
  const [rsh, rsm] = startTime.split(":").map(Number);
  const [reh, rem] = endTime.split(":").map(Number);
  const rentalStart = rsh * 60 + rsm;
  const rentalEnd = reh * 60 + rem;

  for (const cls of classes) {
    if (!cls.schedule) continue;
    try {
      const sched = JSON.parse(cls.schedule);
      if (!sched.courtId || sched.courtId !== courtId) continue;
      if (!Array.isArray(sched.days) || !sched.days.includes(dayOfWeek)) continue;
      const [sh, sm] = (sched.startTime as string).split(":").map(Number);
      const [eh, em] = (sched.endTime as string).split(":").map(Number);
      const classStart = sh * 60 + sm;
      const classEnd = eh * 60 + em;
      if (rentalStart < classEnd && rentalEnd > classStart) return cls;
    } catch {
      continue;
    }
  }
  return null;
}

export async function getRentals(filters?: { status?: string; courtId?: string; date?: string }) {
  const data = await prisma.rentalBooking.findMany({
    where: {
      ...(filters?.status ? { status: filters.status as any } : {}),
      ...(filters?.courtId ? { courtId: filters.courtId } : {}),
      ...(filters?.date
        ? {
            date: {
              gte: new Date(new Date(filters.date).setHours(0, 0, 0, 0)),
              lte: new Date(new Date(filters.date).setHours(23, 59, 59, 999)),
            },
          }
        : {}),
    },
    include: { court: true, branch: true, payments: true },
    orderBy: { date: "desc" },
  });
  return serializeDecimals(data);
}

export async function checkAvailability(
  courtId: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeId?: string
) {
  const start = new Date(`${date}T${startTime}`);
  const end = new Date(`${date}T${endTime}`);

  const [conflictingBooking, conflictingSchedule, activeClasses] = await Promise.all([
    prisma.rentalBooking.findFirst({
      where: {
        courtId,
        id: excludeId ? { not: excludeId } : undefined,
        status: { in: ["PENDING", "CONFIRMED"] },
        OR: [
          { startTime: { gte: start, lt: end } },
          { endTime: { gt: start, lte: end } },
          { startTime: { lte: start }, endTime: { gte: end } },
        ],
      },
    }),
    prisma.courtSchedule.findFirst({
      where: {
        courtId,
        type: { in: ["MAINTENANCE", "ACADEMY"] },
        OR: [
          { startTime: { gte: start, lt: end } },
          { endTime: { gt: start, lte: end } },
          { startTime: { lte: start }, endTime: { gte: end } },
        ],
      },
    }),
    prisma.class.findMany({
      where: { isActive: true },
      select: { id: true, name: true, schedule: true },
    }),
  ]);

  const conflictingClass = findClassConflict(activeClasses, courtId, date, startTime, endTime);

  return {
    available: !conflictingBooking && !conflictingSchedule && !conflictingClass,
    conflictBooking: conflictingBooking,
    conflictSchedule: conflictingSchedule,
    conflictClass: conflictingClass,
  };
}

export async function createRental(data: z.infer<typeof RentalSchema>) {
  const parsed = RentalSchema.parse(data);
  const start = new Date(`${parsed.date}T${parsed.startTime}`);
  const end = new Date(`${parsed.date}T${parsed.endTime}`);
  const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  const totalAmount = durationHours * parsed.pricePerHour;

  const availability = await checkAvailability(
    parsed.courtId,
    parsed.date,
    parsed.startTime,
    parsed.endTime
  );

  if (!availability.available) {
    let error = "Lapangan tidak tersedia pada waktu yang dipilih";
    if (availability.conflictClass) {
      error = `Lapangan digunakan untuk kelas "${availability.conflictClass.name}" pada waktu ini`;
    } else if (availability.conflictSchedule?.type === "MAINTENANCE") {
      error = "Lapangan sedang dalam perawatan";
    } else if (availability.conflictSchedule?.type === "ACADEMY") {
      error = "Lapangan digunakan untuk latihan akademi";
    }
    return { success: false, error };
  }

  const booking = await prisma.rentalBooking.create({
    data: {
      bookingNumber: generateBookingNumber(),
      courtId: parsed.courtId,
      branchId: parsed.branchId,
      customerName: parsed.customerName,
      customerPhone: parsed.customerPhone,
      date: new Date(parsed.date),
      startTime: start,
      endTime: end,
      duration: Math.ceil(durationHours),
      pricePerHour: parsed.pricePerHour,
      totalAmount,
      notes: parsed.notes,
    },
  });

  revalidatePath("/dashboard/rentals");
  return { success: true, booking };
}

export async function updateBookingStatus(id: string, status: string) {
  await prisma.rentalBooking.update({ where: { id }, data: { status: status as any } });
  revalidatePath("/dashboard/rentals");
  return { success: true };
}
