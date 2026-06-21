"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SearchableSelect, SearchableSelectItem } from "@/components/ui/searchable-select";
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
  const payments = initial;
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
  const selectedInv = unpaidInvoices.find((i: any) => i.id === cashForm.invoiceId);

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

      <Card className="border-neutral shadow-sm">
        <CardHeader className="pb-4 border-b border-neutral">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-xl"><CreditCard className="w-5 h-5 text-blue-500" /></div>
              <div>
                <h2 className="font-semibold text-on-surface">Riwayat Pembayaran</h2>
                <p className="text-xs text-muted-foreground">{filtered.length} transaksi</p>
              </div>
            </div>
            <div className="flex gap-2 items-center flex-wrap">
              <SearchableSelect value={filter} onValueChange={(v) => { setFilter(v ?? "PENDING"); setPage(1); }} className="w-44 h-9 text-sm border-border">
                <SearchableSelectItem value="ALL">Semua</SearchableSelectItem>
                <SearchableSelectItem value="PENDING">Menunggu Verifikasi</SearchableSelectItem>
                <SearchableSelectItem value="VERIFIED">Terverifikasi</SearchableSelectItem>
                <SearchableSelectItem value="REJECTED">Ditolak</SearchableSelectItem>
              </SearchableSelect>
              <Button variant="outline" size="sm" className="h-9 border-border text-foreground" onClick={handleExport}>
                <Download className="w-4 h-4 mr-1.5" /> Excel
              </Button>
              <Button size="sm" className="h-9 bg-primary hover:bg-primary-80 shadow-sm shadow-primary/20" onClick={() => setCashOpen(true)}>
                <Plus className="w-4 h-4 mr-1.5" /> Input Tunai
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table className="table-row-hover">
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="text-xs font-semibold text-tertiary pl-5">Tanggal</TableHead>
                <TableHead className="text-xs font-semibold text-tertiary">Siswa / Booking</TableHead>
                <TableHead className="text-xs font-semibold text-tertiary">Jumlah</TableHead>
                <TableHead className="text-xs font-semibold text-tertiary">Metode</TableHead>
                <TableHead className="text-xs font-semibold text-tertiary">Bukti</TableHead>
                <TableHead className="text-xs font-semibold text-tertiary">Status</TableHead>
                <TableHead className="text-xs font-semibold text-tertiary">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-16">
                  <CreditCard className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Tidak ada data pembayaran</p>
                </TableCell></TableRow>
              ) : (
                paginated.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="pl-5">
                      <span className="text-sm text-foreground">{format(new Date(p.createdAt), "d MMM yyyy")}</span>
                      <p className="text-xs text-muted-foreground">{format(new Date(p.createdAt), "HH:mm")}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium text-on-surface">{p.invoice?.student?.name || p.booking?.customerName || "-"}</p>
                      <p className="text-xs text-muted-foreground">{p.invoice?.invoiceNumber || p.booking?.bookingNumber}</p>
                    </TableCell>
                    <TableCell><span className="text-sm font-semibold text-on-surface">Rp {Number(p.amount).toLocaleString("id-ID")}</span></TableCell>
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
                      ) : <span className="text-muted-foreground/50 text-xs">—</span>}
                    </TableCell>
                    <TableCell><span className={statusBadge[p.status]}>{statusLabels[p.status]}</span></TableCell>
                    <TableCell>
                      {p.status === "PENDING" && (
                        <div className="flex items-center gap-1.5">
                          <Button size="sm" onClick={() => handleVerify(p.id)} className="bg-green-500 hover:bg-green-600 h-8 text-xs px-2.5 cursor-pointer">
                            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Verifikasi
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleReject(p.id)} title="Tolak" className="text-destructive border-destructive/20 hover:bg-destructive/10 h-8 w-8 p-0 cursor-pointer">
                            <XCircle className="w-4 h-4" />
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
            <p className="text-sm text-tertiary mt-1">Langsung diverifikasi otomatis</p>
          </DialogHeader>
          <form onSubmit={handleCashSubmit} className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Invoice *</Label>
              <SearchableSelect value={cashForm.invoiceId} onValueChange={(v) => {
                if (!v) return;
                const inv = unpaidInvoices.find((i: any) => i.id === v);
                setCashForm({ ...cashForm, invoiceId: v, amount: inv ? Number(inv.amount) : cashForm.amount });
              }} placeholder="Pilih invoice belum dibayar">
                {unpaidInvoices.map((inv: any) => (
                  <SearchableSelectItem key={inv.id} value={inv.id}>{inv.student?.name} — {inv.invoiceNumber} (Rp {Number(inv.amount).toLocaleString("id-ID")})</SearchableSelectItem>
                ))}
              </SearchableSelect>
            </div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-foreground">Jumlah (Rp) *</Label><Input type="number" value={cashForm.amount || ""} onChange={(e) => setCashForm({ ...cashForm, amount: Number(e.target.value) })} required min={1} /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-foreground">Catatan</Label><Input value={cashForm.notes} onChange={(e) => setCashForm({ ...cashForm, notes: e.target.value })} placeholder="Opsional" /></div>
            <div className="flex justify-end gap-2 pt-2 border-t border-neutral">
              <Button type="button" variant="outline" onClick={() => setCashOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-primary hover:bg-primary-80" disabled={cashLoading}>{cashLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</> : "Catat Pembayaran"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
