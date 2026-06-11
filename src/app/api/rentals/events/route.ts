import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const statusColors: Record<string, { bg: string; border: string }> = {
  PENDING:   { bg: "#f59e0b", border: "#d97706" },
  CONFIRMED: { bg: "#16a34a", border: "#15803d" },
  CANCELLED: { bg: "#9ca3af", border: "#6b7280" },
  COMPLETED: { bg: "#374151", border: "#1f2937" },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const start   = searchParams.get("start");
  const end     = searchParams.get("end");
  const courtId = searchParams.get("courtId");

  if (!start || !end) {
    return NextResponse.json({ error: "start and end required" }, { status: 400 });
  }

  const startDate = new Date(start);
  const endDate   = new Date(end);

  try {
    const [rentals, schedules, classes] = await Promise.all([
      prisma.rentalBooking.findMany({
        where: {
          ...(courtId ? { courtId } : {}),
          startTime: { lt: endDate },
          endTime:   { gt: startDate },
        },
        include: { court: { include: { branch: true } } },
        orderBy: { startTime: "asc" },
      }),
      prisma.courtSchedule.findMany({
        where: {
          ...(courtId ? { courtId } : {}),
          startTime: { lt: endDate },
          endTime:   { gt: startDate },
          type: { in: ["MAINTENANCE", "ACADEMY"] },
        },
        include: { court: true },
      }),
      prisma.class.findMany({
        where: { isActive: true, schedule: { not: null } },
        select: { id: true, name: true, schedule: true, branch: { select: { name: true } } },
      }),
    ]);

    // Expand recurring class schedules into individual events for the date range
    const classEvents: object[] = [];
    const cursor = new Date(startDate);
    while (cursor < endDate) {
      const dayOfWeek = cursor.getDay();
      const dateStr = cursor.toISOString().slice(0, 10);
      for (const cls of classes) {
        if (!cls.schedule) continue;
        try {
          const sched = JSON.parse(cls.schedule);
          if (!Array.isArray(sched.days) || !sched.days.includes(dayOfWeek)) continue;
          if (courtId && sched.courtId && sched.courtId !== courtId) continue;
          classEvents.push({
            id: `class-${cls.id}-${dateStr}`,
            title: `📚 ${cls.name}`,
            start: `${dateStr}T${sched.startTime}`,
            end:   `${dateStr}T${sched.endTime}`,
            backgroundColor: "#7c3aed",
            borderColor:     "#6d28d9",
            textColor:       "#ffffff",
            display:         "block",
            editable:        false,
            extendedProps: {
              type:   "class",
              name:   cls.name,
              branch: cls.branch?.name,
            },
          });
        } catch { /* skip malformed schedule */ }
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    const events = [
      ...classEvents,
      ...rentals.map((r) => {
        const color = statusColors[r.status] ?? statusColors.PENDING;
        const statusLabel: Record<string, string> = {
          PENDING: "⏳", CONFIRMED: "✅", CANCELLED: "❌", COMPLETED: "✔",
        };
        return {
          id: `rental-${r.id}`,
          title: `${statusLabel[r.status] ?? ""} ${r.customerName}`,
          start: r.startTime.toISOString(),
          end:   r.endTime.toISOString(),
          backgroundColor: color.bg,
          borderColor:     color.border,
          textColor:       "#ffffff",
          classNames:      r.status === "CANCELLED" ? ["fc-event-cancelled"] : [],
          extendedProps: {
            type:          "rental",
            rentalId:      r.id,
            status:        r.status,
            bookingNumber: r.bookingNumber,
            court:         r.court?.name,
            courtId:       r.courtId,
            branch:        r.court?.branch?.name,
            customer:      r.customerName,
            phone:         r.customerPhone,
            date:          r.date.toISOString(),
            startTime:     r.startTime.toISOString(),
            endTime:       r.endTime.toISOString(),
            duration:      r.duration,
            pricePerHour:  Number(r.pricePerHour),
            totalAmount:   Number(r.totalAmount),
            notes:         r.notes,
          },
        };
      }),

      ...schedules.map((s) => ({
        id: `schedule-${s.id}`,
        title: s.type === "MAINTENANCE"
          ? `🔧 Perawatan — ${s.court?.name}`
          : `⛹ Latihan — ${s.court?.name}`,
        start:           s.startTime.toISOString(),
        end:             s.endTime.toISOString(),
        backgroundColor: s.type === "MAINTENANCE" ? "#dc2626" : "#2563eb",
        borderColor:     s.type === "MAINTENANCE" ? "#b91c1c" : "#1d4ed8",
        textColor:       "#ffffff",
        display:         "block",
        editable:        false,
        extendedProps: {
          type:  s.type === "MAINTENANCE" ? "maintenance" : "academy",
          court: s.court?.name,
          notes: s.notes,
        },
      })),
    ];

    return NextResponse.json(events);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
