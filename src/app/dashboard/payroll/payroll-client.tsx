"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DollarSign, Plus, Search, Download, CheckCircle, CreditCard } from "lucide-react";
import { createPayroll, approvePayroll, markPayrollPaid, deletePayroll } from "@/app/actions/payroll";
import { exportToExcel } from "@/lib/export";
import { toast } from "sonner";

interface Props { payrolls: any[]; coaches: any[]; }

const PAYROLL_TYPES = ["PER_SESSION", "PER_HOUR", "FIXED_MONTHLY"];
const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700",
  APPROVED: "bg-blue-50 text-blue-700",
  PAID: "bg-green-50 text-green-700",
};
const emptyForm = { coachId: "", period: "", payrollType: "PER_SESSION", sessions: "", hours: "", rateAmount: "", notes: "" };
const PAGE_SIZE = 15;

export function PayrollClient({ payrolls: initial, coaches }: Props) {
  const [payrolls] = useState(initial);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const filtered = payrolls.filter((p) => {
    const q = search.toLowerCase();
    return !q || p.coach?.name?.toLowerCase().includes(q) || p.period?.toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalPending = payrolls.filter(p => p.status === "PENDING").reduce((sum, p) => sum + Number(p.totalAmount), 0);
  const totalPaid = payrolls.filter(p => p.status === "PAID").reduce((sum, p) => sum + Number(p.totalAmount), 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try {
      await createPayroll({
        coachId: form.coachId,
        period: form.period,
        payrollType: form.payrollType as any,
        sessions: form.sessions ? parseInt(form.sessions) : undefined,
        hours: form.hours ? parseFloat(form.hours) : undefined,
        rateAmount: parseFloat(form.rateAmount),
        notes: form.notes || undefined,
      });
      toast.success("Payroll dibuat");
      setOpen(false); window.location.reload();
    } catch (err: any) { toast.error(err.message); }
    setLoading(false);
  }

  async function handleApprove(id: string) {
    await approvePayroll(id, "system");
    toast.success("Payroll disetujui");
    window.location.reload();
  }

  async function handlePaid(id: string) {
    await markPayrollPaid(id);
    toast.success("Payroll ditandai lunas");
    window.location.reload();
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus payroll ini?")) return;
    await deletePayroll(id);
    toast.success("Payroll dihapus");
    window.location.reload();
  }

  function handleExport() {
    const data = payrolls.map((p) => ({
      "Pelatih": p.coach?.name, "Periode": p.period, "Tipe": p.payrollType,
      "Sesi": p.sessions ?? "-", "Jam": p.hours ?? "-",
      "Rate": Number(p.rateAmount), "Total": Number(p.totalAmount), "Status": p.status,
    }));
    exportToExcel(data, "Payroll", "Payroll");
    toast.success(`${data.length} data diekspor`);
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-gray-100 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 mb-1">Pending Pembayaran</p>
            <p className="text-xl font-bold text-yellow-600">Rp {totalPending.toLocaleString("id-ID")}</p>
          </CardContent>
        </Card>
        <Card className="border-gray-100 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 mb-1">Total Dibayar</p>
            <p className="text-xl font-bold text-green-600">Rp {totalPaid.toLocaleString("id-ID")}</p>
          </CardContent>
        </Card>
        <Card className="border-gray-100 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 mb-1">Total Pelatih</p>
            <p className="text-xl font-bold text-gray-900">{coaches.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-50 rounded-xl"><DollarSign className="w-5 h-5 text-orange-500" /></div>
          <div>
            <h2 className="font-semibold text-gray-900">Daftar Payroll</h2>
            <p className="text-xs text-gray-400">{payrolls.length} record payroll</p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <Button variant="outline" size="sm" className="h-9 border-gray-200" onClick={handleExport}><Download className="w-4 h-4 mr-1.5" /> Excel</Button>
          <Button size="sm" className="h-9 bg-orange-500 hover:bg-orange-600 shadow-sm shadow-orange-200" onClick={() => { setForm(emptyForm); setOpen(true); }}><Plus className="w-4 h-4 mr-1.5" /> Buat Payroll</Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder="Cari pelatih atau periode..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9 h-9 border-gray-200 text-sm" />
      </div>

      {paginated.length === 0 ? (
        <div className="text-center py-16">
          <DollarSign className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Belum ada data payroll</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Pelatih</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Periode</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipe</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.coach?.name}</td>
                  <td className="px-4 py-3 text-gray-600">{p.period}</td>
                  <td className="px-4 py-3"><span className="text-xs bg-gray-50 text-gray-600 px-2 py-0.5 rounded-full">{p.payrollType}</span></td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">Rp {Number(p.totalAmount).toLocaleString("id-ID")}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[p.status]}`}>{p.status}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {p.status === "PENDING" && (
                        <button onClick={() => handleApprove(p.id)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-400 transition-colors" title="Approve"><CheckCircle className="w-4 h-4" /></button>
                      )}
                      {p.status === "APPROVED" && (
                        <button onClick={() => handlePaid(p.id)} className="p-1.5 rounded-lg hover:bg-green-50 text-green-500 transition-colors" title="Tandai Lunas"><CreditCard className="w-4 h-4" /></button>
                      )}
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors text-xs px-2">Hapus</button>
                    </div>
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
          <DialogHeader><DialogTitle>Buat Payroll Baru</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Pelatih *</Label>
              <select value={form.coachId} onChange={(e) => setForm({ ...form, coachId: e.target.value })} required className="w-full h-9 border border-gray-200 rounded-lg px-3 text-sm bg-white">
                <option value="">Pilih Pelatih</option>
                {coaches.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">Periode *</Label><Input placeholder="2024-01" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} required /></div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Tipe Payroll *</Label>
                <select value={form.payrollType} onChange={(e) => setForm({ ...form, payrollType: e.target.value })} className="w-full h-9 border border-gray-200 rounded-lg px-3 text-sm bg-white">
                  {PAYROLL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            {form.payrollType === "PER_SESSION" && (
              <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">Jumlah Sesi</Label><Input type="number" min="0" value={form.sessions} onChange={(e) => setForm({ ...form, sessions: e.target.value })} /></div>
            )}
            {form.payrollType === "PER_HOUR" && (
              <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">Jumlah Jam</Label><Input type="number" min="0" step="0.5" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} /></div>
            )}
            <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">Rate (Rp) *</Label><Input type="number" min="0" value={form.rateAmount} onChange={(e) => setForm({ ...form, rateAmount: e.target.value })} required /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">Catatan</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600" disabled={loading}>{loading ? "Menyimpan..." : "Buat Payroll"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
