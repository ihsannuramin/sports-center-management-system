"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SearchableSelect, SearchableSelectItem } from "@/components/ui/searchable-select";
import { Label } from "@/components/ui/label";
import { DataPagination } from "@/components/ui/data-pagination";
import { Plus, Download, Star } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { createAssessment, updateAssessment } from "@/app/actions/assessments";
import { exportToExcel } from "@/lib/export";
import { toast } from "sonner";

const skills = ["dribbling", "passing", "shooting", "defense", "stamina", "attitude"] as const;
const skillLabels: Record<string, string> = {
  dribbling: "Dribbling", passing: "Passing", shooting: "Shooting",
  defense: "Defense", stamina: "Stamina", attitude: "Attitude",
};

interface Props { assessments: any[]; students: any[]; }
const emptyForm = { studentId: "", period: "", dribbling: 70, passing: 70, shooting: 70, defense: 70, stamina: 70, attitude: 70, notes: "" };

export function AssessmentsClient({ assessments: initial, students }: Props) {
  const router = useRouter();
  const assessments = initial;
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const paginated = assessments.slice((page - 1) * pageSize, page * pageSize);

  function getAvg(a: any) {
    return Math.round((a.dribbling + a.passing + a.shooting + a.defense + a.stamina + a.attitude) / 6);
  }

  function openCreate() { setEditing(null); setForm(emptyForm); setOpen(true); }
  function openEdit(a: any) {
    setEditing(a);
    setForm({ studentId: a.studentId, period: a.period, dribbling: a.dribbling, passing: a.passing, shooting: a.shooting, defense: a.defense, stamina: a.stamina, attitude: a.attitude, notes: a.notes || "" });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try {
      if (editing) { await updateAssessment(editing.id, form); toast.success("Penilaian diperbarui"); }
      else { await createAssessment(form); toast.success("Penilaian ditambahkan"); }
      setOpen(false); router.refresh();
    } catch (err: any) { toast.error(err.message); }
    setLoading(false);
  }

  function handleExport() {
    const data = assessments.map((a) => ({
      "Siswa": a.student?.name || "-", "Periode": a.period,
      "Dribbling": a.dribbling, "Passing": a.passing, "Shooting": a.shooting,
      "Defense": a.defense, "Stamina": a.stamina, "Attitude": a.attitude,
      "Rata-rata": getAvg(a), "Catatan": a.notes || "-",
    }));
    exportToExcel(data, "Penilaian-Performa", "Penilaian");
    toast.success(`${data.length} data diekspor`);
  }

  function avgColor(avg: number) {
    if (avg >= 80) return "text-green-600 bg-green-50";
    if (avg >= 60) return "text-amber-600 bg-amber-50";
    return "text-red-600 bg-red-50";
  }

  return (
    <Card className="border-gray-100 shadow-sm">
      <CardHeader className="pb-4 border-b border-gray-50">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-50 rounded-xl"><Star className="w-5 h-5 text-yellow-500" /></div>
            <div>
              <h2 className="font-semibold text-gray-900">Penilaian Performa</h2>
              <p className="text-xs text-gray-400">{assessments.length} penilaian tersimpan</p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <Button variant="outline" size="sm" className="h-9 border-gray-200 text-gray-600" onClick={handleExport}>
              <Download className="w-4 h-4 mr-1.5" /> Excel
            </Button>
            <Button size="sm" className="h-9 bg-orange-500 hover:bg-orange-600 shadow-sm shadow-orange-200" onClick={openCreate}>
              <Plus className="w-4 h-4 mr-1.5" /> Tambah Penilaian
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table className="table-row-hover">
          <TableHeader>
            <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
              <TableHead className="text-xs font-semibold text-gray-500 pl-5">Siswa</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500">Periode</TableHead>
              {skills.map(s => <TableHead key={s} className="text-xs font-semibold text-gray-500">{skillLabels[s]}</TableHead>)}
              <TableHead className="text-xs font-semibold text-gray-500">Rata-rata</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow><TableCell colSpan={10} className="text-center py-16">
                <Star className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Belum ada penilaian</p>
              </TableCell></TableRow>
            ) : (
              paginated.map((a) => {
                const avg = getAvg(a);
                return (
                  <TableRow key={a.id}>
                    <TableCell className="pl-5">
                      <p className="font-medium text-sm text-gray-900">{a.student?.name}</p>
                    </TableCell>
                    <TableCell><span className="badge-blue">{a.period}</span></TableCell>
                    {skills.map((s) => (
                      <TableCell key={s}>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-gray-800 w-7 text-right">{a[s]}</span>
                          <Progress value={a[s]} className="w-12 h-1.5" />
                        </div>
                      </TableCell>
                    ))}
                    <TableCell>
                      <span className={`inline-flex items-center justify-center w-10 h-7 rounded-lg text-sm font-bold ${avgColor(avg)}`}>
                        {avg}
                      </span>
                    </TableCell>
                    <TableCell className="pr-3">
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-gray-500 hover:text-gray-800" onClick={() => openEdit(a)}>Edit</Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <DataPagination total={assessments.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Penilaian" : "Tambah Penilaian"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Siswa *</Label>
                <SearchableSelect value={form.studentId} onValueChange={(v) => v && setForm({ ...form, studentId: v })} placeholder="Pilih siswa">
                  {students.map((s: any) => <SearchableSelectItem key={s.id} value={s.id}>{s.name}</SearchableSelectItem>)}
                </SearchableSelect>
              </div>
              <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">Periode *</Label><Input value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} placeholder="e.g. Q1-2026" required /></div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Nilai Skill (0–100)</p>
              <div className="grid grid-cols-2 gap-3">
                {skills.map((s) => (
                  <div key={s} className="space-y-1.5">
                    <div className="flex justify-between">
                      <Label className="text-xs font-medium text-gray-700">{skillLabels[s]}</Label>
                      <span className="text-xs font-bold text-orange-500">{(form as any)[s]}</span>
                    </div>
                    <input type="range" min={0} max={100} value={(form as any)[s]} onChange={(e) => setForm({ ...form, [s]: Number(e.target.value) })} className="w-full accent-orange-500 h-2" />
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">Catatan</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600" disabled={loading}>{loading ? "Menyimpan..." : "Simpan"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
