"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { saveAttendance, getAttendance, getAttendanceReport, saveCoachAttendance, getCoachAttendance } from "@/app/actions/attendance";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const statusOptions = [
  { value: "PRESENT", label: "Hadir", color: "bg-green-100 text-green-700" },
  { value: "ABSENT", label: "Absen", color: "bg-red-100 text-red-700" },
  { value: "SICK", label: "Sakit", color: "bg-yellow-100 text-yellow-700" },
  { value: "PERMISSION", label: "Izin", color: "bg-blue-100 text-blue-700" },
];

const statusBadge: Record<string, string> = {
  PRESENT: "bg-green-100 text-green-700",
  ABSENT: "bg-red-100 text-red-700",
  SICK: "bg-yellow-100 text-yellow-700",
  PERMISSION: "bg-blue-100 text-blue-700",
};

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

  const classData = classes.find((c) => c.id === selectedClass);

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
      <TabsList>
        <TabsTrigger value="input">Input Absensi Siswa</TabsTrigger>
        <TabsTrigger value="recap">Rekap Bulanan</TabsTrigger>
        <TabsTrigger value="coach">Absensi Pelatih</TabsTrigger>
      </TabsList>

      {/* ── Tab 1: Input Absensi Siswa ── */}
      <TabsContent value="input" className="space-y-4">
        <Card>
          <CardHeader><CardTitle>Input Absensi Siswa</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Kelas</Label>
                <Select value={selectedClass} onValueChange={(v) => { setSelectedClass(v ?? ""); setStudents([]); }}>
                  <SelectTrigger><SelectValue placeholder="Pilih kelas" /></SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tanggal</Label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={loadAttendance} disabled={!selectedClass || loading} className="bg-orange-500 hover:bg-orange-600 w-full">
                  {loading ? "Memuat..." : "Muat Siswa"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {students.length > 0 && (
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Absensi — {classData?.name}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {format(new Date(selectedDate), "EEEE, d MMMM yyyy", { locale: id })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded-full">Hadir: {presentCount}</span>
                <span className="text-sm bg-red-100 text-red-700 px-2 py-1 rounded-full">Absen: {absentCount}</span>
                <Button onClick={handleSave} className="bg-orange-500 hover:bg-orange-600" disabled={saving}>
                  {saving ? "Menyimpan..." : "Simpan Absensi"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No</TableHead>
                    <TableHead>Nama Siswa</TableHead>
                    <TableHead>No. Siswa</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((s, i) => (
                    <TableRow key={s.id}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="font-mono text-sm">{s.studentNumber}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {statusOptions.map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => setRecords({ ...records, [s.id]: opt.value })}
                              className={`text-xs px-3 py-1 rounded-full font-medium transition-all border-2 ${records[s.id] === opt.value ? `${opt.color} border-current` : "bg-gray-50 text-gray-500 border-transparent hover:border-gray-200"}`}
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
      <TabsContent value="recap" className="space-y-4">
        <Card>
          <CardHeader><CardTitle>Rekap Absensi Bulanan</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Kelas</Label>
                <Select value={recapClass} onValueChange={(v) => setRecapClass(v ?? "")}>
                  <SelectTrigger><SelectValue placeholder="Pilih kelas" /></SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Bulan</Label>
                <Select value={recapMonth} onValueChange={(v) => setRecapMonth(v ?? recapMonth)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {months.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tahun</Label>
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
                <Button onClick={loadRecap} disabled={!recapClass || recapLoading} className="bg-orange-500 hover:bg-orange-600 w-full">
                  {recapLoading ? "Memuat..." : "Tampilkan Rekap"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {recapSummary.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Rekap — {classes.find((c) => c.id === recapClass)?.name} ({months.find((m) => m.value === recapMonth)?.label} {recapYear})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Siswa</TableHead>
                    <TableHead>Total Pertemuan</TableHead>
                    <TableHead>Hadir</TableHead>
                    <TableHead>Sakit</TableHead>
                    <TableHead>Izin</TableHead>
                    <TableHead>Absen</TableHead>
                    <TableHead>% Kehadiran</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recapSummary.map((r) => {
                    const pct = r.total > 0 ? Math.round((r.present / r.total) * 100) : 0;
                    return (
                      <TableRow key={r.name}>
                        <TableCell className="font-medium">{r.name}</TableCell>
                        <TableCell>{r.total}</TableCell>
                        <TableCell><span className="text-green-600 font-medium">{r.present}</span></TableCell>
                        <TableCell><span className="text-yellow-600">{r.sick}</span></TableCell>
                        <TableCell><span className="text-blue-600">{r.permission}</span></TableCell>
                        <TableCell><span className="text-red-500">{r.absent}</span></TableCell>
                        <TableCell>
                          <span className={`font-bold ${pct >= 80 ? "text-green-600" : pct >= 60 ? "text-orange-500" : "text-red-500"}`}>
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
      <TabsContent value="coach" className="space-y-4">
        <Card>
          <CardHeader><CardTitle>Input Absensi Pelatih</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kelas</Label>
                <Select value={coachClass} onValueChange={(v) => setCoachClass(v ?? "")}>
                  <SelectTrigger><SelectValue placeholder="Pilih kelas" /></SelectTrigger>
                  <SelectContent>
                    {classes.filter((c) => c.coachId).map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name} — {c.coach?.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tanggal</Label>
                <input
                  type="date"
                  value={coachDate}
                  onChange={(e) => setCoachDate(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                />
              </div>
            </div>

            {coachClass && (
              <div className="mt-4 space-y-3">
                <div className="p-4 rounded-lg border bg-muted/30">
                  <p className="text-sm font-medium mb-1">
                    Pelatih: <span className="text-orange-600">{classes.find((c) => c.id === coachClass)?.coach?.name || "Tidak ada"}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(coachDate), "EEEE, d MMMM yyyy", { locale: id })}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Status Kehadiran</Label>
                  <div className="flex gap-2">
                    {statusOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setCoachRecord(opt.value)}
                        className={`text-sm px-4 py-2 rounded-full font-medium transition-all border-2 ${coachRecord === opt.value ? `${opt.color} border-current` : "bg-gray-50 text-gray-500 border-transparent hover:border-gray-200"}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <Button onClick={handleCoachSave} className="bg-orange-500 hover:bg-orange-600" disabled={coachSaving}>
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
