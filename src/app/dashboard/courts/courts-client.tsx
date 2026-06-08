"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DataPagination } from "@/components/ui/data-pagination";
import { Plus, Building2, Calendar, Download } from "lucide-react";
import { createCourt, toggleCourtStatus, createCourtSchedule } from "@/app/actions/courts";
import { exportToExcel } from "@/lib/export";
import { toast } from "sonner";
import { format } from "date-fns";

const schedLabels: Record<string,string> = { MAINTENANCE:"Perawatan", ACADEMY:"Latihan Akademi", RENTAL:"Sewa" };
const schedBadge: Record<string,string> = { MAINTENANCE:"badge-red", ACADEMY:"badge-blue", RENTAL:"badge-green" };
interface Props { courts:any[]; schedules:any[]; branches:any[]; }
const emptyC = { name:"", courtNumber:1, type:"INDOOR" as any, description:"", branchId:"" };
const emptyS = { courtId:"", branchId:"", title:"", type:"MAINTENANCE" as any, startTime:"", endTime:"", isRecurring:false, notes:"" };

export function CourtsClient({ courts:initial, schedules:initSched, branches }:Props) {
  const router = useRouter();
  const [courts] = useState(initial);
  const [schedules] = useState(initSched);
  const [cOpen,setCOpen] = useState(false);
  const [sOpen,setSOpen] = useState(false);
  const [cForm,setCForm] = useState(emptyC);
  const [sForm,setSForm] = useState(emptyS);
  const [loading,setLoading] = useState(false);
  const [cp,setCp] = useState(1); const [cps,setCps] = useState(10);
  const [sp,setSp] = useState(1); const [sps,setSps] = useState(10);
  const pc = courts.slice((cp-1)*cps, cp*cps);
  const ps = schedules.slice((sp-1)*sps, sp*sps);

  async function submitCourt(e:React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try { await createCourt({...cForm,courtNumber:Number(cForm.courtNumber)}); toast.success("Lapangan ditambahkan"); setCOpen(false); router.refresh(); }
    catch(err:any){toast.error(err.message);} setLoading(false);
  }
  async function submitSched(e:React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try { await createCourtSchedule(sForm); toast.success("Jadwal ditambahkan"); setSOpen(false); router.refresh(); }
    catch(err:any){toast.error(err.message);} setLoading(false);
  }
  async function handleToggle(id:string, isActive:boolean) {
    await toggleCourtStatus(id,!isActive); toast.success(isActive?"Lapangan dinonaktifkan":"Lapangan diaktifkan"); router.refresh();
  }

  return (
    <Tabs defaultValue="courts">
      <TabsList className="bg-gray-100 p-1 rounded-xl">
        <TabsTrigger value="courts" className="rounded-lg text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"><Building2 className="w-4 h-4 mr-1.5"/>Lapangan</TabsTrigger>
        <TabsTrigger value="schedules" className="rounded-lg text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"><Calendar className="w-4 h-4 mr-1.5"/>Jadwal Blokir</TabsTrigger>
      </TabsList>
      <TabsContent value="courts" className="mt-4">
        <Card className="border-gray-100 shadow-sm">
          <CardHeader className="pb-4 border-b border-gray-50">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3"><div className="p-2 bg-blue-50 rounded-xl"><Building2 className="w-5 h-5 text-blue-500"/></div><div><h2 className="font-semibold text-gray-900">Daftar Lapangan</h2><p className="text-xs text-gray-400">{courts.length} lapangan</p></div></div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-9 border-gray-200 text-gray-600" onClick={()=>{const d=courts.map(c=>({No:c.courtNumber,Nama:c.name,Tipe:c.type,Cabang:c.branch?.name||"-",Status:c.isActive?"Aktif":"Nonaktif"}));exportToExcel(d,"Lapangan","Lapangan");toast.success(`${d.length} diekspor`)}}><Download className="w-4 h-4 mr-1.5"/>Excel</Button>
                <Button size="sm" className="h-9 bg-orange-500 hover:bg-orange-600" onClick={()=>setCOpen(true)}><Plus className="w-4 h-4 mr-1.5"/>Tambah</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table className="table-row-hover">
              <TableHeader><TableRow className="bg-gray-50/50 hover:bg-gray-50/50"><TableHead className="text-xs font-semibold text-gray-500 pl-5 w-14">No.</TableHead><TableHead className="text-xs font-semibold text-gray-500">Nama</TableHead><TableHead className="text-xs font-semibold text-gray-500">Tipe</TableHead><TableHead className="text-xs font-semibold text-gray-500">Cabang</TableHead><TableHead className="text-xs font-semibold text-gray-500">Status</TableHead><TableHead className="w-28"></TableHead></TableRow></TableHeader>
              <TableBody>
                {pc.length===0?(<TableRow><TableCell colSpan={6} className="text-center py-12 text-sm text-gray-400">Belum ada lapangan</TableCell></TableRow>):pc.map(c=>(
                  <TableRow key={c.id}>
                    <TableCell className="pl-5 font-mono text-sm text-gray-400">{c.courtNumber}</TableCell>
                    <TableCell className="font-medium text-sm text-gray-900">{c.name}</TableCell>
                    <TableCell><span className={c.type==="INDOOR"?"badge-blue":"badge-green"}>{c.type==="INDOOR"?"Indoor":"Outdoor"}</span></TableCell>
                    <TableCell className="text-sm text-gray-600">{c.branch?.name}</TableCell>
                    <TableCell><span className={c.isActive?"badge-green":"badge-gray"}>{c.isActive?"Aktif":"Nonaktif"}</span></TableCell>
                    <TableCell className="pr-3"><Button size="sm" variant="outline" onClick={()=>handleToggle(c.id,c.isActive)} className={`h-7 text-xs ${c.isActive?"text-red-500 border-red-100 hover:bg-red-50":"text-green-600 border-green-100 hover:bg-green-50"}`}>{c.isActive?"Nonaktifkan":"Aktifkan"}</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <DataPagination total={courts.length} page={cp} pageSize={cps} onPageChange={setCp} onPageSizeChange={s=>{setCps(s);setCp(1)}}/>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="schedules" className="mt-4">
        <Card className="border-gray-100 shadow-sm">
          <CardHeader className="pb-4 border-b border-gray-50">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3"><div className="p-2 bg-red-50 rounded-xl"><Calendar className="w-5 h-5 text-red-500"/></div><div><h2 className="font-semibold text-gray-900">Jadwal Blokir</h2><p className="text-xs text-gray-400">{schedules.length} jadwal</p></div></div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-9 border-gray-200 text-gray-600" onClick={()=>{const d=schedules.map(s=>({Lapangan:s.court?.name,Judul:s.title,Tipe:schedLabels[s.type],Mulai:format(new Date(s.startTime),"dd/MM/yyyy HH:mm"),Selesai:format(new Date(s.endTime),"dd/MM/yyyy HH:mm")}));exportToExcel(d,"Jadwal-Blokir","Jadwal");toast.success(`${d.length} diekspor`)}}><Download className="w-4 h-4 mr-1.5"/>Excel</Button>
                <Button size="sm" className="h-9 bg-orange-500 hover:bg-orange-600" onClick={()=>setSOpen(true)}><Plus className="w-4 h-4 mr-1.5"/>Tambah</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table className="table-row-hover">
              <TableHeader><TableRow className="bg-gray-50/50 hover:bg-gray-50/50"><TableHead className="text-xs font-semibold text-gray-500 pl-5">Lapangan</TableHead><TableHead className="text-xs font-semibold text-gray-500">Judul</TableHead><TableHead className="text-xs font-semibold text-gray-500">Tipe</TableHead><TableHead className="text-xs font-semibold text-gray-500">Mulai</TableHead><TableHead className="text-xs font-semibold text-gray-500">Selesai</TableHead></TableRow></TableHeader>
              <TableBody>
                {ps.length===0?(<TableRow><TableCell colSpan={5} className="text-center py-12 text-sm text-gray-400">Belum ada jadwal blokir</TableCell></TableRow>):ps.map(s=>(
                  <TableRow key={s.id}>
                    <TableCell className="pl-5 font-medium text-sm text-gray-900">{s.court?.name}</TableCell>
                    <TableCell className="text-sm text-gray-700">{s.title}</TableCell>
                    <TableCell><span className={schedBadge[s.type]}>{schedLabels[s.type]}</span></TableCell>
                    <TableCell className="text-sm text-gray-600">{format(new Date(s.startTime),"d MMM yyyy HH:mm")}</TableCell>
                    <TableCell className="text-sm text-gray-600">{format(new Date(s.endTime),"d MMM yyyy HH:mm")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <DataPagination total={schedules.length} page={sp} pageSize={sps} onPageChange={setSp} onPageSizeChange={s=>{setSps(s);setSp(1)}}/>
          </CardContent>
        </Card>
      </TabsContent>

      <Dialog open={cOpen} onOpenChange={setCOpen}>
        <DialogContent><DialogHeader><DialogTitle>Tambah Lapangan</DialogTitle></DialogHeader>
          <form onSubmit={submitCourt} className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5"><Label className="text-xs font-medium text-gray-700">Nama *</Label><Input value={cForm.name} onChange={e=>setCForm({...cForm,name:e.target.value})} required/></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">Nomor *</Label><Input type="number" value={cForm.courtNumber} onChange={e=>setCForm({...cForm,courtNumber:Number(e.target.value)})} required/></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">Tipe</Label><Select value={cForm.type} onValueChange={v=>v&&setCForm({...cForm,type:v as any})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="INDOOR">Indoor</SelectItem><SelectItem value="OUTDOOR">Outdoor</SelectItem></SelectContent></Select></div>
              <div className="col-span-2 space-y-1.5"><Label className="text-xs font-medium text-gray-700">Cabang *</Label><Select value={cForm.branchId} onValueChange={v=>v&&setCForm({...cForm,branchId:v})}><SelectTrigger><SelectValue placeholder="Pilih cabang"/></SelectTrigger><SelectContent>{branches.map((b:any)=><SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100"><Button type="button" variant="outline" onClick={()=>setCOpen(false)}>Batal</Button><Button type="submit" className="bg-orange-500 hover:bg-orange-600" disabled={loading}>{loading?"Menyimpan...":"Simpan"}</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={sOpen} onOpenChange={setSOpen}>
        <DialogContent><DialogHeader><DialogTitle>Tambah Jadwal Blokir</DialogTitle></DialogHeader>
          <form onSubmit={submitSched} className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">Lapangan *</Label><Select value={sForm.courtId} onValueChange={v=>{if(!v)return;const c=courts.find((x:any)=>x.id===v);setSForm({...sForm,courtId:v,branchId:c?.branchId||""})}}><SelectTrigger><SelectValue placeholder="Pilih"/></SelectTrigger><SelectContent>{courts.map((c:any)=><SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">Tipe *</Label><Select value={sForm.type} onValueChange={v=>v&&setSForm({...sForm,type:v as any})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="MAINTENANCE">Perawatan</SelectItem><SelectItem value="ACADEMY">Latihan</SelectItem></SelectContent></Select></div>
              <div className="col-span-2 space-y-1.5"><Label className="text-xs font-medium text-gray-700">Judul *</Label><Input value={sForm.title} onChange={e=>setSForm({...sForm,title:e.target.value})} required/></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">Mulai *</Label><Input type="datetime-local" value={sForm.startTime} onChange={e=>setSForm({...sForm,startTime:e.target.value})} required/></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">Selesai *</Label><Input type="datetime-local" value={sForm.endTime} onChange={e=>setSForm({...sForm,endTime:e.target.value})} required/></div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100"><Button type="button" variant="outline" onClick={()=>setSOpen(false)}>Batal</Button><Button type="submit" className="bg-orange-500 hover:bg-orange-600" disabled={loading}>{loading?"Menyimpan...":"Simpan"}</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}
