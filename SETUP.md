# Sports Center Management System — Setup Guide

## Prerequisites
- Node.js 18+
- Supabase account (free tier works)

---

## 1. Supabase Setup

1. Create a new Supabase project at https://supabase.com
2. Go to **Project Settings → API**
3. Copy your **Project URL**, **anon/public key**, and **service_role key**

---

## 2. Environment Variables

Edit `.env` and fill in your real values:

```env
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
SUPABASE_SERVICE_ROLE_KEY="[YOUR-SERVICE-ROLE-KEY]"

NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Find connection strings: **Supabase Dashboard → Project Settings → Database → Connection string**

---

## 3. Database Migration

```bash
# Push schema to Supabase
npm run db:push

# Or create a migration
npm run db:migrate

# Seed initial data (roles + default branch)
npm run db:seed
```

---

## 4. Create First Admin User

1. Go to **Supabase Dashboard → Authentication → Users**
2. Click **Add User** → create admin account
3. Go to **SQL Editor** and run:

```sql
-- Find the user ID you just created
SELECT id FROM auth.users WHERE email = 'your-admin@email.com';

-- Insert into users table (replace IDs)
INSERT INTO users (id, "supabaseId", email, name, "roleId", "isActive")
VALUES (
  gen_random_uuid(),
  '[SUPABASE-USER-ID]',
  'your-admin@email.com',
  'Admin Name',
  (SELECT id FROM roles WHERE name = 'ADMIN'),
  true
);
```

---

## 5. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000 — you'll be redirected to `/auth/login`.

---

## 6. Deploy to Vercel

```bash
vercel deploy
```

Add all environment variables in Vercel dashboard under **Settings → Environment Variables**.

---

## Module Overview

| Module | Route | Description |
|--------|-------|-------------|
| Dashboard | `/dashboard` | Stats, charts, overview |
| Siswa | `/dashboard/students` | Student management |
| Pelatih | `/dashboard/coaches` | Coach management |
| Kelas | `/dashboard/classes` | Class management |
| Absensi | `/dashboard/attendance` | Daily attendance |
| Penilaian | `/dashboard/assessments` | Performance scoring |
| Invoice | `/dashboard/invoices` | Invoice creation |
| Pembayaran | `/dashboard/payments` | Payment verification |
| Lapangan | `/dashboard/courts` | Court management |
| Sewa | `/dashboard/rentals` | Court rental booking |
| Inventaris | `/dashboard/inventory` | Equipment tracking |
| Cabang | `/dashboard/branches` | Branch management |
