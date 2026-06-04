"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DataPagination } from "@/components/ui/data-pagination";
import { Plus, Search, Layers, Download, FileText, CheckCircle2, Loader2 } from "lucide-react";
import { createInvoice, updateInvoiceStatus, bulkCreateMonthlyInvoices } from "@/app/actions/invoices";
import { exportToExcel } from "@/lib/export";
import { toast } from "sonner";
import { format } from "date-fns";

const typeLabels: Record<string, string> = {
  REGISTRATION: "Pendaftaran", MONTHLY: "Bulanan", TOURNAMENT: "Turnamen", MERCHANDISE: "Merchandise",
};
const typeBadge: Record<string, string> = {
  REGISTRATION: "badge-blue", MONTHLY: "badge-orange", TOURNAMENT: "badge-green", MERCHANDISE: "badge-gray",
};
const statusBadge: Record<string, string> = {
  UNPAID: "badge-yellow", PAID: "badge-green", OVERDUE: "badge-red", CANCELLED: "badge-gray",
};
const statusLabels: Record<string, string> = {
  UNPAID: "Belum Dibayar", PAID: "Lunas", OVERDUE: "Jatuh Tempo", CANCELLED: "Dibatalkan",
};

interface Props { invoices: any[]; students: any[]; branches: any[]; }
const emptyForm = { studentId: "", type: "MONTHLY" as any, amount: 0, dueDate: "", description: "" };
const emptyBulkForm = { amount: 0, dueDate: "", description: "", branchId: "" };

