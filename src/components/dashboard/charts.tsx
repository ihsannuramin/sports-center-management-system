"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-50 rounded-xl shadow-lg p-3 text-sm min-w-[160px]">
      <p className="font-semibold text-gray-700 mb-2 text-xs">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
            <span className="text-xs text-gray-500">{p.name}</span>
          </div>
          <span className="text-xs font-semibold text-gray-900 tabular-nums">
            Rp {Number(p.value).toLocaleString("id-ID")}
          </span>
        </div>
      ))}
    </div>
  );
};

const CustomTooltipAttendance = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-50 rounded-xl shadow-lg p-3 text-sm min-w-[120px]">
      <p className="font-semibold text-gray-700 mb-2 text-xs">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
            <span className="text-xs text-gray-500">{p.name}</span>
          </div>
          <span className="text-xs font-semibold text-gray-900 tabular-nums">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export function DashboardCharts() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Attendance chart */}
      <Card className="border-gray-50">
        <CardHeader className="pb-3 pt-4 px-5">
          <p className="text-sm font-semibold text-gray-900">Absensi Minggu Ini</p>
          <p className="text-xs text-gray-400 mt-0.5">Kehadiran harian siswa (data contoh)</p>
        </CardHeader>
        <CardContent className="px-3 pb-4">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={attendanceData} barSize={20} barGap={3} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip
                content={<CustomTooltipAttendance />}
                cursor={{ fill: "#f8fafc", rx: 4 }}
              />
              <Legend
                wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }}
                formatter={(value) => <span className="text-gray-500">{value}</span>}
              />
              <Bar dataKey="hadir" fill="#f97316" name="Hadir" radius={[4, 4, 0, 0]} />
              <Bar dataKey="absen" fill="#fcd34d" name="Absen" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Revenue chart */}
      <Card className="border-gray-50">
        <CardHeader className="pb-3 pt-4 px-5">
          <p className="text-sm font-semibold text-gray-900">Pendapatan 6 Bulan Terakhir</p>
          <p className="text-xs text-gray-400 mt-0.5">Akademi vs sewa lapangan (data contoh)</p>
        </CardHeader>
        <CardContent className="px-3 pb-4">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={revenueData} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                width={32}
                tickFormatter={(v) => `${v / 1_000_000}jt`}
              />
              <Tooltip content={<CustomTooltipRevenue />} />
              <Legend
                wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }}
                formatter={(value) => <span className="text-gray-500">{value}</span>}
              />
              <Line
                type="monotone"
                dataKey="akademi"
                stroke="#f97316"
                name="Akademi"
                strokeWidth={2.5}
                dot={{ r: 3.5, fill: "#f97316", strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="sewa"
                stroke="#3b82f6"
                name="Sewa"
                strokeWidth={2.5}
                dot={{ r: 3.5, fill: "#3b82f6", strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
