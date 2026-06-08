"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Plus, Search, Download, ExternalLink, Trash2, Filter } from "lucide-react";
import { createDocument, deleteDocument } from "@/app/actions/documents";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface Props { documents: any[]; branches: any[]; }

const CATEGORIES = ["COACH_CONTRACT", "STUDENT_AGREEMENT", "PAYMENT_RECEIPT", "OTHER"];
const CATEGORY_LABELS: Record<string, string> = {
  COACH_CONTRACT: "Kontrak Pelatih",
  STUDENT_AGREEMENT: "Perjanjian Siswa",
  PAYMENT_RECEIPT: "Bukti Pembayaran",
  OTHER: "Lainnya",
};
const CATEGORY_COLORS: Record<string, string> = {
  COACH_CONTRACT: "bg-blue-50 text-blue-700",
  STUDENT_AGREEMENT: "bg-green-50 text-green-700",
  PAYMENT_RECEIPT: "bg-orange-50 text-orange-700",
  OTHER: "bg-gray-50 text-gray-600",
};
const emptyForm = { name: "", type: "PDF", fileUrl: "", category: "OTHER", branchId: "", entityType: "", entityId: "" };
const PAGE_SIZE = 12;

export function DocumentsClient({ documents: initial, branches }: Props) {
  const documents = initial;
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const filtered = documents.filter((d) => {
    const q = search.toLowerCase();
    const matchSearch = !q || d.name?.toLowerCase().includes(q) || d.type?.toLowerCase().includes(q);
    const matchCat = !catFilter || d.category === catFilter;
    return matchSearch && matchCat;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try {
      await createDocument({
        name: form.name,
        type: form.type,
        fileUrl: form.fileUrl,
        category: form.category as any,
        branchId: form.branchId || undefined,
        entityType: form.entityType || undefined,
        entityId: form.entityId || undefined,
      });
      toast.success("Dokumen ditambahkan");
      setOpen(false); window.location.reload();
    } catch (err: any) { toast.error(err.message); }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus dokumen ini?")) return;
    await deleteDocument(id);
    toast.success("Dokumen dihapus");
    window.location.reload();
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        {CATEGORIES.map((cat) => (
          <Card key={cat} className="border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-all" onClick={() => setCatFilter(catFilter === cat ? "" : cat)}>
            <CardContent className="p-4">
              <p className="text-xs text-gray-400 mb-1">{CATEGORY_LABELS[cat]}</p>
              <p className="text-2xl font-bold text-gray-900">{documents.filter(d => d.category === cat).length}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-50 rounded-xl"><FileText className="w-5 h-5 text-orange-500" /></div>
          <div><h2 className="font-semibold text-gray-900">Manajemen Dokumen</h2><p className="text-xs text-gray-400">{documents.length} dokumen tersimpan</p></div>
        </div>
        <Button size="sm" className="h-9 bg-orange-500 hover:bg-orange-600 shadow-sm shadow-orange-200" onClick={() => { setForm(emptyForm); setOpen(true); }}><Plus className="w-4 h-4 mr-1.5" /> Upload Dokumen</Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Cari dokumen..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9 h-9 border-gray-200 text-sm" />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select value={catFilter} onChange={(e) => { setCatFilter(e.target.value); setPage(1); }} className="h-9 pl-9 pr-4 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white">
            <option value="">Semua Kategori</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
          </select>
        </div>
      </div>

      {paginated.length === 0 ? (
        <div className="text-center py-16"><FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" /><p className="text-sm text-gray-400 mb-3">Belum ada dokumen</p><Button size="sm" className="bg-orange-500 hover:bg-orange-600" onClick={() => { setForm(emptyForm); setOpen(true); }}><Plus className="w-4 h-4 mr-1.5" /> Upload Dokumen</Button></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paginated.map((doc) => (
            <Card key={doc.id} className="border-gray-100 shadow-sm hover:shadow-md transition-all group">
              <CardContent className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{doc.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{doc.type}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${CATEGORY_COLORS[doc.category]}`}>{CATEGORY_LABELS[doc.category]}</span>
                  </div>
                </div>
                <div className="text-xs text-gray-400 mb-3">
                  {doc.branch && <p>{doc.branch.name}</p>}
                  {doc.uploader && <p>Oleh: {doc.uploader.name}</p>}
                  <p>{format(new Date(doc.createdAt), "dd MMM yyyy", { locale: id })}</p>
                </div>
                <div className="flex gap-2">
                  <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                    <Button size="sm" variant="outline" className="w-full h-7 text-xs border-gray-200 hover:border-gray-300"><ExternalLink className="w-3.5 h-3.5 mr-1" /> Buka</Button>
                  </a>
                  <Button size="sm" variant="outline" className="h-7 text-xs text-red-500 border-red-100 hover:bg-red-50" onClick={() => handleDelete(doc.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
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
          <DialogHeader><DialogTitle>Upload Dokumen</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 pt-1">
            <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">Nama Dokumen *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Tipe File</Label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full h-9 border border-gray-200 rounded-lg px-3 text-sm bg-white">
                  <option value="PDF">PDF</option>
                  <option value="JPG">JPG</option>
                  <option value="PNG">PNG</option>
                  <option value="DOCX">DOCX</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Kategori *</Label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full h-9 border border-gray-200 rounded-lg px-3 text-sm bg-white">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">URL File *</Label><Input value={form.fileUrl} onChange={(e) => setForm({ ...form, fileUrl: e.target.value })} placeholder="https://..." required /></div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Cabang</Label>
              <select value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })} className="w-full h-9 border border-gray-200 rounded-lg px-3 text-sm bg-white">
                <option value="">Semua Cabang</option>
                {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-600">Upload file ke Supabase Storage terlebih dahulu, lalu paste URL di sini.</div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600" disabled={loading}>{loading ? "Menyimpan..." : "Simpan"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
