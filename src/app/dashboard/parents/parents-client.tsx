"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users, Plus, Search, Phone, Mail, MapPin,
  MessageSquare, Download, ChevronRight,
} from "lucide-react";
import { createParent, updateParent, deleteParent, addParentNote, addParentCommunication } from "@/app/actions/parents";
import { exportToExcel } from "@/lib/export";
import { toast } from "sonner";

interface Props { parents: any[]; branches: any[]; }
const emptyForm = { fullName: "", phone: "", email: "", address: "", notes: "", branchId: "" };
const PAGE_SIZE = 9;

export function ParentsClient({ parents: initial, branches }: Props) {
  const [parents] = useState(initial);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [detailParent, setDetailParent] = useState<any>(null);
  const [noteText, setNoteText] = useState("");
  const [commForm, setCommForm] = useState({ channel: "WHATSAPP", subject: "", message: "" });

  const filtered = parents.filter((p) => {
    const q = search.toLowerCase();
    return !q || p.fullName?.toLowerCase().includes(q) || p.phone?.includes(q) || p.email?.toLowerCase().includes(q);
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function openCreate() { setEditing(null); setForm(emptyForm); setOpen(true); }
  function openEdit(p: any) {
    setEditing(p);
    setForm({ fullName: p.fullName, phone: p.phone, email: p.email ?? "", address: p.address ?? "", notes: p.notes ?? "", branchId: p.branchId ?? "" });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try {
      const data = { ...form, email: form.email || undefined, address: form.address || undefined, notes: form.notes || undefined, branchId: form.branchId || undefined };
      if (editing) { await updateParent(editing.id, data); toast.success("Data orang tua diperbarui"); }
      else { await createParent(data); toast.success("Orang tua ditambahkan"); }
      setOpen(false); window.location.reload();
    } catch (err: any) { toast.error(err.message); }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus data orang tua ini?")) return;
    await deleteParent(id);
    toast.success("Data dihapus");
    window.location.reload();
  }

  async function handleAddNote() {
    if (!noteText.trim() || !detailParent) return;
    await addParentNote(detailParent.id, noteText.trim());
    toast.success("Catatan ditambahkan");
    setNoteText("");
    window.location.reload();
  }

  function handleExport() {
    const data = parents.map((p) => ({
      "Nama": p.fullName, "Telepon": p.phone, "Email": p.email ?? "-",
      "Alamat": p.address ?? "-", "Jumlah Anak": p.students?.length ?? 0,
    }));
    exportToExcel(data, "CRM-OrangTua", "OrangTua");
    toast.success(`${data.length} data diekspor`);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-50 rounded-xl"><Users className="w-5 h-5 text-orange-500" /></div>
          <div>
            <h2 className="font-semibold text-gray-900">CRM Orang Tua</h2>
            <p className="text-xs text-gray-400">{parents.length} orang tua terdaftar</p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <Button variant="outline" size="sm" className="h-9 border-gray-200" onClick={handleExport}><Download className="w-4 h-4 mr-1.5" /> Excel</Button>
          <Button size="sm" className="h-9 bg-orange-500 hover:bg-orange-600 shadow-sm shadow-orange-200" onClick={openCreate}><Plus className="w-4 h-4 mr-1.5" /> Tambah</Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Cari orang tua..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-9 h-9 border-gray-200 text-sm"
        />
      </div>

      {paginated.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400 mb-3">Belum ada data orang tua</p>
          <Button size="sm" className="bg-orange-500 hover:bg-orange-600" onClick={openCreate}><Plus className="w-4 h-4 mr-1.5" /> Tambah Orang Tua</Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paginated.map((p) => (
            <Card key={p.id} className="border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => setDetailParent(p)}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0">
                    {p.fullName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{p.fullName}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">{p.phone}</span>
                    </div>
                    {p.email && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500 truncate">{p.email}</span>
                      </div>
                    )}
                    {p.address && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500 truncate">{p.address}</span>
                      </div>
                    )}
                    <div className="flex gap-3 mt-2 pt-2 border-t border-gray-50">
                      <span className="text-xs text-gray-400">{p.students?.length ?? 0} anak</span>
                      <span className="text-xs text-gray-400">{p._count?.parentNotes ?? 0} catatan</span>
                      <ChevronRight className="w-3 h-3 text-gray-300 ml-auto" />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 pt-2 border-t border-gray-50">
                  <Button size="sm" variant="outline" className="flex-1 h-7 text-xs border-gray-200" onClick={(e) => { e.stopPropagation(); openEdit(p); }}>Edit</Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs text-red-500 border-red-100 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}>Hapus</Button>
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

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Orang Tua" : "Tambah Orang Tua"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 pt-1">
            <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">Nama Lengkap *</Label><Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">No. Telepon *</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">Alamat</Label><Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} /></div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Cabang</Label>
              <select value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })} className="w-full h-9 border border-gray-200 rounded-lg px-3 text-sm bg-white">
                <option value="">Semua Cabang</option>
                {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600" disabled={loading}>{loading ? "Menyimpan..." : "Simpan"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailParent} onOpenChange={() => setDetailParent(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{detailParent?.fullName}</DialogTitle>
          </DialogHeader>
          {detailParent && (
            <Tabs defaultValue="info">
              <TabsList className="h-8 bg-gray-100/80">
                <TabsTrigger value="info" className="text-xs px-3">Info</TabsTrigger>
                <TabsTrigger value="notes" className="text-xs px-3">Catatan</TabsTrigger>
                <TabsTrigger value="history" className="text-xs px-3">Riwayat</TabsTrigger>
              </TabsList>
              <TabsContent value="info" className="mt-3 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><p className="text-xs text-gray-400">Telepon</p><p className="font-medium">{detailParent.phone}</p></div>
                  <div><p className="text-xs text-gray-400">Email</p><p className="font-medium">{detailParent.email ?? "-"}</p></div>
                  <div className="col-span-2"><p className="text-xs text-gray-400">Alamat</p><p className="font-medium">{detailParent.address ?? "-"}</p></div>
                </div>
                {detailParent.students?.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Anak Terdaftar</p>
                    {detailParent.students.map((s: any) => (
                      <div key={s.id} className="text-xs bg-blue-50 text-blue-700 rounded-lg px-3 py-1.5 mb-1">
                        {s.name} — {s.studentNumber}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="notes" className="mt-3 space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Tambah catatan..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    className="h-9 text-sm border-gray-200"
                  />
                  <Button size="sm" className="h-9 bg-orange-500 hover:bg-orange-600" onClick={handleAddNote}>Simpan</Button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(detailParent.parentNotes ?? []).map((n: any) => (
                    <div key={n.id} className="bg-gray-50 rounded-lg px-3 py-2">
                      <p className="text-sm text-gray-700">{n.note}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleDateString("id-ID")}</p>
                    </div>
                  ))}
                  {(detailParent.parentNotes ?? []).length === 0 && <p className="text-xs text-gray-400 text-center py-4">Belum ada catatan</p>}
                </div>
              </TabsContent>
              <TabsContent value="history" className="mt-3">
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {(detailParent.parentCommunications ?? []).map((c: any) => (
                    <div key={c.id} className="bg-gray-50 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-orange-600">{c.channel}</span>
                        <span className="text-xs text-gray-400">{c.direction}</span>
                      </div>
                      {c.subject && <p className="text-xs font-medium text-gray-700">{c.subject}</p>}
                      <p className="text-xs text-gray-600">{c.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(c.createdAt).toLocaleDateString("id-ID")}</p>
                    </div>
                  ))}
                  {(detailParent.parentCommunications ?? []).length === 0 && <p className="text-xs text-gray-400 text-center py-4">Belum ada riwayat komunikasi</p>}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
