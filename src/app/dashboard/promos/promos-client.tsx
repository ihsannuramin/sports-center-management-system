"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tag, Plus, Search, Copy, ToggleLeft, ToggleRight } from "lucide-react";
import { createPromotion, updatePromotion, deletePromotion } from "@/app/actions/promos";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface Props { promos: any[]; }

const DISCOUNT_TYPES = ["FIXED", "PERCENTAGE"];
const CONDITIONS = [
  { key: "new_student", label: "Siswa Baru" },
  { key: "early_bird", label: "Early Bird" },
  { key: "sibling", label: "Kakak/Adik" },
  { key: "referral", label: "Referral" },
];
const emptyForm = { code: "", name: "", discountType: "PERCENTAGE", discountValue: "", maxUses: "", startDate: "", endDate: "", conditions: [] as string[] };
const PAGE_SIZE = 9;

export function PromosClient({ promos: initial }: Props) {
  const promos = initial;
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const filtered = promos.filter((p) => {
    const q = search.toLowerCase();
    return !q || p.code?.toLowerCase().includes(q) || p.name?.toLowerCase().includes(q);
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const activeCount = promos.filter(p => p.isActive).length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try {
      await createPromotion({
        code: form.code.toUpperCase(),
        name: form.name,
        discountType: form.discountType as any,
        discountValue: parseFloat(form.discountValue),
        maxUses: form.maxUses ? parseInt(form.maxUses) : undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        conditions: form.conditions.map(c => ({ condition: c })),
      });
      toast.success("Promo dibuat");
      setOpen(false); window.location.reload();
    } catch (err: any) { toast.error(err.message); }
    setLoading(false);
  }

  async function handleToggle(id: string, isActive: boolean) {
    await updatePromotion(id, { isActive: !isActive });
    toast.success(isActive ? "Promo dinonaktifkan" : "Promo diaktifkan");
    window.location.reload();
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus promo ini?")) return;
    await deletePromotion(id);
    toast.success("Promo dihapus");
    window.location.reload();
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    toast.success(`Kode "${code}" disalin`);
  }

  function toggleCondition(key: string) {
    setForm(f => ({
      ...f,
      conditions: f.conditions.includes(key) ? f.conditions.filter(c => c !== key) : [...f.conditions, key],
    }));
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-gray-100 shadow-sm"><CardContent className="p-4"><p className="text-xs text-gray-400 mb-1">Total Promo</p><p className="text-2xl font-bold text-gray-900">{promos.length}</p></CardContent></Card>
        <Card className="border-gray-100 shadow-sm"><CardContent className="p-4"><p className="text-xs text-gray-400 mb-1">Promo Aktif</p><p className="text-2xl font-bold text-green-600">{activeCount}</p></CardContent></Card>
        <Card className="border-gray-100 shadow-sm"><CardContent className="p-4"><p className="text-xs text-gray-400 mb-1">Total Digunakan</p><p className="text-2xl font-bold text-orange-600">{promos.reduce((s, p) => s + p.usedCount, 0)}</p></CardContent></Card>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-50 rounded-xl"><Tag className="w-5 h-5 text-orange-500" /></div>
          <div><h2 className="font-semibold text-gray-900">Daftar Promo</h2><p className="text-xs text-gray-400">{promos.length} kode promo</p></div>
        </div>
        <Button size="sm" className="h-9 bg-orange-500 hover:bg-orange-600 shadow-sm shadow-orange-200" onClick={() => { setForm(emptyForm); setOpen(true); }}><Plus className="w-4 h-4 mr-1.5" /> Buat Promo</Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder="Cari promo..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9 h-9 border-gray-200 text-sm" />
      </div>

      {paginated.length === 0 ? (
        <div className="text-center py-16"><Tag className="w-10 h-10 text-gray-200 mx-auto mb-3" /><p className="text-sm text-gray-400 mb-3">Belum ada promo</p><Button size="sm" className="bg-orange-500 hover:bg-orange-600" onClick={() => { setForm(emptyForm); setOpen(true); }}><Plus className="w-4 h-4 mr-1.5" /> Buat Promo</Button></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paginated.map((promo) => (
            <Card key={promo.id} className={`border-gray-100 shadow-sm hover:shadow-md transition-all ${!promo.isActive ? "opacity-70" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">{promo.name}</p>
                    <button
                      className="flex items-center gap-1 mt-1 text-sm font-mono font-bold text-orange-500 hover:text-orange-600"
                      onClick={() => copyCode(promo.code)}
                    >
                      {promo.code} <Copy className="w-3 h-3" />
                    </button>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${promo.isActive ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500"}`}>{promo.isActive ? "Aktif" : "Nonaktif"}</span>
                </div>
                <div className="space-y-1.5 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>Diskon:</span>
                    <span className="font-medium text-orange-500">
                      {promo.discountType === "PERCENTAGE" ? `${Number(promo.discountValue)}%` : `Rp ${Number(promo.discountValue).toLocaleString("id-ID")}`}
                    </span>
                  </div>
                  <div className="flex justify-between"><span>Digunakan:</span><span className="font-medium">{promo.usedCount}{promo.maxUses ? ` / ${promo.maxUses}` : ""}</span></div>
                  {promo.startDate && <div className="flex justify-between"><span>Mulai:</span><span className="font-medium">{format(new Date(promo.startDate), "dd MMM yyyy", { locale: id })}</span></div>}
                  {promo.endDate && <div className="flex justify-between"><span>Berakhir:</span><span className="font-medium">{format(new Date(promo.endDate), "dd MMM yyyy", { locale: id })}</span></div>}
                  {promo.rules?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {promo.rules.map((r: any) => (
                        <span key={r.id} className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-xs">{r.condition}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-3 pt-2 border-t border-gray-50">
                  <Button size="sm" variant="outline" className={`flex-1 h-7 text-xs ${promo.isActive ? "text-red-500 border-red-100 hover:bg-red-50" : "text-green-600 border-green-100 hover:bg-green-50"}`} onClick={() => handleToggle(promo.id, promo.isActive)}>
                    {promo.isActive ? "Nonaktifkan" : "Aktifkan"}
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs text-red-500 border-red-100 hover:bg-red-50" onClick={() => handleDelete(promo.id)}>Hapus</Button>
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
          <DialogHeader><DialogTitle>Buat Kode Promo</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">Kode Promo *</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="DISC10" required className="font-mono uppercase" /></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">Nama *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Tipe Diskon *</Label>
                <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })} className="w-full h-9 border border-gray-200 rounded-lg px-3 text-sm bg-white">
                  {DISCOUNT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">{form.discountType === "PERCENTAGE" ? "Persen (%) *" : "Jumlah (Rp) *"}</Label>
                <Input type="number" min="0" max={form.discountType === "PERCENTAGE" ? "100" : undefined} value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">Maks. Penggunaan</Label><Input type="number" min="1" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} placeholder="Kosong = unlimited" /></div>
              <div className="space-y-1.5"></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">Mulai</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">Berakhir</Label><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Kondisi Berlaku</Label>
              <div className="flex flex-wrap gap-2">
                {CONDITIONS.map((c) => (
                  <button key={c.key} type="button" onClick={() => toggleCondition(c.key)} className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${form.conditions.includes(c.key) ? "bg-orange-50 border-orange-200 text-orange-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>{c.label}</button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600" disabled={loading}>{loading ? "Menyimpan..." : "Buat Promo"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
