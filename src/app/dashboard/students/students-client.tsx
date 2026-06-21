"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SearchableSelect, SearchableSelectItem } from "@/components/ui/searchable-select";
import { Label } from "@/components/ui/label";
import { DataPagination } from "@/components/ui/data-pagination";
import { Plus, Search, MoreHorizontal, ExternalLink, Download, Users, Loader2 } from "lucide-react";
import { createStudent, updateStudent, suspendStudent, activateStudent } from "@/app/actions/students";
import { exportToExcel } from "@/lib/export";
import { toast } from "sonner";
import { format } from "date-fns";

const statusBadge: Record<string, string> = {
  ACTIVE: "badge-green",
  INACTIVE: "badge-gray",
  SUSPENDED: "badge-red",
};
const statusLabels: Record<string, string> = {
  ACTIVE: "Aktif", INACTIVE: "Tidak Aktif", SUSPENDED: "Ditangguhkan",
};

interface Props { students: any[]; branches: any[]; classes: any[]; }
const emptyForm = { name: "", birthDate: "", gender: "MALE" as const, phone: "", parentName: "", parentPhone: "", address: "", branchId: "", classId: "" };

export function StudentsClient({ students: initialStudents, branches, classes }: Props) {
  const router = useRouter();
  const students = initialStudents;
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterClass, setFilterClass] = useState("ALL");
  const [filterBranch, setFilterBranch] = useState("ALL");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = students.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.studentNumber.toLowerCase().includes(search.toLowerCase()) ||
      (s.parentName || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "ALL" || s.status === filterStatus;
    const matchClass = filterClass === "ALL" || s.classId === filterClass;
    const matchBranch = filterBranch === "ALL" || s.branchId === filterBranch;
    return matchSearch && matchStatus && matchClass && matchBranch;
  });
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  function resetPage() { setPage(1); }

  function openCreate() { setEditing(null); setForm(emptyForm); setOpen(true); }
  function openEdit(s: any) {
    setEditing(s);
    setForm({ name: s.name, birthDate: s.birthDate ? s.birthDate.toString().slice(0, 10) : "", gender: s.gender, phone: s.phone || "", parentName: s.parentName || "", parentPhone: s.parentPhone || "", address: s.address || "", branchId: s.branchId, classId: s.classId || "" });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try {
      const data = { ...form, classId: form.classId || undefined };
      if (editing) { await updateStudent(editing.id, data); toast.success("Data siswa berhasil diperbarui"); }
      else { await createStudent(data); toast.success("Siswa berhasil ditambahkan"); }
      setOpen(false); router.refresh();
    } catch (err: any) { toast.error(err.message || "Terjadi kesalahan"); }
    setLoading(false);
  }

  async function handleSuspend(id: string, status: string) {
    if (status === "ACTIVE") { await suspendStudent(id); toast.success("Siswa ditangguhkan"); }
    else { await activateStudent(id); toast.success("Siswa diaktifkan"); }
    router.refresh();
  }

  function handleExport() {
    const data = filtered.map((s) => ({
      "No. Siswa": s.studentNumber, "Nama": s.name,
      "Jenis Kelamin": s.gender === "MALE" ? "Laki-laki" : "Perempuan",
      "Tanggal Lahir": s.birthDate ? format(new Date(s.birthDate), "dd/MM/yyyy") : "-",
      "No. HP": s.phone || "-", "Nama Orang Tua": s.parentName || "-",
      "No. HP Orang Tua": s.parentPhone || "-", "Alamat": s.address || "-",
      "Kelas": s.class?.name || "-", "Cabang": s.branch?.name || "-",
      "Status": statusLabels[s.status] || s.status,
    }));
    exportToExcel(data, "Daftar-Siswa", "Siswa");
    toast.success(`${data.length} data diekspor`);
  }

  const activeCount = students.filter(s => s.status === "ACTIVE").length;

  return (
    <Card className="border-neutral shadow-sm">
      <CardHeader className="pb-4 border-b border-neutral">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="font-semibold text-on-surface">Daftar Siswa</h2>
              <p className="text-xs text-muted-foreground">{activeCount} aktif · {filtered.length} ditampilkan</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Cari nama, nomor siswa..." className="pl-9 w-52 h-9 text-sm border-border" value={search} onChange={(e) => { setSearch(e.target.value); resetPage(); }} />
            </div>
            <SearchableSelect value={filterStatus} onValueChange={(v) => { setFilterStatus(v ?? "ALL"); resetPage(); }} className="w-34 h-9 text-sm border-border">
              <SearchableSelectItem value="ALL">Semua Status</SearchableSelectItem>
              {Object.entries(statusLabels).map(([k, v]) => <SearchableSelectItem key={k} value={k}>{v}</SearchableSelectItem>)}
            </SearchableSelect>
            <SearchableSelect value={filterClass} onValueChange={(v) => { setFilterClass(v ?? "ALL"); resetPage(); }} className="w-32 h-9 text-sm border-border">
              <SearchableSelectItem value="ALL">Semua Kelas</SearchableSelectItem>
              {classes.map((c: any) => <SearchableSelectItem key={c.id} value={c.id}>{c.name}</SearchableSelectItem>)}
            </SearchableSelect>
            <SearchableSelect value={filterBranch} onValueChange={(v) => { setFilterBranch(v ?? "ALL"); resetPage(); }} className="w-32 h-9 text-sm border-border">
              <SearchableSelectItem value="ALL">Semua Cabang</SearchableSelectItem>
              {branches.map((b: any) => <SearchableSelectItem key={b.id} value={b.id}>{b.name}</SearchableSelectItem>)}
            </SearchableSelect>
            <Button variant="outline" size="sm" onClick={handleExport} className="h-9 border-border text-foreground hover:text-on-surface">
              <Download className="w-4 h-4 mr-1.5" /> Excel
            </Button>
            <Button size="sm" className="h-9 bg-primary hover:bg-primary-80 shadow-sm shadow-primary/20" onClick={openCreate}>
              <Plus className="w-4 h-4 mr-1.5" /> Tambah Siswa
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table className="table-row-hover">
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="text-xs font-semibold text-tertiary pl-5">No. Siswa</TableHead>
              <TableHead className="text-xs font-semibold text-tertiary">Nama</TableHead>
              <TableHead className="text-xs font-semibold text-tertiary">Kelas</TableHead>
              <TableHead className="text-xs font-semibold text-tertiary">Orang Tua</TableHead>
              <TableHead className="text-xs font-semibold text-tertiary">Cabang</TableHead>
              <TableHead className="text-xs font-semibold text-tertiary">Status</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="w-8 h-8 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">
                      {search || filterStatus !== "ALL" || filterClass !== "ALL" || filterBranch !== "ALL" ? "Tidak ada hasil yang cocok" : "Belum ada siswa terdaftar"}
                    </p>
                    {!search && filterStatus === "ALL" && filterClass === "ALL" && filterBranch === "ALL" && (
                      <Button size="sm" className="mt-1 bg-primary hover:bg-primary-80" onClick={openCreate}>
                        <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Siswa Pertama
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((s) => (
                <TableRow key={s.id} className="cursor-default">
                  <TableCell className="pl-5">
                    <span className="font-mono text-xs text-tertiary bg-muted/50 px-2 py-1 rounded-md">{s.studentNumber}</span>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-on-surface text-sm">{s.name}</p>
                  </TableCell>
                  <TableCell><span className="text-sm text-foreground">{s.class?.name || <span className="text-muted-foreground/50">—</span>}</span></TableCell>
                  <TableCell><span className="text-sm text-foreground">{s.parentName || <span className="text-muted-foreground/50">—</span>}</span></TableCell>
                  <TableCell><span className="text-sm text-foreground">{s.branch?.name || <span className="text-muted-foreground/50">—</span>}</span></TableCell>
                  <TableCell>
                    <span className={statusBadge[s.status]}>{statusLabels[s.status]}</span>
                  </TableCell>
                  <TableCell className="pr-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" aria-label="Aksi" />}>
                        <MoreHorizontal className="w-4 h-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/students/${s.id}`)} className="cursor-pointer">
                          <ExternalLink className="w-3.5 h-3.5 mr-2 text-muted-foreground" /> Detail
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEdit(s)} className="cursor-pointer">Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSuspend(s.id, s.status)} className={`cursor-pointer ${s.status === "ACTIVE" ? "text-destructive" : "text-green-600"}`}>
                          {s.status === "ACTIVE" ? "Tangguhkan" : "Aktifkan"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <DataPagination total={filtered.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Siswa" : "Tambah Siswa Baru"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5"><Label className="text-xs font-medium text-foreground">Nama Lengkap *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium text-foreground">Tanggal Lahir</Label><Input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} /></div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Jenis Kelamin</Label>
                <SearchableSelect value={form.gender} onValueChange={(v) => v && setForm({ ...form, gender: v as any })} placeholder="Pilih jenis kelamin">
                  <SearchableSelectItem value="MALE">Laki-laki</SearchableSelectItem>
                  <SearchableSelectItem value="FEMALE">Perempuan</SearchableSelectItem>
                </SearchableSelect>
              </div>
              <div className="space-y-1.5"><Label className="text-xs font-medium text-foreground">No. HP</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium text-foreground">Nama Orang Tua</Label><Input value={form.parentName} onChange={(e) => setForm({ ...form, parentName: e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium text-foreground">No. HP Orang Tua</Label><Input value={form.parentPhone} onChange={(e) => setForm({ ...form, parentPhone: e.target.value })} /></div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Cabang *</Label>
                <SearchableSelect value={form.branchId} onValueChange={(v) => v && setForm({ ...form, branchId: v })} placeholder="Pilih cabang">
                  {branches.map((b: any) => <SearchableSelectItem key={b.id} value={b.id}>{b.name}</SearchableSelectItem>)}
                </SearchableSelect>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Kelas</Label>
                <SearchableSelect value={form.classId} onValueChange={(v) => v && setForm({ ...form, classId: v })} placeholder="Pilih kelas">
                  {classes.map((c: any) => <SearchableSelectItem key={c.id} value={c.id}>{c.name}</SearchableSelectItem>)}
                </SearchableSelect>
              </div>
              <div className="col-span-2 space-y-1.5"><Label className="text-xs font-medium text-foreground">Alamat</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-neutral">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-primary hover:bg-primary-80" disabled={loading}>
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</> : "Simpan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
