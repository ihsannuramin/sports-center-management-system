"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchableSelect, SearchableSelectItem } from "@/components/ui/searchable-select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, FileText, Download, Building2, Percent } from "lucide-react";
import { exportToExcel } from "@/lib/export";
import { getSppProjectionByClass } from "@/app/actions/reports";
import { toast } from "sonner";

interface Props {
  revenue: any[];
  pl: { revenue: number; expenses: number; profit: number; margin: number };
  collectionRate: { paid: number; total: number; rate: number };
  branches: any[];
  sppProjection: any[];
  year: number;
}

const sppMonths = [
  { value: "1", label: "Januari" }, { value: "2", label: "Februari" }, { value: "3", label: "Maret" },
  { value: "4", label: "April" }, { value: "5", label: "Mei" }, { value: "6", label: "Juni" },
  { value: "7", label: "Juli" }, { value: "8", label: "Agustus" }, { value: "9", label: "September" },
  { value: "10", label: "Oktober" }, { value: "11", label: "November" }, { value: "12", label: "Desember" },
];

function fmt(n: number) { return `Rp ${n.toLocaleString("id-ID")}`; }

export function ReportsClient({ revenue, pl, collectionRate, branches, sppProjection, year }: Props) {
  const [sppMonth, setSppMonth] = useState(String(new Date().getMonth() + 1));
  const [sppYear, setSppYear] = useState(String(year));
  const [sppRows, setSppRows] = useState<any[] | null>(null);
  const [sppLoading, setSppLoading] = useState(false);

  async function loadSppByClass() {
    setSppLoading(true);
    try {
      const period = `${sppYear}-${String(Number(sppMonth)).padStart(2, "0")}`;
      const rows = await getSppProjectionByClass(period);
      setSppRows(rows);
    } catch (err: any) { toast.error(err.message || "Gagal memuat data"); }
    setSppLoading(false);
  }

  function exportSpp() {
    if (!sppRows) return;
    exportToExcel(sppRows.map((r) => ({
      "Kelas": r.className, "Siswa Hadir": r.activeStudents, "Biaya SPP": r.sppAmount ?? "-",
      "Proyeksi": r.proyeksi, "Aktual": r.aktual, "% Tertagih": r.collectedPct ?? "-",
    })), "Proyeksi-SPP", "SPP");
    toast.success("Data diekspor");
  }
  function exportRevenue() {
    exportToExcel(revenue.map(r => ({ "Bulan": r.month, "Akademi": r.academy, "Rental": r.rental, "Total": r.total })), `Revenue-${year}`, "Revenue");
    toast.success("Data diekspor");
  }

  function exportPL() {
    exportToExcel([{ "Pendapatan": pl.revenue, "Pengeluaran": pl.expenses, "Laba": pl.profit, "Margin (%)": pl.margin.toFixed(1) }], `PL-${year}`, "P&L");
    toast.success("Data diekspor");
  }

  return (
    <div className="space-y-5">
      {/* P&L Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-gray-100 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-green-50 rounded-lg"><TrendingUp className="w-4 h-4 text-green-500" /></div>
              <p className="text-xs text-gray-400">Total Pendapatan {year}</p>
            </div>
            <p className="text-xl font-bold text-green-600">{fmt(pl.revenue)}</p>
          </CardContent>
        </Card>
        <Card className="border-gray-100 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-red-50 rounded-lg"><TrendingDown className="w-4 h-4 text-red-500" /></div>
              <p className="text-xs text-gray-400">Total Pengeluaran</p>
            </div>
            <p className="text-xl font-bold text-red-500">{fmt(pl.expenses)}</p>
          </CardContent>
        </Card>
        <Card className="border-gray-100 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-blue-50 rounded-lg"><DollarSign className="w-4 h-4 text-blue-500" /></div>
              <p className="text-xs text-gray-400">Laba Bersih</p>
            </div>
            <p className={`text-xl font-bold ${pl.profit >= 0 ? "text-blue-600" : "text-red-500"}`}>{fmt(pl.profit)}</p>
          </CardContent>
        </Card>
        <Card className="border-gray-100 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-orange-50 rounded-lg"><Percent className="w-4 h-4 text-orange-500" /></div>
              <p className="text-xs text-gray-400">Collection Rate</p>
            </div>
            <p className="text-xl font-bold text-orange-600">{collectionRate.rate.toFixed(1)}%</p>
            <p className="text-xs text-gray-400 mt-0.5">{collectionRate.paid}/{collectionRate.total} invoice</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="revenue">
        <TabsList className="h-9 bg-gray-100/80">
          <TabsTrigger value="revenue" className="text-xs px-4">Pendapatan</TabsTrigger>
          <TabsTrigger value="branches" className="text-xs px-4">Perbandingan Cabang</TabsTrigger>
          <TabsTrigger value="pl" className="text-xs px-4">Laba Rugi</TabsTrigger>
          <TabsTrigger value="spp" className="text-xs px-4">Proyeksi SPP</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="mt-4">
          <Card className="border-gray-100 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Pendapatan Bulanan {year}</CardTitle>
                <Button variant="outline" size="sm" className="h-8 text-xs border-gray-200" onClick={exportRevenue}><Download className="w-3.5 h-3.5 mr-1.5" /> Export</Button>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} />
                  <Tooltip formatter={(v) => fmt(Number(v))} />
                  <Legend />
                  <Bar dataKey="academy" name="Akademi" fill="#f97316" radius={[3,3,0,0]} />
                  <Bar dataKey="rental" name="Rental" fill="#3b82f6" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branches" className="mt-4">
          <Card className="border-gray-100 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Perbandingan Cabang (Bulan Ini)</CardTitle>
                <Button variant="outline" size="sm" className="h-8 text-xs border-gray-200" onClick={() => {
                  exportToExcel(branches, "Branch-Comparison", "Cabang");
                  toast.success("Data diekspor");
                }}><Download className="w-3.5 h-3.5 mr-1.5" /> Export</Button>
              </div>
            </CardHeader>
            <CardContent>
              {branches.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Belum ada data cabang</p>
              ) : (
                <div className="space-y-3">
                  {branches.map((b) => (
                    <div key={b.branch} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-50 rounded-lg"><Building2 className="w-4 h-4 text-orange-500" /></div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{b.branch}</p>
                          <p className="text-xs text-gray-400">{b.students} siswa · {b.coaches} pelatih · {b.courts} lapangan</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 text-sm">{fmt(b.revenue)}</p>
                        <p className="text-xs text-gray-400">bulan ini</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pl" className="mt-4">
          <Card className="border-gray-100 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Laporan Laba Rugi {year}</CardTitle>
                <Button variant="outline" size="sm" className="h-8 text-xs border-gray-200" onClick={exportPL}><Download className="w-3.5 h-3.5 mr-1.5" /> Export</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Total Pendapatan</span>
                  <span className="text-sm font-bold text-green-600">{fmt(pl.revenue)}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Total Pengeluaran</span>
                  <span className="text-sm font-bold text-red-500">{fmt(pl.expenses)}</span>
                </div>
                <div className="flex justify-between items-center py-4 bg-gray-50 rounded-xl px-4">
                  <span className="text-sm font-semibold text-gray-900">Laba Bersih</span>
                  <span className={`text-lg font-bold ${pl.profit >= 0 ? "text-blue-600" : "text-red-500"}`}>{fmt(pl.profit)}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm font-medium text-gray-600">Profit Margin</span>
                  <span className="text-sm font-bold text-orange-600">{pl.margin.toFixed(1)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="spp" className="mt-4 space-y-4">
          <Card className="border-gray-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Proyeksi vs Aktual Pendapatan SPP {year}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sppProjection}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} />
                  <Tooltip formatter={(v) => fmt(Number(v))} />
                  <Legend />
                  <Bar dataKey="proyeksi" name="Proyeksi" fill="#f97316" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="aktual" name="Aktual" fill="#22c55e" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-gray-100 shadow-sm overflow-visible">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base">Breakdown per Kelas</CardTitle>
                <Button variant="outline" size="sm" className="h-8 text-xs border-gray-200" onClick={exportSpp} disabled={!sppRows}>
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Export
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-visible space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-700">Bulan</Label>
                  <SearchableSelect value={sppMonth} onValueChange={(v) => setSppMonth(v ?? sppMonth)}>
                    {sppMonths.map((m) => <SearchableSelectItem key={m.value} value={m.value}>{m.label}</SearchableSelectItem>)}
                  </SearchableSelect>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-700">Tahun</Label>
                  <input
                    type="number"
                    value={sppYear}
                    onChange={(e) => setSppYear(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    min={2020}
                    max={2099}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={loadSppByClass} disabled={sppLoading} className="bg-orange-500 hover:bg-orange-600 w-full">
                    {sppLoading ? "Memuat..." : "Tampilkan"}
                  </Button>
                </div>
              </div>

              {sppRows !== null && (
                sppRows.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">Tidak ada kelas aktif.</p>
                ) : (
                  <div className="rounded-xl border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                          <tr>
                            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 whitespace-nowrap">Kelas</th>
                            <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 whitespace-nowrap">Siswa Hadir</th>
                            <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 whitespace-nowrap">Biaya SPP</th>
                            <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 whitespace-nowrap">Proyeksi</th>
                            <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 whitespace-nowrap">Aktual</th>
                            <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 whitespace-nowrap">% Tertagih</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {sppRows.map((r) => (
                            <tr key={r.classId}>
                              <td className="px-3 py-2 font-medium text-gray-900 whitespace-nowrap">{r.className}</td>
                              <td className="px-3 py-2 text-right text-gray-600 whitespace-nowrap">{r.activeStudents}</td>
                              <td className="px-3 py-2 text-right text-gray-600 whitespace-nowrap">{r.sppAmount != null ? fmt(r.sppAmount) : "—"}</td>
                              <td className="px-3 py-2 text-right text-gray-900 whitespace-nowrap">{fmt(r.proyeksi)}</td>
                              <td className="px-3 py-2 text-right text-green-600 font-medium whitespace-nowrap">{fmt(r.aktual)}</td>
                              <td className="px-3 py-2 text-right text-gray-600 whitespace-nowrap">{r.collectedPct != null ? `${r.collectedPct}%` : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
