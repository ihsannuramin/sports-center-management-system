"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Bell, Plus, Search, CheckCheck, Trash2, Mail, MessageSquare, Smartphone, Loader2 } from "lucide-react";
import { createNotification, markAsRead, markAllAsRead, deleteNotification } from "@/app/actions/notifications";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface Props { notifications: any[]; }

const CHANNEL_ICONS: Record<string, any> = {
  IN_APP: Smartphone, EMAIL: Mail, WHATSAPP: MessageSquare,
};
const CHANNEL_COLORS: Record<string, string> = {
  IN_APP: "bg-blue-50 text-blue-500",
  EMAIL: "bg-purple-50 text-purple-500",
  WHATSAPP: "bg-green-50 text-green-500",
};
const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700",
  SENT: "bg-blue-50 text-blue-700",
  FAILED: "bg-destructive/10 text-destructive",
  READ: "bg-muted/50 text-muted-foreground",
};
const NOTIF_TYPES = [
  "INVOICE_CREATED", "INVOICE_DUE", "INVOICE_OVERDUE", "INVOICE_PAID",
  "BOOKING_CREATED", "BOOKING_CONFIRMED", "BOOKING_CANCELLED",
  "CLASS_RESCHEDULED", "COACH_REPLACEMENT", "STUDENT_SUSPENSION",
];
const emptyForm = { type: "INVOICE_CREATED", channel: "IN_APP", title: "", message: "" };
const PAGE_SIZE = 20;

export function NotificationsClient({ notifications: initial }: Props) {
  const notifications = initial;
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const filtered = notifications.filter((n) => {
    const q = search.toLowerCase();
    const matchSearch = !q || n.title?.toLowerCase().includes(q) || n.message?.toLowerCase().includes(q) || n.type?.toLowerCase().includes(q);
    const matchChannel = !channelFilter || n.channel === channelFilter;
    return matchSearch && matchChannel;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const unreadCount = notifications.filter(n => n.status !== "READ").length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try {
      await createNotification({ type: form.type as any, channel: form.channel as any, title: form.title, message: form.message });
      toast.success("Notifikasi dibuat");
      setOpen(false); window.location.reload();
    } catch (err: any) { toast.error(err.message); }
    setLoading(false);
  }

  async function handleMarkRead(id: string) {
    await markAsRead(id);
    toast.success("Ditandai sudah dibaca");
    window.location.reload();
  }

  async function handleMarkAllRead() {
    await markAllAsRead("system");
    toast.success("Semua ditandai sudah dibaca");
    window.location.reload();
  }

  async function handleDelete(id: string) {
    await deleteNotification(id);
    toast.success("Notifikasi dihapus");
    window.location.reload();
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-neutral shadow-sm"><CardContent className="p-4"><p className="text-xs text-muted-foreground mb-1">Total</p><p className="text-2xl font-bold text-on-surface">{notifications.length}</p></CardContent></Card>
        <Card className="border-neutral shadow-sm"><CardContent className="p-4"><p className="text-xs text-muted-foreground mb-1">Belum Dibaca</p><p className="text-2xl font-bold text-primary">{unreadCount}</p></CardContent></Card>
        <Card className="border-neutral shadow-sm"><CardContent className="p-4"><p className="text-xs text-muted-foreground mb-1">Terkirim</p><p className="text-2xl font-bold text-blue-600">{notifications.filter(n => n.status === "SENT").length}</p></CardContent></Card>
        <Card className="border-neutral shadow-sm"><CardContent className="p-4"><p className="text-xs text-muted-foreground mb-1">Gagal</p><p className="text-2xl font-bold text-destructive">{notifications.filter(n => n.status === "FAILED").length}</p></CardContent></Card>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-10 rounded-xl"><Bell className="w-5 h-5 text-primary" /></div>
          <div><h2 className="font-semibold text-on-surface">Notification Center</h2><p className="text-xs text-muted-foreground">{notifications.length} total notifikasi</p></div>
        </div>
        <div className="flex gap-2 items-center">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" className="h-9 border-border text-foreground" onClick={handleMarkAllRead}><CheckCheck className="w-4 h-4 mr-1.5" /> Tandai Semua</Button>
          )}
          <Button size="sm" className="h-9 bg-primary hover:bg-primary-80 shadow-sm shadow-primary/20" onClick={() => { setForm(emptyForm); setOpen(true); }}><Plus className="w-4 h-4 mr-1.5" /> Buat Notifikasi</Button>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Cari notifikasi..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9 h-9 border-border text-sm" />
        </div>
        <select value={channelFilter} onChange={(e) => { setChannelFilter(e.target.value); setPage(1); }} className="h-9 px-3 border border-border rounded-lg text-sm text-foreground bg-surface">
          <option value="">Semua Channel</option>
          <option value="IN_APP">In App</option>
          <option value="EMAIL">Email</option>
          <option value="WHATSAPP">WhatsApp</option>
        </select>
      </div>

      {paginated.length === 0 ? (
        <div className="text-center py-16"><Bell className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" /><p className="text-sm text-muted-foreground">Belum ada notifikasi</p></div>
      ) : (
        <div className="space-y-2">
          {paginated.map((notif) => {
            const ChannelIcon = CHANNEL_ICONS[notif.channel] ?? Bell;
            return (
              <Card key={notif.id} className={`border-neutral shadow-sm hover:shadow-md transition-all ${notif.status === "READ" ? "opacity-70" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl flex-shrink-0 ${CHANNEL_COLORS[notif.channel] ?? "bg-muted/50 text-tertiary"}`}>
                      <ChannelIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-on-surface text-sm">{notif.title}</p>
                          <p className="text-xs text-tertiary mt-0.5">{notif.message}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[notif.status]}`}>{notif.status}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="bg-muted/50 px-2 py-0.5 rounded text-tertiary">{notif.type}</span>
                        {notif.user && <span>· {notif.user.name}</span>}
                        <span className="ml-auto">{format(new Date(notif.createdAt), "dd MMM yyyy HH:mm", { locale: id })}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {notif.status !== "READ" && (
                        <button type="button" onClick={() => handleMarkRead(notif.id)} title="Tandai Sudah Dibaca" className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-blue-50 text-muted-foreground hover:text-blue-500 transition-colors cursor-pointer"><CheckCheck className="w-4 h-4" /></button>
                      )}
                      <button type="button" onClick={() => handleDelete(notif.id)} title="Hapus" className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" className="h-8 border-border" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Sebelumnya</Button>
          <span className="text-sm text-tertiary">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" className="h-8 border-border" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Berikutnya</Button>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Buat Notifikasi</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Tipe *</Label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full h-9 border border-border rounded-lg px-3 text-sm bg-surface">
                  {NOTIF_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Channel *</Label>
                <select value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })} className="w-full h-9 border border-border rounded-lg px-3 text-sm bg-surface">
                  <option value="IN_APP">In App</option>
                  <option value="EMAIL">Email</option>
                  <option value="WHATSAPP">WhatsApp</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-foreground">Judul *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-foreground">Pesan *</Label><textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required rows={3} className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-none" /></div>
            <div className="flex justify-end gap-2 pt-2 border-t border-neutral">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-primary hover:bg-primary-80" disabled={loading}>{loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Mengirim...</> : "Buat & Kirim"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
