export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { ArrowLeft, User, Phone, MapPin, BookOpen, ClipboardCheck, Star, FileText } from "lucide-react";

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  INACTIVE: "bg-gray-100 text-gray-700",
  SUSPENDED: "bg-red-100 text-red-700",
};
const statusLabels: Record<string, string> = {
  ACTIVE: "Aktif", INACTIVE: "Tidak Aktif", SUSPENDED: "Ditangguhkan",
};
const attendanceColors: Record<string, string> = {
  PRESENT: "text-green-600", ABSENT: "text-red-500", SICK: "text-yellow-600", PERMISSION: "text-blue-600",
};
const attendanceLabels: Record<string, string> = {
  PRESENT: "Hadir", ABSENT: "Absen", SICK: "Sakit", PERMISSION: "Izin",
};
const invoiceStatusColors: Record<string, string> = {
  UNPAID: "bg-yellow-100 text-yellow-700", PAID: "bg-green-100 text-green-700",
  OVERDUE: "bg-red-100 text-red-700", CANCELLED: "bg-gray-100 text-gray-700",
};
const invoiceStatusLabels: Record<string, string> = {
  UNPAID: "Belum Dibayar", PAID: "Lunas", OVERDUE: "Jatuh Tempo", CANCELLED: "Dibatalkan",
};
const skills = ["dribbling", "passing", "shooting", "defense", "stamina", "attitude"] as const;
const skillLabels: Record<string, string> = {
  dribbling: "Dribbling", passing: "Passing", shooting: "Shooting",
  defense: "Defense", stamina: "Stamina", attitude: "Attitude",
};

async function getStudentDetail(id: string) {
  return prisma.student.findUnique({
    where: { id },
    include: {
      branch: true,
      class: { include: { coach: true } },
      attendances: {
        orderBy: { date: "desc" },
        take: 30,
        include: { class: true },
      },
      assessments: { orderBy: { assessedAt: "desc" } },
      invoices: {
        orderBy: { createdAt: "desc" },
        include: { payments: true },
      },
    },
  });
}

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await getStudentDetail(id).catch(() => null);

  if (!student) notFound();

  const totalAttendance = student.attendances.length;
  const presentCount = student.attendances.filter((a) => a.status === "PRESENT").length;
  const attendancePct = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

  const latestAssessment = student.assessments[0];
  const avgScore = latestAssessment
    ? Math.round((latestAssessment.dribbling + latestAssessment.passing + latestAssessment.shooting + latestAssessment.defense + latestAssessment.stamina + latestAssessment.attitude) / 6)
    : null;

  const unpaidAmount = student.invoices
    .filter((inv) => inv.status === "UNPAID")
    .reduce((sum, inv) => sum + Number(inv.amount), 0);

  return (
    <>
      <Header title="Detail Siswa" />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" render={<Link href="/dashboard/students" />} nativeButton={false}>
            <ArrowLeft className="w-4 h-4 mr-1" />Kembali
          </Button>
        </div>

        {/* Profile Card */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader className="flex-row items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                <User className="w-7 h-7 text-orange-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold">{student.name}</h2>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[student.status]}`}>
                    {statusLabels[student.status]}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground font-mono">{student.studentNumber}</p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <BookOpen className="w-4 h-4" />
                  <span>{student.class?.name || "Belum ada kelas"}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span>Pelatih: {student.class?.coach?.name || "-"}</span>
                </div>
                {student.parentName && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span>Orang Tua: {student.parentName}</span>
                  </div>
                )}
                {student.parentPhone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span>{student.parentPhone}</span>
                  </div>
                )}
                {student.address && (
                  <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                    <MapPin className="w-4 h-4" />
                    <span>{student.address}</span>
                  </div>
                )}
                <div className="text-muted-foreground">
                  Terdaftar: {format(new Date(student.joinDate), "d MMMM yyyy", { locale: idLocale })}
                </div>
                <div className="text-muted-foreground">
                  Cabang: {student.branch?.name}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="space-y-3">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-1">
                  <ClipboardCheck className="w-4 h-4 text-orange-500" />
                  <p className="text-sm text-muted-foreground">Kehadiran (30 terakhir)</p>
                </div>
                <p className={`text-2xl font-bold ${attendancePct >= 80 ? "text-green-600" : attendancePct >= 60 ? "text-orange-500" : "text-red-500"}`}>
                  {attendancePct}%
                </p>
                <p className="text-xs text-muted-foreground">{presentCount}/{totalAttendance} pertemuan</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="w-4 h-4 text-orange-500" />
                  <p className="text-sm text-muted-foreground">Nilai Rata-rata</p>
                </div>
                {avgScore !== null ? (
                  <p className={`text-2xl font-bold ${avgScore >= 80 ? "text-green-600" : avgScore >= 60 ? "text-orange-500" : "text-red-500"}`}>
                    {avgScore}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">Belum dinilai</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-orange-500" />
                  <p className="text-sm text-muted-foreground">Tagihan Belum Lunas</p>
                </div>
                <p className={`text-xl font-bold ${unpaidAmount > 0 ? "text-red-500" : "text-green-600"}`}>
                  {unpaidAmount > 0 ? `Rp ${unpaidAmount.toLocaleString("id-ID")}` : "Lunas"}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Attendance History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-orange-500" />
                Riwayat Kehadiran (30 Terakhir)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {student.attendances.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Belum ada data kehadiran</p>
              ) : (
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {student.attendances.map((a) => (
                    <div key={a.id} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                      <span className="text-muted-foreground">{format(new Date(a.date), "d MMM yyyy")}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{a.class?.name}</span>
                        <span className={`font-medium ${attendanceColors[a.status]}`}>
                          {attendanceLabels[a.status]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Latest Assessment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-4 h-4 text-orange-500" />
                Penilaian Performa
                {latestAssessment && <span className="text-xs font-normal text-muted-foreground">({latestAssessment.period})</span>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!latestAssessment ? (
                <p className="text-sm text-muted-foreground text-center py-4">Belum ada penilaian</p>
              ) : (
                <div className="space-y-3">
                  {skills.map((s) => (
                    <div key={s} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{skillLabels[s]}</span>
                        <span className={`font-bold ${latestAssessment[s] >= 80 ? "text-green-600" : latestAssessment[s] >= 60 ? "text-orange-500" : "text-red-500"}`}>
                          {latestAssessment[s]}
                        </span>
                      </div>
                      <Progress value={latestAssessment[s]} className="h-2" />
                    </div>
                  ))}
                  {latestAssessment.notes && (
                    <p className="text-xs text-muted-foreground border-t pt-2">{latestAssessment.notes}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Invoices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-500" />
              Riwayat Invoice
            </CardTitle>
          </CardHeader>
          <CardContent>
            {student.invoices.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Belum ada invoice</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. Invoice</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Jatuh Tempo</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {student.invoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono text-sm">{inv.invoiceNumber}</TableCell>
                      <TableCell>{inv.type}</TableCell>
                      <TableCell className="font-medium">Rp {Number(inv.amount).toLocaleString("id-ID")}</TableCell>
                      <TableCell>{format(new Date(inv.dueDate), "d MMM yyyy")}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${invoiceStatusColors[inv.status]}`}>
                          {invoiceStatusLabels[inv.status]}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
