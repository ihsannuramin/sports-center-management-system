"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function CalendarView() {
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  function handleEventClick(info: any) {
    setSelectedEvent({
      title: info.event.title,
      start: info.event.start,
      end: info.event.end,
      ...info.event.extendedProps,
    });
  }

  function formatTime(date: Date | null) {
    if (!date) return "-";
    return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  }

  function formatDate(date: Date | null) {
    if (!date) return "-";
    return date.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }

  const typeLabels: Record<string, string> = {
    rental: "Sewa Lapangan",
    academy: "Latihan Akademi",
    maintenance: "Perawatan Lapangan",
  };

  return (
    <>
      <div className="bg-white rounded-lg border p-1">
        <div className="flex gap-3 mb-3 px-3 pt-2 flex-wrap text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-green-600 inline-block" />
            <span>Sewa Dikonfirmasi</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-amber-600 inline-block" />
            <span>Sewa Menunggu</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-blue-600 inline-block" />
            <span>Latihan Akademi</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-red-600 inline-block" />
            <span>Perawatan</span>
          </div>
        </div>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          buttonText={{
            today: "Hari Ini",
            month: "Bulan",
            week: "Minggu",
            day: "Harian",
          }}
          locale="id"
          height="auto"
          slotMinTime="06:00:00"
          slotMaxTime="23:00:00"
          allDaySlot={false}
          eventClick={handleEventClick}
          events={async (fetchInfo, successCallback, failureCallback) => {
            try {
              const res = await fetch(
                `/api/calendar?start=${fetchInfo.startStr}&end=${fetchInfo.endStr}`
              );
              const data = await res.json();
              successCallback(data);
            } catch {
              failureCallback(new Error("Gagal memuat jadwal"));
            }
          }}
          eventTimeFormat={{ hour: "2-digit", minute: "2-digit", meridiem: false, hour12: false }}
          nowIndicator
          businessHours={{ daysOfWeek: [1, 2, 3, 4, 5, 6], startTime: "07:00", endTime: "22:00" }}
        />
      </div>

      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Detail Jadwal</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-2 text-sm">
              <div className="font-medium text-base">{selectedEvent.court}</div>
              <div className="text-xs px-2 py-0.5 rounded-full font-medium inline-block bg-gray-100 text-gray-700">
                {typeLabels[selectedEvent.type] || selectedEvent.type}
              </div>
              <div className="space-y-1 text-gray-400">
                <p>{formatDate(selectedEvent.start)}</p>
                <p>{formatTime(selectedEvent.start)} — {formatTime(selectedEvent.end)}</p>
              </div>
              {selectedEvent.type === "rental" && (
                <div className="border-t pt-2 space-y-1">
                  <p><span className="font-medium">Pelanggan:</span> {selectedEvent.customer}</p>
                  <p><span className="font-medium">No. HP:</span> {selectedEvent.phone}</p>
                  <p><span className="font-medium">No. Booking:</span> {selectedEvent.bookingNumber}</p>
                  <p>
                    <span className="font-medium">Status:</span>{" "}
                    <span className={selectedEvent.status === "CONFIRMED" ? "text-green-600" : "text-amber-600"}>
                      {selectedEvent.status === "CONFIRMED" ? "Dikonfirmasi" : "Menunggu"}
                    </span>
                  </p>
                </div>
              )}
              {selectedEvent.notes && (
                <p className="border-t pt-2 text-gray-400">{selectedEvent.notes}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
