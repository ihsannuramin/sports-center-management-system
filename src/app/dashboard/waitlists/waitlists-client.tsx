"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SearchableSelect, SearchableSelectItem } from "@/components/ui/searchable-select";
import { Label } from "@/components/ui/label";
import { DataPagination } from "@/components/ui/data-pagination";
import { Plus, Download, Users, ArrowUpCircle, XCircle, CalendarClock } from "lucide-react";
import { addToClassWaitlist, addToRentalWaitlist, promoteFromWaitlist, cancelWaitlist } from "@/app/actions/waitlists";
import { exportToExcel } from "@/lib/export";
import { toast } from "sonner";
import { format } from "date-fns";

const statusBadge: Record<string, string> = {
  WAITING: "badge-yellow",
  NOTIFIED: "badge-blue",
  PROMOTED: "badge-green",
  CANCELLED: "badge-gray",
};
const statusLabel: Record<string, string> = {
  WAITING: "Menunggu",
  NOTIFIED: "Diberitahu",
  PROMOTED: "Dipromosikan",
  CANCELLED: "Dibatalkan",
};

interface Props {
  classWaitlists: any[];
  rentalWaitlists: any[];
  classes: any[];
  courts: any[];
}

const emptyClassForm = { classId: "", name: "", phone: "", email: "" };
const emptyRentalForm = { courtId: "", name: "", phone: "", date: "", startTime: "", endTime: "" };

