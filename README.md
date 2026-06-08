# Sports Center Management System

A comprehensive management system for sports centers combining a Basketball Academy and Court Rental business. Built for multi-branch operations with a focus on ease of use for admins and field operators.

## Tech Stack

| Layer         | Technology                      |
| ------------- | ------------------------------- |
| Framework     | Next.js (App Router, Turbopack) |
| Language      | TypeScript                      |
| Styling       | Tailwind CSS v4                 |
| UI Components | shadcn/ui + @base-ui/react      |
| ORM           | Prisma v5                       |
| Database      | Supabase PostgreSQL             |
| Auth          | Supabase Auth (SSR)             |
| Charts        | Recharts                        |
| Calendar      | FullCalendar v6                 |
| Export        | SheetJS (xlsx)                  |

## Features

### Dashboard

- KPI cards: active students, coaches, courts, monthly revenue
- Monthly revenue chart (bar/line) with academy vs rental split
- Real-time court status (available / booked / maintenance)
- Pending payment alert banner

### Student Management

- Student list with search and filters (status, class, branch)
- Add / edit / suspend / activate students
- Student detail page: attendance history, invoices, assessments
- Pagination (10/25/50 rows) · Export to Excel

### Coach Management

- Coach list with search
- Add / edit / activate / deactivate coaches
- Shows number of classes assigned
- Pagination · Export to Excel

### Class Management

- Class list with capacity indicators (full class shown in red)
- Age groups: U8, U10, U12, U14, U16, Senior
- Assign coach and branch per class
- Pagination · Export to Excel

### Attendance

- Daily attendance input per class (Present / Permission / Sick / Absent)
- Coach attendance tab
- Monthly recap tab

### Performance Assessment

- 6 skills scored 0–100: Dribbling, Passing, Shooting, Defense, Stamina, Attitude
- Color-coded averages: green (≥80) · orange (≥60) · red (<60)
- Pagination · Export to Excel

### Invoice & Billing

- Invoice types: Registration, Monthly, Tournament, Merchandise
- Bulk monthly invoice creation for all active students
- Status tracking: Unpaid → Paid / Overdue / Cancelled
- Summary cards for outstanding and paid amounts
- Pagination · Export to Excel

### Payment Management

- Manual bank transfer verification with proof image preview
- Cash payment (auto-verified)
- Filter by status: Pending / Verified / Rejected
- Pagination · Export to Excel

### Court Management

- Indoor and outdoor court listings
- Block schedules: Maintenance, Academy Training
- Activate / deactivate courts
- Pagination · Export to Excel

### Court Rental

- FullCalendar view (Month / Week / Day)
- Click empty slot to create a booking
- Click event to view booking details
- Filter calendar by court
- Booking list with status management: Pending → Confirmed → Completed / Cancelled
- Pagination · Export to Excel

### Inventory

- Categories: Ball, Cone, Jersey, Equipment, Other
- Low stock alert banner + per-row indicator
- Add / edit / delete items
- Pagination · Export to Excel

### Branch Management

- Card grid view with per-branch stats (students, coaches, courts)
- Add / edit / activate / deactivate branches
- Pagination · Export to Excel

### Schedule / Calendar

- Full-page FullCalendar combining: rental bookings + academy schedules + maintenance blocks

## Setup

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)

### 1. Clone and install

```bash
git clone <repo-url>
cd sports-center
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/postgres"

NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT_ID.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."

NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

You can find these values in your Supabase project under **Settings → Database** and **Settings → API**.

### 3. Apply database schema

```bash
npm run db:push
```

### 4. Seed initial data

Seeds default roles and a branch:

```bash
npm run db:seed
```

### 5. Create the first admin user

1. Go to your Supabase dashboard → **Authentication → Users** → **Add user**
2. Create the user with email and password
3. In **SQL Editor**, run:

```sql
INSERT INTO users (id, "supabaseId", email, name, "roleId", "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  '<supabase-user-uuid>',
  'admin@example.com',
  'Admin',
  (SELECT id FROM roles WHERE name = 'ADMIN'),
  true,
  now(),
  now()
);
```

Replace `<supabase-user-uuid>` with the UUID from the Supabase Auth user you just created.

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with the admin credentials you created.

## Project Structure

```
src/
  app/
    actions/          # Server actions (students, coaches, classes, ...)
    api/
      calendar/       # GET /api/calendar
      rentals/events/ # GET /api/rentals/events
    auth/             # Login, reset password
    dashboard/        # All management modules
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
  components/
    dashboard/        # Charts, KPI cards
    layout/           # Sidebar, header
    schedule/         # FullCalendar wrapper
    ui/               # shadcn components + DataPagination
  lib/
    export.ts         # Excel export utility (SheetJS)
    prisma.ts         # Prisma client
    supabase/         # Supabase client helpers
  proxy.ts            # Next.js middleware (route protection)
prisma/
  schema.prisma       # Database schema
  seed.ts             # Initial data seeder
```

## Available Scripts

| Command           | Description                             |
| ----------------- | --------------------------------------- |
| `npm run dev`     | Start development server with Turbopack |
| `npm run build`   | Build for production                    |
| `npm run start`   | Start production server                 |
| `npm run db:push` | Push Prisma schema to database          |
| `npm run db:seed` | Seed initial roles and branch data      |

## REVISED

This project is a comprehensive Sports Center Management System designed to streamline operations for a Basketball Academy and Court Rental business. It features a multi-branch management system with an intuitive dashboard for admins and field operators. The system includes modules for student and coach management, class scheduling, attendance tracking, performance assessments, invoicing, payment processing, court management, inventory control, and a unified calendar view. Built with Next.js, TypeScript, Tailwind CSS, Prisma, and Supabase, it offers robust functionality while maintaining ease of use.
