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
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 bg-surface/95 backdrop-blur-md border-b border-neutral px-4">
      {/* Sidebar toggle */}
      <SidebarTrigger
        className="-ml-1 text-tertiary hover:text-foreground hover:bg-muted rounded-md transition-colors"
        aria-label="Toggle sidebar"
      />
      <div className="h-4 w-px bg-border" />

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1 className="font-semibold text-on-surface text-[15px] truncate leading-tight">
          {title}
        </h1>
      </div>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              aria-label="Menu pengguna"
            />
          }
        >
          <Avatar className="h-7 w-7 ring-2 ring-primary-10">
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary-80 text-white text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:flex flex-col items-start">
            <span className="text-xs font-semibold text-on-surface leading-tight max-w-[120px] truncate">
              {displayEmail}
            </span>
            {roleLabel && (
              <span className="text-[10px] text-tertiary leading-tight">
                {roleLabel}
              </span>
            )}
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-tertiary hidden sm:block" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-52">
          {/* User info header */}
          <div className="px-3 py-2.5">
            <p className="text-xs font-semibold text-on-surface truncate">{userEmail}</p>
            {roleLabel && (
              <span className="inline-flex items-center mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary-10 text-primary">
                {roleLabel}
              </span>
            )}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            className="text-destructive hover:bg-destructive/10 cursor-pointer gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            Keluar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
