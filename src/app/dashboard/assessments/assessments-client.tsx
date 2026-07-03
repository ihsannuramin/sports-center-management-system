"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { SearchableSelect, SearchableSelectItem } from "@/components/ui/searchable-select";
import { Label } from "@/components/ui/label";
import { DataPagination } from "@/components/ui/data-pagination";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Download, Star, Check, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { createAssessment, updateAssessment } from "@/app/actions/assessments";
import { exportToExcel } from "@/lib/export";
import { toast } from "sonner";

const skills = ["dribbling", "passing", "shooting", "defense", "stamina", "attitude"] as const;
const skillLabels: Record<string, string> = {
  dribbling: "Dribbling", passing: "Passing", shooting: "Shooting",
  defense: "Defense", stamina: "Stamina", attitude: "Attitude",
};

const QUICK_TAGS = ["Egois", "Komunikatif", "Gampang Frustrasi", "Pekerja Keras", "Disiplin", "Kurang Fokus"];
const SKILL_SUGGESTIONS = ["Tendangan Bebas", "Heading", "Kecepatan", "Kelincahan", "Three-Point", "Lay-up", "Serve", "Spike", "Block", "Smash"];
const MAX_CUSTOM_SKILLS = 5;

interface CustomSkill { name: string; score: number; }

interface Props { assessments: any[]; students: any[]; }

const emptyForm = {
  studentId: "", period: "",
  dribbling: 60, passing: 60, shooting: 60, defense: 60, stamina: 60, attitude: 60,
  customSkills: [] as CustomSkill[],
  notes: "",
};

function snapRating(v: number) {
  return Math.round(v / 20) * 20;
}

function RatingButtons({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((r) => {
        const mapped = r * 20;
        const selected = value === mapped;
        return (
          <button
            key={r}
            type="button"
            onClick={() => onChange(mapped)}
            className={`relative flex-1 h-11 rounded-xl text-base font-bold transition-all duration-150 select-none
              ${selected
                ? "bg-orange-500 text-white scale-105 shadow-md shadow-orange-200"
                : "bg-gray-100 text-gray-500 hover:bg-orange-50 hover:text-orange-500 active:scale-95"
              }`}
          >
            {selected ? <Check className="w-4 h-4 mx-auto" /> : r}
          </button>
        );
      })}
    </div>
  );
}

