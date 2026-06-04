"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Activity, Search, Filter } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface Props { logs: any[]; total: number; }

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-50 text-green-700 border-green-100",
  UPDATE: "bg-blue-50 text-blue-700 border-blue-100",
  DELETE: "bg-red-50 text-red-700 border-red-100",
  VERIFY: "bg-purple-50 text-purple-700 border-purple-100",
  REJECT: "bg-red-50 text-red-700 border-red-100",
  LOGIN:  "bg-orange-50 text-orange-700 border-orange-100",
  LOGOUT: "bg-gray-50 text-gray-600 border-gray-100",
  EXPORT: "bg-teal-50 text-teal-700 border-teal-100",
  APPROVE:"bg-green-50 text-green-700 border-green-100",
};

const PAGE_SIZE = 20;

export function ActivityLogClient({ logs: initial, total }: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);

  const filtered = initial.filter((l) => {
    const q = search.toLowerCase();
    const matchSearch = !q || l.module?.toLowerCase().includes(q) || l.user?.name?.toLowerCase().includes(q) || l.action?.toLowerCase().includes(q) || l.note?.toLowerCase().includes(q);
    const matchFilter = !filter || l.action === filter;
    return matchSearch && matchFilter;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const actions = [...new Set(initial.map((l) => l.action))];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-50 rounded-xl"><Activity className="w-5 h-5 text-orange-500" /></div>
          <div>
            <h2 className="font-semibold text-gray-900">Log Aktivitas Sistem</h2>
            <p className="text-xs text-gray-400">{total} total aktivitas tercatat</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Cari modul, pengguna, aksi..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 h-9 border-gray-200 text-sm"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => { setFilter(e.target.value); setPage(1); }}
            className="h-9 pl-9 pr-3 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white appearance-none"
          >
            <option value="">Semua Aksi</option>
            {actions.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      {paginated.length === 0 ? (
        <div className="text-center py-16">
          <Activity className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Belum ada log aktivitas</p>
        </div>
      ) : (
        <div className="space-y-2">
          {paginated.map((log) => (
            <Card key={log.id} className="border-gray-100 shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <span className={`flex-shrink-0 text-xs px-2 py-1 rounded-md border font-medium ${ACTION_COLORS[log.action] ?? "bg-gray-50 text-gray-600 border-gray-100"}`}>
                    {log.action}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-900">{log.module}</span>
                      {log.note && <span className="text-xs text-gray-500 truncate">— {log.note}</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {log.user && <span className="text-xs text-gray-400">{log.user.name}</span>}
                      {log.ipAddress && <span className="text-xs text-gray-300">IP: {log.ipAddress}</span>}
                      <span className="text-xs text-gray-400 ml-auto">
                        {format(new Date(log.createdAt), "dd MMM yyyy HH:mm", { locale: id })}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Sebelumnya
          </button>
          <span className="text-sm text-gray-500 min-w-[4rem] text-center">{page} / {totalPages}</span>
          <button
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Berikutnya
          </button>
        </div>
      )}
    </div>
  );
}
