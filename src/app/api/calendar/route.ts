import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  if (!start || !end) {
    return NextResponse.json({ error: "start and end required" }, { status: 400 });
  }

  const startDate = new Date(start);
  const endDate = new Date(end);

  try {
    const [rentals, schedules] = await Promise.all([
      prisma.rentalBooking.findMany({
        where: {
          status: { in: ["PENDING", "CONFIRMED"] },
          startTime: { gte: startDate, lte: endDate },
        },
        include: { court: true },
      }),
      prisma.courtSchedule.findMany({
        where: {
          startTime: { gte: startDate, lte: endDate },
        },
        include: { court: true },
      }),
    ]);

    const events = [
      ...rentals.map((r) => ({
        id: `rental-${r.id}`,
        title: `🏀 Sewa — ${r.customerName} (${r.court?.name})`,
        start: r.startTime.toISOString(),
        end: r.endTime.toISOString(),
        backgroundColor: r.status === "CONFIRMED" ? "#16a34a" : "#d97706",
        borderColor: r.status === "CONFIRMED" ? "#15803d" : "#b45309",
        textColor: "#ffffff",
        extendedProps: {
          type: "rental",
          status: r.status,
          court: r.court?.name,
          customer: r.customerName,
          phone: r.customerPhone,
          bookingNumber: r.bookingNumber,
        },
      })),
      ...schedules.map((s) => ({
        id: `schedule-${s.id}`,
        title: s.type === "MAINTENANCE"
          ? `🔧 ${s.title} (${s.court?.name})`
          : `⛹ ${s.title} (${s.court?.name})`,
        start: s.startTime.toISOString(),
        end: s.endTime.toISOString(),
        backgroundColor: s.type === "MAINTENANCE" ? "#dc2626" : "#2563eb",
        borderColor: s.type === "MAINTENANCE" ? "#b91c1c" : "#1d4ed8",
        textColor: "#ffffff",
        extendedProps: {
          type: s.type === "MAINTENANCE" ? "maintenance" : "academy",
          court: s.court?.name,
          notes: s.notes,
        },
      })),
    ];

    return NextResponse.json(events);
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
