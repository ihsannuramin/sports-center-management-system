# PRD — Sports Center Management System

**Versi:** 1.4.0  
**Terakhir Diperbarui:** 2026-06-03  
**Stack:** Next.js 16.2.7 · TypeScript · Tailwind CSS v4 · Prisma v5 · Supabase PostgreSQL · shadcn/ui

---

## 1. Ringkasan Produk

Sistem manajemen terpadu untuk pusat olahraga berbasis UMKM (Basketball Academy + Court Rental). Dirancang multi-cabang, cocok di-deploy ke Vercel, dengan target pengguna admin/operator lapangan.

**Tujuan Utama:**
- Mengelola siswa, pelatih, dan kelas akademi basket
- Mengelola sewa lapangan dengan kalender real-time
- Mengelola pembayaran, tagihan, dan keuangan
- Mencatat inventaris dan penilaian performa siswa

---

## 2. Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Framework | Next.js 16.2.7 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui + @base-ui/react (bukan Radix) |
| ORM | Prisma v5.22 |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth (SSR via @supabase/ssr) |
| Charts | Recharts |
| Calendar | FullCalendar v6 (daygrid, timegrid, interaction) |
| Export | SheetJS (xlsx) |
| Date | date-fns |
| Notifikasi | Sonner |

---

## 3. Arsitektur & Konvensi

- `src/proxy.ts` = middleware Next.js 16 (bukan `middleware.ts`)
- Semua halaman dashboard pakai `export const dynamic = "force-dynamic"`
- Supabase client dibuat lazily di dalam handler (bukan di body komponen)
- Client components pakai `useRouter().refresh()` (bukan `window.location.reload()`)
- FullCalendar di-import dinamis dengan `{ ssr: false }`
- @base-ui/react: pakai prop `render` (bukan `asChild`)
- Select `onValueChange` mengembalikan `(value: string | null)` — selalu guard dengan `v && ...`

---

## 4. Setup & Deployment

```bash
# 1. Isi .env dengan kredensial Supabase
# 2. Apply schema database
npm run db:push

# 3. Seed data awal (roles + cabang default)
npm run db:seed

# 4. Buat admin pertama manual di Supabase Auth + SQL

# Development
npm run dev

# Build
npm run build
```

---

## 5. Modul & Fitur

### 5.1 Auth
- Login dengan email/password via Supabase
- Reset password
- Session management via SSR cookies

---

### 5.2 Dashboard
- Statistik ringkas: total siswa aktif, pelatih, lapangan, pendapatan bulan ini
- Grafik pendapatan bulanan (Recharts — bar/line)
- Status lapangan real-time (available/booked/maintenance)
- Split pendapatan: Akademi vs Rental

---

### 5.3 Siswa (`/dashboard/students`)
**Fitur:**
- Daftar siswa dengan tabel
- Filter: status (Aktif/Tidak Aktif/Ditangguhkan) · kelas · cabang
- Pencarian: nama, nomor siswa, nama orang tua
- Tambah / Edit siswa (form modal)
- Tangguhkan / Aktifkan siswa
- Halaman detail siswa (`/dashboard/students/[id]`): riwayat absensi, invoice, penilaian
- **Pagination:** 10/25/50 baris per halaman, reset saat filter berubah
- **Export Excel:** semua data terfilter (No. Siswa, Nama, Jenis Kelamin, Tanggal Lahir, No. HP, Orang Tua, Kelas, Cabang, Status)

**Kolom Tabel:** No. Siswa · Nama · Kelas · Orang Tua · Cabang · Status

---

### 5.4 Pelatih (`/dashboard/coaches`)
**Fitur:**
- Daftar pelatih dengan pencarian nama
- Tambah / Edit pelatih
- Aktifkan / Nonaktifkan pelatih
- Tampilkan jumlah kelas yang diajar
- **Pagination:** 10/25/50 baris per halaman
- **Export Excel:** Nama, No. HP, Email, Spesialisasi, Jumlah Kelas, Cabang, Status

**Kolom Tabel:** Pelatih (avatar + nama + HP) · Spesialisasi · Kelas Diajar · Cabang · Status

---

### 5.5 Kelas (`/dashboard/classes`)
**Fitur:**
- Daftar kelas dengan kapasitas siswa (terisi/maksimal)
- Tambah / Edit / Hapus kelas
- Kelompok umur: U8, U10, U12, U14, U16, Senior
- Assign pelatih dan cabang
- Indikator merah jika kelas penuh
- **Pagination:** 10/25/50 baris per halaman
- **Export Excel:** Nama Kelas, Kelompok Umur, Jadwal, Pelatih, Jumlah Siswa, Maks Siswa, Cabang

**Kolom Tabel:** Nama Kelas · Kelompok Umur · Jadwal · Pelatih · Siswa · Cabang

---

### 5.6 Absensi (`/dashboard/attendance`)
**Fitur:**
- Input absensi harian per kelas (Hadir/Izin/Sakit/Alpha)
- Tab Absensi Pelatih
- Tab Rekap Bulanan
- Fungsi: `getClassesForAttendance()` — include array `students`
- Fungsi: `saveCoachAttendance()` + `getCoachAttendance()`

