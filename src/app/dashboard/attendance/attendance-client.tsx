"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchableSelect, SearchableSelectItem } from "@/components/ui/searchable-select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { saveAttendance, getAttendance, getAttendanceReport, saveCoachAttendance } from "@/app/actions/attendance";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";

const statusOptions = [
  { value: "PRESENT", label: "Hadir", color: "bg-green-100 text-green-700" },
  { value: "ABSENT", label: "Absen", color: "bg-red-100 text-destructive" },
  { value: "SICK", label: "Sakit", color: "bg-yellow-100 text-yellow-700" },
  { value: "PERMISSION", label: "Izin", color: "bg-blue-100 text-blue-700" },
];

const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

function getScheduleDates(cls: any): string[] {
  if (!cls?.schedule) return [];
  try {
    const sched = typeof cls.schedule === "string" ? JSON.parse(cls.schedule) : cls.schedule;
    if (!Array.isArray(sched.days) || sched.days.length === 0) return [];
    const dates: string[] = [];
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 90);
    const end = new Date(today);
    end.setDate(end.getDate() + 14);
    const cursor = new Date(start);
    while (cursor <= end) {
      if (sched.days.includes(cursor.getDay())) {
        dates.push(cursor.toISOString().slice(0, 10));
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    return dates.reverse(); // most recent first
  } catch {
    return [];
  }
}

function getScheduleDayNames(cls: any): string {
  if (!cls?.schedule) return "";
  try {
    const sched = typeof cls.schedule === "string" ? JSON.parse(cls.schedule) : cls.schedule;
    if (!Array.isArray(sched.days) || sched.days.length === 0) return "";
    return sched.days.map((d: number) => DAY_NAMES[d]).join(", ");
  } catch {
    return "";
  }
}

function pickDefaultDate(dates: string[]): string {
  if (dates.length === 0) return format(new Date(), "yyyy-MM-dd");
  const todayStr = format(new Date(), "yyyy-MM-dd");
  return dates.includes(todayStr) ? todayStr : dates[0];
}

interface Props { classes: any[]; }

export function AttendanceClient({ classes }: Props) {
  const router = useRouter();

  // Student attendance state
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [students, setStudents] = useState<any[]>([]);
  const [records, setRecords] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Recap state
  const [recapClass, setRecapClass] = useState("");
  const [recapMonth, setRecapMonth] = useState(String(new Date().getMonth() + 1));
  const [recapYear, setRecapYear] = useState(String(new Date().getFullYear()));
  const [recapData, setRecapData] = useState<any[]>([]);
  const [recapLoading, setRecapLoading] = useState(false);

  // Coach attendance state
  const [coachClass, setCoachClass] = useState("");
  const [coachDate, setCoachDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [coachRecord, setCoachRecord] = useState("PRESENT");
  const [coachNotes, setCoachNotes] = useState("");
  const [coachSaving, setCoachSaving] = useState(false);

  // Valid dates based on class schedule
  const validStudentDates = useMemo(() => {
    const cls = classes.find((c) => c.id === selectedClass);
    return getScheduleDates(cls);
  }, [selectedClass, classes]);

  const validCoachDates = useMemo(() => {
    const cls = classes.find((c) => c.id === coachClass);
    return getScheduleDates(cls);
  }, [coachClass, classes]);

  const classData = classes.find((c) => c.id === selectedClass);
  const coachClassData = classes.find((c) => c.id === coachClass);

  function handleClassChange(v: string) {
    setSelectedClass(v ?? "");
    setStudents([]);
    const cls = classes.find((c) => c.id === v);
    const dates = getScheduleDates(cls);
    setSelectedDate(pickDefaultDate(dates));
  }

  function handleCoachClassChange(v: string) {
    setCoachClass(v ?? "");
    const cls = classes.find((c) => c.id === v);
    const dates = getScheduleDates(cls);
    setCoachDate(pickDefaultDate(dates));
  }

  async function loadAttendance() {
    if (!selectedClass) return;
    setLoading(true);
    try {
      const existing = await getAttendance(selectedClass, selectedDate);
      const cls = classes.find((c) => c.id === selectedClass);
      if (cls?.students) {
        setStudents(cls.students);
        const rec: Record<string, string> = {};
        cls.students.forEach((s: any) => {
          const found = existing.find((a: any) => a.studentId === s.id);
          rec[s.id] = found?.status || "PRESENT";
        });
        setRecords(rec);
      }
    } catch {
      toast.error("Gagal memuat data absensi");
    }
    setLoading(false);
  }

  async function handleSave() {
    if (!selectedClass || students.length === 0) return;
    setSaving(true);
    try {
      await saveAttendance({
        classId: selectedClass,
        date: selectedDate,
        records: students.map((s) => ({ studentId: s.id, status: records[s.id] as any || "PRESENT" })),
      });
      toast.success("Absensi berhasil disimpan");
    } catch {
      toast.error("Gagal menyimpan absensi");
    }
    setSaving(false);
  }

  async function loadRecap() {
    if (!recapClass) return;
    setRecapLoading(true);
    try {
      const data = await getAttendanceReport(recapClass, Number(recapMonth), Number(recapYear));
      setRecapData(data);
    } catch {
      toast.error("Gagal memuat rekap absensi");
    }
    setRecapLoading(false);
  }

  async function handleCoachSave() {
    const cls = classes.find((c) => c.id === coachClass);
    if (!coachClass || !cls?.coachId) {
      toast.error("Kelas tidak memiliki pelatih terdaftar");
      return;
    }
    setCoachSaving(true);
    try {
      await saveCoachAttendance({
        classId: coachClass,
        coachId: cls.coachId,
        date: coachDate,
        status: coachRecord as any,
        notes: coachNotes || undefined,
      });
      toast.success("Absensi pelatih disimpan");
    } catch {
      toast.error("Gagal menyimpan absensi pelatih");
    }
    setCoachSaving(false);
  }

  // Build recap summary per student
  const recapSummary = (() => {
    const map: Record<string, { name: string; present: number; absent: number; sick: number; permission: number; total: number }> = {};
    recapData.forEach((a) => {
      if (!a.studentId || !a.student) return;
      if (!map[a.studentId]) {
        map[a.studentId] = { name: a.student.name, present: 0, absent: 0, sick: 0, permission: 0, total: 0 };
      }
      map[a.studentId].total++;
      if (a.status === "PRESENT") map[a.studentId].present++;
      else if (a.status === "ABSENT") map[a.studentId].absent++;
      else if (a.status === "SICK") map[a.studentId].sick++;
      else if (a.status === "PERMISSION") map[a.studentId].permission++;
    });
    return Object.values(map);
  })();

  const presentCount = Object.values(records).filter((v) => v === "PRESENT").length;
  const absentCount = Object.values(records).filter((v) => v === "ABSENT").length;

  const months = [
    { value: "1", label: "Januari" }, { value: "2", label: "Februari" }, { value: "3", label: "Maret" },
    { value: "4", label: "April" }, { value: "5", label: "Mei" }, { value: "6", label: "Juni" },
    { value: "7", label: "Juli" }, { value: "8", label: "Agustus" }, { value: "9", label: "September" },
    { value: "10", label: "Oktober" }, { value: "11", label: "November" }, { value: "12", label: "Desember" },
  ];

  return (
    <Tabs defaultValue="input">
      <TabsList className="bg-muted p-1 rounded-xl">
        <TabsTrigger value="input" className="rounded-lg text-sm data-[state=active]:bg-surface data-[state=active]:shadow-sm">Input Absensi Siswa</TabsTrigger>
        <TabsTrigger value="recap" className="rounded-lg text-sm data-[state=active]:bg-surface data-[state=active]:shadow-sm">Rekap Bulanan</TabsTrigger>
        <TabsTrigger value="coach" className="rounded-lg text-sm data-[state=active]:bg-surface data-[state=active]:shadow-sm">Absensi Pelatih</TabsTrigger>
      </TabsList>

      {/* ── Tab 1: Input Absensi Siswa ── */}
      <TabsContent value="input" className="space-y-4 mt-4">
        <Card className="overflow-visible border-neutral shadow-sm">
          <CardHeader className="pb-3 border-b border-neutral">
            <CardTitle className="text-base">Input Absensi Siswa</CardTitle>
          </CardHeader>
          <CardContent className="overflow-visible pt-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Kelas</Label>
                <SearchableSelect value={selectedClass} onValueChange={(v) => handleClassChange(v ?? "")} placeholder="Pilih kelas">
                  {classes.map((c) => <SearchableSelectItem key={c.id} value={c.id}>{c.name}</SearchableSelectItem>)}
                </SearchableSelect>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">
                  Tanggal
                  {validStudentDates.length > 0 && (
                    <span className="ml-1.5 text-primary font-normal text-[11px]">({getScheduleDayNames(classData)})</span>
                  )}
                </Label>
                {validStudentDates.length > 0 ? (
                  <SearchableSelect
                    value={selectedDate}
                    onValueChange={(v) => { setSelectedDate(v ?? selectedDate); setStudents([]); }}
                    placeholder="Pilih tanggal sesi"
                  >
                    {validStudentDates.map((d) => (
                      <SearchableSelectItem key={d} value={d}>
                        {format(parseISO(d), "EEEE, d MMM yyyy", { locale: id })}
                      </SearchableSelectItem>
                    ))}
                  </SearchableSelect>
                ) : (
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => { setSelectedDate(e.target.value); setStudents([]); }}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  />
                )}
              </div>
              <div className="flex items-end">
                <Button onClick={loadAttendance} disabled={!selectedClass || loading} className="bg-primary hover:bg-primary-80 w-full">
                  {loading ? "Memuat..." : "Muat Siswa"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {students.length > 0 && (
          <Card className="border-neutral shadow-sm">
            <CardHeader className="flex-row items-center justify-between pb-4 border-b border-neutral">
              <div>
                <CardTitle className="text-base">{classData?.name}</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {format(parseISO(selectedDate), "EEEE, d MMMM yyyy", { locale: id })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded-full">Hadir: {presentCount}</span>
                <span className="text-sm bg-red-100 text-destructive px-2 py-1 rounded-full">Absen: {absentCount}</span>
                <Button onClick={handleSave} className="bg-primary hover:bg-primary-80" disabled={saving}>
                  {saving ? "Menyimpan..." : "Simpan Absensi"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="pl-5 text-xs font-semibold text-tertiary uppercase tracking-wide">No</TableHead>
                    <TableHead className="text-xs font-semibold text-tertiary uppercase tracking-wide">Nama Siswa</TableHead>
                    <TableHead className="text-xs font-semibold text-tertiary uppercase tracking-wide">No. Siswa</TableHead>
                    <TableHead className="text-xs font-semibold text-tertiary uppercase tracking-wide">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((s, i) => (
                    <TableRow key={s.id}>
                      <TableCell className="pl-5 text-tertiary">{i + 1}</TableCell>
                      <TableCell className="font-medium text-on-surface">{s.name}</TableCell>
                      <TableCell className="font-mono text-sm text-tertiary">{s.studentNumber}</TableCell>
                      <TableCell>
                        <div className="flex gap-2 flex-wrap">
                          {statusOptions.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setRecords({ ...records, [s.id]: opt.value })}
                              className={`text-xs px-3 py-1 rounded-full font-medium transition-all border-2 cursor-pointer ${records[s.id] === opt.value ? `${opt.color} border-current` : "bg-muted/50 text-tertiary border-transparent hover:border-border"}`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* ── Tab 2: Rekap Bulanan ── */}
      <TabsContent value="recap" className="space-y-4 mt-4">
        <Card className="overflow-visible border-neutral shadow-sm">
          <CardHeader className="pb-3 border-b border-neutral">
            <CardTitle className="text-base">Rekap Absensi Bulanan</CardTitle>
          </CardHeader>
          <CardContent className="overflow-visible pt-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Kelas</Label>
                <SearchableSelect value={recapClass} onValueChange={(v) => setRecapClass(v ?? "")} placeholder="Pilih kelas">
                  {classes.map((c) => <SearchableSelectItem key={c.id} value={c.id}>{c.name}</SearchableSelectItem>)}
                </SearchableSelect>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Bulan</Label>
                <SearchableSelect value={recapMonth} onValueChange={(v) => setRecapMonth(v ?? recapMonth)} placeholder="Pilih bulan">
                  {months.map((m) => <SearchableSelectItem key={m.value} value={m.value}>{m.label}</SearchableSelectItem>)}
                </SearchableSelect>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Tahun</Label>
                <input
                  type="number"
                  value={recapYear}
                  onChange={(e) => setRecapYear(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  min={2020}
                  max={2099}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={loadRecap} disabled={!recapClass || recapLoading} className="bg-primary hover:bg-primary-80 w-full">
                  {recapLoading ? "Memuat..." : "Tampilkan Rekap"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {recapSummary.length > 0 && (
          <Card className="border-neutral shadow-sm">
            <CardHeader className="pb-4 border-b border-neutral">
              <CardTitle className="text-base">
                Rekap — {classes.find((c) => c.id === recapClass)?.name} ({months.find((m) => m.value === recapMonth)?.label} {recapYear})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="pl-5 text-xs font-semibold text-tertiary uppercase tracking-wide">Nama Siswa</TableHead>
                    <TableHead className="text-xs font-semibold text-tertiary uppercase tracking-wide">Pertemuan</TableHead>
                    <TableHead className="text-xs font-semibold text-tertiary uppercase tracking-wide">Hadir</TableHead>
                    <TableHead className="text-xs font-semibold text-tertiary uppercase tracking-wide">Sakit</TableHead>
                    <TableHead className="text-xs font-semibold text-tertiary uppercase tracking-wide">Izin</TableHead>
                    <TableHead className="text-xs font-semibold text-tertiary uppercase tracking-wide">Absen</TableHead>
                    <TableHead className="text-xs font-semibold text-tertiary uppercase tracking-wide">% Hadir</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recapSummary.map((r) => {
                    const pct = r.total > 0 ? Math.round((r.present / r.total) * 100) : 0;
                    return (
                      <TableRow key={r.name}>
                        <TableCell className="pl-5 font-medium text-on-surface">{r.name}</TableCell>
                        <TableCell className="text-foreground">{r.total}</TableCell>
                        <TableCell><span className="text-green-600 font-medium">{r.present}</span></TableCell>
                        <TableCell><span className="text-yellow-600">{r.sick}</span></TableCell>
                        <TableCell><span className="text-blue-600">{r.permission}</span></TableCell>
                        <TableCell><span className="text-destructive">{r.absent}</span></TableCell>
                        <TableCell>
                          <span className={`font-bold ${pct >= 80 ? "text-green-600" : pct >= 60 ? "text-primary" : "text-destructive"}`}>
                            {pct}%
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* ── Tab 3: Absensi Pelatih ── */}
      <TabsContent value="coach" className="space-y-4 mt-4">
        <Card className="overflow-visible border-neutral shadow-sm">
          <CardHeader className="pb-3 border-b border-neutral">
            <CardTitle className="text-base">Input Absensi Pelatih</CardTitle>
          </CardHeader>
          <CardContent className="overflow-visible pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Kelas</Label>
                <SearchableSelect value={coachClass} onValueChange={(v) => handleCoachClassChange(v ?? "")} placeholder="Pilih kelas">
                  {classes.filter((c) => c.coachId).map((c) => (
                    <SearchableSelectItem key={c.id} value={c.id}>{c.name} — {c.coach?.name}</SearchableSelectItem>
                  ))}
                </SearchableSelect>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">
                  Tanggal
                  {validCoachDates.length > 0 && (
                    <span className="ml-1.5 text-primary font-normal text-[11px]">({getScheduleDayNames(coachClassData)})</span>
                  )}
                </Label>
                {validCoachDates.length > 0 ? (
                  <SearchableSelect
                    value={coachDate}
                    onValueChange={(v) => setCoachDate(v ?? coachDate)}
                    placeholder="Pilih tanggal sesi"
                  >
                    {validCoachDates.map((d) => (
                      <SearchableSelectItem key={d} value={d}>
                        {format(parseISO(d), "EEEE, d MMM yyyy", { locale: id })}
                      </SearchableSelectItem>
                    ))}
                  </SearchableSelect>
                ) : (
                  <input
                    type="date"
                    value={coachDate}
                    onChange={(e) => setCoachDate(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  />
                )}
              </div>
            </div>

            {coachClass && (
              <div className="mt-4 space-y-3">
                <div className="p-4 rounded-xl border border-neutral bg-muted/50">
                  <p className="text-sm font-medium text-on-surface">
                    Pelatih: <span className="text-primary">{coachClassData?.coach?.name || "Tidak ada"}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(parseISO(coachDate), "EEEE, d MMMM yyyy", { locale: id })}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-foreground">Status Kehadiran</Label>
                  <div className="flex gap-2 flex-wrap">
                    {statusOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setCoachRecord(opt.value)}
                        className={`text-sm px-4 py-2 rounded-full font-medium transition-all border-2 cursor-pointer ${coachRecord === opt.value ? `${opt.color} border-current` : "bg-muted/50 text-tertiary border-transparent hover:border-border"}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <Button type="button" onClick={handleCoachSave} className="bg-primary hover:bg-primary-80" disabled={coachSaving}>
                  {coachSaving ? "Menyimpan..." : "Simpan Absensi Pelatih"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
