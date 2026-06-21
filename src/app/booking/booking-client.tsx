"use client";

import { useState } from "react";
import { checkPublicAvailability, createPublicBooking, getBookingStatus } from "./actions";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  Calendar, Clock, MapPin, User, Phone, CheckCircle2,
  Search, ArrowRight, Building2, Info, ChevronRight, X,
  AlertCircle, Loader2,
} from "lucide-react";

interface Court {
  id: string;
  name: string;
  courtNumber: number;
  type: string;
  description: string | null;
  branch: { id: string; name: string };
}

interface Props {
  courts: Court[];
  businessName: string;
}

type Step = "form" | "confirm" | "success" | "track";

const HOURS = Array.from({ length: 15 }, (_, i) => {
  const h = i + 7;
  return `${String(h).padStart(2, "0")}:00`;
});

const DEFAULT_PRICE = 100000;

function fmt(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

export function BookingClient({ courts, businessName }: Props) {
  const [step, setStep] = useState<Step>("form");
  const [loading, setLoading] = useState(false);
  const [avail, setAvail] = useState<{ available: boolean; reason?: string } | null>(null);
  const [checkingAvail, setCheckingAvail] = useState(false);
  const [error, setError] = useState("");
  const [successBooking, setSuccessBooking] = useState<any>(null);

  // Track form
  const [trackNum, setTrackNum] = useState("");
  const [trackResult, setTrackResult] = useState<any>(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState("");

  const [form, setForm] = useState({
    courtId: "",
    customerName: "",
    customerPhone: "",
    date: "",
    startTime: "08:00",
    endTime: "09:00",
    notes: "",
  });

  const selectedCourt = courts.find((c) => c.id === form.courtId);
  const startH = parseInt(form.startTime);
  const endH = parseInt(form.endTime);
  const duration = endH > startH ? endH - startH : 0;
  const total = duration * DEFAULT_PRICE;

  function set(key: string, val: string) {
    setForm((p) => ({ ...p, [key]: val }));
    setAvail(null);
    setError("");
  }

  async function handleCheckAvail() {
    if (!form.courtId || !form.date || !form.startTime || !form.endTime) return;
    setCheckingAvail(true);
    setAvail(null);
    const res = await checkPublicAvailability(form.courtId, form.date, form.startTime, form.endTime);
    setAvail(res);
    setCheckingAvail(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.customerName || !form.customerPhone || !form.courtId || !form.date || duration <= 0) {
      setError("Lengkapi semua data yang diperlukan");
      return;
    }
    setStep("confirm");
  }

  async function handleConfirm() {
    setLoading(true);
    setError("");
    try {
      const res = await createPublicBooking(form);
      if (!res.success) {
        setError(res.error ?? "Terjadi kesalahan");
        setStep("form");
      } else {
        setSuccessBooking(res.booking);
        setStep("success");
      }
    } catch (err: any) {
      setError(err.message);
      setStep("form");
    }
    setLoading(false);
  }

  async function handleTrack() {
    if (!trackNum.trim()) return;
    setTrackLoading(true);
    setTrackError("");
    const res = await getBookingStatus(trackNum.trim().toUpperCase());
    if (!res.found) setTrackError("Nomor booking tidak ditemukan");
    else setTrackResult(res.booking);
    setTrackLoading(false);
  }

  const STATUS_MAP: Record<string, { label: string; cls: string }> = {
    PENDING: { label: "Menunggu Konfirmasi", cls: "text-amber-700 bg-amber-50 border-amber-200" },
    CONFIRMED: { label: "Dikonfirmasi", cls: "text-green-700 bg-green-50 border-green-200" },
    CANCELLED: { label: "Dibatalkan", cls: "text-destructive bg-destructive/10 border-destructive/20" },
    COMPLETED: { label: "Selesai", cls: "text-blue-700 bg-blue-50 border-blue-200" },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-10 via-surface to-primary-10/30">
      {/* Header */}
      <header className="bg-surface border-b border-neutral sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary-80 rounded-xl flex items-center justify-center shadow-sm shadow-primary/20">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.5"/>
                <path d="M12 2C12 2 8 7 8 12C8 17 12 22 12 22" stroke="white" strokeWidth="1.5"/>
                <path d="M12 2C12 2 16 7 16 12C16 17 12 22 12 22" stroke="white" strokeWidth="1.5"/>
                <path d="M2 12H22" stroke="white" strokeWidth="1.5"/>
              </svg>
            </div>
            <div>
              <p className="font-bold text-sm text-on-surface leading-tight">{businessName}</p>
              <p className="text-xs text-muted-foreground">Online Booking</p>
            </div>
          </div>
          <button
            onClick={() => { setStep("track"); setTrackResult(null); setTrackError(""); }}
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-primary-10"
          >
            <Search className="w-4 h-4" />
            Cek Status Booking
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Track Step */}
        {step === "track" && (
          <div className="max-w-md mx-auto">
            <button onClick={() => setStep("form")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
              <X className="w-3.5 h-3.5" /> Kembali ke Booking
            </button>
            <div className="bg-surface rounded-md border border-neutral shadow-sm p-6">
              <h2 className="text-lg font-bold text-on-surface mb-1">Cek Status Booking</h2>
              <p className="text-sm text-muted-foreground mb-5">Masukkan nomor booking yang kamu terima saat pemesanan</p>
              <div className="flex gap-2">
                <input
                  value={trackNum}
                  onChange={(e) => setTrackNum(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleTrack()}
                  placeholder="BK-20240601-1234"
                  className="flex-1 border border-border rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  onClick={handleTrack}
                  disabled={trackLoading}
                  className="bg-primary hover:bg-primary-80 text-white px-4 py-2.5 rounded-full font-medium text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {trackLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Cari
                </button>
              </div>
              {trackError && (
                <div className="mt-4 flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-4 py-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {trackError}
                </div>
              )}
              {trackResult && (
                <div className="mt-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-on-surface">{trackResult.bookingNumber}</p>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_MAP[trackResult.status]?.cls}`}>
                      {STATUS_MAP[trackResult.status]?.label ?? trackResult.status}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-foreground bg-muted/50 rounded-md p-4">
                    <div className="flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground" />{trackResult.customerName}</div>
                    <div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-muted-foreground" />{trackResult.court?.name} — {trackResult.court?.branch?.name}</div>
                    <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" />
                      {format(new Date(trackResult.date), "EEEE, dd MMMM yyyy", { locale: id })}
                    </div>
                    <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-muted-foreground" />
                      {format(new Date(trackResult.startTime), "HH:mm")} – {format(new Date(trackResult.endTime), "HH:mm")}
                      <span className="text-muted-foreground">({trackResult.duration} jam)</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border font-semibold text-on-surface">
                      <span>Total</span>
                      <span className="text-primary">{fmt(Number(trackResult.totalAmount))}</span>
                    </div>
                  </div>
                  {trackResult.status === "PENDING" && (
                    <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-4 py-3">
                      <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      Booking sedang diproses. Admin akan menghubungi kamu melalui WhatsApp untuk konfirmasi pembayaran.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Success Step */}
        {step === "success" && successBooking && (
          <div className="max-w-md mx-auto">
            <div className="bg-surface rounded-md border border-neutral shadow-sm p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-on-surface mb-1">Booking Berhasil!</h2>
              <p className="text-sm text-muted-foreground mb-6">Simpan nomor booking kamu di bawah ini</p>

              <div className="bg-primary-10 border border-primary-20 rounded-md p-4 mb-6">
                <p className="text-xs text-muted-foreground mb-1">Nomor Booking</p>
                <p className="text-2xl font-bold text-primary tracking-wider">{successBooking.bookingNumber}</p>
              </div>

              <div className="text-left space-y-2 text-sm bg-muted/50 rounded-md p-4 mb-6">
                <div className="flex items-center gap-2 text-foreground"><Building2 className="w-4 h-4 text-muted-foreground" />{successBooking.court?.name}</div>
                <div className="flex items-center gap-2 text-foreground"><MapPin className="w-4 h-4 text-muted-foreground" />{successBooking.court?.branch?.name}</div>
                <div className="flex items-center gap-2 text-foreground"><Calendar className="w-4 h-4 text-muted-foreground" />
                  {format(new Date(successBooking.date), "EEEE, dd MMMM yyyy", { locale: id })}
                </div>
                <div className="flex items-center gap-2 text-foreground"><Clock className="w-4 h-4 text-muted-foreground" />
                  {format(new Date(successBooking.startTime), "HH:mm")} – {format(new Date(successBooking.endTime), "HH:mm")}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border font-semibold text-on-surface">
                  <span>Total Pembayaran</span>
                  <span className="text-primary">{fmt(Number(successBooking.totalAmount))}</span>
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-md px-4 py-3 mb-6 text-left">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                Admin kami akan menghubungi <strong>{successBooking.customerPhone}</strong> via WhatsApp untuk konfirmasi pembayaran.
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setStep("track"); setTrackNum(successBooking.bookingNumber); setTrackResult(null); }}
                  className="flex-1 border border-border text-foreground py-2.5 rounded-full font-medium text-sm hover:bg-muted/50 transition-colors"
                >
                  Cek Status
                </button>
                <button
                  onClick={() => {
                    setStep("form");
                    setForm({ courtId: "", customerName: "", customerPhone: "", date: "", startTime: "08:00", endTime: "09:00", notes: "" });
                    setAvail(null);
                    setSuccessBooking(null);
                    setError("");
                  }}
                  className="flex-1 bg-primary hover:bg-primary-80 text-white py-2.5 rounded-full font-medium text-sm transition-colors"
                >
                  Booking Lagi
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Step */}
        {step === "confirm" && (
          <div className="max-w-md mx-auto">
            <button onClick={() => setStep("form")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
              <X className="w-3.5 h-3.5" /> Kembali edit
            </button>
            <div className="bg-surface rounded-md border border-neutral shadow-sm p-6">
              <h2 className="text-lg font-bold text-on-surface mb-1">Konfirmasi Booking</h2>
              <p className="text-sm text-muted-foreground mb-5">Pastikan detail booking sudah benar</p>

              <div className="space-y-3 text-sm bg-muted/50 rounded-md p-4 mb-5">
                <div className="flex items-center gap-2 text-foreground"><User className="w-4 h-4 text-muted-foreground" />{form.customerName}</div>
                <div className="flex items-center gap-2 text-foreground"><Phone className="w-4 h-4 text-muted-foreground" />{form.customerPhone}</div>
                <div className="flex items-center gap-2 text-foreground"><Building2 className="w-4 h-4 text-muted-foreground" />{selectedCourt?.name} — {selectedCourt?.branch?.name}</div>
                <div className="flex items-center gap-2 text-foreground"><Calendar className="w-4 h-4 text-muted-foreground" />
                  {form.date && format(new Date(form.date), "EEEE, dd MMMM yyyy", { locale: id })}
                </div>
                <div className="flex items-center gap-2 text-foreground"><Clock className="w-4 h-4 text-muted-foreground" />
                  {form.startTime} – {form.endTime} <span className="text-muted-foreground">({duration} jam)</span>
                </div>
                {form.notes && <div className="flex items-start gap-2 text-foreground pt-1 border-t border-border"><Info className="w-4 h-4 text-muted-foreground mt-0.5" />{form.notes}</div>}
                <div className="flex items-center justify-between pt-2 border-t border-border font-bold text-on-surface">
                  <span>Total</span>
                  <span className="text-primary">{fmt(total)}</span>
                </div>
              </div>

              {error && (
                <div className="mb-4 flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-4 py-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
              )}

              <button
                onClick={handleConfirm}
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-80 text-white py-3 rounded-full font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {loading ? "Memproses..." : "Konfirmasi & Buat Booking"}
              </button>
            </div>
          </div>
        )}

        {/* Form Step */}
        {step === "form" && (
          <div className="grid lg:grid-cols-5 gap-6">
            {/* Left: Form */}
            <div className="lg:col-span-3">
              <div className="mb-6">
                <h1 className="headline-sm text-on-surface mb-1">Booking Lapangan</h1>
                <p className="text-sm text-muted-foreground">Pesan lapangan basket secara online, konfirmasi via WhatsApp</p>
              </div>

              {error && (
                <div className="mb-5 flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-4 py-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Court Selection */}
                <div className="bg-surface rounded-md border border-neutral shadow-sm p-5 space-y-4">
                  <h3 className="font-semibold text-on-surface text-sm flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" /> Pilih Lapangan
                  </h3>
                  <div className="grid gap-3">
                    {courts.map((court) => (
                      <button
                        key={court.id}
                        type="button"
                        onClick={() => set("courtId", court.id)}
                        className={`text-left border rounded-md p-4 transition-all ${
                          form.courtId === court.id
                            ? "border-primary bg-primary-10 shadow-sm shadow-primary/10"
                            : "border-neutral hover:border-primary-20 hover:bg-primary-10/50"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-on-surface text-sm">{court.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">{court.branch.name}</span>
                              <span className="text-xs text-muted-foreground/50">•</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${court.type === "INDOOR" ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"}`}>
                                {court.type === "INDOOR" ? "Indoor" : "Outdoor"}
                              </span>
                            </div>
                            {court.description && <p className="text-xs text-muted-foreground mt-1">{court.description}</p>}
                          </div>
                          {form.courtId === court.id && (
                            <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                              <CheckCircle2 className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-primary mt-2">{fmt(DEFAULT_PRICE)}/jam</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date & Time */}
                <div className="bg-surface rounded-md border border-neutral shadow-sm p-5 space-y-4">
                  <h3 className="font-semibold text-on-surface text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" /> Tanggal & Waktu
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="label-md text-foreground block mb-1.5">Tanggal *</label>
                      <input
                        type="date"
                        value={form.date}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) => set("date", e.target.value)}
                        required
                        className="w-full border border-border rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label-md text-foreground block mb-1.5">Mulai *</label>
                        <select
                          value={form.startTime}
                          onChange={(e) => set("startTime", e.target.value)}
                          className="w-full border border-border rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="label-md text-foreground block mb-1.5">Selesai *</label>
                        <select
                          value={form.endTime}
                          onChange={(e) => set("endTime", e.target.value)}
                          className="w-full border border-border rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          {HOURS.filter((h) => h > form.startTime).map((h) => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Availability check */}
                  {form.courtId && form.date && form.startTime && form.endTime && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleCheckAvail}
                        disabled={checkingAvail}
                        className="flex items-center gap-2 text-sm text-primary font-medium hover:text-primary transition-colors disabled:opacity-50"
                      >
                        {checkingAvail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        {checkingAvail ? "Mengecek..." : "Cek Ketersediaan"}
                      </button>
                      {avail?.available === true && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-100 rounded-md px-3 py-2">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Lapangan tersedia pada waktu ini
                        </div>
                      )}
                      {avail?.available === false && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                          <AlertCircle className="w-3.5 h-3.5" /> {avail.reason ?? "Lapangan tidak tersedia. Pilih waktu lain."}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Personal Info */}
                <div className="bg-surface rounded-md border border-neutral shadow-sm p-5 space-y-4">
                  <h3 className="font-semibold text-on-surface text-sm flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" /> Data Pemesan
                  </h3>
                  <div>
                    <label className="label-md text-foreground block mb-1.5">Nama Lengkap *</label>
                    <input
                      type="text"
                      value={form.customerName}
                      onChange={(e) => set("customerName", e.target.value)}
                      placeholder="Masukkan nama lengkap"
                      required
                      className="w-full border border-border rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="label-md text-foreground block mb-1.5">Nomor WhatsApp *</label>
                    <input
                      type="tel"
                      value={form.customerPhone}
                      onChange={(e) => set("customerPhone", e.target.value)}
                      placeholder="08xxxxxxxxxx"
                      required
                      className="w-full border border-border rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Konfirmasi booking akan dikirim ke nomor ini</p>
                  </div>
                  <div>
                    <label className="label-md text-foreground block mb-1.5">Catatan (opsional)</label>
                    <textarea
                      rows={2}
                      value={form.notes}
                      onChange={(e) => set("notes", e.target.value)}
                      placeholder="Contoh: butuh bola, dll."
                      className="w-full border border-border rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary-80 text-white py-3.5 rounded-full font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-md shadow-primary/20"
                >
                  Lanjutkan <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Right: Summary */}
            <div className="lg:col-span-2">
              <div className="sticky top-24 space-y-4">
                <div className="bg-surface rounded-md border border-neutral shadow-sm p-5">
                  <h3 className="font-semibold text-on-surface mb-4 text-sm">Ringkasan Booking</h3>
                  {!form.courtId && !form.date ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Pilih lapangan dan waktu untuk melihat ringkasan</p>
                  ) : (
                    <div className="space-y-3 text-sm">
                      {selectedCourt && (
                        <div className="flex items-start gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-on-surface">{selectedCourt.name}</p>
                            <p className="text-xs text-muted-foreground">{selectedCourt.branch.name}</p>
                          </div>
                        </div>
                      )}
                      {form.date && (
                        <div className="flex items-center gap-2 text-foreground">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {format(new Date(form.date), "EEE, dd MMM yyyy", { locale: id })}
                        </div>
                      )}
                      {form.startTime && form.endTime && (
                        <div className="flex items-center gap-2 text-foreground">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          {form.startTime} – {form.endTime}
                          {duration > 0 && <span className="text-muted-foreground">({duration} jam)</span>}
                        </div>
                      )}
                      {duration > 0 && (
                        <div className="pt-3 border-t border-neutral space-y-2">
                          <div className="flex justify-between text-tertiary">
                            <span>{duration} jam × {fmt(DEFAULT_PRICE)}</span>
                            <span>{fmt(total)}</span>
                          </div>
                          <div className="flex justify-between font-bold text-on-surface text-base">
                            <span>Total</span>
                            <span className="text-primary">{fmt(total)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-md p-4 space-y-2">
                  <p className="text-xs font-semibold text-blue-700 flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> Cara Booking</p>
                  {["Isi form booking", "Konfirmasi detail", "Admin hubungi via WA", "Lakukan pembayaran", "Selesai!"].map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                      <span className="text-xs text-blue-700">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-neutral py-6">
        <div className="max-w-5xl mx-auto px-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {businessName} · Sistem Booking Online
        </div>
      </footer>
    </div>
  );
}
