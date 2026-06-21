"use client";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import { useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SearchableSelect, SearchableSelectItem } from "@/components/ui/searchable-select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataPagination } from "@/components/ui/data-pagination";
import { Plus, AlertCircle, CheckCircle, CalendarDays, List, Download } from "lucide-react";
import { createRental, checkAvailability, updateBookingStatus } from "@/app/actions/rentals";
import { exportToExcel } from "@/lib/export";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

const statusColors: Record<string,string> = { PENDING:"bg-amber-100 text-amber-700", CONFIRMED:"bg-green-100 text-green-700", CANCELLED:"bg-gray-100 text-gray-600", COMPLETED:"bg-slate-100 text-slate-700" };
const statusLabels: Record<string,string> = { PENDING:"Menunggu", CONFIRMED:"Dikonfirmasi", CANCELLED:"Dibatalkan", COMPLETED:"Selesai" };
const statusBadge: Record<string,string> = { PENDING:"badge-yellow", CONFIRMED:"badge-green", CANCELLED:"badge-gray", COMPLETED:"badge-gray" };

function addHour(t:string,h=1):string{const[hh,mm]=t.split(":").map(Number);const tot=hh*60+mm+h*60;return`${String(Math.floor(tot/60)%24).padStart(2,"0")}:${String(tot%60).padStart(2,"0")}`;}
function durH(s:string,e:string):number{const[sh,sm]=s.split(":").map(Number);const[eh,em]=e.split(":").map(Number);return Math.max(0,(eh*60+em-sh*60-sm)/60);}

interface Props { courts:any[]; rentals:any[]; branches:any[]; }
const emptyF = { courtId:"", branchId:"", customerName:"", customerPhone:"", date:"", startTime:"08:00", endTime:"09:00", pricePerHour:0, notes:"" };

