"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Wallet, Plus, Search, Download, CheckCircle, XCircle, Filter, Trash2 } from "lucide-react";
import { createExpense, approveExpense, rejectExpense, deleteExpense } from "@/app/actions/expenses";
import { exportToExcel } from "@/lib/export";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface Props { expenses: any[]; summary: any; branches: any[]; }

const CATEGORIES = ["UTILITIES", "PAYROLL", "MAINTENANCE", "MARKETING", "EQUIPMENT", "RENT", "OTHER"];
const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700",
  APPROVED: "bg-green-50 text-green-700",
  REJECTED: "bg-destructive/10 text-destructive",
};
const emptyForm = { title: "", category: "UTILITIES", amount: "", date: "", description: "", branchId: "" };
const PAGE_SIZE = 15;

export function ExpensesClient({ expenses: initial, summary, branches }: Props) {
  const expenses = initial;
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const filtered = expenses.filter((e) => {
    const q = search.toLowerCase();
    const matchSearch = !q || e.title?.toLowerCase().includes(q) || e.category?.toLowerCase().includes(q);
    const matchCat = !catFilter || e.category === catFilter;
    return matchSearch && matchCat;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try {
      await createExpense({
        title: form.title,
        category: form.category as any,
        amount: parseFloat(form.amount),
        date: form.date,
        description: form.description || undefined,
        branchId: form.branchId,
      });
      toast.success("Pengeluaran ditambahkan");
      setOpen(false); window.location.reload();
    } catch (err: any) { toast.error(err.message); }
    setLoading(false);
  }

  async function handleApprove(expenseId: string) {
    try {
      await approveExpense(expenseId, "system");
      toast.success("Pengeluaran disetujui");
      window.location.reload();
    } catch (err: any) { toast.error(err.message ?? "Gagal menyetujui"); }
  }

  async function handleReject(expenseId: string) {
    try {
      await rejectExpense(expenseId);
      toast.success("Pengeluaran ditolak");
      window.location.reload();
    } catch (err: any) { toast.error(err.message ?? "Gagal menolak"); }
  }

  async function handleDelete(expenseId: string) {
    if (!confirm("Hapus pengeluaran ini?")) return;
    try {
      await deleteExpense(expenseId);
      toast.success("Pengeluaran dihapus");
      window.location.reload();
    } catch (err: any) { toast.error(err.message ?? "Gagal menghapus"); }
  }

  function handleExport() {
    const data = expenses.map((e) => ({
      "Judul": e.title, "Kategori": e.category,
      "Jumlah": Number(e.amount), "Tanggal": new Date(e.date).toLocaleDateString("id-ID"),
      "Status": e.status, "Cabang": e.branch?.name ?? "-",
    }));
    exportToExcel(data, "Pengeluaran", "Expenses");
    toast.success(`${data.length} data diekspor`);
  }

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-neutral shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Pengeluaran (Approved)</p>
            <p className="text-xl font-bold text-on-surface">Rp {summary.total.toLocaleString("id-ID")}</p>
          </CardContent>
        </Card>
        <Card className="border-neutral shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Bulan Ini</p>
            <p className="text-xl font-bold text-on-surface">Rp {summary.thisMonth.toLocaleString("id-ID")}</p>
          </CardContent>
        </Card>
        <Card className="border-neutral shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Pending Persetujuan</p>
            <p className="text-xl font-bold text-yellow-600">{expenses.filter(e => e.status === "PENDING").length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-10 rounded-xl"><Wallet className="w-5 h-5 text-primary" /></div>
          <div>
            <h2 className="font-semibold text-on-surface">Daftar Pengeluaran</h2>
            <p className="text-xs text-muted-foreground">{expenses.length} transaksi pengeluaran</p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <Button variant="outline" size="sm" className="h-9 border-border" onClick={handleExport}><Download className="w-4 h-4 mr-1.5" /> Excel</Button>
          <Button size="sm" className="h-9 bg-primary hover:bg-primary-80 shadow-sm shadow-primary/20" onClick={() => { setForm(emptyForm); setOpen(true); }}><Plus className="w-4 h-4 mr-1.5" /> Tambah</Button>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Cari pengeluaran..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9 h-9 border-border text-sm" />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <select value={catFilter} onChange={(e) => { setCatFilter(e.target.value); setPage(1); }} className="h-9 pl-9 pr-4 border border-border rounded-lg text-sm text-foreground bg-surface">
            <option value="">Semua Kategori</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {paginated.length === 0 ? (
        <div className="text-center py-16">
          <Wallet className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Belum ada data pengeluaran</p>
        </div>
      ) : (
        <div className="rounded-xl border border-neutral overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-neutral">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-tertiary uppercase tracking-wide">Judul</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-tertiary uppercase tracking-wide">Kategori</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-tertiary uppercase tracking-wide">Jumlah</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-tertiary uppercase tracking-wide">Tanggal</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-tertiary uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-tertiary uppercase tracking-wide">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map((expense) => (
                <tr key={expense.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium text-on-surface">{expense.title}</td>
                  <td className="px-4 py-3"><span className="text-xs bg-muted/50 text-foreground px-2 py-0.5 rounded-full">{expense.category}</span></td>
                  <td className="px-4 py-3 text-right font-semibold text-on-surface">Rp {Number(expense.amount).toLocaleString("id-ID")}</td>
                  <td className="px-4 py-3 text-xs text-tertiary">{format(new Date(expense.date), "dd MMM yyyy", { locale: id })}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[expense.status]}`}>{expense.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {expense.status === "PENDING" && (
                        <>
                          <button type="button" onClick={() => handleApprove(expense.id)} title="Setujui" className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-green-50 text-green-500 transition-colors cursor-pointer"><CheckCircle className="w-4 h-4" /></button>
                          <button type="button" onClick={() => handleReject(expense.id)} title="Tolak" className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-destructive transition-colors cursor-pointer"><XCircle className="w-4 h-4" /></button>
                        </>
                      )}
                      <button type="button" onClick={() => handleDelete(expense.id)} title="Hapus" className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground/50 hover:text-destructive transition-colors cursor-pointer ml-1"><Trash2 className="w-4 h-4" /></button>
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
          <Button variant="outline" size="sm" className="h-8 border-border" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Sebelumnya</Button>
          <span className="text-sm text-tertiary">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" className="h-8 border-border" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Berikutnya</Button>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tambah Pengeluaran</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 pt-1">
            <div className="space-y-1.5"><Label className="text-xs font-medium text-foreground">Judul *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Kategori *</Label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full h-9 border border-border rounded-lg px-3 text-sm bg-surface">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Cabang *</Label>
                <select value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })} required className="w-full h-9 border border-border rounded-lg px-3 text-sm bg-surface">
                  <option value="">Pilih Cabang</option>
                  {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs font-medium text-foreground">Jumlah (Rp) *</Label><Input type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium text-foreground">Tanggal *</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-foreground">Deskripsi</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
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
