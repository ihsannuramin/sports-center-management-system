"use client";

import dynamic from "next/dynamic";

const CalendarView = dynamic(
  () => import("@/components/schedule/calendar-view").then((m) => m.CalendarView),
  {
    ssr: false,
    loading: () => (
      <div className="h-96 flex items-center justify-center text-muted-foreground">
        Memuat kalender...
      </div>
    ),
  }
);

export function CalendarWrapper() {
  return <CalendarView />;
}
