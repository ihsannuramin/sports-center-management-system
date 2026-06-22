"use client";

import { useEffect, useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, User } from "lucide-react";

const roleLabels: Record<string, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  COACH: "Pelatih",
  STAFF: "Staff",
};

export function Header({ title }: { title: string }) {
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then(({ user }) => {
        if (user?.email) setUserEmail(user.email);
        if (user?.role) setUserRole(user.role);
      })
      .catch(() => {});
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
    router.refresh();
  }

  const initials = userEmail
    ? userEmail.slice(0, 2).toUpperCase()
    : "AD";

  const displayEmail =
    userEmail.length > 24 ? userEmail.slice(0, 24) + "…" : userEmail;

  const roleLabel = roleLabels[userRole] || userRole || "";

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 bg-white/95 backdrop-blur-md border-b border-gray-50 px-4">
      {/* Sidebar toggle */}
      <SidebarTrigger
        className="-ml-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
        aria-label="Toggle sidebar"
      />
      <div className="h-4 w-px bg-gray-200" />

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1 className="font-semibold text-gray-900 text-[15px] truncate leading-tight">
          {title}
        </h1>
      </div>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50"
              aria-label="Menu pengguna"
            />
          }
        >
          <Avatar className="h-7 w-7 ring-2 ring-orange-400-10">
            <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:flex flex-col items-start">
            <span className="text-xs font-semibold text-gray-900 leading-tight max-w-[120px] truncate">
              {displayEmail}
            </span>
            {roleLabel && (
              <span className="text-[10px] text-gray-500 leading-tight">
                {roleLabel}
              </span>
            )}
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-gray-500 hidden sm:block" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-52">
          {/* User info header */}
          <div className="px-3 py-2.5">
            <p className="text-xs font-semibold text-gray-900 truncate">{userEmail}</p>
            {roleLabel && (
              <span className="inline-flex items-center mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-orange-50 text-orange-500">
                {roleLabel}
              </span>
            )}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            className="text-red-500 hover:bg-red-50 cursor-pointer gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            Keluar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