---

### 5.7 Penilaian Performa (`/dashboard/assessments`)
**Fitur:**
- 6 skill: Dribbling, Passing, Shooting, Defense, Stamina, Attitude (0–100, slider)
- Input per siswa per periode
- Tampilkan progress bar per skill + rata-rata
- Warna rata-rata: hijau (≥80) · oranye (≥60) · merah (<60)
- **Pagination:** 10/25/50 baris per halaman
- **Export Excel:** Siswa, Periode, semua nilai skill, Rata-rata, Catatan

**Kolom Tabel:** Siswa · Periode · 6 Skill (nilai + progress bar) · Rata-rata

---

### 5.8 Invoice (`/dashboard/invoices`)
**Fitur:**
- Jenis tagihan: Pendaftaran, Bulanan, Turnamen, Merchandise
- Buat invoice manual per siswa
- Bulk invoice bulanan untuk semua siswa aktif (bisa filter per cabang)
- Update status: Belum Dibayar → Lunas
- Filter status: Belum Dibayar / Lunas / Jatuh Tempo / Dibatalkan
- Summary cards: Total Invoice, Total Belum Dibayar, Sudah Lunas
- **Pagination:** 10/25/50 baris per halaman, reset saat filter berubah
- **Export Excel:** No. Invoice, Siswa, Jenis, Jumlah (Rp), Jatuh Tempo, Status

**Fungsi Kunci:** `bulkCreateMonthlyInvoices()` — buat MONTHLY invoice untuk semua siswa aktif

---

### 5.9 Pembayaran (`/dashboard/payments`)
**Fitur:**
- Riwayat semua pembayaran
- Filter: Menunggu Verifikasi / Terverifikasi / Ditolak / Semua
- Verifikasi / Tolak transfer bukti manual
- Input pembayaran tunai (langsung auto-verifikasi)
- Lihat bukti transfer (preview gambar)
- Banner alert jika ada pembayaran menunggu verifikasi
- **Pagination:** 10/25/50 baris per halaman
- **Export Excel:** Tanggal, Siswa/Booking, No. Referensi, Jumlah (Rp), Metode, Status

**Fungsi Kunci:** `verifyPayment(id)` — auto-resolve verifier dari Supabase session

---

### 5.10 Lapangan & Jadwal (`/dashboard/courts`)
**Fitur (Tab: Lapangan):**
- Daftar lapangan (Indoor/Outdoor)
- Tambah lapangan
- Aktifkan / Nonaktifkan lapangan
- **Pagination:** 10/25/50 per halaman
- **Export Excel:** No., Nama, Tipe, Cabang, Status

**Fitur (Tab: Jadwal Blokir):**
- Blokir lapangan untuk: Perawatan, Latihan Akademi
- Input waktu mulai & selesai
- **Pagination:** 10/25/50 per halaman
- **Export Excel:** Lapangan, Judul, Tipe, Mulai, Selesai

---

### 5.11 Rental Lapangan (`/dashboard/rentals`)
**Fitur (Tab: Kalender):**
- Kalender FullCalendar (Month/Week/Day view)
- Klik slot kosong → form booking baru
- Klik event → dialog detail booking
- Filter per lapangan (update kalender real-time)
- Cek ketersediaan lapangan sebelum booking
- Legend warna status booking
- API: `GET /api/rentals/events?start=&end=&courtId=`

**Fitur (Tab: Daftar Booking):**
- Tabel semua booking
- Filter status: Semua / Menunggu / Dikonfirmasi / Dibatalkan / Selesai
- Konfirmasi / Batalkan / Selesaikan booking
- **Pagination:** 10/25/50 per halaman
- **Export Excel:** No. Booking, Pelanggan, No. HP, Lapangan, Tanggal, Jam Mulai, Jam Selesai, Durasi, Total (Rp), Status

**Status Booking:** PENDING → CONFIRMED → COMPLETED / CANCELLED

---

### 5.12 Inventaris (`/dashboard/inventory`)
**Fitur:**
- Kategori: Bola, Cone, Jersey, Peralatan, Lainnya
- Alert banner jika ada item stok rendah (quantity ≤ minStock)
- Indikator merah per baris jika stok rendah
- Tambah / Edit / Hapus item
- **Pagination:** 10/25/50 per halaman
- **Export Excel:** Nama, Kategori, Stok, Min. Stok, Satuan, Cabang, Status Stok

---

### 5.13 Cabang (`/dashboard/branches`)
**Fitur:**
- Tampilan card grid (bukan tabel)
- Statistik per cabang: jumlah Siswa, Pelatih, Lapangan
- Tambah / Edit cabang
- Aktifkan / Nonaktifkan cabang
- **Pagination card:** 9 card per halaman (tombol Sebelumnya/Berikutnya)
- **Export Excel:** Nama Cabang, Alamat, Telepon, Jumlah Siswa, Pelatih, Lapangan, Status

---

### 5.14 Jadwal / Kalender (`/dashboard/schedule`)
- Kalender FullCalendar full-page (Month/Week/Day)
- Gabungkan event: rental + jadwal_akademi + perawatan
- Dinamis import (`{ ssr: false }`)
- API: `GET /api/calendar?start=&end=`

