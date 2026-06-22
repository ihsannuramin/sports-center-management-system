"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, UserCheck, BookOpen, ClipboardCheck,
  Star, FileText, CreditCard, Building2, Calendar,
  Package, LogOut, GitBranch, ChevronRight,
  Bell, ShieldCheck, Activity, Settings, Wallet, BarChart3,
  Wrench, Box, FolderOpen, Tags, UserPlus, Target, FlaskConical,
  Clock, CreditCard as MembershipIcon, Percent, Users2, Baby,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";

const menuItems = [
  {
    group: "Utama",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
    ],
  },
  {
    group: "Akademi",
    items: [
      { href: "/dashboard/students", label: "Siswa", icon: Users },
      { href: "/dashboard/coaches", label: "Pelatih", icon: UserCheck },
      { href: "/dashboard/classes", label: "Kelas", icon: BookOpen },
      { href: "/dashboard/attendance", label: "Absensi", icon: ClipboardCheck },
      { href: "/dashboard/assessments", label: "Penilaian", icon: Star },
      { href: "/dashboard/trial-classes", label: "Trial Kelas", icon: FlaskConical },
    ],
  },
  {
    group: "CRM & Prospek",
    items: [
      { href: "/dashboard/leads", label: "Prospek (Leads)", icon: Target },
      { href: "/dashboard/parents", label: "Data Orang Tua", icon: Baby },
      { href: "/dashboard/waitlists", label: "Waiting List", icon: Clock },
    ],
  },
  {
    group: "Keuangan",
    items: [
      { href: "/dashboard/invoices", label: "Invoice", icon: FileText },
      { href: "/dashboard/payments", label: "Pembayaran", icon: CreditCard },
      { href: "/dashboard/expenses", label: "Pengeluaran", icon: Wallet },
      { href: "/dashboard/payroll", label: "Payroll Pelatih", icon: Users2 },
      { href: "/dashboard/reports", label: "Laporan Keuangan", icon: BarChart3 },
    ],
  },
  {
    group: "Lapangan & Sewa",
    items: [
      { href: "/dashboard/courts", label: "Lapangan", icon: Building2 },
      { href: "/dashboard/rentals", label: "Sewa Lapangan", icon: Calendar },
      { href: "/dashboard/memberships", label: "Membership & Paket", icon: MembershipIcon },
      { href: "/dashboard/promos", label: "Promo & Diskon", icon: Percent },
    ],
  },
  {
    group: "Operasional",
    items: [
      { href: "/dashboard/inventory", label: "Inventaris", icon: Package },
      { href: "/dashboard/maintenance", label: "Maintenance", icon: Wrench },
      { href: "/dashboard/assets", label: "Aset", icon: Box },
      { href: "/dashboard/documents", label: "Dokumen", icon: FolderOpen },
    ],
  },
  {
    group: "Manajemen",
    items: [
      { href: "/dashboard/branches", label: "Cabang", icon: GitBranch },
      { href: "/dashboard/approvals", label: "Persetujuan", icon: ShieldCheck },
      { href: "/dashboard/notifications", label: "Notifikasi", icon: Bell },
    ],
  },
  {
    group: "Sistem",
    items: [
      { href: "/dashboard/users", label: "Pengguna & Akses", icon: UserPlus },
      { href: "/dashboard/activity-log", label: "Log Aktivitas", icon: Activity },
      { href: "/dashboard/settings", label: "Pengaturan", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
    router.refresh();
  }

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <Sidebar className="border-r border-gray-50">
      {/* Header */}
      <SidebarHeader className="px-4 py-4 border-b border-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md shadow-orange-200 flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.5" />
              <path d="M12 2C12 2 8 7 8 12C8 17 12 22 12 22" stroke="white" strokeWidth="1.5" />
              <path d="M12 2C12 2 16 7 16 12C16 17 12 22 12 22" stroke="white" strokeWidth="1.5" />
              <path d="M2 12H22" stroke="white" strokeWidth="1.5" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm text-gray-900 leading-tight tracking-tight">Sports Center</p>
            <p className="text-[10px] text-gray-500 font-semibold tracking-widest uppercase mt-0.5">
              Management
            </p>
          </div>
        </div>
      </SidebarHeader>

      {/* Nav */}
      <SidebarContent className="px-2 py-2 overflow-y-auto">
        {menuItems.map((group, gi) => (
          <SidebarGroup key={group.group} className={gi === 0 ? "" : "mt-1"}>
            {group.group !== "Utama" && (
              <SidebarGroupLabel className="text-[10px] font-bold tracking-widest text-gray-500/80 uppercase px-3 mb-0.5 mt-2 select-none">
                {group.group}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href, (item as any).exact);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        render={<Link href={item.href} />}
                        isActive={active}
                        className={[
                          "relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 w-full",
                          active
                            ? "bg-orange-50 text-orange-500 before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-[18px] before:w-0.5 before:rounded-r-full before:bg-orange-500"
                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-900",
                        ].join(" ")}
                      >
                        <item.icon
                          className={`w-[15px] h-[15px] flex-shrink-0 ${active ? "text-orange-500" : "text-gray-500"}`}
                          aria-hidden="true"
                        />
                        <span className="flex-1 truncate">{item.label}</span>
                        {active && (
                          <ChevronRight className="w-3 h-3 text-orange-500/70 ml-auto flex-shrink-0" />
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="px-3 py-3 border-t border-gray-50">
        <button
          onClick={handleLogout}
          aria-label="Keluar dari sistem"
          className="flex items-center gap-2.5 text-sm text-gray-500 hover:text-red-500 transition-all duration-150 w-full px-3 py-2 rounded-lg hover:bg-red-50 group"
        >
          <LogOut className="w-[15px] h-[15px] flex-shrink-0 group-hover:text-red-500 transition-colors" />
          <span className="font-medium">Keluar</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
