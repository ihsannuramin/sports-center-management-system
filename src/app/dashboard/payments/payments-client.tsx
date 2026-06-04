"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DataPagination } from "@/components/ui/data-pagination";
import { verifyPayment, rejectPayment, createPayment } from "@/app/actions/payments";
import { exportToExcel } from "@/lib/export";
import { toast } from "sonner";
import { format } from "date-fns";
import { CheckCircle, XCircle, Eye, Plus, Download, CreditCard, AlertCircle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const statusBadge: Record<string, string> = {
  PENDING: "badge-yellow", VERIFIED: "badge-green", REJECTED: "badge-red",
};
const statusLabels: Record<string, string> = {
  PENDING: "Menunggu", VERIFIED: "Terverifikasi", REJECTED: "Ditolak",
};

interface Props { payments: any[]; invoices: any[]; }
const emptyCashForm = { invoiceId: "", amount: 0, notes: "" };

export function PaymentsClient({ payments: initial, invoices }: Props) {
  const router = useRouter();
  const [payments] = useState(initial);
  const [filter, setFilter] = useState("PENDING");
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [cashOpen, setCashOpen] = useState(false);
  const [cashForm, setCashForm] = useState(emptyCashForm);
  const [cashLoading, setCashLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = payments.filter((p) => filter === "ALL" || p.status === filter);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const pendingCount = payments.filter((p) => p.status === "PENDING").length;
  const unpaidInvoices = invoices.filter((inv: any) => inv.status === "UNPAID");

  async function handleVerify(id: string) { await verifyPayment(id); toast.success("Pembayaran diverifikasi"); router.refresh(); }
  async function handleReject(id: string) { await rejectPayment(id); toast.success("Pembayaran ditolak"); router.refresh(); }
  async function handleCashSubmit(e: React.FormEvent) {
    e.preventDefault(); setCashLoading(true);
    try {
      const result = await createPayment({ invoiceId: cashForm.invoiceId || undefined, amount: Number(cashForm.amount), method: "CASH", notes: cashForm.notes || undefined });
      if (result.success) {
        await verifyPayment(result.payment!.id);
        toast.success("Pembayaran tunai dicatat & diverifikasi");
        setCashOpen(false); setCashForm(emptyCashForm); router.refresh();
      }
    } catch (err: any) { toast.error(err.message || "Terjadi kesalahan"); }
    setCashLoading(false);
  }
  function handleExport() {
    const data = filtered.map((p) => ({
      "Tanggal": format(new Date(p.createdAt), "dd/MM/yyyy HH:mm"),
      "Siswa / Booking": p.invoice?.student?.name || p.booking?.customerName || "-",
      "No. Referensi": p.invoice?.invoiceNumber || p.booking?.bookingNumber || "-",
      "Jumlah (Rp)": Number(p.amount), "Metode": p.method === "TRANSFER" ? "Transfer Bank" : "Tunai",
      "Status": statusLabels[p.status] || p.status,
    }));
    exportToExcel(data, "Riwayat-Pembayaran", "Pembayaran");
    toast.success(`${data.length} data diekspor`);
  }

  return (
    <div className="space-y-5">
      {pendingCount > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <div className="p-1.5 bg-amber-100 rounded-lg"><AlertCircle className="w-4 h-4 text-amber-600" /></div>
          <p className="text-sm font-medium text-amber-700">{pendingCount} pembayaran menunggu verifikasi Anda</p>
          <Button size="sm" variant="outline" className="ml-auto h-7 text-xs border-amber-200 text-amber-700 hover:bg-amber-100" onClick={() => setFilter("PENDING")}>
            Tampilkan
          </Button>
        </div>
      )}

      <Card className="border-gray-100 shadow-sm">
        <CardHeader className="pb-4 border-b border-gray-50">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-xl"><CreditCard className="w-5 h-5 text-blue-500" /></div>
              <div>
                <h2 className="font-semibold text-gray-900">Riwayat Pembayaran</h2>
                <p className="text-xs text-gray-400">{filtered.length} transaksi</p>
              </div>
            </div>
            <div className="flex gap-2 items-center flex-wrap">
              <Select value={filter} onValueChange={(v) => { setFilter(v ?? "PENDING"); setPage(1); }}>
                <SelectTrigger className="w-44 h-9 text-sm border-gray-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua</SelectItem>
                  <SelectItem value="PENDING">Menunggu Verifikasi</SelectItem>
                  <SelectItem value="VERIFIED">Terverifikasi</SelectItem>
                  <SelectItem value="REJECTED">Ditolak</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="h-9 border-gray-200 text-gray-600" onClick={handleExport}>
                <Download className="w-4 h-4 mr-1.5" /> Excel
              </Button>
              <Button size="sm" className="h-9 bg-orange-500 hover:bg-orange-600 shadow-sm shadow-orange-200" onClick={() => setCashOpen(true)}>
                <Plus className="w-4 h-4 mr-1.5" /> Input Tunai
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table className="table-row-hover">
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                <TableHead className="text-xs font-semibold text-gray-500 pl-5">Tanggal</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500">Siswa / Booking</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500">Jumlah</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500">Metode</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500">Bukti</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500">Status</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-16">
                  <CreditCard className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Tidak ada data pembayaran</p>
                </TableCell></TableRow>
              ) : (
                paginated.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="pl-5">
                      <span className="text-sm text-gray-600">{format(new Date(p.createdAt), "d MMM yyyy")}</span>
                      <p className="text-xs text-gray-400">{format(new Date(p.createdAt), "HH:mm")}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium text-gray-900">{p.invoice?.student?.name || p.booking?.customerName || "-"}</p>
                      <p className="text-xs text-gray-400">{p.invoice?.invoiceNumber || p.booking?.bookingNumber}</p>
                    </TableCell>
                    <TableCell><span className="text-sm font-semibold text-gray-900">Rp {Number(p.amount).toLocaleString("id-ID")}</span></TableCell>
                    <TableCell>
                      <span className={p.method === "CASH" ? "badge-blue" : "badge-gray"}>
                        {p.method === "TRANSFER" ? "Transfer" : "Tunai"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {p.proofUrl ? (
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-blue-500 hover:text-blue-600 px-2" onClick={() => setProofUrl(p.proofUrl)}>
                          <Eye className="w-3.5 h-3.5 mr-1" /> Lihat
                        </Button>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </TableCell>
                    <TableCell><span className={statusBadge[p.status]}>{statusLabels[p.status]}</span></TableCell>
                    <TableCell>
                      {p.status === "PENDING" && (
                        <div className="flex gap-1">
                          <Button size="sm" onClick={() => handleVerify(p.id)} className="bg-green-500 hover:bg-green-600 h-7 text-xs px-2.5">
                            <CheckCircle className="w-3 h-3 mr-1" /> Verifikasi
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleReject(p.id)} className="text-red-500 border-red-200 hover:bg-red-50 h-7 w-7 p-0">
                            <XCircle className="w-3.5 h-3.5" />
                          </Button>
                        </div>
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

      <Dialog open={!!proofUrl} onOpenChange={() => setProofUrl(null)}>
        <DialogContent><DialogHeader><DialogTitle>Bukti Pembayaran</DialogTitle></DialogHeader>
          {proofUrl && <img src={proofUrl} alt="Bukti pembayaran" className="w-full rounded-xl" />}
        </DialogContent>
      </Dialog>

      <Dialog open={cashOpen} onOpenChange={setCashOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Input Pembayaran Tunai</DialogTitle>
            <p className="text-sm text-gray-500 mt-1">Langsung diverifikasi otomatis</p>
          </DialogHeader>
          <form onSubmit={handleCashSubmit} className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Invoice *</Label>
              <Select value={cashForm.invoiceId} onValueChange={(v) => {
                if (!v) return;
                const inv = unpaidInvoices.find((i: any) => i.id === v);
                setCashForm({ ...cashForm, invoiceId: v, amount: inv ? Number(inv.amount) : cashForm.amount });
              }}>
                <SelectTrigger><SelectValue placeholder="Pilih invoice belum dibayar" /></SelectTrigger>
                <SelectContent>{unpaidInvoices.map((inv: any) => (
                  <SelectItem key={inv.id} value={inv.id}>{inv.student?.name} — {inv.invoiceNumber} (Rp {Number(inv.amount).toLocaleString("id-ID")})</SelectItem>
                ))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">Jumlah (Rp) *</Label><Input type="number" value={cashForm.amount || ""} onChange={(e) => setCashForm({ ...cashForm, amount: Number(e.target.value) })} required min={1} /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">Catatan</Label><Input value={cashForm.notes} onChange={(e) => setCashForm({ ...cashForm, notes: e.target.value })} placeholder="Opsional" /></div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={() => setCashOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600" disabled={cashLoading}>{cashLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</> : "Catat Pembayaran"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
