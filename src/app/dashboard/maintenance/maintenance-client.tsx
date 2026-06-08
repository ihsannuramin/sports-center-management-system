"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Wrench, Plus, Search, AlertTriangle, CheckCircle, Clock, XCircle } from "lucide-react";
import { createMaintenanceTicket, updateTicketStatus, deleteTicket } from "@/app/actions/maintenance";
import { toast } from "sonner";

interface Props { tickets: any[]; assets: any[]; branches: any[]; }

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const STATUSES = ["OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-gray-50 text-gray-600",
  MEDIUM: "bg-blue-50 text-blue-600",
  HIGH: "bg-orange-50 text-orange-600",
  URGENT: "bg-red-50 text-red-600",
};
const STATUS_ICONS: Record<string, any> = {
  OPEN: AlertTriangle,
  IN_PROGRESS: Clock,
  COMPLETED: CheckCircle,
  CANCELLED: XCircle,
};
const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-yellow-50 text-yellow-700",
  IN_PROGRESS: "bg-blue-50 text-blue-700",
  COMPLETED: "bg-green-50 text-green-700",
  CANCELLED: "bg-gray-50 text-gray-500",
};
const emptyForm = { title: "", description: "", priority: "MEDIUM", branchId: "", assetId: "" };

export function MaintenanceClient({ tickets: initial, assets, branches }: Props) {
  const tickets = initial;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [resolveNote, setResolveNote] = useState("");
  const [resolveId, setResolveId] = useState<string | null>(null);

  const filtered = tickets.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch = !q || t.title?.toLowerCase().includes(q) || t.branch?.name?.toLowerCase().includes(q);
    const matchStatus = !statusFilter || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openCount = tickets.filter(t => t.status === "OPEN").length;
  const inProgressCount = tickets.filter(t => t.status === "IN_PROGRESS").length;
  const urgentCount = tickets.filter(t => t.priority === "URGENT" && t.status !== "COMPLETED").length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try {
      await createMaintenanceTicket({
        title: form.title,
        description: form.description || undefined,
        priority: form.priority as any,
        branchId: form.branchId,
        assetId: form.assetId || undefined,
      });
      toast.success("Tiket dibuat");
      setOpen(false); window.location.reload();
    } catch (err: any) { toast.error(err.message); }
    setLoading(false);
  }

  async function handleStatusChange(id: string, status: string) {
    if (status === "COMPLETED") { setResolveId(id); return; }
    await updateTicketStatus(id, status as any);
    toast.success(`Status diubah ke ${status}`);
    window.location.reload();
  }

  async function handleResolve() {
    if (!resolveId) return;
    await updateTicketStatus(resolveId, "COMPLETED", resolveNote);
    toast.success("Tiket diselesaikan");
    setResolveId(null); setResolveNote("");
    window.location.reload();
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus tiket ini?")) return;
    await deleteTicket(id);
    toast.success("Tiket dihapus");
    window.location.reload();
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-gray-100 shadow-sm"><CardContent className="p-4"><p className="text-xs text-gray-400 mb-1">Tiket Terbuka</p><p className="text-2xl font-bold text-yellow-600">{openCount}</p></CardContent></Card>
        <Card className="border-gray-100 shadow-sm"><CardContent className="p-4"><p className="text-xs text-gray-400 mb-1">Dalam Proses</p><p className="text-2xl font-bold text-blue-600">{inProgressCount}</p></CardContent></Card>
        <Card className="border-gray-100 shadow-sm"><CardContent className="p-4"><p className="text-xs text-gray-400 mb-1">Urgent</p><p className="text-2xl font-bold text-red-600">{urgentCount}</p></CardContent></Card>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-50 rounded-xl"><Wrench className="w-5 h-5 text-orange-500" /></div>
          <div>
            <h2 className="font-semibold text-gray-900">Tiket Maintenance</h2>
            <p className="text-xs text-gray-400">{tickets.length} total tiket</p>
          </div>
        </div>
        <Button size="sm" className="h-9 bg-orange-500 hover:bg-orange-600 shadow-sm shadow-orange-200" onClick={() => { setForm(emptyForm); setOpen(true); }}><Plus className="w-4 h-4 mr-1.5" /> Buat Tiket</Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Cari tiket..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 border-gray-200 text-sm" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 px-3 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white">
          <option value="">Semua Status</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Wrench className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400 mb-3">Tidak ada tiket maintenance</p>
          <Button size="sm" className="bg-orange-500 hover:bg-orange-600" onClick={() => { setForm(emptyForm); setOpen(true); }}><Plus className="w-4 h-4 mr-1.5" /> Buat Tiket</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ticket) => {
            const StatusIcon = STATUS_ICONS[ticket.status] ?? AlertTriangle;
            return (
              <Card key={ticket.id} className="border-gray-100 shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl flex-shrink-0 ${STATUS_COLORS[ticket.status]}`}>
                      <StatusIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-gray-900 truncate">{ticket.title}</p>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[ticket.priority]}`}>{ticket.priority}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[ticket.status]}`}>{ticket.status}</span>
                        </div>
                      </div>
                      {ticket.description && <p className="text-xs text-gray-500 mt-1 truncate">{ticket.description}</p>}
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span>{ticket.branch?.name}</span>
                        {ticket.asset && <span>· {ticket.asset.name}</span>}
                        {ticket.assignee && <span>· {ticket.assignee.name}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {ticket.status === "OPEN" && (
                        <button onClick={() => handleStatusChange(ticket.id, "IN_PROGRESS")} className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">Proses</button>
                      )}
                      {ticket.status === "IN_PROGRESS" && (
                        <button onClick={() => handleStatusChange(ticket.id, "COMPLETED")} className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors">Selesai</button>
                      )}
                      <button onClick={() => handleDelete(ticket.id)} className="text-xs px-2 py-1 bg-red-50 text-red-400 rounded-lg hover:bg-red-100 transition-colors">Hapus</button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Buat Tiket Maintenance</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 pt-1">
            <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">Judul *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">Deskripsi</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Prioritas *</Label>
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full h-9 border border-gray-200 rounded-lg px-3 text-sm bg-white">
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
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
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Aset (opsional)</Label>
              <select value={form.assetId} onChange={(e) => setForm({ ...form, assetId: e.target.value })} className="w-full h-9 border border-gray-200 rounded-lg px-3 text-sm bg-white">
                <option value="">Pilih Aset</option>
                {assets.map((a: any) => <option key={a.id} value={a.id}>{a.name} — {a.category}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600" disabled={loading}>{loading ? "Menyimpan..." : "Buat Tiket"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!resolveId} onOpenChange={() => setResolveId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Selesaikan Tiket</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">Catatan Resolusi</Label><Textarea value={resolveNote} onChange={(e) => setResolveNote(e.target.value)} rows={3} placeholder="Deskripsikan tindakan yang diambil..." /></div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button variant="outline" onClick={() => setResolveId(null)}>Batal</Button>
              <Button className="bg-green-500 hover:bg-green-600" onClick={handleResolve}>Tandai Selesai</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
