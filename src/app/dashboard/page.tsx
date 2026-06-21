export const dynamic = "force-dynamic";

import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
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
      prevAcademyRevenue, prevRentalRevenue, inactiveThisMonth,
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

function formatRupiah(amount: number) {
  if (amount >= 1_000_000_000) return `Rp ${(amount / 1_000_000_000).toFixed(1)}M`;
  if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1)}jt`;
  return `Rp ${amount.toLocaleString("id-ID")}`;
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

  const churnRate = stats.activeStudents > 0
    ? Math.round((stats.inactiveThisMonth / (stats.activeStudents + stats.inactiveThisMonth)) * 100)
    : 0;
  const collectionRate = pct(stats.paidInvoicesMonth, stats.totalInvoicesMonth);
  const leadConversion = pct(stats.convertedLeads, stats.totalLeads);
  const occupancyRate = stats.totalCourts > 0 ? pct(stats.activeCourtsToday, stats.totalCourts) : 0;
  const coachUtilization = stats.totalClasses > 0 ? pct(stats.classesWithStudents, stats.totalClasses) : 0;

  // Format current date in Indonesian
  const now = new Date();
  const dateStr = now.toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const statCards = [
    { title: "Siswa Aktif", value: stats.activeStudents, icon: Users, iconBg: "bg-blue-50", iconColor: "text-blue-500", border: "border-blue-300", href: "/dashboard/students" },
    { title: "Pelatih Aktif", value: stats.activeCoaches, icon: UserCheck, iconBg: "bg-green-50", iconColor: "text-green-500", border: "border-green-300", href: "/dashboard/coaches" },
    { title: "Absensi Hari Ini", value: stats.todayAttendance, icon: ClipboardCheck, iconBg: "bg-primary-10", iconColor: "text-primary", border: "border-orange-300", href: "/dashboard/attendance" },
    { title: "Booking Hari Ini", value: stats.todayBookings, icon: Calendar, iconBg: "bg-purple-50", iconColor: "text-purple-500", border: "border-purple-300", href: "/dashboard/rentals" },
  ];

  const biKpis = [
    {
      label: "Revenue Growth",
      value: `${growthPct > 0 ? "+" : ""}${growthPct}%`,
      sub: "vs bulan lalu",
      positive: growthPct >= 0,
      icon: TrendingUp,
      iconBg: growthPct >= 0 ? "bg-green-50" : "bg-destructive/10",
      iconColor: growthPct >= 0 ? "text-green-500" : "text-destructive",
      href: "/dashboard/reports",
    },
    {
      label: "Collection Rate",
      value: `${collectionRate}%`,
      sub: `${stats.paidInvoicesMonth}/${stats.totalInvoicesMonth} invoice`,
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
      sub: `${stats.inactiveThisMonth} inactive`,
      positive: churnRate <= 5,
      icon: TrendingDown,
      iconBg: churnRate <= 5 ? "bg-green-50" : "bg-destructive/10",
      iconColor: churnRate <= 5 ? "text-green-500" : "text-destructive",
      href: "/dashboard/students",
    },
    {
      label: "Occupancy Rate",
      value: `${occupancyRate}%`,
      sub: `${stats.activeCourtsToday}/${stats.totalCourts} lapangan`,
      positive: occupancyRate >= 50,
      icon: Building2,
      iconBg: "bg-primary-10",
      iconColor: "text-primary",
      href: "/dashboard/courts",
    },
    {
      label: "Coach Utilization",
      value: `${coachUtilization}%`,
      sub: `${stats.classesWithStudents}/${stats.totalClasses} kelas`,
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

        {/* Date strip */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground capitalize">{dateStr}</p>
        </div>

        {/* Alert: pending payments */}
        {stats.pendingPayments > 0 && (
          <Link
            href="/dashboard/payments"
            className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 hover:bg-amber-100 transition-colors group"
          >
            <div className="p-1.5 bg-amber-100 rounded-lg flex-shrink-0">
              <AlertCircle className="w-4 h-4 text-amber-600" aria-hidden="true" />
            </div>
            <p className="text-sm font-medium text-amber-700 flex-1">
              {stats.pendingPayments} pembayaran menunggu verifikasi
            </p>
            <ArrowUpRight className="w-4 h-4 text-amber-500 flex-shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        )}

        {/* ── Bagian 1: KPI Utama ── */}
        <div>
          <p className="section-label mb-3">Ikhtisar Hari Ini</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((card) => (
              <Link key={card.title} href={card.href}>
                <Card className={`card-hover cursor-pointer group border ${card.border} h-full`}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-2.5 rounded-xl ${card.iconBg}`}>
                        <card.icon className={`w-5 h-5 ${card.iconColor}`} aria-hidden="true" />
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-2xl font-bold text-on-surface tabular-nums">{card.value}</p>
                      <p className="text-sm text-tertiary">{card.title}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Bagian 2: Keuangan + Status ── */}
        <div>
          <p className="section-label mb-3">Keuangan & Lapangan</p>
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Revenue card */}
            <Card className="lg:col-span-1 border-neutral">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-blue-50 rounded-xl">
                    <Banknote className="w-4 h-4 text-blue-500" aria-hidden="true" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">Pendapatan Bulan Ini</span>
                </div>
                <p className="text-2xl font-bold text-on-surface mb-3 tabular-nums">
                  {formatRupiah(totalRev)}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
                      <span className="text-xs text-tertiary">Akademi</span>
                    </div>
                    <span className="text-xs font-semibold text-foreground tabular-nums">
                      {formatRupiah(academyRev)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                      <span className="text-xs text-tertiary">Sewa Lapangan</span>
                    </div>
                    <span className="text-xs font-semibold text-foreground tabular-nums">
                      {formatRupiah(rentalRev)}
                    </span>
                  </div>
                  {prevTotalRev > 0 && (
                    <div className="flex items-center justify-between pt-2 border-t border-neutral mt-2">
                      <span className="text-xs text-muted-foreground">vs bulan lalu</span>
                      <span className={`text-xs font-semibold tabular-nums ${growthPct >= 0 ? "text-green-600" : "text-destructive"}`}>
                        {growthPct >= 0 ? "+" : ""}{growthPct}%
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Unpaid invoices */}
            <Card className="lg:col-span-1 border-neutral">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-destructive/10 rounded-xl">
                    <TrendingUp className="w-4 h-4 text-destructive" aria-hidden="true" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">Tagihan Belum Dibayar</span>
                </div>
                <p className="text-2xl font-bold text-destructive mb-1 tabular-nums">
                  {formatRupiah(unpaidAmount)}
                </p>
                <p className="text-xs text-muted-foreground">{unpaidCount} invoice outstanding</p>
                <Link
                  href="/dashboard/invoices"
                  className="mt-4 flex items-center gap-1 text-xs font-medium text-primary hover:text-primary transition-colors"
                >
                  Lihat semua invoice <ArrowUpRight className="w-3 h-3" />
                </Link>
              </CardContent>
            </Card>

            {/* Court status */}
            <Card className="lg:col-span-1 border-neutral">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-primary-10 rounded-xl">
                    <Building2 className="w-4 h-4 text-primary" aria-hidden="true" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">Status Lapangan</span>
                </div>
                <DashboardCourtStatus />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ── Bagian 3: Business Intelligence ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <p className="section-label">Business Intelligence</p>
            <BarChart3 className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {biKpis.map((kpi) => (
              <Link key={kpi.label} href={kpi.href}>
                <Card className="card-hover cursor-pointer group h-full">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2.5">
                      <div className={`p-1.5 rounded-lg ${kpi.iconBg}`}>
                        <kpi.icon className={`w-3.5 h-3.5 ${kpi.iconColor}`} aria-hidden="true" />
                      </div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${kpi.positive ? "bg-green-50 text-green-600" : "bg-destructive/10 text-destructive"}`}>
                        {kpi.positive ? "Baik" : "Perhatian"}
                      </span>
                    </div>
                    <p className="text-xl font-bold text-on-surface tabular-nums">{kpi.value}</p>
                    <p className="text-xs font-semibold text-foreground mt-0.5">{kpi.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{kpi.sub}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Bagian 4: Charts ── */}
        <div>
          <p className="section-label mb-3">Tren & Analitik</p>
          <DashboardCharts />
        </div>

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
      return (
        <div className="flex flex-col items-center gap-1.5 py-4 text-center">
          <Building2 className="w-8 h-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Belum ada lapangan</p>
        </div>
      );
    }

    const getStatus = (c: typeof courts[0]) => {
      const schedType = c.courtSchedules[0]?.type;
      if (schedType === "MAINTENANCE") return { label: "Perawatan", cls: "bg-destructive/10 text-destructive border border-destructive/20" };
      if (schedType === "ACADEMY") return { label: "Latihan", cls: "bg-blue-50 text-blue-600 border border-blue-100" };
      if (c.rentalBookings.length > 0) return { label: "Disewa", cls: "bg-primary-10 text-primary border border-primary-20" };
      return { label: "Tersedia", cls: "bg-green-50 text-green-600 border border-green-100" };
    };

    return (
      <div className="space-y-2">
        {courts.map((c) => {
          const { label, cls } = getStatus(c);
          return (
            <div key={c.id} className="flex items-center justify-between gap-2">
              <span className="text-sm text-foreground font-medium truncate">{c.name}</span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${cls}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    );
  } catch {
    return <p className="text-sm text-muted-foreground">Tidak dapat memuat data</p>;
  }
}
