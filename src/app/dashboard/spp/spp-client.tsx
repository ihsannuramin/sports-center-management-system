"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SearchableSelect, SearchableSelectItem } from "@/components/ui/searchable-select";
import { DataPagination } from "@/components/ui/data-pagination";
import { Receipt, Calculator, Search, Download, Eye, CheckCircle, XCircle, Upload } from "lucide-react";
import {
  previewSppGeneration,
  generateSppBatch,
  getSppBatchDetail,
  setSppDiscount,
  markSppPaid,
  markSppUnpaid,
} from "@/app/actions/spp";
import { exportToExcel } from "@/lib/export";
import { toast } from "sonner";

interface Props { batches: any[]; classes: any[]; }

const months = [
  { value: "1", label: "Januari" }, { value: "2", label: "Februari" }, { value: "3", label: "Maret" },
  { value: "4", label: "April" }, { value: "5", label: "Mei" }, { value: "6", label: "Juni" },
  { value: "7", label: "Juli" }, { value: "8", label: "Agustus" }, { value: "9", label: "September" },
  { value: "10", label: "Oktober" }, { value: "11", label: "November" }, { value: "12", label: "Desember" },
];

const PAGE_SIZE = 10;

export function SppClient({ batches, classes }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const [genOpen, setGenOpen] = useState(false);
  const [genClassId, setGenClassId] = useState("");
  const [genMonth, setGenMonth] = useState(String(new Date().getMonth() + 1));
  const [genYear, setGenYear] = useState(String(new Date().getFullYear()));
  const [genLoading, setGenLoading] = useState(false);
  const [genPreview, setGenPreview] = useState<{ sppAmount: number | null; rows: any[] } | null>(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailBatchId, setDetailBatchId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [proofViewUrl, setProofViewUrl] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const genPeriod = `${genYear}-${String(Number(genMonth)).padStart(2, "0")}`;
  const selectedClass = classes.find((c: any) => c.id === genClassId);
  const classSppMissing = !!selectedClass && selectedClass.sppAmount == null;

  const filtered = batches.filter((b: any) => {
    const q = search.toLowerCase();
    return !q || b.className.toLowerCase().includes(q) || b.period.includes(q);
  });
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const totalBilled = batches.reduce((sum: number, b: any) => sum + b.totalBilled, 0);
  const totalPaid = batches.reduce((sum: number, b: any) => sum + b.totalPaid, 0);

  function openGenerate() {
    setGenClassId(""); setGenPreview(null); setGenOpen(true);
  }

  async function handlePreviewGenerate() {
    if (!genClassId) return;
    setGenLoading(true);
    try {
      const res = await previewSppGeneration(genClassId, genPeriod);
      setGenPreview(res);
    } catch (err: any) { toast.error(err.message || "Gagal menghitung"); }
    setGenLoading(false);
  }

  async function handleGenerate() {
    if (!genClassId) return;
    setGenLoading(true);
    try {
      const res = await generateSppBatch(genClassId, genPeriod);
      if (res.success) {
        toast.success(`${res.created} siswa ditagih${res.skipped ? `, ${res.skipped} dilewati (sudah ditagih)` : ""}`);
        setGenOpen(false);
        router.refresh();
      } else {
        toast.error(res.error || "Gagal generate");
      }
    } catch (err: any) { toast.error(err.message || "Gagal generate"); }
    setGenLoading(false);
  }

  async function openDetail(batchId: string) {
    setDetailOpen(true);
    setDetailBatchId(batchId);
    setDetailLoading(true);
    try {
      const data = await getSppBatchDetail(batchId);
      setDetailData(data);
    } catch { setDetailData(null); }
    setDetailLoading(false);
  }

  async function refreshDetail() {
    if (!detailBatchId) return;
    const data = await getSppBatchDetail(detailBatchId);
    setDetailData(data);
  }

  async function handleDiscountBlur(rowId: string, value: string) {
    const num = Number(value);
    if (Number.isNaN(num)) return;
    try {
      await setSppDiscount(rowId, num);
    } catch (err: any) { toast.error(err.message); }
    await refreshDetail();
    router.refresh();
  }

  async function handleMarkPaid(rowId: string, proofUrl?: string) {
    try {
      await markSppPaid(rowId, proofUrl);
      toast.success("Siswa ditandai lunas");
      await refreshDetail();
      router.refresh();
    } catch (err: any) { toast.error(err.message); }
  }

  async function handleMarkUnpaid(rowId: string) {
    try {
      await markSppUnpaid(rowId);
      toast.success("Status dibatalkan");
      await refreshDetail();
      router.refresh();
    } catch (err: any) { toast.error(err.message); }
  }

  function handleFileChange(rowId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { handleMarkPaid(rowId, reader.result as string); };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function handleExport() {
    const data = batches.map((b: any) => ({
      "Periode": b.period, "Kelas": b.className, "Total Siswa": b.totalStudents,
      "Lunas": b.paidCount, "Belum Lunas": b.unpaidCount,
      "Total Tertagih": b.totalBilled, "Total Terbayar": b.totalPaid,
    }));
    exportToExcel(data, "Input-SPP-Siswa", "SPP");
    toast.success(`${data.length} data diekspor`);
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-gray-100 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 mb-1">Total Tertagih</p>
            <p className="text-xl font-bold text-gray-900">Rp {totalBilled.toLocaleString("id-ID")}</p>
          </CardContent>
        </Card>
        <Card className="border-gray-100 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 mb-1">Total Terbayar</p>
            <p className="text-xl font-bold text-green-600">Rp {totalPaid.toLocaleString("id-ID")}</p>
          </CardContent>
        </Card>
        <Card className="border-gray-100 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 mb-1">Batch Periode+Kelas</p>
            <p className="text-xl font-bold text-gray-900">{batches.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-50 rounded-xl"><Receipt className="w-5 h-5 text-orange-500" /></div>
          <div>
            <h2 className="font-semibold text-gray-900">Input SPP Siswa</h2>
            <p className="text-xs text-gray-400">{batches.length} batch periode & kelas</p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <Button variant="outline" size="sm" className="h-9 border-gray-200" onClick={handleExport}><Download className="w-4 h-4 mr-1.5" /> Excel</Button>
          <Button size="sm" className="h-9 bg-orange-500 hover:bg-orange-600 shadow-sm shadow-orange-200" onClick={openGenerate}><Calculator className="w-4 h-4 mr-1.5" /> Generate SPP</Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder="Cari kelas atau periode..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9 h-9 border-gray-200 text-sm" />
      </div>

      <Card className="border-gray-100 shadow-sm">
        <CardContent className="p-0">
          <Table className="table-row-hover">
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                <TableHead className="text-xs font-semibold text-gray-500 pl-5">Periode</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500">Kelas</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500">Total Siswa</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500">Lunas</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500">Belum Lunas</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500">Total Tertagih</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500">Total Terbayar</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-16">
                    <Receipt className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Belum ada batch SPP</p>
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((b: any) => (
                  <TableRow key={b.id}>
                    <TableCell className="pl-5 font-medium text-sm text-gray-900">{b.period}</TableCell>
                    <TableCell className="text-sm text-gray-700">{b.className}</TableCell>
                    <TableCell className="text-sm text-gray-600">{b.totalStudents}</TableCell>
                    <TableCell><span className="badge-green">{b.paidCount}</span></TableCell>
                    <TableCell><span className="badge-yellow">{b.unpaidCount}</span></TableCell>
                    <TableCell className="text-sm font-medium text-gray-900">Rp {b.totalBilled.toLocaleString("id-ID")}</TableCell>
                    <TableCell className="text-sm font-medium text-green-600">Rp {b.totalPaid.toLocaleString("id-ID")}</TableCell>
                    <TableCell className="pr-3">
                      <Button size="sm" variant="outline" className="h-8 text-xs border-gray-200" onClick={() => openDetail(b.id)}>
                        Lihat Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <DataPagination total={filtered.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
        </CardContent>
      </Card>

      {/* Generate dialog */}
      <Dialog open={genOpen} onOpenChange={setGenOpen}>
        <DialogContent className="w-[92vw] sm:max-w-3xl">
          <DialogHeader><DialogTitle>Generate SPP dari Kelas & Periode</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-1 min-w-0">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Kelas *</Label>
                <SearchableSelect value={genClassId} onValueChange={(v) => { setGenClassId(v ?? ""); setGenPreview(null); }} placeholder="Pilih kelas">
                  {classes.map((c: any) => <SearchableSelectItem key={c.id} value={c.id}>{c.name}</SearchableSelectItem>)}
                </SearchableSelect>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Bulan</Label>
                <SearchableSelect value={genMonth} onValueChange={(v) => { setGenMonth(v ?? genMonth); setGenPreview(null); }}>
                  {months.map((m) => <SearchableSelectItem key={m.value} value={m.value}>{m.label}</SearchableSelectItem>)}
                </SearchableSelect>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Tahun</Label>
                <input
                  type="number"
                  value={genYear}
                  onChange={(e) => { setGenYear(e.target.value); setGenPreview(null); }}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  min={2020}
                  max={2099}
                />
              </div>
            </div>

            {classSppMissing && (
              <div className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                Kelas ini belum punya Biaya SPP. Lengkapi dulu di Data Kelas sebelum generate.
              </div>
            )}

            <div className="flex justify-end">
              <Button type="button" variant="outline" className="border-gray-200" onClick={handlePreviewGenerate} disabled={!genClassId || genLoading || classSppMissing}>
                {genLoading ? "Menghitung..." : "Hitung"}
              </Button>
            </div>

            {genPreview !== null && (
              genPreview.rows.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Tidak ada siswa yang hadir (PRESENT) di kelas ini untuk periode ini.</p>
              ) : (
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto max-h-[45vh] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                        <tr>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 whitespace-nowrap">Siswa</th>
                          <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 whitespace-nowrap">Biaya SPP</th>
                          <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 whitespace-nowrap"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {genPreview.rows.map((r: any) => (
                          <tr key={r.studentId}>
                            <td className="px-3 py-2 font-medium text-gray-900 whitespace-nowrap">{r.studentName}</td>
                            <td className="px-3 py-2 text-right text-gray-600 whitespace-nowrap">Rp {r.baseAmount.toLocaleString("id-ID")}</td>
                            <td className="px-3 py-2 text-xs text-right whitespace-nowrap">
                              {r.billedElsewhere && <span className="text-gray-400">sudah ditagih</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={() => setGenOpen(false)}>Batal</Button>
              <Button
                type="button"
                className="bg-orange-500 hover:bg-orange-600"
                disabled={!genPreview || genPreview.rows.every((r: any) => r.billedElsewhere) || genLoading || classSppMissing}
                onClick={handleGenerate}
              >
                {genLoading ? "Memproses..." : "Generate"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="w-[92vw] sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {detailData ? `${detailData.className} — ${detailData.period}` : "Detail SPP"}
            </DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <p className="text-sm text-gray-400 text-center py-8">Memuat...</p>
          ) : !detailData ? (
            <p className="text-sm text-gray-400 text-center py-8">Data tidak ditemukan.</p>
          ) : (
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto max-h-[55vh] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                    <tr>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 whitespace-nowrap">Siswa</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 whitespace-nowrap">Biaya</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 whitespace-nowrap">Diskon</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 whitespace-nowrap">Tagihan</th>
                      <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 whitespace-nowrap">Bukti</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {detailData.rows.map((r: any) => (
                      <tr key={r.id} className="align-top">
                        <td className="px-3 py-2 font-medium text-gray-900 whitespace-nowrap">
                          {r.studentName}
                          <div className="text-[11px] text-gray-400 font-mono">{r.studentNumber}</div>
                        </td>
                        <td className="px-3 py-2 text-right text-gray-600 whitespace-nowrap">Rp {r.baseAmount.toLocaleString("id-ID")}</td>
                        <td className="px-3 py-2 text-right whitespace-nowrap">
                          <input
                            type="number"
                            min="0"
                            max={r.baseAmount}
                            defaultValue={r.discountAmount}
                            disabled={r.status === "PAID"}
                            onBlur={(e) => handleDiscountBlur(r.id, e.target.value)}
                            className="w-24 h-8 rounded-md border border-input bg-transparent px-2 text-sm text-right disabled:opacity-50"
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-gray-900 whitespace-nowrap">Rp {r.amount.toLocaleString("id-ID")}</td>
                        <td className="px-3 py-2 text-center whitespace-nowrap">
                          {r.proofUrl ? (
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-blue-500 hover:text-blue-600 px-2" onClick={() => setProofViewUrl(r.proofUrl)}>
                              <Eye className="w-3.5 h-3.5 mr-1" /> Lihat
                            </Button>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right whitespace-nowrap">
                          {r.status === "PAID" ? (
                            <Button size="sm" variant="outline" className="h-8 text-xs text-red-500 border-red-200 hover:bg-red-50" onClick={() => handleMarkUnpaid(r.id)}>
                              <XCircle className="w-3.5 h-3.5 mr-1" /> Batalkan
                            </Button>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              <input
                                ref={(el) => { fileInputRefs.current[r.id] = el; }}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFileChange(r.id, e)}
                              />
                              <Button size="sm" variant="outline" className="h-8 text-xs border-gray-200" onClick={() => fileInputRefs.current[r.id]?.click()}>
                                <Upload className="w-3.5 h-3.5 mr-1" /> Upload
                              </Button>
                              <Button size="sm" className="h-8 text-xs bg-green-500 hover:bg-green-600" onClick={() => handleMarkPaid(r.id)}>
                                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Tandai Lunas
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!proofViewUrl} onOpenChange={() => setProofViewUrl(null)}>
        <DialogContent><DialogHeader><DialogTitle>Bukti Pembayaran</DialogTitle></DialogHeader>
          {proofViewUrl && <img src={proofViewUrl} alt="Bukti pembayaran" className="w-full rounded-xl" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
