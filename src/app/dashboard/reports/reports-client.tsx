"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, FileText, Download, Building2, Percent } from "lucide-react";
import { exportToExcel } from "@/lib/export";
import { toast } from "sonner";

interface Props {
  revenue: any[];
  pl: { revenue: number; expenses: number; profit: number; margin: number };
  collectionRate: { paid: number; total: number; rate: number };
  branches: any[];
  year: number;
}

function fmt(n: number) { return `Rp ${n.toLocaleString("id-ID")}`; }

export function ReportsClient({ revenue, pl, collectionRate, branches, year }: Props) {
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
      </Tabs>
    </div>
  );
}
