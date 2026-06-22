"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SearchableSelect, SearchableSelectItem } from "@/components/ui/searchable-select";
import { Label } from "@/components/ui/label";
import { DataPagination } from "@/components/ui/data-pagination";
import { Plus, MoreHorizontal, Download, BookOpen, Clock, MapPin, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClass, updateClass, deleteClass } from "@/app/actions/classes";
import { exportToExcel } from "@/lib/export";

const ageGroupLabels: Record<string, string> = {
  U8: "U8", U10: "U10", U12: "U12", U14: "U14", U16: "U16", SENIOR: "Senior",
};

const DAYS = [
  { value: 1, short: "Sen", label: "Senin" },
  { value: 2, short: "Sel", label: "Selasa" },
  { value: 3, short: "Rab", label: "Rabu" },
  { value: 4, short: "Kam", label: "Kamis" },
  { value: 5, short: "Jum", label: "Jumat" },
  { value: 6, short: "Sab", label: "Sabtu" },
  { value: 0, short: "Min", label: "Minggu" },
];

const HOURS = Array.from({ length: 17 }, (_, i) => {
  const h = i + 6;
  return `${String(h).padStart(2, "0")}:00`;
});

function parseSchedule(schedule: string | null | undefined) {
  if (!schedule) return null;
  try {
    const s = JSON.parse(schedule);
    if (!s.days) return { text: schedule };
    const days = [...(s.days as number[])]
      .sort((a, b) => a - b)
      .map((d) => DAYS.find((x) => x.value === d)?.short ?? d)
      .join(" & ");
    return { days, time: `${s.startTime}–${s.endTime}`, courtName: s.courtName || null, isJson: true };
  } catch {
    return { text: schedule };
  }
}

function serializeSchedule(days: number[], startTime: string, endTime: string, courtId: string, courtName: string) {
  if (!days.length || !courtId) return undefined;
  return JSON.stringify({ days, startTime, endTime, courtId, courtName });
}

interface Props { classes: any[]; branches: any[]; coaches: any[]; courts: any[]; }

const emptyForm = {
  name: "",
  ageGroup: "U8" as any,
  maxStudents: 20,
  branchId: "",
  coachId: "",
  scheduleDays: [] as number[],
  scheduleStart: "08:00",
  scheduleEnd: "10:00",
  scheduleCourtId: "",
};

