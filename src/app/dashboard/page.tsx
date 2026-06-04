export const dynamic = "force-dynamic";

import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users, UserCheck, ClipboardCheck, Calendar,
  Building2, Banknote, AlertCircle, TrendingUp, ArrowUpRight,
  TrendingDown, Target, Percent, Activity, BarChart3,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { DashboardCharts } from "@/components/dashboard/charts";
import Link from "next/link";

async function getDashboardStats() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  try {
    const [
      activeStudents,
      activeCoaches,
      todayAttendance,
      todayBookings,
      unpaidInvoices,
      pendingPayments,
      academyRevenue,
      rentalRevenue,
      prevAcademyRevenue,
      prevRentalRevenue,
      // BI KPIs
      inactiveThisMonth,
      totalInvoicesMonth,
      paidInvoicesMonth,
      totalLeads,
      convertedLeads,
      totalCourts,
      activeCourtsToday,
      totalClasses,
      classesWithStudents,
    ] = await Promise.all([
      prisma.student.count({ where: { status: "ACTIVE" } }),
      prisma.coach.count({ where: { isActive: true } }),
      prisma.attendance.count({ where: { date: { gte: todayStart, lte: todayEnd } } }),
      prisma.rentalBooking.count({ where: { date: { gte: todayStart, lte: todayEnd } } }),
      prisma.invoice.aggregate({ where: { status: "UNPAID" }, _sum: { amount: true }, _count: true }),
      prisma.payment.count({ where: { status: "PENDING" } }),
      prisma.payment.aggregate({
        where: { status: "VERIFIED", invoiceId: { not: null }, createdAt: { gte: monthStart, lte: monthEnd } },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { status: "VERIFIED", bookingId: { not: null }, createdAt: { gte: monthStart, lte: monthEnd } },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { status: "VERIFIED", invoiceId: { not: null }, createdAt: { gte: prevMonthStart, lte: prevMonthEnd } },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { status: "VERIFIED", bookingId: { not: null }, createdAt: { gte: prevMonthStart, lte: prevMonthEnd } },
        _sum: { amount: true },
      }),
      prisma.student.count({ where: { status: "INACTIVE", updatedAt: { gte: monthStart, lte: monthEnd } } }),
      prisma.invoice.count({ where: { createdAt: { gte: monthStart, lte: monthEnd } } }),
      prisma.invoice.count({ where: { status: "PAID", createdAt: { gte: monthStart, lte: monthEnd } } }),
      prisma.lead.count(),
      prisma.lead.count({ where: { stage: { in: ["REGISTERED", "ACTIVE"] } } }),
      prisma.court.count({ where: { isActive: true } }),
      prisma.rentalBooking.count({
        where: { date: { gte: todayStart, lte: todayEnd }, status: { in: ["CONFIRMED", "PENDING"] } },
      }),
      prisma.class.count({ where: { isActive: true } }),
      prisma.class.count({ where: { isActive: true, students: { some: { status: "ACTIVE" } } } }),
    ]);

    return {
      activeStudents, activeCoaches, todayAttendance, todayBookings,
      unpaidInvoices, pendingPayments, academyRevenue, rentalRevenue,
      prevAcademyRevenue, prevRentalRevenue,
      inactiveThisMonth,
      totalInvoicesMonth, paidInvoicesMonth,
      totalLeads, convertedLeads,
      totalCourts, activeCourtsToday,
      totalClasses, classesWithStudents,
    };
  } catch {
    return {
      activeStudents: 0, activeCoaches: 0, todayAttendance: 0, todayBookings: 0,
      unpaidInvoices: { _sum: { amount: null }, _count: 0 },
      pendingPayments: 0,
      academyRevenue: { _sum: { amount: null } },
      rentalRevenue: { _sum: { amount: null } },
      prevAcademyRevenue: { _sum: { amount: null } },
      prevRentalRevenue: { _sum: { amount: null } },
      inactiveThisMonth: 0,
      totalInvoicesMonth: 0, paidInvoicesMonth: 0,
      totalLeads: 0, convertedLeads: 0,
      totalCourts: 0, activeCourtsToday: 0,
      totalClasses: 0, classesWithStudents: 0,
    };
  }
}

function pct(num: number, den: number) {
  if (!den) return 0;
  return Math.round((num / den) * 100);
}

