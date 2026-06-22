"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Box, Plus, Search, Download, AlertCircle, Pencil, Trash2 } from "lucide-react";
import { createAsset, updateAsset, deleteAsset } from "@/app/actions/assets";
import { exportToExcel } from "@/lib/export";
import { toast } from "sonner";
import { format } from "date-fns";

interface Props { assets: any[]; branches: any[]; }

const CATEGORIES = ["Basketball Ring", "AC", "Scoreboard", "Lighting", "Sound System", "Camera", "Furniture", "Equipment", "Other"];
const CONDITIONS = ["GOOD", "FAIR", "POOR", "NEEDS_REPAIR"];
const CONDITION_COLORS: Record<string, string> = {
  GOOD: "bg-green-50 text-green-700",
  FAIR: "bg-yellow-50 text-yellow-700",
  POOR: "bg-orange-50 text-orange-500",
  NEEDS_REPAIR: "bg-red-50 text-red-500",
};
const emptyForm = { name: "", category: "Equipment", branchId: "", purchaseDate: "", cost: "", depreciation: "", warrantyExpiry: "", condition: "GOOD", description: "" };
const PAGE_SIZE = 9;

export function AssetsClient({ assets: initial, branches }: Props) {
  const assets = initial;
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const filtered = assets.filter((a) => {
    const q = search.toLowerCase();
    return !q || a.name?.toLowerCase().includes(q) || a.category?.toLowerCase().includes(q);
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const needsRepair = assets.filter(a => a.condition === "NEEDS_REPAIR" || a.condition === "POOR").length;
  const totalValue = assets.reduce((sum, a) => sum + Number(a.cost ?? 0), 0);

  function openCreate() { setEditing(null); setForm(emptyForm); setOpen(true); }
  function openEdit(a: any) {
    setEditing(a);
    setForm({
      name: a.name, category: a.category, branchId: a.branchId,
      purchaseDate: a.purchaseDate ? a.purchaseDate.split("T")[0] : "",
      cost: a.cost ? String(Number(a.cost)) : "",
      depreciation: a.depreciation ? String(Number(a.depreciation)) : "",
      warrantyExpiry: a.warrantyExpiry ? a.warrantyExpiry.split("T")[0] : "",
      condition: a.condition, description: a.description ?? "",
    });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try {
      const data = {
        name: form.name, category: form.category, branchId: form.branchId,
        purchaseDate: form.purchaseDate || undefined,
        cost: form.cost ? parseFloat(form.cost) : undefined,
        depreciation: form.depreciation ? parseFloat(form.depreciation) : undefined,
        warrantyExpiry: form.warrantyExpiry || undefined,
        condition: form.condition, description: form.description || undefined,
      };
      if (editing) { await updateAsset(editing.id, data); toast.success("Aset diperbarui"); }
      else { await createAsset(data as any); toast.success("Aset ditambahkan"); }
      setOpen(false); window.location.reload();
    } catch (err: any) { toast.error(err.message); }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus aset ini?")) return;
    await deleteAsset(id);
    toast.success("Aset dihapus");
    window.location.reload();
  }

  function handleExport() {
    const data = assets.map((a) => ({
      "Nama": a.name, "Kategori": a.category, "Cabang": a.branch?.name ?? "-",
      "Kondisi": a.condition, "Harga": Number(a.cost ?? 0),
      "Depresiasi (%)": Number(a.depreciation ?? 0),
      "Garansi s/d": a.warrantyExpiry ? new Date(a.warrantyExpiry).toLocaleDateString("id-ID") : "-",
    }));
    exportToExcel(data, "Aset", "Assets");
    toast.success(`${data.length} data diekspor`);
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-gray-50 shadow-sm"><CardContent className="p-4"><p className="text-xs text-gray-400 mb-1">Total Aset</p><p className="text-2xl font-bold text-gray-900">{assets.length}</p></CardContent></Card>
        <Card className="border-gray-50 shadow-sm"><CardContent className="p-4"><p className="text-xs text-gray-400 mb-1">Total Nilai</p><p className="text-xl font-bold text-gray-900">Rp {totalValue.toLocaleString("id-ID")}</p></CardContent></Card>
        <Card className="border-gray-50 shadow-sm"><CardContent className="p-4"><p className="text-xs text-gray-400 mb-1">Perlu Perbaikan</p><p className="text-2xl font-bold text-red-500">{needsRepair}</p></CardContent></Card>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-50 rounded-xl"><Box className="w-5 h-5 text-orange-500" /></div>
          <div>
            <h2 className="font-semibold text-gray-900">Daftar Aset</h2>
            <p className="text-xs text-gray-400">{assets.length} aset terdaftar</p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <Button variant="outline" size="sm" className="h-9 border-gray-200" onClick={handleExport}><Download className="w-4 h-4 mr-1.5" /> Excel</Button>
          <Button size="sm" className="h-9 bg-orange-500 hover:bg-orange-600 shadow-sm shadow-orange-200" onClick={openCreate}><Plus className="w-4 h-4 mr-1.5" /> Tambah Aset</Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder="Cari aset..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9 h-9 border-gray-200 text-sm" />
      </div>

      {paginated.length === 0 ? (
        <div className="text-center py-16"><Box className="w-10 h-10 text-gray-200 mx-auto mb-3" /><p className="text-sm text-gray-400 mb-3">Belum ada aset terdaftar</p><Button size="sm" className="bg-orange-500 hover:bg-orange-600" onClick={openCreate}><Plus className="w-4 h-4 mr-1.5" /> Tambah Aset</Button></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paginated.map((asset) => (
            <Card key={asset.id} className="border-gray-50 shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-gray-900">{asset.name}</p>
                    <p className="text-xs text-gray-400">{asset.category}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CONDITION_COLORS[asset.condition]}`}>{asset.condition}</span>
                </div>
                <div className="space-y-1.5 text-xs text-gray-500">
                  {asset.cost && <div className="flex justify-between"><span>Nilai:</span><span className="font-medium">Rp {Number(asset.cost).toLocaleString("id-ID")}</span></div>}
                  {asset.depreciation && <div className="flex justify-between"><span>Depresiasi:</span><span className="font-medium">{Number(asset.depreciation)}%/tahun</span></div>}
                  {asset.warrantyExpiry && <div className="flex justify-between"><span>Garansi s/d:</span><span className="font-medium">{new Date(asset.warrantyExpiry).toLocaleDateString("id-ID")}</span></div>}
                  <div className="flex justify-between"><span>Cabang:</span><span className="font-medium">{asset.branch?.name}</span></div>
                  <div className="flex justify-between"><span>Tiket:</span><span className="font-medium">{asset._count?.maintenanceTickets ?? 0}</span></div>
                </div>
                {(asset.condition === "NEEDS_REPAIR" || asset.condition === "POOR") && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-red-500 bg-red-50 rounded-lg px-2.5 py-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> Perlu perhatian
                  </div>
                )}
                <div className="flex gap-3 mt-3 pt-3 border-t border-gray-50">
                  <Button size="sm" variant="outline" className="flex-1 h-8 text-xs border-gray-200 cursor-pointer" onClick={() => openEdit(asset)}><Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit</Button>
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-red-500 border-red-100 hover:bg-red-50 cursor-pointer" title="Hapus" onClick={() => handleDelete(asset.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" className="h-8 border-gray-200" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Sebelumnya</Button>
          <span className="text-sm text-gray-500">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" className="h-8 border-gray-200" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Berikutnya</Button>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Aset" : "Tambah Aset Baru"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 pt-1">
            <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">Nama Aset *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Kategori</Label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full h-9 border border-gray-200 rounded-lg px-3 text-sm bg-white">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Cabang *</Label>
                <select value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })} required className="w-full h-9 border border-gray-200 rounded-lg px-3 text-sm bg-white">
                  <option value="">Pilih Cabang</option>
                  {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">Tanggal Beli</Label><Input type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">Harga (Rp)</Label><Input type="number" min="0" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">Depresiasi (%/tahun)</Label><Input type="number" min="0" max="100" step="0.1" value={form.depreciation} onChange={(e) => setForm({ ...form, depreciation: e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">Garansi s/d</Label><Input type="date" value={form.warrantyExpiry} onChange={(e) => setForm({ ...form, warrantyExpiry: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Kondisi</Label>
              <select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} className="w-full h-9 border border-gray-200 rounded-lg px-3 text-sm bg-white">
                {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">Deskripsi</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-50">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600" disabled={loading}>{loading ? "Menyimpan..." : "Simpan"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