---

## 6. Komponen Shared

### `DataPagination` (`/components/ui/data-pagination.tsx`)
Komponen pagination reusable untuk semua tabel.
- Dropdown pilih ukuran halaman: 10 / 25 / 50
- Tampilkan range: "1–10 dari 45"
- Tombol prev/next dengan disable state
- Props: `total`, `page`, `pageSize`, `onPageChange`, `onPageSizeChange`

### `exportToExcel` (`/lib/export.ts`)
Utility export menggunakan SheetJS (xlsx).
- `exportToExcel(data, filename, sheetName?)`
- Download langsung ke browser sebagai file `.xlsx`

---

## 7. API Routes

| Endpoint | Method | Deskripsi |
|----------|--------|-----------|
| `/api/calendar` | GET | Events FullCalendar (rental + jadwal) |
| `/api/rentals/events` | GET | Events khusus halaman rental |

Query params: `start`, `end`, `courtId` (opsional)

---

## 8. Changelog

### v1.3.0 — 2026-06-03
**Fitur Baru:**
- **Pagination** ditambahkan ke semua 9 menu tabel (Siswa, Pelatih, Kelas, Invoice, Pembayaran, Penilaian, Lapangan, Rental, Inventaris, Cabang)
  - Pilihan tampilkan: 10 / 25 / 50 baris per halaman
  - Auto reset ke halaman 1 saat filter/pencarian berubah
  - Cabang: pagination card 9 per halaman
- **Export Excel** ditambahkan ke semua menu
  - Export data yang sedang difilter (bukan hanya halaman aktif)
  - Tombol "Export Excel" di header setiap halaman
  - Format file: `Nama-Menu_YYYY.xlsx`
- **Komponen baru:** `DataPagination` (reusable)
- **Utility baru:** `lib/export.ts` (SheetJS wrapper)
- **Dependency baru:** `xlsx` (SheetJS)

### v1.2.0 — Sebelumnya
**Modul Selesai:**
- Auth (login, reset password)
- Dashboard stats + charts + realtime court status
- Siswa CRUD + filter + halaman detail
- Pelatih, Kelas CRUD
- Absensi harian + pelatih + rekap bulanan
- Penilaian Performa (6 skill)
- Invoice + Bulk Monthly Invoice
- Pembayaran manual transfer + tunai
- Lapangan + Jadwal Blokir
- Rental Lapangan (kalender FullCalendar + daftar)
- Jadwal/Kalender full-page
- Inventaris + low stock alert
- Cabang (multi-branch)

---

## 9. Struktur File Kunci

```
src/
  app/
    actions/          # Server actions (students, coaches, classes, ...)
    api/
      calendar/       # GET /api/calendar
      rentals/events/ # GET /api/rentals/events
    auth/             # login, reset-password
    dashboard/
      assessments/
      attendance/
      branches/
      classes/
      coaches/
      courts/
      inventory/
      invoices/
      payments/
      rentals/
      schedule/
      students/
      layout.tsx
      page.tsx        # Dashboard home
  components/
    dashboard/charts.tsx
    layout/app-sidebar.tsx
    schedule/calendar-view.tsx
    ui/               # shadcn components + data-pagination.tsx
  lib/
    export.ts         # Excel export utility
    prisma.ts
    supabase/
  proxy.ts            # Next.js 16 middleware
```

### v1.4.0 — 2026-06-03
**UI/UX Revamp (Operator-Friendly):**
- **Sidebar:** Basketball icon brand logo, orange active indicator (left border + bg), group labels uppercase, chevron arrow on active item, logout with hover animation
- **Header:** Sticky with blur backdrop, user email display, cleaner dropdown
- **Dashboard:** Clickable KPI cards (navigate to module), pending payments alert banner, revenue split card, better court status badges, improved chart tooltips with custom render, legend on both charts
- **globals.css:** New CSS utility classes: `.badge-green/red/yellow/gray/blue/orange` for semantic badges, `.table-row-hover` for consistent row hover, `.page-content` layout helper
- **All table pages:** Consistent card header with icon + subtitle, `text-xs font-semibold text-gray-500` table headers on gray-50 bg, `pl-5` first column padding, meaningful empty states with icon + CTA button
- **Students:** Student number shown as monospace pill, better filter layout
- **Coaches:** Gradient avatar initials, phone/email subtitle, classes count inline
- **Classes:** Age group badge, full/capacity indicator with red text when full
- **Invoices:** Type badges (color-coded), summary cards with colored borders, Lunas button with green styling
- **Payments:** Two-column date/time display, colored method badges, compact verify/reject buttons
- **Inventory:** Category badges (color-coded), bold red stock when low, warning icon inline
- **Assessments:** Score shown in colored rounded pill (green/amber/red), skill sliders grouped in gray bg box
- **Courts:** Tabs with white pill active style
- **Rentals:** Calendar tab with rounded tab style, list tab with status filter dropdown + export
- **Branches:** Card with MapPin + Phone icons for contact info, gradient avatar logo icon