function revenueGrowth(curr: number, prev: number) {
  if (!prev) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 100);
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  const unpaidAmount = stats.unpaidInvoices._sum.amount ? Number(stats.unpaidInvoices._sum.amount) : 0;
  const unpaidCount = stats.unpaidInvoices._count || 0;
  const academyRev = stats.academyRevenue._sum.amount ? Number(stats.academyRevenue._sum.amount) : 0;
  const rentalRev = stats.rentalRevenue._sum.amount ? Number(stats.rentalRevenue._sum.amount) : 0;
  const totalRev = academyRev + rentalRev;
  const prevAcademyRev = stats.prevAcademyRevenue._sum.amount ? Number(stats.prevAcademyRevenue._sum.amount) : 0;
  const prevRentalRev = stats.prevRentalRevenue._sum.amount ? Number(stats.prevRentalRevenue._sum.amount) : 0;
  const prevTotalRev = prevAcademyRev + prevRentalRev;
  const growthPct = revenueGrowth(totalRev, prevTotalRev);

  // BI KPIs
  const churnRate = stats.activeStudents > 0
    ? Math.round((stats.inactiveThisMonth / (stats.activeStudents + stats.inactiveThisMonth)) * 100)
    : 0;
  const collectionRate = pct(stats.paidInvoicesMonth, stats.totalInvoicesMonth);
  const leadConversion = pct(stats.convertedLeads, stats.totalLeads);
  const occupancyRate = stats.totalCourts > 0 ? pct(stats.activeCourtsToday, stats.totalCourts) : 0;
  const coachUtilization = stats.totalClasses > 0 ? pct(stats.classesWithStudents, stats.totalClasses) : 0;

  const statCards = [
    { title: "Siswa Aktif", value: stats.activeStudents, icon: Users, iconBg: "bg-blue-50", iconColor: "text-blue-500", href: "/dashboard/students" },
    { title: "Pelatih Aktif", value: stats.activeCoaches, icon: UserCheck, iconBg: "bg-green-50", iconColor: "text-green-500", href: "/dashboard/coaches" },
    { title: "Absensi Hari Ini", value: stats.todayAttendance, icon: ClipboardCheck, iconBg: "bg-orange-50", iconColor: "text-orange-500", href: "/dashboard/attendance" },
    { title: "Booking Hari Ini", value: stats.todayBookings, icon: Calendar, iconBg: "bg-purple-50", iconColor: "text-purple-500", href: "/dashboard/rentals" },
  ];

  const biKpis = [
    {
      label: "Revenue Growth",
      value: `${growthPct > 0 ? "+" : ""}${growthPct}%`,
      sub: "vs bulan lalu",
      positive: growthPct >= 0,
      icon: TrendingUp,
      iconBg: growthPct >= 0 ? "bg-green-50" : "bg-red-50",
      iconColor: growthPct >= 0 ? "text-green-500" : "text-red-500",
      href: "/dashboard/reports",
    },
    {
      label: "Collection Rate",
      value: `${collectionRate}%`,
      sub: `${stats.paidInvoicesMonth}/${stats.totalInvoicesMonth} invoice bulan ini`,
      positive: collectionRate >= 80,
      icon: Percent,
      iconBg: collectionRate >= 80 ? "bg-green-50" : "bg-amber-50",
      iconColor: collectionRate >= 80 ? "text-green-500" : "text-amber-500",
      href: "/dashboard/invoices",
    },
    {
      label: "Lead Conversion",
      value: `${leadConversion}%`,
      sub: `${stats.convertedLeads} dari ${stats.totalLeads} leads`,
      positive: leadConversion >= 30,
      icon: Target,
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-500",
      href: "/dashboard/leads",
    },
    {
      label: "Churn Rate",
      value: `${churnRate}%`,
      sub: `${stats.inactiveThisMonth} inactive bulan ini`,
      positive: churnRate <= 5,
      icon: TrendingDown,
      iconBg: churnRate <= 5 ? "bg-green-50" : "bg-red-50",
      iconColor: churnRate <= 5 ? "text-green-500" : "text-red-500",
      href: "/dashboard/students",
    },
    {
      label: "Occupancy Rate",
      value: `${occupancyRate}%`,
      sub: `${stats.activeCourtsToday}/${stats.totalCourts} lapangan aktif`,
      positive: occupancyRate >= 50,
      icon: Building2,
      iconBg: "bg-orange-50",
      iconColor: "text-orange-500",
      href: "/dashboard/courts",
    },
    {
      label: "Coach Utilization",
      value: `${coachUtilization}%`,
      sub: `${stats.classesWithStudents}/${stats.totalClasses} kelas aktif`,
      positive: coachUtilization >= 70,
      icon: Activity,
      iconBg: "bg-teal-50",
      iconColor: "text-teal-500",
      href: "/dashboard/coaches",
    },
  ];

  return (
    <>
      <Header title="Dashboard" />
      <div className="flex flex-1 flex-col gap-5 p-5">

        {/* Alert: pending payments */}
        {stats.pendingPayments > 0 && (
          <Link href="/dashboard/payments" className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 hover:bg-amber-100 transition-colors group">
            <div className="p-1.5 bg-amber-100 rounded-lg">
              <AlertCircle className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-sm font-medium text-amber-700">
              {stats.pendingPayments} pembayaran menunggu verifikasi
            </p>
            <ArrowUpRight className="w-4 h-4 text-amber-500 ml-auto group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        )}

        {/* KPI Cards Row 1 */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => (
            <Link key={card.title} href={card.href}>
              <Card className="hover:shadow-md hover:border-orange-100 transition-all duration-200 cursor-pointer group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2.5 rounded-xl ${card.iconBg}`}>
                      <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-orange-400 transition-colors" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                    <p className="text-sm text-gray-500">{card.title}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Revenue + Court Status */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-blue-50 rounded-xl">
                  <Banknote className="w-4 h-4 text-blue-500" />
                </div>
                <span className="text-sm font-semibold text-gray-700">Pendapatan Bulan Ini</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-3">
                Rp {totalRev.toLocaleString("id-ID")}
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-400" />
                    <span className="text-xs text-gray-500">Akademi</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-700">Rp {academyRev.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="text-xs text-gray-500">Sewa Lapangan</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-700">Rp {rentalRev.toLocaleString("id-ID")}</span>
                </div>
                {prevTotalRev > 0 && (
                  <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-2">
                    <span className="text-xs text-gray-400">vs bulan lalu</span>
                    <span className={`text-xs font-semibold ${growthPct >= 0 ? "text-green-600" : "text-red-500"}`}>
                      {growthPct >= 0 ? "+" : ""}{growthPct}%
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-red-50 rounded-xl">
                  <TrendingUp className="w-4 h-4 text-red-500" />
                </div>
                <span className="text-sm font-semibold text-gray-700">Tagihan Belum Dibayar</span>
              </div>
              <p className="text-2xl font-bold text-red-500 mb-1">
                Rp {unpaidAmount.toLocaleString("id-ID")}
              </p>
              <p className="text-xs text-gray-400">{unpaidCount} invoice outstanding</p>
              <Link
                href="/dashboard/invoices"
                className="mt-4 flex items-center gap-1 text-xs font-medium text-orange-500 hover:text-orange-600 transition-colors"
              >
                Lihat semua invoice <ArrowUpRight className="w-3 h-3" />
              </Link>
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-orange-50 rounded-xl">
                  <Building2 className="w-4 h-4 text-orange-500" />
                </div>
                <span className="text-sm font-semibold text-gray-700">Status Lapangan</span>
              </div>
              <DashboardCourtStatus />
            </CardContent>
          </Card>
        </div>

        {/* BI KPIs Row */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-gray-400" />
            <p className="text-sm font-semibold text-gray-600">Business Intelligence</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {biKpis.map((kpi) => (
              <Link key={kpi.label} href={kpi.href}>
                <Card className="hover:shadow-md hover:border-orange-100 transition-all duration-200 cursor-pointer group h-full">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-1.5 rounded-lg ${kpi.iconBg}`}>
                        <kpi.icon className={`w-3.5 h-3.5 ${kpi.iconColor}`} />
                      </div>
                    </div>
                    <p className="text-xl font-bold text-gray-900">{kpi.value}</p>
                    <p className="text-xs font-medium text-gray-600 mt-0.5">{kpi.label}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">{kpi.sub}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Charts */}
        <DashboardCharts />
      </div>
    </>
  );
}

async function DashboardCourtStatus() {
  try {
    const now = new Date();
    const courts = await prisma.court.findMany({
      where: { isActive: true },
      select: {
        id: true, name: true,
        rentalBookings: {
          where: { status: { in: ["PENDING", "CONFIRMED"] }, startTime: { lte: now }, endTime: { gte: now } },
          select: { id: true },
        },
        courtSchedules: {
          where: { startTime: { lte: now }, endTime: { gte: now } },
          select: { id: true, type: true },
        },
      },
    });

    if (courts.length === 0) {
      return <p className="text-sm text-gray-400">Belum ada lapangan</p>;
    }

    const getStatus = (c: typeof courts[0]) => {
      const schedType = c.courtSchedules[0]?.type;
      if (schedType === "MAINTENANCE") return { label: "Perawatan", cls: "bg-red-50 text-red-600 border border-red-100" };
      if (schedType === "ACADEMY") return { label: "Latihan", cls: "bg-blue-50 text-blue-600 border border-blue-100" };
      if (c.rentalBookings.length > 0) return { label: "Disewa", cls: "bg-orange-50 text-orange-600 border border-orange-100" };
      return { label: "Tersedia", cls: "bg-green-50 text-green-600 border border-green-100" };
    };

    return (
      <div className="space-y-2">
        {courts.map((c) => {
          const { label, cls } = getStatus(c);
          return (
            <div key={c.id} className="flex items-center justify-between">
              <span className="text-sm text-gray-700 font-medium truncate mr-2">{c.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${cls}`}>{label}</span>
            </div>
          );
        })}
      </div>
    );
  } catch {
    return <p className="text-sm text-gray-400">Tidak dapat memuat data</p>;
  }
}
