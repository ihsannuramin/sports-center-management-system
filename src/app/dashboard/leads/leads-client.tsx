"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, Plus, Search, Phone, Mail, Download, TrendingUp, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { createLead, updateLeadStage, deleteLead, updateLead } from "@/app/actions/leads";
import { exportToExcel } from "@/lib/export";
import { toast } from "sonner";

interface Props { leads: any[]; funnel: any[]; branches: any[]; }

const STAGES = ["LEAD", "CONTACTED", "TRIAL", "REGISTERED", "ACTIVE"];
const STAGE_COLORS: Record<string, string> = {
  LEAD: "bg-gray-100 text-gray-600",
  CONTACTED: "bg-blue-50 text-blue-600",
  TRIAL: "bg-yellow-50 text-yellow-600",
  REGISTERED: "bg-purple-50 text-purple-600",
  ACTIVE: "bg-green-50 text-green-600",
};
const SOURCES = ["INSTAGRAM", "TIKTOK", "REFERRAL", "WALK_IN", "WEBSITE", "OTHER"];
const emptyForm = { fullName: "", phone: "", email: "", source: "INSTAGRAM", notes: "", branchId: "" };
const PAGE_SIZE = 10;

export function LeadsClient({ leads: initial, funnel, branches }: Props) {
  const leads = initial;
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const filtered = leads.filter((l) => {
    const q = search.toLowerCase();
    const matchSearch = !q || l.fullName?.toLowerCase().includes(q) || l.phone?.includes(q) || l.source?.toLowerCase().includes(q);
    const matchStage = !stageFilter || l.stage === stageFilter;
    return matchSearch && matchStage;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function openCreate() { setEditing(null); setForm(emptyForm); setOpen(true); }
  function openEdit(l: any) {
    setEditing(l);
    setForm({ fullName: l.fullName, phone: l.phone, email: l.email ?? "", source: l.source, notes: l.notes ?? "", branchId: l.branchId ?? "" });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try {
      const data = { ...form, email: form.email || undefined, notes: form.notes || undefined, branchId: form.branchId || undefined, source: form.source as any };
      if (editing) { await updateLead(editing.id, data); toast.success("Lead diperbarui"); }
      else { await createLead(data); toast.success("Lead ditambahkan"); }
      setOpen(false); window.location.reload();
    } catch (err: any) { toast.error(err.message); }
    setLoading(false);
  }

  async function handleStageChange(id: string, stage: string) {
    await updateLeadStage(id, stage as any);
    toast.success(`Stage diubah ke ${stage}`);
    window.location.reload();
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus lead ini?")) return;
    await deleteLead(id);
    toast.success("Lead dihapus");
    window.location.reload();
  }

  function handleExport() {
    const data = leads.map((l) => ({
      "Nama": l.fullName, "Telepon": l.phone, "Email": l.email ?? "-",
      "Source": l.source, "Stage": l.stage, "Cabang": l.branch?.name ?? "-",
    }));
    exportToExcel(data, "Leads", "Leads");
    toast.success(`${data.length} data diekspor`);
  }

  return (
    <div className="space-y-5">
      {/* Funnel Stats */}
      <div className="grid grid-cols-5 gap-3">
        {funnel.map((f) => (
          <button
            key={f.stage}
            onClick={() => setStageFilter(stageFilter === f.stage ? "" : f.stage)}
            className={`p-3 rounded-xl border text-center transition-all ${stageFilter === f.stage ? "border-orange-300 bg-orange-50" : "border-gray-100 bg-white hover:border-orange-200"}`}
          >
            <p className="text-2xl font-bold text-gray-900">{f.count}</p>
            <p className="text-xs text-gray-400 mt-0.5">{f.stage}</p>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-50 rounded-xl"><Target className="w-5 h-5 text-orange-500" /></div>
          <div>
            <h2 className="font-semibold text-gray-900">Daftar Lead</h2>
            <p className="text-xs text-gray-400">{leads.length} total lead</p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <Button variant="outline" size="sm" className="h-9 border-gray-200" onClick={handleExport}><Download className="w-4 h-4 mr-1.5" /> Excel</Button>
          <Button size="sm" className="h-9 bg-orange-500 hover:bg-orange-600 shadow-sm shadow-orange-200" onClick={openCreate}><Plus className="w-4 h-4 mr-1.5" /> Tambah Lead</Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Cari lead..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-9 h-9 border-gray-200 text-sm"
        />
      </div>

      {paginated.length === 0 ? (
        <div className="text-center py-16">
          <Target className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400 mb-3">Belum ada lead</p>
          <Button size="sm" className="bg-orange-500 hover:bg-orange-600" onClick={openCreate}><Plus className="w-4 h-4 mr-1.5" /> Tambah Lead</Button>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nama</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Kontak</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Source</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stage</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cabang</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-900">{lead.fullName}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-xs text-gray-500"><Phone className="w-3 h-3" /> {lead.phone}</div>
                    {lead.email && <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5"><Mail className="w-3 h-3" /> {lead.email}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-gray-50 text-gray-600 px-2 py-0.5 rounded-full">{lead.source}</span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={lead.stage}
                      onChange={(e) => handleStageChange(lead.id, e.target.value)}
                      className={`text-xs border border-transparent rounded-lg px-2 py-1 font-medium ${STAGE_COLORS[lead.stage]}`}
                    >
                      {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{lead.branch?.name ?? "-"}</td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-700 cursor-pointer" aria-label="Aksi" />}>
                        <MoreHorizontal className="w-4 h-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(lead)} className="cursor-pointer gap-2"><Pencil className="w-3.5 h-3.5" /> Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDelete(lead.id)} className="cursor-pointer gap-2 text-red-500 focus:text-red-500"><Trash2 className="w-3.5 h-3.5" /> Hapus</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
          <DialogHeader><DialogTitle>{editing ? "Edit Lead" : "Tambah Lead Baru"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 pt-1">
            <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">Nama Lengkap *</Label><Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">No. Telepon *</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Source *</Label>
                <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="w-full h-9 border border-gray-200 rounded-lg px-3 text-sm bg-white">
                  {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Cabang</Label>
                <select value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })} className="w-full h-9 border border-gray-200 rounded-lg px-3 text-sm bg-white">
                  <option value="">Pilih Cabang</option>
                  {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">Catatan</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
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
