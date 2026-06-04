"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckSquare, Search, CheckCircle, XCircle, Clock, Filter } from "lucide-react";
import { approveRequest, rejectRequest } from "@/app/actions/approvals";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface Props { requests: any[]; }

const TYPE_LABELS: Record<string, string> = {
  REFUND: "Refund",
  INVOICE_CANCELLATION: "Pembatalan Invoice",
  MANUAL_DISCOUNT: "Diskon Manual",
  INVENTORY_ADJUSTMENT: "Penyesuaian Inventaris",
  BOOKING_CANCELLATION: "Pembatalan Booking",
};
const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700",
  APPROVED: "bg-green-50 text-green-700",
  REJECTED: "bg-red-50 text-red-700",
};
const PAGE_SIZE = 15;

export function ApprovalsClient({ requests: initial }: Props) {
  const [requests] = useState(initial);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [noteDialog, setNoteDialog] = useState<{ id: string; action: "approve" | "reject" } | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [page, setPage] = useState(1);

  const filtered = requests.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.type?.toLowerCase().includes(q) || r.requester?.name?.toLowerCase().includes(q) || r.reason?.toLowerCase().includes(q);
    const matchStatus = !statusFilter || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const pendingCount = requests.filter(r => r.status === "PENDING").length;

  async function handleAction() {
    if (!noteDialog) return;
    try {
      if (noteDialog.action === "approve") {
        await approveRequest(noteDialog.id, "system", reviewNote);
        toast.success("Request disetujui");
      } else {
        await rejectRequest(noteDialog.id, "system", reviewNote);
        toast.error("Request ditolak");
      }
      setNoteDialog(null); setReviewNote("");
      window.location.reload();
    } catch (err: any) { toast.error(err.message); }
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-gray-100 shadow-sm"><CardContent className="p-4"><p className="text-xs text-gray-400 mb-1">Menunggu Persetujuan</p><p className="text-2xl font-bold text-yellow-600">{pendingCount}</p></CardContent></Card>
        <Card className="border-gray-100 shadow-sm"><CardContent className="p-4"><p className="text-xs text-gray-400 mb-1">Disetujui</p><p className="text-2xl font-bold text-green-600">{requests.filter(r => r.status === "APPROVED").length}</p></CardContent></Card>
        <Card className="border-gray-100 shadow-sm"><CardContent className="p-4"><p className="text-xs text-gray-400 mb-1">Ditolak</p><p className="text-2xl font-bold text-red-500">{requests.filter(r => r.status === "REJECTED").length}</p></CardContent></Card>
      </div>

      <div className="flex items-center gap-3">
        <div className="p-2 bg-orange-50 rounded-xl"><CheckSquare className="w-5 h-5 text-orange-500" /></div>
        <div><h2 className="font-semibold text-gray-900">Approval Workflow</h2><p className="text-xs text-gray-400">{requests.length} total request</p></div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Cari request..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9 h-9 border-gray-200 text-sm" />
        </div>
        <div className="flex gap-1 bg-gray-100/80 rounded-lg p-1">
          {["", "PENDING", "APPROVED", "REJECTED"].map((s) => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }} className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${statusFilter === s ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
              {s || "Semua"}
            </button>
          ))}
        </div>
      </div>

      {paginated.length === 0 ? (
        <div className="text-center py-16"><CheckSquare className="w-10 h-10 text-gray-200 mx-auto mb-3" /><p className="text-sm text-gray-400">Tidak ada approval request</p></div>
      ) : (
        <div className="space-y-3">
          {paginated.map((req) => (
            <Card key={req.id} className="border-gray-100 shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-900">{TYPE_LABELS[req.type] ?? req.type}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[req.status]}`}>{req.status}</span>
                    </div>
                    {req.reason && <p className="text-xs text-gray-600 mb-1">{req.reason}</p>}
                    {req.amount && <p className="text-xs font-semibold text-orange-500">Rp {Number(req.amount).toLocaleString("id-ID")}</p>}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      {req.requester && <span>Oleh: {req.requester.name}</span>}
                      {req.approver && <span>· Diproses: {req.approver.name}</span>}
                      <span className="ml-auto">{format(new Date(req.createdAt), "dd MMM yyyy HH:mm", { locale: id })}</span>
                    </div>
                    {req.reviewNote && (
                      <div className="mt-2 bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-600">
                        <span className="font-medium">Catatan: </span>{req.reviewNote}
                      </div>
                    )}
                  </div>
                  {req.status === "PENDING" && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => { setNoteDialog({ id: req.id, action: "approve" }); setReviewNote(""); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-xs font-medium">
                        <CheckCircle className="w-4 h-4" /> Setuju
                      </button>
                      <button onClick={() => { setNoteDialog({ id: req.id, action: "reject" }); setReviewNote(""); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors text-xs font-medium">
                        <XCircle className="w-4 h-4" /> Tolak
                      </button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" className="h-8 border-gray-200" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Sebelumnya</Button>
          <span className="text-sm text-gray-500">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" className="h-8 border-gray-200" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Berikutnya</Button>
        </div>
      )}

      <Dialog open={!!noteDialog} onOpenChange={() => setNoteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{noteDialog?.action === "approve" ? "Setujui Request" : "Tolak Request"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">Catatan Review</Label><Input value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} placeholder="Catatan tambahan (opsional)" /></div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button variant="outline" onClick={() => setNoteDialog(null)}>Batal</Button>
              <Button className={noteDialog?.action === "approve" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"} onClick={handleAction}>
                {noteDialog?.action === "approve" ? "Setujui" : "Tolak"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