export function ClassesClient({ classes: initial, branches, coaches, courts }: Props) {
  const router = useRouter();
  const classes = initial;
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const paginated = classes.slice((page - 1) * pageSize, page * pageSize);

  const filteredCourts = courts.filter((c: any) => c.isActive && (!form.branchId || c.branchId === form.branchId));

  function toggleDay(day: number) {
    setForm((f) => ({
      ...f,
      scheduleDays: f.scheduleDays.includes(day)
        ? f.scheduleDays.filter((d) => d !== day)
        : [...f.scheduleDays, day],
    }));
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(c: any) {
    setEditing(c);
    let scheduleDays: number[] = [];
    let scheduleStart = "08:00";
    let scheduleEnd = "10:00";
    let scheduleCourtId = "";
    if (c.schedule) {
      try {
        const s = JSON.parse(c.schedule);
        scheduleDays = s.days || [];
        scheduleStart = s.startTime || "08:00";
        scheduleEnd = s.endTime || "10:00";
        scheduleCourtId = s.courtId || "";
      } catch { /* old text format */ }
    }
    setForm({
      name: c.name,
      ageGroup: c.ageGroup,
      maxStudents: c.maxStudents,
      branchId: c.branchId,
      coachId: c.coachId || "",
      scheduleDays,
      scheduleStart,
      scheduleEnd,
      scheduleCourtId,
    });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const court = courts.find((c: any) => c.id === form.scheduleCourtId);
      const schedule = serializeSchedule(
        form.scheduleDays,
        form.scheduleStart,
        form.scheduleEnd,
        form.scheduleCourtId,
        court?.name || ""
      );
      const data = {
        name: form.name,
        ageGroup: form.ageGroup,
        schedule,
        maxStudents: form.maxStudents,
        branchId: form.branchId,
        coachId: form.coachId || undefined,
      };
      if (editing) { await updateClass(editing.id, data); toast.success("Kelas diperbarui"); }
      else { await createClass(data); toast.success("Kelas ditambahkan"); }
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus kelas ini?")) return;
    await deleteClass(id);
    toast.success("Kelas dihapus");
    router.refresh();
  }

  function handleExport() {
    const data = classes.map((c) => {
      const sched = parseSchedule(c.schedule);
      return {
        "Nama Kelas": c.name,
        "Kelompok Umur": ageGroupLabels[c.ageGroup] || c.ageGroup,
        "Hari": sched?.days || sched?.text || "-",
        "Waktu": sched?.time || "-",
        "Lapangan": sched?.courtName || "-",
        "Pelatih": c.coach?.name || "-",
        "Jumlah Siswa": c._count?.students || 0,
        "Maks Siswa": c.maxStudents,
        "Cabang": c.branch?.name || "-",
      };
    });
    exportToExcel(data, "Daftar-Kelas", "Kelas");
    toast.success(`${data.length} data diekspor`);
  }

  return (
    <Card className="border-gray-50 shadow-sm">
      <CardHeader className="pb-4 border-b border-gray-50">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-xl"><BookOpen className="w-5 h-5 text-purple-500" /></div>
            <div>
              <h2 className="font-semibold text-gray-900">Daftar Kelas</h2>
              <p className="text-xs text-gray-400">{classes.length} kelas terdaftar</p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <Button variant="outline" size="sm" className="h-9 border-gray-200 text-gray-700" onClick={handleExport}>
              <Download className="w-4 h-4 mr-1.5" /> Excel
            </Button>
            <Button size="sm" className="h-9 bg-orange-500 hover:bg-orange-600 shadow-sm shadow-orange-200" onClick={openCreate}>
              <Plus className="w-4 h-4 mr-1.5" /> Tambah Kelas
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table className="table-row-hover">
          <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50">
              <TableHead className="text-xs font-semibold text-gray-500 pl-5">Nama Kelas</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500">Usia</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500">Jadwal & Lapangan</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500">Pelatih</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500">Siswa</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500">Cabang</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16">
                  <BookOpen className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Belum ada kelas</p>
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((c) => {
                const isFull = c._count.students >= c.maxStudents;
                const sched = parseSchedule(c.schedule);
                return (
                  <TableRow key={c.id}>
                    <TableCell className="pl-5">
                      <p className="font-medium text-sm text-gray-900">{c.name}</p>
                    </TableCell>
                    <TableCell>
                      <span className="badge-blue">{ageGroupLabels[c.ageGroup] || c.ageGroup}</span>
                    </TableCell>
                    <TableCell>
                      {!sched ? (
                        <span className="text-gray-300">—</span>
                      ) : sched.isJson ? (
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            <span className="text-xs font-medium text-gray-700">{sched.days}</span>
                            <span className="text-xs text-gray-500">{sched.time}</span>
                          </div>
                          {sched.courtName && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3 h-3 text-orange-500 flex-shrink-0" />
                              <span className="text-xs text-orange-500">{sched.courtName}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-700">{sched.text}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-700">{c.coach?.name || <span className="text-gray-300">—</span>}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${isFull ? "text-red-500" : "text-gray-900"}`}>
                          {c._count.students}
                        </span>
                        <span className="text-xs text-gray-400">/ {c.maxStudents}</span>
                        {isFull && <span className="badge-red">Penuh</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-700">{c.branch?.name}</span>
                    </TableCell>
                    <TableCell className="pr-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-700" aria-label="Aksi" />}>
                          <MoreHorizontal className="w-4 h-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(c)} className="cursor-pointer gap-2"><Pencil className="w-3.5 h-3.5" /> Edit</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-500 focus:text-red-500 cursor-pointer gap-2" onClick={() => handleDelete(c.id)}><Trash2 className="w-3.5 h-3.5" /> Hapus</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <DataPagination
          total={classes.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        />
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Kelas" : "Tambah Kelas Baru"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            {/* Basic info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Nama Kelas *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Kelompok Umur *</Label>
                <SearchableSelect value={form.ageGroup} onValueChange={(v) => v && setForm({ ...form, ageGroup: v as any })} placeholder="Pilih kelompok umur">
                  {Object.entries(ageGroupLabels).map(([k, v]) => <SearchableSelectItem key={k} value={k}>{v}</SearchableSelectItem>)}
                </SearchableSelect>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Maks. Siswa</Label>
                <Input type="number" value={form.maxStudents} onChange={(e) => setForm({ ...form, maxStudents: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Cabang *</Label>
                <SearchableSelect
                  value={form.branchId}
                  onValueChange={(v) => v && setForm({ ...form, branchId: v, scheduleCourtId: "" })}
                  placeholder="Pilih cabang"
                >
                  {branches.map((b: any) => <SearchableSelectItem key={b.id} value={b.id}>{b.name}</SearchableSelectItem>)}
                </SearchableSelect>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Pelatih</Label>
                <SearchableSelect value={form.coachId} onValueChange={(v) => v && setForm({ ...form, coachId: v })} placeholder="Pilih pelatih">
                  {coaches.map((c: any) => <SearchableSelectItem key={c.id} value={c.id}>{c.name}</SearchableSelectItem>)}
                </SearchableSelect>
              </div>
            </div>

            {/* Schedule section */}
            <div className="border border-gray-50 rounded-xl p-4 space-y-3 bg-gray-50">
              <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-orange-500" /> Jadwal Latihan
              </p>

              {/* Day picker */}
              <div className="space-y-1.5">
                <p className="text-xs text-gray-500">Hari Latihan</p>
                <div className="flex gap-1.5 flex-wrap">
                  {DAYS.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        form.scheduleDays.includes(day.value)
                          ? "bg-orange-500 text-white shadow-sm"
                          : "bg-white text-gray-700 border border-gray-200 hover:border-orange-400"
                      }`}
                    >
                      {day.short}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time range */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <p className="text-xs text-gray-500">Jam Mulai</p>
                  <SearchableSelect
                    value={form.scheduleStart}
                    onValueChange={(v) => v && setForm({ ...form, scheduleStart: v })}
                    className="bg-white"
                  >
                    {HOURS.map((h) => <SearchableSelectItem key={h} value={h}>{h}</SearchableSelectItem>)}
                  </SearchableSelect>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs text-gray-500">Jam Selesai</p>
                  <SearchableSelect
                    value={form.scheduleEnd}
                    onValueChange={(v) => v && setForm({ ...form, scheduleEnd: v })}
                    className="bg-white"
                  >
                    {HOURS.filter((h) => h > form.scheduleStart).map((h) => (
                      <SearchableSelectItem key={h} value={h}>{h}</SearchableSelectItem>
                    ))}
                  </SearchableSelect>
                </div>
              </div>

              {/* Court */}
              <div className="space-y-1.5">
                <p className="text-xs text-gray-500">
                  Lapangan yang Digunakan
                  <span className="text-orange-500 ml-1">— slot ini akan diblokir dari penyewaan</span>
                </p>
                <SearchableSelect
                  value={form.scheduleCourtId}
                  onValueChange={(v) => setForm({ ...form, scheduleCourtId: v ?? "" })}
                  disabled={!form.branchId}
                  className="bg-white"
                  placeholder={!form.branchId ? "Pilih cabang dulu" : "Tidak ada / semua lapangan"}
                >
                  <SearchableSelectItem value="">Tidak ada / semua lapangan</SearchableSelectItem>
                  {filteredCourts.map((c: any) => (
                    <SearchableSelectItem key={c.id} value={c.id}>{c.name}</SearchableSelectItem>
                  ))}
                </SearchableSelect>
              </div>

              {form.scheduleDays.length > 0 && form.scheduleCourtId && (
                <div className="text-xs text-orange-500 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                  Lapangan akan diblokir: {form.scheduleDays.sort().map((d) => DAYS.find((x) => x.value === d)?.label).join(", ")}{" "}
                  {form.scheduleStart}–{form.scheduleEnd}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-1 border-t border-gray-50">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600" disabled={loading}>
                {loading ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
