"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, UserCheck, BookOpen, ClipboardCheck,
  Star, FileText, CreditCard, Building2, Calendar, CalendarDays,
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
import { createClient } from "@/lib/supabase/client";
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
      { href: "/dashboard/schedule", label: "Kalender", icon: CalendarDays },
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
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <Sidebar className="border-r border-gray-100">
      <SidebarHeader className="px-4 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-sm shadow-orange-200 flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.5"/>
              <path d="M12 2C12 2 8 7 8 12C8 17 12 22 12 22" stroke="white" strokeWidth="1.5"/>
              <path d="M12 2C12 2 16 7 16 12C16 17 12 22 12 22" stroke="white" strokeWidth="1.5"/>
              <path d="M2 12H22" stroke="white" strokeWidth="1.5"/>
            </svg>
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm text-gray-900 leading-tight">Sports Center</p>
            <p className="text-xs text-gray-400 font-medium tracking-wide">MANAGEMENT</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        {menuItems.map((group) => (
          <SidebarGroup key={group.group} className="mb-1">
            <SidebarGroupLabel className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase px-3 mb-1">
              {group.group}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active = isActive(item.href, (item as any).exact);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        render={<Link href={item.href} />}
                        isActive={active}
                        className={`
                          relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150
                          ${active
                            ? "bg-orange-50 text-orange-600 before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-0.5 before:rounded-full before:bg-orange-500"
                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                          }
                        `}
                      >
                        <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-orange-500" : "text-gray-400"}`} />
                        <span className="flex-1">{item.label}</span>
                        {active && <ChevronRight className="w-3 h-3 text-orange-400 ml-auto" />}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="px-4 py-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 text-sm text-gray-400 hover:text-red-500 transition-colors duration-150 w-full px-2 py-2 rounded-lg hover:bg-red-50 group"
        >
          <LogOut className="w-4 h-4 group-hover:text-red-400" />
          <span className="font-medium">Keluar</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
