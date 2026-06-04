"use client";

import { useState } from "react";
import { submitRegistration } from "./actions";
import {
  User, Phone, Mail, MapPin, Calendar, BookOpen,
  GitBranch, CheckCircle2, AlertCircle, Loader2,
  ArrowRight, ArrowLeft, Baby, Info,
} from "lucide-react";

interface Branch { id: string; name: string; }
interface ClassItem {
  id: string; name: string; ageGroup: string; branchId: string;
  maxStudents: number; _count: { students: number };
}

interface Props {
  branches: Branch[];
  classes: ClassItem[];
  businessName: string;
}

const AGE_GROUPS: Record<string, string> = {
  U8: "U-8", U10: "U-10", U12: "U-12", U14: "U-14", U16: "U-16", SENIOR: "Senior",
};

type Step = 1 | 2 | 3;

const emptyForm = {
  studentName: "", birthDate: "", gender: "MALE" as "MALE" | "FEMALE",
  phone: "", address: "", classId: "", branchId: "",
  parentName: "", parentPhone: "", parentEmail: "", parentAddress: "",
};

export function RegisterClient({ branches, classes, businessName }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);

  function set(key: string, value: string) {
    setForm((p) => ({ ...p, [key]: value }));
    setError("");
  }

  const filteredClasses = form.branchId
    ? classes.filter((c) => c.branchId === form.branchId)
    : classes;

  function canGoStep2() {
    return form.studentName.length >= 2 && form.gender && form.branchId;
  }

  function canGoStep3() {
    return form.parentName.length >= 2 && form.parentPhone.length >= 8;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canGoStep3()) { setError("Lengkapi data orang tua"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await submitRegistration({
        studentName: form.studentName,
        birthDate: form.birthDate || undefined,
        gender: form.gender,
        phone: form.phone || undefined,
        address: form.address || undefined,
        classId: form.classId || undefined,
        branchId: form.branchId,
        parentName: form.parentName,
        parentPhone: form.parentPhone,
        parentEmail: form.parentEmail || undefined,
        parentAddress: form.parentAddress || undefined,
      });
      setResult(res);
      setStep(3);
    } catch (err: any) {
      setError(err.message ?? "Pendaftaran gagal. Silakan coba lagi.");
    }
    setLoading(false);
  }

  const stepLabels = ["Data Siswa", "Data Orang Tua", "Selesai"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-sm shadow-orange-200">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.5"/>
              <path d="M12 2C12 2 8 7 8 12C8 17 12 22 12 22" stroke="white" strokeWidth="1.5"/>
              <path d="M12 2C12 2 16 7 16 12C16 17 12 22 12 22" stroke="white" strokeWidth="1.5"/>
              <path d="M2 12H22" stroke="white" strokeWidth="1.5"/>
            </svg>
          </div>
          <div>
            <p className="font-bold text-sm text-gray-900 leading-tight">{businessName}</p>
            <p className="text-xs text-gray-400">Pendaftaran Siswa Online</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Step indicator */}
        {step < 3 && (
          <div className="flex items-center gap-2 mb-8">
            {stepLabels.map((label, i) => {
              const s = (i + 1) as Step;
              const isActive = step === s;
              const isDone = step > s;
              return (
                <div key={i} className="flex items-center gap-2 flex-1">
                  <div className="flex items-center gap-2 flex-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                      isDone ? "bg-green-500 text-white" : isActive ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-400"
                    }`}>
                      {isDone ? <CheckCircle2 className="w-4 h-4" /> : s}
                    </div>
                    <span className={`text-xs font-medium hidden sm:block ${isActive ? "text-orange-600" : isDone ? "text-green-600" : "text-gray-400"}`}>
                      {label}
                    </span>
                  </div>
                  {i < stepLabels.length - 1 && (
                    <div className={`h-0.5 flex-1 rounded-full mx-1 ${step > s ? "bg-green-300" : "bg-gray-100"}`} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && result && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Pendaftaran Berhasil!</h2>
            <p className="text-sm text-gray-400 mb-6">Selamat datang di {businessName}</p>

            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-6 text-left space-y-2">
              <p className="text-xs font-semibold text-orange-700 mb-3">Detail Pendaftaran</p>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <User className="w-4 h-4 text-gray-400" /> {result.student.name}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <GitBranch className="w-4 h-4 text-gray-400" /> {result.student.branch?.name}
              </div>
              {result.student.class && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <BookOpen className="w-4 h-4 text-gray-400" /> Kelas {result.student.class.name}
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Baby className="w-4 h-4 text-gray-400" /> Orang tua: {result.parent.fullName}
              </div>
              <div className="pt-2 border-t border-orange-100">
                <p className="text-xs text-gray-400">Nomor Siswa</p>
                <p className="text-base font-bold text-orange-600">{result.student.studentNumber}</p>
              </div>
            </div>

            <div className="flex items-start gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-6 text-left">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              Admin kami akan menghubungi <strong>{form.parentPhone}</strong> untuk informasi lebih lanjut mengenai jadwal latihan dan pembayaran.
            </div>

            <button
              onClick={() => { setForm(emptyForm); setResult(null); setStep(1); }}
              className="w-full border border-gray-200 text-gray-600 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors"
            >
              Daftar Siswa Lain
            </button>
          </div>
        )}

        {/* Step 1: Student Data */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h1 className="text-xl font-bold text-gray-900 mb-1">Data Siswa</h1>
              <p className="text-sm text-gray-400">Lengkapi informasi calon siswa baru</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Nama Lengkap Siswa *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={form.studentName}
                    onChange={(e) => set("studentName", e.target.value)}
                    placeholder="Nama lengkap siswa"
                    required
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1.5">Jenis Kelamin *</label>
                  <select
                    value={form.gender}
                    onChange={(e) => set("gender", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  >
                    <option value="MALE">Laki-laki</option>
                    <option value="FEMALE">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1.5">Tanggal Lahir</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={form.birthDate}
                      onChange={(e) => set("birthDate", e.target.value)}
                      className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Nomor HP Siswa (opsional)</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Alamat</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <textarea
                    rows={2}
                    value={form.address}
                    onChange={(e) => set("address", e.target.value)}
                    placeholder="Alamat lengkap siswa"
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-orange-500" /> Cabang & Kelas
              </h3>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Pilih Cabang *</label>
                <select
                  value={form.branchId}
                  onChange={(e) => { set("branchId", e.target.value); set("classId", ""); }}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  <option value="">-- Pilih Cabang --</option>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>

              {form.branchId && (
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1.5">Pilih Kelas (opsional)</label>
                  <div className="grid gap-2">
                    {filteredClasses.length === 0 ? (
                      <p className="text-sm text-gray-400 py-2">Tidak ada kelas tersedia di cabang ini</p>
                    ) : (
                      filteredClasses.map((cls) => {
                        const isFull = cls._count.students >= cls.maxStudents;
                        return (
                          <button
                            key={cls.id}
                            type="button"
                            disabled={isFull}
                            onClick={() => set("classId", form.classId === cls.id ? "" : cls.id)}
                            className={`text-left border rounded-xl p-3 transition-all ${
                              form.classId === cls.id
                                ? "border-orange-400 bg-orange-50"
                                : isFull
                                ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                                : "border-gray-100 hover:border-orange-200 hover:bg-orange-50/50"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900 text-sm">{cls.name}</p>
                                <p className="text-xs text-gray-400 mt-0.5">Usia: {AGE_GROUPS[cls.ageGroup] ?? cls.ageGroup}</p>
                              </div>
                              <div className="text-right">
                                <p className={`text-xs font-medium ${isFull ? "text-red-500" : "text-green-600"}`}>
                                  {isFull ? "Penuh" : `${cls._count.students}/${cls.maxStudents}`}
                                </p>
                                {form.classId === cls.id && (
                                  <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center mt-1 ml-auto">
                                    <CheckCircle2 className="w-3 h-3 text-white" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={!canGoStep2()}
              onClick={() => { if (canGoStep2()) setStep(2); }}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-md shadow-orange-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Lanjutkan ke Data Orang Tua <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Parent Data */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <button type="button" onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-4 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Kembali
              </button>
              <h1 className="text-xl font-bold text-gray-900 mb-1">Data Orang Tua / Wali</h1>
              <p className="text-sm text-gray-400">Informasi orang tua atau wali siswa</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Nama Orang Tua / Wali *</label>
                <div className="relative">
                  <Baby className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={form.parentName}
                    onChange={(e) => set("parentName", e.target.value)}
                    placeholder="Nama lengkap orang tua"
                    required
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Nomor WhatsApp *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={form.parentPhone}
                    onChange={(e) => set("parentPhone", e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    required
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Info pendaftaran akan dikirim ke nomor ini</p>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Email (opsional)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={form.parentEmail}
                    onChange={(e) => set("parentEmail", e.target.value)}
                    placeholder="email@contoh.com"
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Alamat (opsional)</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <textarea
                    rows={2}
                    value={form.parentAddress}
                    onChange={(e) => set("parentAddress", e.target.value)}
                    placeholder="Alamat orang tua"
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Review summary */}
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 space-y-2 text-sm">
              <p className="font-semibold text-orange-700 text-xs mb-3">Ringkasan Pendaftaran</p>
              <div className="flex items-center gap-2 text-gray-600"><User className="w-4 h-4 text-gray-400" /> {form.studentName}</div>
              <div className="flex items-center gap-2 text-gray-600">
                <GitBranch className="w-4 h-4 text-gray-400" />
                {branches.find((b) => b.id === form.branchId)?.name ?? "—"}
              </div>
              {form.classId && (
                <div className="flex items-center gap-2 text-gray-600">
                  <BookOpen className="w-4 h-4 text-gray-400" />
                  Kelas: {filteredClasses.find((c) => c.id === form.classId)?.name ?? "—"}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !canGoStep3()}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-md shadow-orange-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {loading ? "Memproses..." : "Selesaikan Pendaftaran"}
            </button>
          </form>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-gray-100 py-6">
        <div className="max-w-2xl mx-auto px-4 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} {businessName} · Pendaftaran Online
        </div>
      </footer>
    </div>
  );
}
