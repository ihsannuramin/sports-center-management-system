"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Plus, Search, Users, Package } from "lucide-react";
import { createMembershipPlan, assignMembership, createRentalPackage, updateRentalPackage, updateMembershipPlan } from "@/app/actions/memberships";
import { toast } from "sonner";

interface Props { plans: any[]; memberships: any[]; packages: any[]; students: any[]; }

const MEMBERSHIP_TYPES = ["MONTHLY", "QUARTERLY", "SEMI_ANNUAL", "ANNUAL"];
const TYPE_LABELS: Record<string, string> = {
  MONTHLY: "Bulanan (30 hari)",
  QUARTERLY: "Triwulan (90 hari)",
  SEMI_ANNUAL: "Semi Tahunan (180 hari)",
  ANNUAL: "Tahunan (365 hari)",
};
const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-50 text-green-700",
  EXPIRED: "bg-destructive/10 text-destructive",
  CANCELLED: "bg-muted/50 text-tertiary",
};

export function MembershipsClient({ plans, memberships, packages, students }: Props) {
  const [planOpen, setPlanOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [pkgOpen, setPkgOpen] = useState(false);
  const [planForm, setPlanForm] = useState({ name: "", type: "MONTHLY", durationDays: "30", price: "", description: "" });
  const [assignForm, setAssignForm] = useState({ studentId: "", planId: "", startDate: "", autoRenew: false });
  const [pkgForm, setPkgForm] = useState({ name: "", hours: "", price: "", validDays: "365", description: "" });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const filteredMemberships = memberships.filter((m) => {
    const q = search.toLowerCase();
    return !q || m.student?.name?.toLowerCase().includes(q) || m.plan?.name?.toLowerCase().includes(q);
  });

  async function handleCreatePlan(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try {
      await createMembershipPlan({
        name: planForm.name,
        type: planForm.type as any,
        durationDays: parseInt(planForm.durationDays),
        price: parseFloat(planForm.price),
        description: planForm.description || undefined,
      });
      toast.success("Paket membership dibuat");
      setPlanOpen(false); window.location.reload();
    } catch (err: any) { toast.error(err.message); }
    setLoading(false);
  }

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try {
      await assignMembership({
        studentId: assignForm.studentId,
        planId: assignForm.planId,
        startDate: assignForm.startDate,
        autoRenew: assignForm.autoRenew,
      });
      toast.success("Membership ditetapkan");
      setAssignOpen(false); window.location.reload();
    } catch (err: any) { toast.error(err.message); }
    setLoading(false);
  }

  async function handleCreatePackage(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try {
      await createRentalPackage({
        name: pkgForm.name,
        hours: parseInt(pkgForm.hours),
        price: parseFloat(pkgForm.price),
        validDays: parseInt(pkgForm.validDays),
        description: pkgForm.description || undefined,
      });
      toast.success("Paket rental dibuat");
      setPkgOpen(false); window.location.reload();
    } catch (err: any) { toast.error(err.message); }
    setLoading(false);
  }

  async function togglePlan(id: string, isActive: boolean) {
    await updateMembershipPlan(id, { isActive: !isActive });
    toast.success("Status diperbarui");
    window.location.reload();
  }

  async function togglePackage(id: string, isActive: boolean) {
    await updateRentalPackage(id, { isActive: !isActive });
    toast.success("Status diperbarui");
    window.location.reload();
  }

  return (
    <div className="space-y-5">
      <Tabs defaultValue="plans">
        <TabsList className="h-9 bg-muted/80">
          <TabsTrigger value="plans" className="text-xs px-4">Paket Akademi</TabsTrigger>
          <TabsTrigger value="active" className="text-xs px-4">Membership Aktif</TabsTrigger>
          <TabsTrigger value="rental" className="text-xs px-4">Paket Rental</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="mt-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-10 rounded-xl"><CreditCard className="w-5 h-5 text-primary" /></div>
              <div><h2 className="font-semibold text-on-surface">Paket Membership Akademi</h2><p className="text-xs text-muted-foreground">{plans.length} paket tersedia</p></div>
            </div>
            <Button size="sm" className="h-9 bg-primary hover:bg-primary-80 shadow-sm shadow-primary/20" onClick={() => setPlanOpen(true)}><Plus className="w-4 h-4 mr-1.5" /> Buat Paket</Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.id} className={`border-neutral shadow-sm ${!plan.isActive ? "opacity-60" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-on-surface">{plan.name}</p>
                      <p className="text-xs text-muted-foreground">{TYPE_LABELS[plan.type] ?? plan.type}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${plan.isActive ? "bg-green-50 text-green-700" : "bg-muted/50 text-tertiary"}`}>{plan.isActive ? "Aktif" : "Nonaktif"}</span>
                  </div>
                  <p className="text-xl font-bold text-primary mb-1">Rp {Number(plan.price).toLocaleString("id-ID")}</p>
                  <p className="text-xs text-muted-foreground mb-3">{plan._count?.studentMemberships ?? 0} siswa aktif</p>
                  <Button size="sm" variant="outline" className={`w-full h-7 text-xs ${plan.isActive ? "text-destructive border-destructive/20 hover:bg-destructive/10" : "text-green-600 border-green-100 hover:bg-green-50"}`} onClick={() => togglePlan(plan.id, plan.isActive)}>
                    {plan.isActive ? "Nonaktifkan" : "Aktifkan"}
                  </Button>
                </CardContent>
              </Card>
            ))}
            {plans.length === 0 && <div className="col-span-3 text-center py-12 text-sm text-muted-foreground">Belum ada paket membership</div>}
          </div>
        </TabsContent>

        <TabsContent value="active" className="mt-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-10 rounded-xl"><Users className="w-5 h-5 text-primary" /></div>
              <div><h2 className="font-semibold text-on-surface">Membership Siswa</h2><p className="text-xs text-muted-foreground">{memberships.length} total membership</p></div>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Cari siswa..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 w-48 border-border text-sm" />
              </div>
              <Button size="sm" className="h-9 bg-primary hover:bg-primary-80" onClick={() => setAssignOpen(true)}><Plus className="w-4 h-4 mr-1.5" /> Tetapkan</Button>
            </div>
          </div>
          <div className="rounded-xl border border-neutral overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-neutral">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-tertiary uppercase tracking-wide">Siswa</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-tertiary uppercase tracking-wide">Paket</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-tertiary uppercase tracking-wide">Mulai</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-tertiary uppercase tracking-wide">Berakhir</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-tertiary uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredMemberships.map((m) => (
                  <tr key={m.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3 font-medium text-on-surface">{m.student?.name}<p className="text-xs text-muted-foreground">{m.student?.studentNumber}</p></td>
                    <td className="px-4 py-3 text-foreground text-xs">{m.plan?.name} <br /><span className="text-muted-foreground">{m.plan?.type}</span></td>
                    <td className="px-4 py-3 text-xs text-tertiary">{new Date(m.startDate).toLocaleDateString("id-ID")}</td>
                    <td className="px-4 py-3 text-xs text-tertiary">{new Date(m.endDate).toLocaleDateString("id-ID")}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[m.status]}`}>{m.status}</span></td>
                  </tr>
                ))}
                {filteredMemberships.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">Belum ada membership aktif</td></tr>}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="rental" className="mt-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-10 rounded-xl"><Package className="w-5 h-5 text-primary" /></div>
              <div><h2 className="font-semibold text-on-surface">Paket Sewa Lapangan</h2><p className="text-xs text-muted-foreground">{packages.length} paket tersedia</p></div>
            </div>
            <Button size="sm" className="h-9 bg-primary hover:bg-primary-80 shadow-sm shadow-primary/20" onClick={() => setPkgOpen(true)}><Plus className="w-4 h-4 mr-1.5" /> Buat Paket</Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg) => (
              <Card key={pkg.id} className={`border-neutral shadow-sm ${!pkg.isActive ? "opacity-60" : ""}`}>
                <CardContent className="p-4">
                  <p className="font-semibold text-on-surface">{pkg.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{pkg.hours} jam · valid {pkg.validDays} hari</p>
                  <p className="text-xl font-bold text-primary mt-2 mb-3">Rp {Number(pkg.price).toLocaleString("id-ID")}</p>
                  {pkg.description && <p className="text-xs text-muted-foreground mb-3">{pkg.description}</p>}
                  <Button size="sm" variant="outline" className={`w-full h-7 text-xs ${pkg.isActive ? "text-destructive border-destructive/20 hover:bg-destructive/10" : "text-green-600 border-green-100 hover:bg-green-50"}`} onClick={() => togglePackage(pkg.id, pkg.isActive)}>
                    {pkg.isActive ? "Nonaktifkan" : "Aktifkan"}
                  </Button>
                </CardContent>
              </Card>
            ))}
            {packages.length === 0 && <div className="col-span-3 text-center py-12 text-sm text-muted-foreground">Belum ada paket rental</div>}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Membership Plan Dialog */}
      <Dialog open={planOpen} onOpenChange={setPlanOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Buat Paket Membership</DialogTitle></DialogHeader>
          <form onSubmit={handleCreatePlan} className="space-y-3 pt-1">
            <div className="space-y-1.5"><Label className="text-xs font-medium text-foreground">Nama Paket *</Label><Input value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Tipe *</Label>
                <select value={planForm.type} onChange={(e) => {
                  const durations: Record<string, string> = { MONTHLY: "30", QUARTERLY: "90", SEMI_ANNUAL: "180", ANNUAL: "365" };
                  setPlanForm({ ...planForm, type: e.target.value, durationDays: durations[e.target.value] ?? planForm.durationDays });
                }} className="w-full h-9 border border-border rounded-lg px-3 text-sm bg-surface">
                  {MEMBERSHIP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1.5"><Label className="text-xs font-medium text-foreground">Durasi (hari) *</Label><Input type="number" min="1" value={planForm.durationDays} onChange={(e) => setPlanForm({ ...planForm, durationDays: e.target.value })} required /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-foreground">Harga (Rp) *</Label><Input type="number" min="0" value={planForm.price} onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })} required /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-foreground">Deskripsi</Label><Input value={planForm.description} onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })} /></div>
            <div className="flex justify-end gap-2 pt-2 border-t border-neutral">
              <Button type="button" variant="outline" onClick={() => setPlanOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-primary hover:bg-primary-80" disabled={loading}>{loading ? "Menyimpan..." : "Simpan"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Membership Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tetapkan Membership ke Siswa</DialogTitle></DialogHeader>
          <form onSubmit={handleAssign} className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Siswa *</Label>
              <select value={assignForm.studentId} onChange={(e) => setAssignForm({ ...assignForm, studentId: e.target.value })} required className="w-full h-9 border border-border rounded-lg px-3 text-sm bg-surface">
                <option value="">Pilih Siswa</option>
                {students.map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.studentNumber})</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Paket *</Label>
              <select value={assignForm.planId} onChange={(e) => setAssignForm({ ...assignForm, planId: e.target.value })} required className="w-full h-9 border border-border rounded-lg px-3 text-sm bg-surface">
                <option value="">Pilih Paket</option>
                {plans.filter(p => p.isActive).map((p: any) => <option key={p.id} value={p.id}>{p.name} — Rp {Number(p.price).toLocaleString("id-ID")}</option>)}
              </select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-foreground">Tanggal Mulai *</Label><Input type="date" value={assignForm.startDate} onChange={(e) => setAssignForm({ ...assignForm, startDate: e.target.value })} required /></div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="autoRenew" checked={assignForm.autoRenew} onChange={(e) => setAssignForm({ ...assignForm, autoRenew: e.target.checked })} className="w-4 h-4 rounded border-foreground/20" />
              <Label htmlFor="autoRenew" className="text-xs font-medium text-foreground">Auto Renewal</Label>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-neutral">
              <Button type="button" variant="outline" onClick={() => setAssignOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-primary hover:bg-primary-80" disabled={loading}>{loading ? "Menyimpan..." : "Tetapkan"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Rental Package Dialog */}
      <Dialog open={pkgOpen} onOpenChange={setPkgOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Buat Paket Rental</DialogTitle></DialogHeader>
          <form onSubmit={handleCreatePackage} className="space-y-3 pt-1">
            <div className="space-y-1.5"><Label className="text-xs font-medium text-foreground">Nama Paket *</Label><Input value={pkgForm.name} onChange={(e) => setPkgForm({ ...pkgForm, name: e.target.value })} placeholder="Contoh: Paket 10 Jam" required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs font-medium text-foreground">Jumlah Jam *</Label><Input type="number" min="1" value={pkgForm.hours} onChange={(e) => setPkgForm({ ...pkgForm, hours: e.target.value })} required /></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium text-foreground">Valid (hari)</Label><Input type="number" min="1" value={pkgForm.validDays} onChange={(e) => setPkgForm({ ...pkgForm, validDays: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-foreground">Harga (Rp) *</Label><Input type="number" min="0" value={pkgForm.price} onChange={(e) => setPkgForm({ ...pkgForm, price: e.target.value })} required /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-foreground">Deskripsi</Label><Input value={pkgForm.description} onChange={(e) => setPkgForm({ ...pkgForm, description: e.target.value })} /></div>
            <div className="flex justify-end gap-2 pt-2 border-t border-neutral">
              <Button type="button" variant="outline" onClick={() => setPkgOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-primary hover:bg-primary-80" disabled={loading}>{loading ? "Menyimpan..." : "Simpan"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
