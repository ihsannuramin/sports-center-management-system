"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, GitBranch, Users, UserCheck, Building2, Download, MapPin, Phone } from "lucide-react";
import { createBranch, updateBranch, toggleBranchStatus } from "@/app/actions/branches";
import { exportToExcel } from "@/lib/export";
import { toast } from "sonner";

interface Props { branches: any[]; }
const emptyForm = { name: "", address: "", phone: "" };
const PAGE_SIZE = 9;

export function BranchesClient({ branches: initial }: Props) {
  const branches = initial;
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(branches.length / PAGE_SIZE));
  const paginated = branches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function openCreate() { setEditing(null); setForm(emptyForm); setOpen(true); }
  function openEdit(b: any) {
    setEditing(b);
    setForm({ name: b.name, address: b.address || "", phone: b.phone || "" });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try {
      if (editing) { await updateBranch(editing.id, form); toast.success("Cabang diperbarui"); }
      else { await createBranch(form); toast.success("Cabang ditambahkan"); }
      setOpen(false); window.location.reload();
    } catch (err: any) { toast.error(err.message); }
    setLoading(false);
  }

  async function handleToggle(id: string, isActive: boolean) {
    await toggleBranchStatus(id, !isActive);
    toast.success(isActive ? "Cabang dinonaktifkan" : "Cabang diaktifkan");
    window.location.reload();
  }

  function handleExport() {
    const data = branches.map((b) => ({
      "Nama Cabang": b.name, "Alamat": b.address || "-", "Telepon": b.phone || "-",
      "Jumlah Siswa": b._count?.students || 0, "Jumlah Pelatih": b._count?.coaches || 0,
      "Jumlah Lapangan": b._count?.courts || 0, "Status": b.isActive ? "Aktif" : "Nonaktif",
    }));
    exportToExcel(data, "Daftar-Cabang", "Cabang");
    toast.success(`${data.length} data diekspor`);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-10 rounded-xl"><GitBranch className="w-5 h-5 text-primary" /></div>
          <div>
            <h2 className="font-semibold text-on-surface">Daftar Cabang</h2>
            <p className="text-xs text-muted-foreground">{branches.length} cabang · {branches.filter(b => b.isActive).length} aktif</p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <Button variant="outline" size="sm" className="h-9 border-border text-foreground" onClick={handleExport}>
            <Download className="w-4 h-4 mr-1.5" /> Excel
          </Button>
          <Button size="sm" className="h-9 bg-primary hover:bg-primary-80 shadow-sm shadow-primary/20" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-1.5" /> Tambah Cabang
          </Button>
        </div>
      </div>

      {paginated.length === 0 ? (
        <div className="text-center py-16">
          <GitBranch className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-3">Belum ada cabang terdaftar</p>
          <Button size="sm" className="bg-primary hover:bg-primary-80" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-1.5" /> Tambah Cabang Pertama
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paginated.map((b) => (
            <Card key={b.id} className={`border-neutral shadow-sm transition-all hover:shadow-md ${!b.isActive ? "opacity-60" : ""}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-primary-80 rounded-xl flex items-center justify-center shadow-sm shadow-primary/20 flex-shrink-0 mt-0.5">
                      <GitBranch className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-base text-on-surface truncate">{b.name}</CardTitle>
                      {b.address && (
                        <div className="flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                          <p className="text-xs text-muted-foreground truncate">{b.address}</p>
                        </div>
                      )}
                      {b.phone && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                          <p className="text-xs text-muted-foreground">{b.phone}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <span className={`flex-shrink-0 ${b.isActive ? "badge-green" : "badge-gray"}`}>
                    {b.isActive ? "Aktif" : "Nonaktif"}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center p-2.5 bg-blue-50 rounded-xl">
                    <Users className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                    <p className="text-xl font-bold text-blue-700 leading-tight">{b._count?.students || 0}</p>
                    <p className="text-xs text-blue-400 mt-0.5">Siswa</p>
                  </div>
                  <div className="text-center p-2.5 bg-green-50 rounded-xl">
                    <UserCheck className="w-4 h-4 text-green-500 mx-auto mb-1" />
                    <p className="text-xl font-bold text-green-700 leading-tight">{b._count?.coaches || 0}</p>
                    <p className="text-xs text-green-400 mt-0.5">Pelatih</p>
                  </div>
                  <div className="text-center p-2.5 bg-primary-10 rounded-xl">
                    <Building2 className="w-4 h-4 text-primary mx-auto mb-1" />
                    <p className="text-xl font-bold text-primary leading-tight">{b._count?.courts || 0}</p>
                    <p className="text-xs text-primary mt-0.5">Lapangan</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 h-8 text-xs border-border hover:border-foreground/20" onClick={() => openEdit(b)}>Edit</Button>
                  <Button size="sm" variant="outline" onClick={() => handleToggle(b.id, b.isActive)}
                    className={`flex-1 h-8 text-xs ${b.isActive ? "text-destructive border-destructive/20 hover:bg-destructive/10" : "text-green-600 border-green-100 hover:bg-green-50"}`}>
                    {b.isActive ? "Nonaktifkan" : "Aktifkan"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" className="h-8 border-border" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Sebelumnya</Button>
          <span className="text-sm text-tertiary min-w-[4rem] text-center">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" className="h-8 border-border" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Berikutnya</Button>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Cabang" : "Tambah Cabang Baru"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 pt-1">
            <div className="space-y-1.5"><Label className="text-xs font-medium text-foreground">Nama Cabang *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-foreground">Alamat</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-foreground">No. Telepon</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="flex justify-end gap-2 pt-2 border-t border-neutral">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-primary hover:bg-primary-80" disabled={loading}>{loading ? "Menyimpan..." : "Simpan"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
