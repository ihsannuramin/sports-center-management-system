"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend,
} from "recharts";

const attendanceData = [
  { day: "Sen", hadir: 18, absen: 2 },
  { day: "Sel", hadir: 20, absen: 0 },
  { day: "Rab", hadir: 15, absen: 5 },
  { day: "Kam", hadir: 22, absen: 1 },
  { day: "Jum", hadir: 19, absen: 3 },
  { day: "Sab", hadir: 25, absen: 2 },
];

const revenueData = [
  { month: "Jan", akademi: 5000000, sewa: 2000000 },
  { month: "Feb", akademi: 5500000, sewa: 2500000 },
  { month: "Mar", akademi: 4800000, sewa: 3000000 },
  { month: "Apr", akademi: 6000000, sewa: 2800000 },
  { month: "Mei", akademi: 6500000, sewa: 3500000 },
  { month: "Jun", akademi: 7000000, sewa: 4000000 },
];

const CustomTooltipRevenue = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-sm">
        <p className="font-semibold text-gray-700 mb-2">{label}</p>
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-gray-500">{p.name}:</span>
            <span className="font-medium text-gray-800">Rp {Number(p.value).toLocaleString("id-ID")}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const CustomTooltipAttendance = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-sm">
        <p className="font-semibold text-gray-700 mb-2">{label}</p>
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-gray-500">{p.name}:</span>
            <span className="font-medium text-gray-800">{p.value} siswa</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function DashboardCharts() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-700">Absensi Minggu Ini</CardTitle>
          <p className="text-xs text-gray-400">Kehadiran harian siswa</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={attendanceData} barSize={22} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltipAttendance />} cursor={{ fill: "#f8fafc" }} />
              <Legend
                wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
                formatter={(value) => <span className="text-gray-500">{value}</span>}
              />
              <Bar dataKey="hadir" fill="#f97316" name="Hadir" radius={[4, 4, 0, 0]} />
              <Bar dataKey="absen" fill="#fde68a" name="Absen" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-700">Pendapatan 6 Bulan Terakhir</CardTitle>
          <p className="text-xs text-gray-400">Akademi vs sewa lapangan</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v / 1000000}jt`}
              />
              <Tooltip content={<CustomTooltipRevenue />} />
              <Legend
                wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
                formatter={(value) => <span className="text-gray-500">{value}</span>}
              />
              <Line type="monotone" dataKey="akademi" stroke="#f97316" name="Akademi" strokeWidth={2.5} dot={{ r: 4, fill: "#f97316" }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="sewa" stroke="#3b82f6" name="Sewa" strokeWidth={2.5} dot={{ r: 4, fill: "#3b82f6" }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