export function InvoicesClient({ invoices: initial, students, branches }: Props) {
  const router = useRouter();
  const [invoices] = useState(initial);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [open, setOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [bulkForm, setBulkForm] = useState(emptyBulkForm);
  const [loading, setLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = invoices.filter((inv) => {
    const matchSearch = inv.student?.name.toLowerCase().includes(search.toLowerCase()) || inv.invoiceNumber.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const totalUnpaid = filtered.filter(i => i.status === "UNPAID").reduce((sum, i) => sum + Number(i.amount), 0);
  const totalPaid = filtered.filter(i => i.status === "PAID").length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try { await createInvoice({ ...form, amount: Number(form.amount) }); toast.success("Invoice berhasil dibuat"); setOpen(false); router.refresh(); }
    catch (err: any) { toast.error(err.message); }
    setLoading(false);
  }
  async function handleStatusChange(id: string, status: string) {
    await updateInvoiceStatus(id, status); toast.success("Status diperbarui"); router.refresh();
  }
  async function handleBulkSubmit(e: React.FormEvent) {
    e.preventDefault(); setBulkLoading(true);
    try {
      const result = await bulkCreateMonthlyInvoices({ amount: Number(bulkForm.amount), dueDate: bulkForm.dueDate, description: bulkForm.description || undefined, branchId: bulkForm.branchId || undefined });
      if (result.success) { toast.success(`${result.count} invoice dibuat`); setBulkOpen(false); setBulkForm(emptyBulkForm); router.refresh(); }
      else toast.error(result.error);
    } catch (err: any) { toast.error(err.message); }
    setBulkLoading(false);
  }
  function handleExport() {
    const data = filtered.map((inv) => ({
      "No. Invoice": inv.invoiceNumber, "Siswa": inv.student?.name || "-",
      "Jenis": typeLabels[inv.type] || inv.type, "Jumlah (Rp)": Number(inv.amount),
      "Jatuh Tempo": format(new Date(inv.dueDate), "dd/MM/yyyy"), "Status": statusLabels[inv.status] || inv.status,
    }));
    exportToExcel(data, "Daftar-Invoice", "Invoice");
    toast.success(`${data.length} invoice diekspor`);
  }

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-gray-100 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 font-medium mb-1">Total Invoice</p>
            <p className="text-2xl font-bold text-gray-900">{filtered.length}</p>
          </CardContent>
        </Card>
        <Card className="border-red-100 bg-red-50/30 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-red-500 font-medium mb-1">Belum Dibayar</p>
            <p className="text-xl font-bold text-red-600">Rp {totalUnpaid.toLocaleString("id-ID")}</p>
          </CardContent>
        </Card>
        <Card className="border-green-100 bg-green-50/30 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-green-600 font-medium mb-1">Sudah Lunas</p>
            <p className="text-2xl font-bold text-green-700">{totalPaid}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-gray-100 shadow-sm">
        <CardHeader className="pb-4 border-b border-gray-50">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 rounded-xl"><FileText className="w-5 h-5 text-orange-500" /></div>
              <div>
                <h2 className="font-semibold text-gray-900">Daftar Invoice</h2>
                <p className="text-xs text-gray-400">{filtered.length} invoice</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input placeholder="Cari invoice..." className="pl-9 w-48 h-9 text-sm border-gray-200" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
              </div>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v ?? "ALL"); setPage(1); }}>
                <SelectTrigger className="w-38 h-9 text-sm border-gray-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Status</SelectItem>
                  {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="h-9 border-gray-200 text-gray-600" onClick={handleExport}>
                <Download className="w-4 h-4 mr-1.5" /> Excel
              </Button>
              <Button variant="outline" size="sm" className="h-9 border-gray-200 text-gray-600" onClick={() => setBulkOpen(true)}>
                <Layers className="w-4 h-4 mr-1.5" /> Massal
              </Button>
              <Button size="sm" className="h-9 bg-orange-500 hover:bg-orange-600 shadow-sm shadow-orange-200" onClick={() => setOpen(true)}>
                <Plus className="w-4 h-4 mr-1.5" /> Buat Invoice
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table className="table-row-hover">
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                <TableHead className="text-xs font-semibold text-gray-500 pl-5">No. Invoice</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500">Siswa</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500">Jenis</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500">Jumlah</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500">Jatuh Tempo</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500">Status</TableHead>
                <TableHead className="w-28 text-xs font-semibold text-gray-500">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-16">
                  <FileText className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Tidak ada invoice</p>
                </TableCell></TableRow>
              ) : (
                paginated.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="pl-5"><span className="font-mono text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md">{inv.invoiceNumber}</span></TableCell>
                    <TableCell><span className="text-sm font-medium text-gray-900">{inv.student?.name}</span></TableCell>
                    <TableCell><span className={typeBadge[inv.type]}>{typeLabels[inv.type] || inv.type}</span></TableCell>
                    <TableCell><span className="text-sm font-semibold text-gray-900">Rp {Number(inv.amount).toLocaleString("id-ID")}</span></TableCell>
                    <TableCell><span className="text-sm text-gray-600">{format(new Date(inv.dueDate), "d MMM yyyy")}</span></TableCell>
                    <TableCell><span className={statusBadge[inv.status]}>{statusLabels[inv.status]}</span></TableCell>
                    <TableCell>
                      {inv.status === "UNPAID" && (
                        <Button size="sm" variant="outline" onClick={() => handleStatusChange(inv.id, "PAID")}
                          className="h-7 text-xs text-green-600 border-green-200 hover:bg-green-50 hover:border-green-300">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Lunas
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <DataPagination total={filtered.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
        </CardContent>
      </Card>

      {/* Create Invoice Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Buat Invoice Baru</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Siswa *</Label>
              <Select value={form.studentId} onValueChange={(v) => v && setForm({ ...form, studentId: v })}>
                <SelectTrigger><SelectValue placeholder="Pilih siswa" /></SelectTrigger>
                <SelectContent>{students.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name} ({s.studentNumber})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Jenis *</Label>
                <Select value={form.type} onValueChange={(v) => v && setForm({ ...form, type: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">Jumlah (Rp) *</Label><Input type="number" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} required /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">Jatuh Tempo *</Label><Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} required /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">Keterangan</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600" disabled={loading}>{loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</> : "Buat Invoice"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Invoice Dialog */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tagihan Bulanan Massal</DialogTitle>
            <p className="text-sm text-gray-500 mt-1">Buat invoice untuk semua siswa aktif sekaligus</p>
          </DialogHeader>
          <form onSubmit={handleBulkSubmit} className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Cabang</Label>
              <Select value={bulkForm.branchId} onValueChange={(v) => v && setBulkForm({ ...bulkForm, branchId: v === "ALL" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Semua cabang" /></SelectTrigger>
                <SelectContent><SelectItem value="ALL">Semua Cabang</SelectItem>{branches.map((b: any) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">Jumlah (Rp) *</Label><Input type="number" value={bulkForm.amount || ""} onChange={(e) => setBulkForm({ ...bulkForm, amount: Number(e.target.value) })} required min={1} /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">Jatuh Tempo *</Label><Input type="date" value={bulkForm.dueDate} onChange={(e) => setBulkForm({ ...bulkForm, dueDate: e.target.value })} required /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">Keterangan</Label><Input value={bulkForm.description} onChange={(e) => setBulkForm({ ...bulkForm, description: e.target.value })} placeholder="e.g. Tagihan Bulanan Juni 2026" /></div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={() => setBulkOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600" disabled={bulkLoading}>{bulkLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Membuat...</> : "Buat Tagihan"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
