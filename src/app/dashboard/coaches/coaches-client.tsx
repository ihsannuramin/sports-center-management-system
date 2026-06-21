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
import { Plus, MoreHorizontal, Download, Search, UserCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { exportToExcel } from "@/lib/export";

interface Props { coaches: any[]; branches: any[]; }
const emptyForm = { name: "", phone: "", email: "", specialty: "", branchId: "", userId: "" };

export function CoachesClient({ coaches: initial, branches }: Props) {
  const router = useRouter();
  const coaches = initial;
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = coaches.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  function openCreate() { setEditing(null); setForm(emptyForm); setOpen(true); }
  function openEdit(c: any) {
    setEditing(c);
    setForm({ name: c.name, phone: c.phone || "", email: c.email || "", specialty: c.specialty || "", branchId: c.branchId, userId: c.userId });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try {
      const { createCoach, updateCoach } = await import("@/app/actions/coaches");
      if (editing) { await updateCoach(editing.id, form); toast.success("Pelatih diperbarui"); }
      else { await createCoach(form); toast.success("Pelatih ditambahkan"); }
      setOpen(false); router.refresh();
    } catch (err: any) { toast.error(err.message || "Terjadi kesalahan"); }
    setLoading(false);
  }

  async function handleToggle(id: string, isActive: boolean) {
    const { toggleCoachStatus } = await import("@/app/actions/coaches");
    await toggleCoachStatus(id, !isActive);
    toast.success(isActive ? "Pelatih dinonaktifkan" : "Pelatih diaktifkan");
    router.refresh();
  }

  function handleExport() {
    const data = filtered.map((c) => ({
      "Nama": c.name, "No. HP": c.phone || "-", "Email": c.email || "-",
      "Spesialisasi": c.specialty || "-", "Jumlah Kelas": c.classes?.length || 0,
      "Cabang": c.branch?.name || "-", "Status": c.isActive ? "Aktif" : "Tidak Aktif",
    }));
    exportToExcel(data, "Daftar-Pelatih", "Pelatih");
    toast.success(`${data.length} data diekspor`);
  }

  return (
    <Card className="border-neutral shadow-sm">
      <CardHeader className="pb-4 border-b border-neutral">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-xl"><UserCheck className="w-5 h-5 text-green-500" /></div>
            <div>
              <h2 className="font-semibold text-on-surface">Daftar Pelatih</h2>
              <p className="text-xs text-muted-foreground">{filtered.length} pelatih</p>
            </div>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Cari pelatih..." className="pl-9 w-52 h-9 text-sm border-border" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <Button variant="outline" size="sm" className="h-9 border-border text-foreground" onClick={handleExport}>
              <Download className="w-4 h-4 mr-1.5" /> Excel
            </Button>
            <Button size="sm" className="h-9 bg-primary hover:bg-primary-80 shadow-sm shadow-primary/20" onClick={openCreate}>
              <Plus className="w-4 h-4 mr-1.5" /> Tambah Pelatih
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table className="table-row-hover">
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="text-xs font-semibold text-tertiary pl-5">Pelatih</TableHead>
              <TableHead className="text-xs font-semibold text-tertiary">Spesialisasi</TableHead>
              <TableHead className="text-xs font-semibold text-tertiary">Kelas</TableHead>
              <TableHead className="text-xs font-semibold text-tertiary">Cabang</TableHead>
              <TableHead className="text-xs font-semibold text-tertiary">Status</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-16">
                <UserCheck className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Belum ada pelatih</p>
              </TableCell></TableRow>
            ) : (
              paginated.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="pl-5">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-gradient-to-br from-orange-400 to-primary-80 text-white text-xs font-bold">
                          {c.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm text-on-surface">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.phone || c.email || "—"}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {c.specialty ? <span className="text-sm text-foreground">{c.specialty}</span> : <span className="text-muted-foreground/50 text-sm">—</span>}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-sm text-foreground">
                      <span className="font-semibold text-on-surface">{c.classes?.length || 0}</span> kelas
                    </span>
                  </TableCell>
                  <TableCell><span className="text-sm text-foreground">{c.branch?.name || "—"}</span></TableCell>
                  <TableCell>
                    <span className={c.isActive ? "badge-green" : "badge-gray"}>
                      {c.isActive ? "Aktif" : "Tidak Aktif"}
                    </span>
                  </TableCell>
                  <TableCell className="pr-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" aria-label="Aksi" />}>
                        <MoreHorizontal className="w-4 h-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(c)} className="cursor-pointer">Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggle(c.id, c.isActive)} className={`cursor-pointer ${c.isActive ? "text-destructive" : "text-green-600"}`}>
                          {c.isActive ? "Nonaktifkan" : "Aktifkan"}
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
          <DialogHeader><DialogTitle>{editing ? "Edit Pelatih" : "Tambah Pelatih Baru"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5"><Label className="text-xs font-medium text-foreground">Nama Lengkap *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium text-foreground">No. HP</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium text-foreground">Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium text-foreground">Spesialisasi</Label><Input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} placeholder="e.g. Shooting, Defense" /></div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Cabang *</Label>
                <SearchableSelect value={form.branchId} onValueChange={(v) => v && setForm({ ...form, branchId: v })} placeholder="Pilih cabang">
                  {branches.map((b: any) => <SearchableSelectItem key={b.id} value={b.id}>{b.name}</SearchableSelectItem>)}
                </SearchableSelect>
              </div>
              <div className="col-span-2 space-y-1.5"><Label className="text-xs font-medium text-foreground">User ID (Supabase) *</Label><Input value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} required /></div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-neutral">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-primary hover:bg-primary-80" disabled={loading}>{loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</> : "Simpan"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