export function RentalsClient({ courts, rentals:initialRentals, branches }:Props) {
  const router = useRouter();
  const calRef = useRef<any>(null);
  const [courtFilter,setCourtFilter] = useState("ALL");
  const courtFilterRef = useRef("ALL");
  const [createOpen,setCreateOpen] = useState(false);
  const [detailEvent,setDetailEvent] = useState<any>(null);
  const [form,setForm] = useState(emptyF);
  const [avail,setAvail] = useState<any>(null);
  const [loading,setLoading] = useState(false);
  const [checking,setChecking] = useState(false);
  const rentals = initialRentals;
  const [listFilter,setListFilter] = useState("ALL");
  const [page,setPage] = useState(1);
  const [pageSize,setPageSize] = useState(10);

  const filteredRentals = rentals.filter((r:any)=>listFilter==="ALL"||r.status===listFilter);
  const paginated = filteredRentals.slice((page-1)*pageSize, page*pageSize);

  const fetchEvents = useCallback((info:any,success:any,failure:any)=>{
    const p=new URLSearchParams({start:info.startStr,end:info.endStr,...(courtFilterRef.current!=="ALL"?{courtId:courtFilterRef.current}:{})});
    fetch(`/api/rentals/events?${p}`).then(r=>r.json()).then(success).catch(()=>failure(new Error("Gagal")));
  },[]);
  function handleCourtFilter(v:string){const val=v??"ALL";setCourtFilter(val);courtFilterRef.current=val;calRef.current?.getApi().refetchEvents();}
  function handleDateClick(info:any){const raw=info.dateStr;const date=raw.slice(0,10);const time=info.allDay?"08:00":raw.slice(11,16);setForm({...emptyF,date,startTime:time,endTime:addHour(time,1)});setAvail(null);setCreateOpen(true);}
  function handleEventClick(info:any){
    const p=info.event.extendedProps;
    if(p.type==="rental") { setDetailEvent(p); return; }
    if(p.type==="class"||p.type==="academy"||p.type==="maintenance") {
      setDetailEvent({...p, _nonRental:true, _title:info.event.title, _start:info.event.startStr, _end:info.event.endStr});
    }
  }
  async function handleCheck(){if(!form.courtId||!form.date||!form.startTime||!form.endTime)return;setChecking(true);const r=await checkAvailability(form.courtId,form.date,form.startTime,form.endTime);setAvail(r);setChecking(false);}
  async function handleCreate(e:React.FormEvent){e.preventDefault();setLoading(true);try{const r=await createRental({...form,pricePerHour:Number(form.pricePerHour)});if(!r.success){toast.error(r.error);}else{toast.success(`Booking ${r.booking?.bookingNumber} dibuat`);setCreateOpen(false);setForm(emptyF);setAvail(null);router.refresh();calRef.current?.getApi().refetchEvents();}}catch(err:any){toast.error(err.message);}setLoading(false);}
  async function handleStatus(id:string,status:string){await updateBookingStatus(id,status);toast.success("Status diperbarui");setDetailEvent(null);router.refresh();calRef.current?.getApi().refetchEvents();}

  const dur=durH(form.startTime,form.endTime);
  const total=dur*(form.pricePerHour||0);
  const selCourt=courts.find((c:any)=>c.id===form.courtId);

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        <SearchableSelect value={courtFilter} onValueChange={v=>handleCourtFilter(v??"ALL")} className="w-48 h-9 text-sm border-gray-200">
          <SearchableSelectItem value="ALL">Semua Lapangan</SearchableSelectItem>
          {courts.filter((c:any)=>c.isActive).map((c:any)=><SearchableSelectItem key={c.id} value={c.id}>{c.name}</SearchableSelectItem>)}
        </SearchableSelect>
        <Button size="sm" className="h-9 bg-orange-500 hover:bg-orange-600 ml-auto" onClick={()=>{setForm(emptyF);setAvail(null);setCreateOpen(true);}}>
          <Plus className="w-4 h-4 mr-1.5"/>Buat Booking
        </Button>
      </div>

      <div className="flex gap-4 text-xs flex-wrap">
        {[{color:"bg-amber-500",label:"Menunggu"},{color:"bg-green-600",label:"Dikonfirmasi"},{color:"bg-slate-600",label:"Selesai"},{color:"bg-gray-400",label:"Dibatalkan"},{color:"bg-violet-600",label:"Jadwal Kelas"},{color:"bg-blue-600",label:"Latihan"},{color:"bg-red-600",label:"Perawatan"}].map(l=>(
          <div key={l.label} className="flex items-center gap-1.5"><span className={`w-2.5 h-2.5 rounded-sm ${l.color} inline-block`}/><span className="text-gray-500">{l.label}</span></div>
        ))}
      </div>

      <Tabs defaultValue="calendar">
        <TabsList className="bg-gray-100 p-1 rounded-xl">
          <TabsTrigger value="calendar" className="rounded-lg text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"><CalendarDays className="w-4 h-4 mr-1.5"/>Kalender</TabsTrigger>
          <TabsTrigger value="list" className="rounded-lg text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"><List className="w-4 h-4 mr-1.5"/>Daftar Booking</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mt-4">
            <style>{`
              .fc-event-cancelled{opacity:.5;text-decoration:line-through}
              .fc .fc-timegrid-slot{height:2.2em}
              .fc .fc-col-header-cell{background:#fafafa}
              .fc-day-today{background:#fff7ed!important}
              .fc-button-primary{background-color:#f97316!important;border-color:#ea580c!important}
              .fc-button-primary:hover{background-color:#ea580c!important}
              .fc-button-active{background-color:#c2410c!important}
              .fc-scroller{scrollbar-width:thin;scrollbar-color:#e5e7eb transparent}
              .fc-scroller::-webkit-scrollbar{width:6px}
              .fc-scroller::-webkit-scrollbar-thumb{background:#e5e7eb;border-radius:3px}
              .fc-list-event{cursor:pointer}
              .fc-list-event:hover td{background:#fff7ed!important}
              .fc-list-event-dot{border-radius:3px!important;width:10px!important;height:10px!important;border:none!important}
              .fc-list-day-cushion{background:#f9fafb!important;font-size:0.75rem;font-weight:600;color:#6b7280}
              .fc-list-table td{padding:10px 14px!important;font-size:0.8rem}
              .fc-list-event-title a{color:#111827!important;font-weight:500;text-decoration:none!important}
              .fc-list-empty{padding:48px 0;text-align:center;color:#9ca3af;font-size:0.875rem}
            `}</style>
            <FullCalendar
              ref={calRef}
              plugins={[dayGridPlugin,timeGridPlugin,interactionPlugin,listPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{left:"prev,next today",center:"title",right:"dayGridMonth,timeGridWeek,timeGridDay,listWeek"}}
              buttonText={{today:"Hari Ini",month:"Bulan",week:"Minggu",day:"Harian",listWeek:"Agenda"}}
              locale="id"
              height="calc(100vh - 300px)"
              slotMinTime="06:00:00"
              slotMaxTime="23:00:00"
              allDaySlot={false}
              nowIndicator
              stickyHeaderDates
              selectable
              dateClick={handleDateClick}
              eventClick={handleEventClick}
              events={fetchEvents}
              eventTimeFormat={{hour:"2-digit",minute:"2-digit",meridiem:false,hour12:false}}
              eventDisplay="block"
              eventMinHeight={28}
              slotLabelFormat={{hour:"2-digit",minute:"2-digit",hour12:false}}
              noEventsText="Tidak ada agenda pada periode ini"
              eventDidMount={info=>{
                if(info.event.extendedProps.type!=="rental") info.el.style.cursor="default";
              }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">Klik slot kosong untuk booking baru · Klik event untuk detail · Mode Agenda menampilkan semua event berurutan</p>
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          <Card className="border-gray-100 shadow-sm">
            <CardHeader className="pb-4 border-b border-gray-50">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h2 className="font-semibold text-gray-900">Semua Booking <span className="text-gray-400 font-normal text-sm">({filteredRentals.length})</span></h2>
                <div className="flex gap-2 items-center">
                  <SearchableSelect value={listFilter} onValueChange={v=>{setListFilter(v??"ALL");setPage(1);}} className="w-36 h-9 text-sm border-gray-200">
                    <SearchableSelectItem value="ALL">Semua Status</SearchableSelectItem>
                    {Object.entries(statusLabels).map(([k,v])=><SearchableSelectItem key={k} value={k}>{v}</SearchableSelectItem>)}
                  </SearchableSelect>
                  <Button variant="outline" size="sm" className="h-9 border-gray-200 text-gray-600" onClick={()=>{const d=filteredRentals.map((r:any)=>({"No.Booking":r.bookingNumber,Pelanggan:r.customerName,"No.HP":r.customerPhone,Lapangan:r.court?.name,Tanggal:format(new Date(r.date),"dd/MM/yyyy"),"Jam Mulai":format(new Date(r.startTime),"HH:mm"),"Jam Selesai":format(new Date(r.endTime),"HH:mm"),"Durasi(jam)":r.duration,"Total(Rp)":Number(r.totalAmount),Status:statusLabels[r.status]}));exportToExcel(d,"Booking-Lapangan","Booking");toast.success(`${d.length} diekspor`);}}><Download className="w-4 h-4 mr-1.5"/>Excel</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table className="table-row-hover">
                <TableHeader><TableRow className="bg-gray-50/50 hover:bg-gray-50/50"><TableHead className="text-xs font-semibold text-gray-500 pl-5">No. Booking</TableHead><TableHead className="text-xs font-semibold text-gray-500">Pelanggan</TableHead><TableHead className="text-xs font-semibold text-gray-500">Lapangan</TableHead><TableHead className="text-xs font-semibold text-gray-500">Tanggal & Waktu</TableHead><TableHead className="text-xs font-semibold text-gray-500">Total</TableHead><TableHead className="text-xs font-semibold text-gray-500">Status</TableHead><TableHead className="w-28"></TableHead></TableRow></TableHeader>
                <TableBody>
                  {paginated.length===0?(<TableRow><TableCell colSpan={7} className="text-center py-12 text-sm text-gray-400">Belum ada booking</TableCell></TableRow>):paginated.map((r:any)=>(
                    <TableRow key={r.id}>
                      <TableCell className="pl-5"><span className="font-mono text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md">{r.bookingNumber}</span></TableCell>
                      <TableCell><p className="font-medium text-sm text-gray-900">{r.customerName}</p><p className="text-xs text-gray-400">{r.customerPhone}</p></TableCell>
                      <TableCell className="text-sm text-gray-700">{r.court?.name}</TableCell>
                      <TableCell><p className="text-sm text-gray-700">{format(new Date(r.date),"d MMM yyyy")}</p><p className="text-xs text-gray-400">{format(new Date(r.startTime),"HH:mm")}–{format(new Date(r.endTime),"HH:mm")} ({r.duration}j)</p></TableCell>
                      <TableCell className="text-sm font-semibold text-gray-900">Rp {Number(r.totalAmount).toLocaleString("id-ID")}</TableCell>
                      <TableCell><span className={statusBadge[r.status]}>{statusLabels[r.status]}</span></TableCell>
                      <TableCell className="pr-3">
                        {r.status==="PENDING"&&<div className="flex gap-1"><Button size="sm" onClick={()=>handleStatus(r.id,"CONFIRMED")} className="bg-green-500 hover:bg-green-600 h-7 text-xs">Konfirmasi</Button><Button size="sm" variant="outline" onClick={()=>handleStatus(r.id,"CANCELLED")} className="text-red-500 h-7 text-xs">Batal</Button></div>}
                        {r.status==="CONFIRMED"&&<Button size="sm" variant="outline" onClick={()=>handleStatus(r.id,"COMPLETED")} className="h-7 text-xs">Selesai</Button>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <DataPagination total={filteredRentals.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={s=>{setPageSize(s);setPage(1)}}/>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Booking Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Buat Booking Sewa Lapangan</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">Lapangan *</Label><SearchableSelect value={form.courtId} onValueChange={v=>{if(!v)return;const c=courts.find((x:any)=>x.id===v);setForm({...form,courtId:v,branchId:c?.branchId||""});setAvail(null);}} placeholder="Pilih lapangan">{courts.filter((c:any)=>c.isActive).map((c:any)=><SearchableSelectItem key={c.id} value={c.id}>{c.name}</SearchableSelectItem>)}</SearchableSelect></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">Tanggal *</Label><Input type="date" value={form.date} onChange={e=>{setForm({...form,date:e.target.value});setAvail(null);}} required/></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">Jam Mulai *</Label><Input type="time" value={form.startTime} onChange={e=>{setForm({...form,startTime:e.target.value});setAvail(null);}} required/></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">Jam Selesai *</Label><Input type="time" value={form.endTime} onChange={e=>{setForm({...form,endTime:e.target.value});setAvail(null);}} required/></div>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleCheck} disabled={checking||!form.courtId||!form.date} className="w-full">{checking?"Memeriksa...":"Cek Ketersediaan"}</Button>
            {avail&&<div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${avail.available?"bg-green-50 text-green-700 border border-green-200":"bg-red-50 text-red-700 border border-red-200"}`}>{avail.available?<><CheckCircle className="w-4 h-4"/>Lapangan tersedia</>:<><AlertCircle className="w-4 h-4"/>{avail.conflictClass?`Jadwal kelas "${avail.conflictClass.name}" aktif pada waktu ini`:avail.conflictSchedule?.type==="MAINTENANCE"?"Lapangan dalam perawatan":avail.conflictSchedule?.type==="ACADEMY"?"Jadwal latihan akademi aktif":"Lapangan tidak tersedia"}</>}</div>}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5"><Label className="text-xs font-medium text-gray-700">Nama Pelanggan *</Label><Input value={form.customerName} onChange={e=>setForm({...form,customerName:e.target.value})} required/></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">No. HP *</Label><Input value={form.customerPhone} onChange={e=>setForm({...form,customerPhone:e.target.value})} required/></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">Harga/Jam (Rp) *</Label><Input type="number" value={form.pricePerHour||""} onChange={e=>setForm({...form,pricePerHour:Number(e.target.value)})} required/></div>
            </div>
            {dur>0&&form.pricePerHour>0&&<div className="bg-orange-50 border border-orange-100 p-3 rounded-xl text-sm space-y-1"><div className="flex justify-between"><span className="text-gray-500">Lapangan</span><span className="font-medium">{selCourt?.name||"—"}</span></div><div className="flex justify-between"><span className="text-gray-500">Durasi</span><span>{dur} jam</span></div><div className="flex justify-between border-t pt-1 font-semibold text-orange-700"><span>Total</span><span>Rp {total.toLocaleString("id-ID")}</span></div></div>}
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100"><Button type="button" variant="outline" onClick={()=>setCreateOpen(false)}>Batal</Button><Button type="submit" className="bg-orange-500 hover:bg-orange-600" disabled={loading||(avail!==null&&!avail.available)}>{loading?"Menyimpan...":"Buat Booking"}</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailEvent} onOpenChange={()=>setDetailEvent(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{detailEvent?._nonRental ? "Detail Jadwal" : "Detail Booking"}</DialogTitle>
          </DialogHeader>
          {detailEvent && !detailEvent._nonRental && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-gray-400">{detailEvent.bookingNumber}</span>
                <span className={statusBadge[detailEvent.status]}>{statusLabels[detailEvent.status]}</span>
              </div>
              <div className="space-y-2 border border-gray-100 rounded-xl p-3 bg-gray-50/50">
                {[["Lapangan",detailEvent.court],["Tanggal",detailEvent.date?format(new Date(detailEvent.date),"d MMM yyyy",{locale:idLocale}):"—"],["Waktu",detailEvent._start?`${format(new Date(detailEvent._start),"HH:mm")} – ${format(new Date(detailEvent._end),"HH:mm")}`:"—"],["Pelanggan",detailEvent.customer],["No. HP",detailEvent.phone||"—"],["Total",`Rp ${detailEvent.totalAmount?.toLocaleString("id-ID")}`]].map(([k,v])=>(
                  <div key={k} className="flex justify-between gap-4"><span className="text-gray-500 shrink-0">{k}</span><span className="font-medium text-gray-900 text-right">{v}</span></div>
                ))}
              </div>
              {detailEvent.status==="PENDING"&&<div className="flex gap-2"><Button className="flex-1 bg-green-500 hover:bg-green-600" onClick={()=>handleStatus(detailEvent.rentalId,"CONFIRMED")}>Konfirmasi</Button><Button variant="outline" className="flex-1 text-red-500 border-red-200" onClick={()=>handleStatus(detailEvent.rentalId,"CANCELLED")}>Batalkan</Button></div>}
              {detailEvent.status==="CONFIRMED"&&<Button className="w-full" variant="outline" onClick={()=>handleStatus(detailEvent.rentalId,"COMPLETED")}>Tandai Selesai</Button>}
            </div>
          )}
          {detailEvent?._nonRental && (
            <div className="space-y-3 text-sm">
              <div className="space-y-2 border border-gray-100 rounded-xl p-3 bg-gray-50/50">
                {[
                  ["Tipe", detailEvent.type==="class"?"Jadwal Kelas":detailEvent.type==="academy"?"Latihan Akademi":"Perawatan"],
                  ["Nama", detailEvent.name||detailEvent.className||detailEvent._title||"—"],
                  ["Lapangan", detailEvent.court||"—"],
                  ["Cabang", detailEvent.branch||"—"],
                  ["Waktu", detailEvent._start?`${format(new Date(detailEvent._start),"HH:mm")} – ${format(new Date(detailEvent._end),"HH:mm")}`:"—"],
                  ...(detailEvent.notes?[["Catatan",detailEvent.notes]]:[]),
                ].map(([k,v])=>(
                  <div key={k} className="flex justify-between gap-4"><span className="text-gray-500 shrink-0">{k}</span><span className="font-medium text-gray-900 text-right">{v}</span></div>
                ))}
              </div>
              <p className="text-xs text-gray-400 text-center">Event ini tidak dapat diubah dari halaman ini</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
