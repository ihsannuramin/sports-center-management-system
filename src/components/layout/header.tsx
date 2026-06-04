"use client";

import { useEffect, useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { Bell, ChevronDown } from "lucide-react";

export function Header({ title }: { title: string }) {
  const [userEmail, setUserEmail] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then(({ user }) => {
        if (user?.email) setUserEmail(user.email);
      })
      .catch(() => {});
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
    router.refresh();
  }

  const initials = userEmail.slice(0, 2).toUpperCase() || "AD";
  const displayEmail = userEmail.length > 22 ? userEmail.slice(0, 22) + "..." : userEmail;

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-4">
      <SidebarTrigger className="-ml-1 text-gray-400 hover:text-gray-700 transition-colors" />
      <div className="h-5 w-px bg-gray-200" />

      <div className="flex-1 min-w-0">
        <h1 className="font-semibold text-gray-900 text-[15px] truncate">{title}</h1>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger render={<button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-50 transition-colors" />}>
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-orange-500 text-white text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-[140px] truncate">
            {displayEmail}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs text-gray-500 truncate">{userEmail}</p>
          </div>
          <DropdownMenuItem
            onClick={handleLogout}
            className="text-red-500 hover:text-red-600 hover:bg-red-50 cursor-pointer mt-1"
          >
            Keluar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