export function AssessmentsClient({ assessments: initial, students }: Props) {
  const router = useRouter();
  const assessments = initial;
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const paginated = assessments.slice((page - 1) * pageSize, page * pageSize);
  const selectedStudent = students.find((s: any) => s.id === form.studentId);

  function getAvg(a: any) {
    return Math.round((a.dribbling + a.passing + a.shooting + a.defense + a.stamina + a.attitude) / 6);
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setSelectedTags([]);
    setOpen(true);
  }

  function openEdit(a: any) {
    setEditing(a);
    setForm({
      studentId: a.studentId,
      period: a.period,
      dribbling: snapRating(a.dribbling),
      passing: snapRating(a.passing),
      shooting: snapRating(a.shooting),
      defense: snapRating(a.defense),
      stamina: snapRating(a.stamina),
      attitude: snapRating(a.attitude),
      customSkills: Array.isArray(a.customSkills)
        ? (a.customSkills as any[]).map((c) => ({ name: c.name, score: snapRating(c.score) }))
        : [],
      notes: a.notes || "",
    });
    setSelectedTags([]);
    setOpen(true);
  }

  function addCustomSkill(name = "") {
    if (form.customSkills.length >= MAX_CUSTOM_SKILLS) return;
    setForm({ ...form, customSkills: [...form.customSkills, { name, score: 60 }] });
  }

  function updateCustomSkill(i: number, patch: Partial<CustomSkill>) {
    const updated = form.customSkills.map((s, idx) => idx === i ? { ...s, ...patch } : s);
    setForm({ ...form, customSkills: updated });
  }

  function removeCustomSkill(i: number) {
    setForm({ ...form, customSkills: form.customSkills.filter((_, idx) => idx !== i) });
  }

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const tagsStr = selectedTags.join(", ");
      const finalNotes = [tagsStr, form.notes].filter(Boolean).join(" | ");
      const payload = { ...form, notes: finalNotes };
      if (editing) {
        await updateAssessment(editing.id, payload);
        toast.success("Penilaian diperbarui");
      } else {
        await createAssessment(payload);
        toast.success("Penilaian ditambahkan");
      }
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    }
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

  function initials(name: string) {
    return name.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();
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
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm text-gray-900">{a.student?.name}</p>
                        {Array.isArray(a.customSkills) && (a.customSkills as any[]).length > 0 && (
                          <span
                            className="text-xs font-semibold text-orange-500 bg-orange-50 border border-orange-200 rounded-full px-1.5 py-0.5 cursor-default"
                            title={(a.customSkills as any[]).map((c: any) => `${c.name}: ${c.score / 20}/5`).join(", ")}
                          >
                            +{(a.customSkills as any[]).length}
                          </span>
                        )}
                      </div>
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

      {/* Mobile-first assessment form dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg w-full p-0 flex flex-col max-h-[95dvh] overflow-hidden gap-0">

          {/* Player profile header */}
          <div className="px-4 py-3 border-b bg-white shrink-0 flex items-center gap-3">
            {selectedStudent ? (
              <>
                <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {initials(selectedStudent.name)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{selectedStudent.name}</p>
                  <p className="text-xs text-gray-400">{selectedStudent.kelas || "Siswa"}</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  <Star className="w-5 h-5 text-gray-300" />
                </div>
                <div>
                  <p className="font-semibold text-gray-700 text-base">
                    {editing ? "Edit Penilaian" : "Tambah Penilaian"}
                  </p>
                  <p className="text-xs text-gray-400">Pilih siswa untuk memulai</p>
                </div>
              </>
            )}
            <DialogTitle className="sr-only">{editing ? "Edit Penilaian" : "Tambah Penilaian"}</DialogTitle>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            {/* Scrollable form body */}
            <div className="overflow-y-auto flex-1 px-4 py-4 space-y-4">

              {/* Student + Period */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-700">Siswa *</Label>
                  <SearchableSelect
                    value={form.studentId}
                    onValueChange={(v) => v && setForm({ ...form, studentId: v })}
                    placeholder="Pilih siswa"
                  >
                    {students.map((s: any) => (
                      <SearchableSelectItem key={s.id} value={s.id}>{s.name}</SearchableSelectItem>
                    ))}
                  </SearchableSelect>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-700">Periode *</Label>
                  <Input
                    value={form.period}
                    onChange={(e) => setForm({ ...form, period: e.target.value })}
                    placeholder="e.g. Q1-2026"
                    required
                  />
                </div>
              </div>

              {/* Tabbed skill inputs */}
              <Tabs defaultValue="skill">
                <TabsList className="w-full h-10" variant="default">
                  <TabsTrigger value="fisik" className="flex-1 text-sm">Fisik</TabsTrigger>
                  <TabsTrigger value="skill" className="flex-1 text-sm">Skill</TabsTrigger>
                  <TabsTrigger value="karakter" className="flex-1 text-sm">Karakter</TabsTrigger>
                </TabsList>

                {/* Tab: Fisik */}
                <TabsContent value="fisik" className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-medium text-gray-700">Stamina</Label>
                      <span className="text-sm font-bold text-orange-500">{form.stamina / 20} / 5</span>
                    </div>
                    <RatingButtons value={form.stamina} onChange={(v) => setForm({ ...form, stamina: v })} />
                  </div>
                </TabsContent>

                {/* Tab: Skill */}
                <TabsContent value="skill" className="mt-4 space-y-4">
                  {(["dribbling", "passing", "shooting", "defense"] as const).map((s) => (
                    <div key={s} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm font-medium text-gray-700">{skillLabels[s]}</Label>
                        <span className="text-sm font-bold text-orange-500">{form[s] / 20} / 5</span>
                      </div>
                      <RatingButtons value={form[s]} onChange={(v) => setForm({ ...form, [s]: v })} />
                    </div>
                  ))}

                  {/* Custom skills */}
                  <div className="pt-2 border-t border-gray-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Skill Custom</p>
                      <button
                        type="button"
                        onClick={() => addCustomSkill()}
                        disabled={form.customSkills.length >= MAX_CUSTOM_SKILLS}
                        className="flex items-center gap-1 text-xs font-medium text-orange-500 hover:text-orange-600 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-3.5 h-3.5" /> Tambah Skill
                      </button>
                    </div>

                    {/* Suggestion chips */}
                    {form.customSkills.length < MAX_CUSTOM_SKILLS && (
                      <div className="flex flex-wrap gap-1.5">
                        {SKILL_SUGGESTIONS.filter((s) => !form.customSkills.some((c) => c.name === s)).map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => addCustomSkill(s)}
                            className="px-2.5 py-1 rounded-full text-xs border border-dashed border-gray-300 text-gray-500 hover:border-orange-400 hover:text-orange-500 transition-colors"
                          >
                            + {s}
                          </button>
                        ))}
                      </div>
                    )}

                    {form.customSkills.map((cs, i) => (
                      <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={cs.name}
                            onChange={(e) => updateCustomSkill(i, { name: e.target.value })}
                            placeholder="Nama skill..."
                            maxLength={50}
                            className="flex-1 text-sm font-medium bg-transparent outline-none placeholder-gray-400 text-gray-800 border-b border-gray-200 pb-0.5 focus:border-orange-400"
                          />
                          <button
                            type="button"
                            onClick={() => removeCustomSkill(i)}
                            className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-400">Rating</span>
                          <span className="text-xs font-bold text-orange-500">{cs.score / 20} / 5</span>
                        </div>
                        <RatingButtons value={cs.score} onChange={(v) => updateCustomSkill(i, { score: v })} />
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* Tab: Karakter */}
                <TabsContent value="karakter" className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-medium text-gray-700">Attitude</Label>
                      <span className="text-sm font-bold text-orange-500">{form.attitude / 20} / 5</span>
                    </div>
                    <RatingButtons value={form.attitude} onChange={(v) => setForm({ ...form, attitude: v })} />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-gray-700">Tag Karakter</Label>
                    <div className="flex flex-wrap gap-2">
                      {QUICK_TAGS.map((tag) => {
                        const active = selectedTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleTag(tag)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150
                              ${active
                                ? "bg-orange-500 text-white border-orange-500"
                                : "bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-500"
                              }`}
                          >
                            {active && <Check className="w-3 h-3 inline mr-1" />}
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-700">Catatan Tambahan</Label>
                    <Input
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      placeholder="Catatan opsional..."
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sticky bottom action bar */}
            <div className="px-4 py-3 border-t bg-white shrink-0 flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1 h-11 border-gray-200"
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="flex-1 h-11 bg-orange-500 hover:bg-orange-600 shadow-sm shadow-orange-200"
                disabled={loading}
              >
                {loading ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