export function WaitlistsClient({ classWaitlists: initClass, rentalWaitlists: initRental, classes, courts }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"class" | "rental">("class");
  const [loading, setLoading] = useState(false);

  const [classOpen, setClassOpen] = useState(false);
  const [classForm, setClassForm] = useState(emptyClassForm);
  const [classPage, setClassPage] = useState(1);
  const [classPageSize, setClassPageSize] = useState(10);

  const [rentalOpen, setRentalOpen] = useState(false);
  const [rentalForm, setRentalForm] = useState(emptyRentalForm);
  const [rentalPage, setRentalPage] = useState(1);
  const [rentalPageSize, setRentalPageSize] = useState(10);

  const classWaitlists = initClass;
  const rentalWaitlists = initRental;

  const paginatedClass = classWaitlists.slice((classPage - 1) * classPageSize, classPage * classPageSize);
  const paginatedRental = rentalWaitlists.slice((rentalPage - 1) * rentalPageSize, rentalPage * rentalPageSize);

  async function handleAddClass(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await addToClassWaitlist({ classId: classForm.classId, name: classForm.name, phone: classForm.phone, email: classForm.email || undefined });
      toast.success("Ditambahkan ke waitlist kelas");
      setClassOpen(false);
      setClassForm(emptyClassForm);
      router.refresh();
    } catch (err: any) { toast.error(err.message); }
    setLoading(false);
  }

  async function handleAddRental(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await addToRentalWaitlist({
        courtId: rentalForm.courtId,
        name: rentalForm.name,
        phone: rentalForm.phone,
        date: rentalForm.date,
        startTime: `${rentalForm.date}T${rentalForm.startTime}`,
        endTime: `${rentalForm.date}T${rentalForm.endTime}`,
      });
      toast.success("Ditambahkan ke waitlist rental");
      setRentalOpen(false);
      setRentalForm(emptyRentalForm);
      router.refresh();
    } catch (err: any) { toast.error(err.message); }
    setLoading(false);
  }

  async function handlePromote(id: string, type: "class" | "rental") {
    if (!confirm("Promosikan dari waitlist?")) return;
    await promoteFromWaitlist(id, type);
    toast.success("Status diperbarui");
    router.refresh();
  }

  async function handleCancel(id: string, type: "class" | "rental") {
    if (!confirm("Batalkan waitlist ini?")) return;
    await cancelWaitlist(id, type);
    toast.success("Waitlist dibatalkan");
    router.refresh();
  }

  function exportClass() {
    const data = classWaitlists.map((w) => ({
      "Posisi": w.position,
      "Nama": w.name,
      "No. HP": w.phone,
      "Email": w.email || "-",
      "Kelas": w.class?.name || "-",
      "Status": statusLabel[w.status] || w.status,
      "Daftar": format(new Date(w.createdAt), "dd/MM/yyyy"),
    }));
    exportToExcel(data, "Waitlist-Kelas", "Waitlist Kelas");
    toast.success(`${data.length} data diekspor`);
  }

  function exportRental() {
    const data = rentalWaitlists.map((w) => ({
      "Posisi": w.position,
      "Nama": w.name,
      "No. HP": w.phone,
      "Lapangan": w.court?.name || "-",
      "Tanggal": format(new Date(w.date), "dd/MM/yyyy"),
      "Jam Mulai": format(new Date(w.startTime), "HH:mm"),
      "Jam Selesai": format(new Date(w.endTime), "HH:mm"),
      "Status": statusLabel[w.status] || w.status,
    }));
    exportToExcel(data, "Waitlist-Rental", "Waitlist Rental");
    toast.success(`${data.length} data diekspor`);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 bg-muted p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab("class")}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === "class" ? "bg-surface shadow text-on-surface" : "text-tertiary hover:text-foreground"}`}
        >
          Waitlist Kelas
        </button>
        <button
          onClick={() => setTab("rental")}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === "rental" ? "bg-surface shadow text-on-surface" : "text-tertiary hover:text-foreground"}`}
        >
          Waitlist Rental
        </button>
      </div>

      {tab === "class" && (
        <Card className="border-neutral shadow-sm">
          <CardHeader className="pb-4 border-b border-neutral">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-xl"><Users className="w-5 h-5 text-blue-500" /></div>
                <div>
                  <h2 className="font-semibold text-on-surface">Waitlist Kelas Akademi</h2>
                  <p className="text-xs text-muted-foreground">{classWaitlists.length} pendaftar</p>
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <Button variant="outline" size="sm" className="h-9 border-border text-foreground" onClick={exportClass}>
                  <Download className="w-4 h-4 mr-1.5" /> Excel
                </Button>
                <Button size="sm" className="h-9 bg-primary hover:bg-primary-80 shadow-sm shadow-primary/20" onClick={() => setClassOpen(true)}>
                  <Plus className="w-4 h-4 mr-1.5" /> Tambah
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table className="table-row-hover">
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="text-xs font-semibold text-tertiary pl-5 w-16">No.</TableHead>
                  <TableHead className="text-xs font-semibold text-tertiary">Nama</TableHead>
                  <TableHead className="text-xs font-semibold text-tertiary">No. HP</TableHead>
                  <TableHead className="text-xs font-semibold text-tertiary">Kelas</TableHead>
                  <TableHead className="text-xs font-semibold text-tertiary">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-tertiary">Tanggal Daftar</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedClass.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-16">
                    <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Belum ada waitlist kelas</p>
                  </TableCell></TableRow>
                ) : (
                  paginatedClass.map((w) => (
                    <TableRow key={w.id}>
                      <TableCell className="pl-5">
                        <span className="text-sm font-mono font-medium text-foreground">#{w.position}</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium text-on-surface">{w.name}</p>
                          {w.email && <p className="text-xs text-muted-foreground">{w.email}</p>}
                        </div>
                      </TableCell>
                      <TableCell><span className="text-sm text-foreground">{w.phone}</span></TableCell>
                      <TableCell><span className="text-sm text-foreground">{w.class?.name || "-"}</span></TableCell>
                      <TableCell><span className={statusBadge[w.status]}>{statusLabel[w.status] || w.status}</span></TableCell>
                      <TableCell><span className="text-sm text-tertiary">{format(new Date(w.createdAt), "dd/MM/yyyy")}</span></TableCell>
                      <TableCell className="pr-3">
                        {w.status === "WAITING" && (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500 hover:text-green-700 hover:bg-green-50" title="Promosikan" onClick={() => handlePromote(w.id, "class")}>
                              <ArrowUpCircle className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" title="Batalkan" onClick={() => handleCancel(w.id, "class")}>
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <DataPagination total={classWaitlists.length} page={classPage} pageSize={classPageSize} onPageChange={setClassPage} onPageSizeChange={(s) => { setClassPageSize(s); setClassPage(1); }} />
          </CardContent>
        </Card>
      )}

      {tab === "rental" && (
        <Card className="border-neutral shadow-sm">
          <CardHeader className="pb-4 border-b border-neutral">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-xl"><CalendarClock className="w-5 h-5 text-purple-500" /></div>
                <div>
                  <h2 className="font-semibold text-on-surface">Waitlist Rental Lapangan</h2>
                  <p className="text-xs text-muted-foreground">{rentalWaitlists.length} pendaftar</p>
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <Button variant="outline" size="sm" className="h-9 border-border text-foreground" onClick={exportRental}>
                  <Download className="w-4 h-4 mr-1.5" /> Excel
                </Button>
                <Button size="sm" className="h-9 bg-primary hover:bg-primary-80 shadow-sm shadow-primary/20" onClick={() => setRentalOpen(true)}>
                  <Plus className="w-4 h-4 mr-1.5" /> Tambah
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table className="table-row-hover">
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="text-xs font-semibold text-tertiary pl-5 w-16">No.</TableHead>
                  <TableHead className="text-xs font-semibold text-tertiary">Nama</TableHead>
                  <TableHead className="text-xs font-semibold text-tertiary">No. HP</TableHead>
                  <TableHead className="text-xs font-semibold text-tertiary">Lapangan</TableHead>
                  <TableHead className="text-xs font-semibold text-tertiary">Tanggal & Waktu</TableHead>
                  <TableHead className="text-xs font-semibold text-tertiary">Status</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRental.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-16">
                    <CalendarClock className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Belum ada waitlist rental</p>
                  </TableCell></TableRow>
                ) : (
                  paginatedRental.map((w) => (
                    <TableRow key={w.id}>
                      <TableCell className="pl-5">
                        <span className="text-sm font-mono font-medium text-foreground">#{w.position}</span>
                      </TableCell>
                      <TableCell><span className="text-sm font-medium text-on-surface">{w.name}</span></TableCell>
                      <TableCell><span className="text-sm text-foreground">{w.phone}</span></TableCell>
                      <TableCell><span className="text-sm text-foreground">{w.court?.name || "-"}</span></TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm text-foreground">{format(new Date(w.date), "dd/MM/yyyy")}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(w.startTime), "HH:mm")} – {format(new Date(w.endTime), "HH:mm")}</p>
                        </div>
                      </TableCell>
                      <TableCell><span className={statusBadge[w.status]}>{statusLabel[w.status] || w.status}</span></TableCell>
                      <TableCell className="pr-3">
                        {w.status === "WAITING" && (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500 hover:text-green-700 hover:bg-green-50" title="Promosikan" onClick={() => handlePromote(w.id, "rental")}>
                              <ArrowUpCircle className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" title="Batalkan" onClick={() => handleCancel(w.id, "rental")}>
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <DataPagination total={rentalWaitlists.length} page={rentalPage} pageSize={rentalPageSize} onPageChange={setRentalPage} onPageSizeChange={(s) => { setRentalPageSize(s); setRentalPage(1); }} />
          </CardContent>
        </Card>
      )}

      {/* Add Class Waitlist Dialog */}
      <Dialog open={classOpen} onOpenChange={setClassOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tambah Waitlist Kelas</DialogTitle></DialogHeader>
          <form onSubmit={handleAddClass} className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Kelas *</Label>
              <SearchableSelect value={classForm.classId} onValueChange={(v) => v && setClassForm({ ...classForm, classId: v })} placeholder="Pilih kelas">
                {classes.map((c: any) => <SearchableSelectItem key={c.id} value={c.id}>{c.name}</SearchableSelectItem>)}
              </SearchableSelect>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Nama *</Label>
              <Input value={classForm.name} onChange={(e) => setClassForm({ ...classForm, name: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">No. HP *</Label>
              <Input value={classForm.phone} onChange={(e) => setClassForm({ ...classForm, phone: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Email</Label>
              <Input type="email" value={classForm.email} onChange={(e) => setClassForm({ ...classForm, email: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-neutral">
              <Button type="button" variant="outline" onClick={() => setClassOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-primary hover:bg-primary-80" disabled={loading}>{loading ? "Menyimpan..." : "Simpan"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Rental Waitlist Dialog */}
      <Dialog open={rentalOpen} onOpenChange={setRentalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tambah Waitlist Rental</DialogTitle></DialogHeader>
          <form onSubmit={handleAddRental} className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Lapangan *</Label>
              <SearchableSelect value={rentalForm.courtId} onValueChange={(v) => v && setRentalForm({ ...rentalForm, courtId: v })} placeholder="Pilih lapangan">
                {courts.map((c: any) => <SearchableSelectItem key={c.id} value={c.id}>{c.name}</SearchableSelectItem>)}
              </SearchableSelect>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Nama *</Label>
              <Input value={rentalForm.name} onChange={(e) => setRentalForm({ ...rentalForm, name: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">No. HP *</Label>
              <Input value={rentalForm.phone} onChange={(e) => setRentalForm({ ...rentalForm, phone: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Tanggal *</Label>
              <Input type="date" value={rentalForm.date} onChange={(e) => setRentalForm({ ...rentalForm, date: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Jam Mulai *</Label>
                <Input type="time" value={rentalForm.startTime} onChange={(e) => setRentalForm({ ...rentalForm, startTime: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Jam Selesai *</Label>
                <Input type="time" value={rentalForm.endTime} onChange={(e) => setRentalForm({ ...rentalForm, endTime: e.target.value })} required />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-neutral">
              <Button type="button" variant="outline" onClick={() => setRentalOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-primary hover:bg-primary-80" disabled={loading}>{loading ? "Menyimpan..." : "Simpan"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
