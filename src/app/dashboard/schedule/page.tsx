import { Header } from "@/components/layout/header";
import { CalendarWrapper } from "./calendar-wrapper";

export default function SchedulePage() {
  return (
    <>
      <Header title="Jadwal Lapangan" />
      <div className="flex flex-1 flex-col gap-5 p-5">
        <div className="text-sm text-muted-foreground">
          Tampilan jadwal sewa lapangan dan latihan akademi. Klik event untuk melihat detail.
        </div>
        <CalendarWrapper />
      </div>
    </>
  );
}

