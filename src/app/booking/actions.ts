"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";

const PublicBookingSchema = z.object({
  courtId: z.string().min(1),
  customerName: z.string().min(2),
  customerPhone: z.string().min(8),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  notes: z.string().optional(),
});

const DEFAULT_PRICE_PER_HOUR = 100000;

function generateBookingNumber() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const r = Math.floor(Math.random() * 9000) + 1000;
  return `BK-${y}${m}${day}-${r}`;
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

export async function checkPublicAvailability(courtId: string, date: string, startTime: string, endTime: string) {
  const start = new Date(`${date}T${startTime}`);
  const end = new Date(`${date}T${endTime}`);

  const [conflictBooking, conflictSchedule, activeClasses] = await Promise.all([
    prisma.rentalBooking.findFirst({
      where: {
        courtId,
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

  const conflictClass = findClassConflict(activeClasses, courtId, date, startTime, endTime);
  const available = !conflictBooking && !conflictSchedule && !conflictClass;

  let reason: string | undefined;
  if (!available) {
    if (conflictClass) {
      reason = "Lapangan digunakan untuk jadwal latihan";
    } else if (conflictSchedule?.type === "MAINTENANCE") {
      reason = "Lapangan sedang dalam perawatan";
    } else if (conflictSchedule?.type === "ACADEMY") {
      reason = "Lapangan digunakan untuk latihan akademi";
    } else {
      reason = "Sudah ada booking lain pada waktu ini";
    }
  }

  return { available, reason };
}

export async function createPublicBooking(data: z.infer<typeof PublicBookingSchema>) {
  const parsed = PublicBookingSchema.parse(data);
  const start = new Date(`${parsed.date}T${parsed.startTime}`);
  const end = new Date(`${parsed.date}T${parsed.endTime}`);

  if (end <= start) {
    return { success: false, error: "Waktu selesai harus lebih besar dari waktu mulai" };
  }

  const avail = await checkPublicAvailability(parsed.courtId, parsed.date, parsed.startTime, parsed.endTime);
  if (!avail.available) {
    return { success: false, error: "Lapangan tidak tersedia pada waktu yang dipilih. Silakan pilih waktu lain." };
  }

  const court = await prisma.court.findUnique({ where: { id: parsed.courtId }, include: { branch: true } });
  if (!court) return { success: false, error: "Lapangan tidak ditemukan" };

  const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  const totalAmount = durationHours * DEFAULT_PRICE_PER_HOUR;

  const booking = await prisma.rentalBooking.create({
    data: {
      bookingNumber: generateBookingNumber(),
      courtId: parsed.courtId,
      branchId: court.branchId,
      customerName: parsed.customerName,
      customerPhone: parsed.customerPhone,
      date: new Date(parsed.date),
      startTime: start,
      endTime: end,
      duration: Math.ceil(durationHours),
      pricePerHour: DEFAULT_PRICE_PER_HOUR,
      totalAmount,
      notes: parsed.notes,
      status: "PENDING",
    },
    include: { court: { include: { branch: true } } },
  });

  return { success: true, booking };
}

export async function getBookingStatus(bookingNumber: string) {
  const booking = await prisma.rentalBooking.findUnique({
    where: { bookingNumber },
    include: { court: { include: { branch: true } }, payments: true },
  });

  if (!booking) return { found: false };
  return { found: true, booking };
}
