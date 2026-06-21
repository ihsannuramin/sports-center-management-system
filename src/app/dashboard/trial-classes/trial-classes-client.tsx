"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, Plus, Search, Users, Calendar, Trash2 } from "lucide-react";
import { createTrialClass, addTrialParticipant, updateParticipantStatus, getTrialParticipants, deleteTrialClass } from "@/app/actions/trial-classes";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface Props { trials: any[]; classes: any[]; }

const TRIAL_STATUSES = ["REGISTERED", "ATTENDED", "ABSENT", "CONVERTED"];
const STATUS_COLORS: Record<string, string> = {
  REGISTERED: "bg-yellow-50 text-yellow-700",
  ATTENDED: "bg-blue-50 text-blue-700",
  ABSENT: "bg-red-50 text-red-700",
  CONVERTED: "bg-green-50 text-green-700",
};
const emptyTrialForm = { classId: "", date: "", maxSlots: "5", notes: "" };
const emptyParticipantForm = { name: "", phone: "", email: "" };

export function TrialClassesClient({ trials: initial, classes }: Props) {
  const trials = initial;
  const [trialOpen, setTrialOpen] = useState(false);
  const [participantOpen, setParticipantOpen] = useState(false);
  const [selectedTrial, setSelectedTrial] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [trialForm, setTrialForm] = useState(emptyTrialForm);
  const [participantForm, setParticipantForm] = useState(emptyParticipantForm);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = trials.filter((t) => {
    const q = search.toLowerCase();
    return !q || t.class?.name?.toLowerCase().includes(q) || t.class?.branch?.name?.toLowerCase().includes(q);
  });

  async function openParticipants(trial: any) {
    setSelectedTrial(trial);
    const p = await getTrialParticipants(trial.id);
    setParticipants(p);
    setParticipantOpen(true);
  }

  async function handleCreateTrial(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try {
      await createTrialClass({ classId: trialForm.classId, date: trialForm.date, maxSlots: parseInt(trialForm.maxSlots), notes: trialForm.notes || undefined });
      toast.success("Kelas trial dibuat");
      setTrialOpen(false); window.location.reload();
    } catch (err: any) { toast.error(err.message); }
    setLoading(false);
  }

  async function handleAddParticipant(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try {
      await addTrialParticipant({ trialClassId: selectedTrial.id, name: participantForm.name, phone: participantForm.phone, email: participantForm.email || undefined });
      toast.success("Peserta ditambahkan");
      setParticipantForm(emptyParticipantForm);
      const p = await getTrialParticipants(selectedTrial.id);
      setParticipants(p);
      window.location.reload();
    } catch (err: any) { toast.error(err.message); }
    setLoading(false);
  }

  async function handleStatusChange(id: string, status: string) {
    await updateParticipantStatus(id, status as any);
    toast.success(`Status diubah ke ${status}`);
    if (selectedTrial) {
      const p = await getTrialParticipants(selectedTrial.id);
      setParticipants(p);
    }
    window.location.reload();
  }

  async function handleDeleteTrial(id: string) {
    if (!confirm("Hapus kelas trial ini?")) return;
    await deleteTrialClass(id);
    toast.success("Kelas trial dihapus");
    window.location.reload();
  }

  const totalTrials = trials.length;
  const totalParticipants = trials.reduce((s, t) => s + (t._count?.participants ?? 0), 0);
  const converted = 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-gray-100 shadow-sm"><CardContent className="p-4"><p className="text-xs text-gray-400 mb-1">Total Kelas Trial</p><p className="text-2xl font-bold text-gray-900">{totalTrials}</p></CardContent></Card>
        <Card className="border-gray-100 shadow-sm"><CardContent className="p-4"><p className="text-xs text-gray-400 mb-1">Total Peserta</p><p className="text-2xl font-bold text-blue-600">{totalParticipants}</p></CardContent></Card>
        <Card className="border-gray-100 shadow-sm"><CardContent className="p-4"><p className="text-xs text-gray-400 mb-1">Dikonversi</p><p className="text-2xl font-bold text-green-600">{converted}</p></CardContent></Card>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-50 rounded-xl"><GraduationCap className="w-5 h-5 text-orange-500" /></div>
          <div><h2 className="font-semibold text-gray-900">Kelas Trial</h2><p className="text-xs text-gray-400">{trials.length} kelas trial terdaftar</p></div>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Cari kelas..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 w-48 border-gray-200 text-sm" />
          </div>
          <Button size="sm" className="h-9 bg-orange-500 hover:bg-orange-600 shadow-sm shadow-orange-200" onClick={() => { setTrialForm(emptyTrialForm); setTrialOpen(true); }}><Plus className="w-4 h-4 mr-1.5" /> Buat Kelas Trial</Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16"><GraduationCap className="w-10 h-10 text-gray-200 mx-auto mb-3" /><p className="text-sm text-gray-400 mb-3">Belum ada kelas trial</p><Button size="sm" className="bg-orange-500 hover:bg-orange-600" onClick={() => { setTrialForm(emptyTrialForm); setTrialOpen(true); }}><Plus className="w-4 h-4 mr-1.5" /> Buat Kelas Trial</Button></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((trial) => (
            <Card key={trial.id} className="border-gray-100 shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">{trial.class?.name}</p>
                    <p className="text-xs text-gray-400">{trial.class?.branch?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-gray-900">{format(new Date(trial.date), "dd MMM yyyy", { locale: id })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                  <div className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {trial._count?.participants ?? 0} / {trial.maxSlots} peserta</div>
                </div>
                {trial.notes && <p className="text-xs text-gray-400 mb-3 truncate">{trial.notes}</p>}
                <div className="flex gap-3 pt-2 border-t border-gray-50">
                  <Button size="sm" variant="outline" className="flex-1 h-8 text-xs border-gray-200 cursor-pointer" onClick={() => openParticipants(trial)}><Users className="w-3.5 h-3.5 mr-1.5" /> Peserta</Button>
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-red-500 border-red-100 hover:bg-red-50 cursor-pointer" title="Hapus" onClick={() => handleDeleteTrial(trial.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Trial Dialog */}
      <Dialog open={trialOpen} onOpenChange={setTrialOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Buat Kelas Trial</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateTrial} className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Kelas *</Label>
              <select value={trialForm.classId} onChange={(e) => setTrialForm({ ...trialForm, classId: e.target.value })} required className="w-full h-9 border border-gray-200 rounded-lg px-3 text-sm bg-white">
                <option value="">Pilih Kelas</option>
                {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name} — {c.ageGroup}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">Tanggal *</Label><Input type="date" value={trialForm.date} onChange={(e) => setTrialForm({ ...trialForm, date: e.target.value })} required /></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">Maks. Peserta</Label><Input type="number" min="1" value={trialForm.maxSlots} onChange={(e) => setTrialForm({ ...trialForm, maxSlots: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">Catatan</Label><Input value={trialForm.notes} onChange={(e) => setTrialForm({ ...trialForm, notes: e.target.value })} /></div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={() => setTrialOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600" disabled={loading}>{loading ? "Menyimpan..." : "Buat"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Participants Dialog */}
      <Dialog open={participantOpen} onOpenChange={setParticipantOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Peserta — {selectedTrial?.class?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <form onSubmit={handleAddParticipant} className="flex gap-2">
              <Input placeholder="Nama *" value={participantForm.name} onChange={(e) => setParticipantForm({ ...participantForm, name: e.target.value })} required className="h-9 text-sm" />
              <Input placeholder="Telepon *" value={participantForm.phone} onChange={(e) => setParticipantForm({ ...participantForm, phone: e.target.value })} required className="h-9 text-sm" />
              <Button type="submit" size="sm" className="h-9 bg-orange-500 hover:bg-orange-600 flex-shrink-0" disabled={loading}><Plus className="w-4 h-4" /></Button>
            </form>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {participants.map((p) => (
                <div key={p.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.phone}</p>
                  </div>
                  <select value={p.status} onChange={(e) => handleStatusChange(p.id, e.target.value)} className={`text-xs border-0 rounded-lg px-2 py-1 font-medium ${STATUS_COLORS[p.status]}`}>
                    {TRIAL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              ))}
              {participants.length === 0 && <p className="text-xs text-gray-400 text-center py-6">Belum ada peserta</p>}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
