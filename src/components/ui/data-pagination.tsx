"use client";

import { Button } from "./button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DataPaginationProps {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function DataPagination({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: DataPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/40">
      {/* Left: page size + count */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span className="hidden sm:inline">Tampilkan</span>
        <Select
          value={String(pageSize)}
          onValueChange={(v) => {
            if (v) {
              onPageSizeChange(Number(v));
              onPageChange(1);
            }
          }}
        >
          <SelectTrigger className="h-7 w-14 text-xs border-gray-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>
        <span className="hidden sm:inline">baris</span>
        {total > 0 && (
          <span className="ml-1 text-gray-400 tabular-nums">
            {start}–{end} dari <span className="font-medium text-gray-600">{total}</span>
          </span>
        )}
        {total === 0 && (
          <span className="ml-1 text-gray-400">Tidak ada data</span>
        )}
      </div>

      {/* Right: prev/next */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7 border-gray-200 text-gray-500 hover:text-gray-900"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </Button>
        <span className="min-w-[4rem] text-center text-xs text-gray-500 tabular-nums select-none">
          {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7 border-gray-200 text-gray-500 hover:text-gray-900"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Halaman berikutnya"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
