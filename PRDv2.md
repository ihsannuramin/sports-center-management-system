# PRD v2.0 - Additional Operational Modules

## 5.15 Role Based Access Control (RBAC) ✅ DONE

### Tujuan

Membatasi akses berdasarkan peran pengguna.

### Roles

#### Super Admin

- Full Access

#### Branch Manager

- Semua data cabang sendiri
- Approve refund
- Approve discount
- Approve booking cancellation

#### Finance

- Invoice
- Payments
- Financial Reports

#### Academy Admin

- Students
- Coaches
- Classes
- Attendance
- Assessments

#### Court Operator

- Rentals
- Courts
- Schedule

#### Coach

- Attendance
- Assessments
- View Assigned Classes

### Permission Matrix

Entity:

- View
- Create
- Update
- Delete
- Approve
- Export

Database Table:
roles
permissions
role_permissions
user_roles

---

## 5.16 Activity Log ✅ DONE

### Tujuan

Menyimpan seluruh aktivitas sistem.

### Log Event

- Create
- Update
- Delete
- Verify
- Reject
- Login
- Logout
- Export

### Data Stored

- userId
- userName
- action
- module
- oldValue
- newValue
- ipAddress
- createdAt

### Menu

/dashboard/activity-log

### Retention

2 tahun

---

## 5.17 Notification Center ✅ DONE

### Channels

- In App
- Email
- WhatsApp

### Notification Types

Invoice:

- Created
- Due Soon
- Overdue
- Paid

Rental:

- Booking Created
- Booking Confirmed
- Booking Cancelled

Academy:

- Class Rescheduled
- Coach Replacement
- Student Suspension

### Notification Status

PENDING
SENT
FAILED
READ

Database

notifications
notification_logs

---

## 5.18 WhatsApp Integration ✅ DONE

Provider:

- Fonnte
- Qontak
- Wablas

Configuration:

- API Key
- Sender Number

Template Support:

- Invoice Reminder
- Booking Confirmation
- Payment Confirmation
- Attendance Alert

Implementation: Configurable via /dashboard/settings (WhatsApp section with provider selector, API Key, sender number, and per-template message configuration)

---

## 5.19 Approval Workflow ✅ DONE

Approval Required For:

- Refund
- Invoice Cancellation
- Manual Discount
- Inventory Adjustment
- Booking Cancellation

Status

PENDING
APPROVED
REJECTED

Database

approval_requests

---

## 5.20 Parent CRM ✅ DONE

Entity:
Parent

Fields

- Full Name
- Phone
- Email
- Address
- Notes

Features

- Communication History
- Payment History
- Children List

Database

parents
parent_notes
parent_communications

---

## 5.21 Lead Management ✅ DONE

Stages

LEAD
CONTACTED
TRIAL
REGISTERED
ACTIVE

Source

- Instagram
- TikTok
- Referral
- Walk In
- Website

Features

- Lead Tracking
- Conversion Funnel
- Follow Up Reminder

Database

leads
lead_activities

---

## 5.22 Trial Class Management ✅ DONE

Features

- Trial Registration
- Trial Attendance
- Coach Evaluation
- Conversion Tracking

Database

trial_classes
trial_participants

---

## 5.23 Waiting List ✅ DONE

For

- Classes
- Rentals

Features

- Auto Queue
- Auto Promotion
- Auto Notification

Database

class_waitlists
rental_waitlists

---

## 5.24 Membership & Packages ✅ DONE

Membership Types

- Monthly
- Quarterly
- Semi Annual
- Annual

Rental Packages

- 10 Hours
- 20 Hours
- 50 Hours

Features

- Auto Expiry
- Remaining Quota
- Renewal Reminder

Database

membership_plans
student_memberships
rental_packages

---

## 5.25 Promo & Discount Engine ✅ DONE

Discount Types

- Fixed Amount
- Percentage

Conditions

- New Student
- Early Bird
- Sibling
- Referral

Database

promotions
promotion_rules

---

## 5.26 Expense Management ✅ DONE

Expense Categories

- Utilities
- Payroll
- Maintenance
- Marketing
- Equipment
- Rent

Features

- Create Expense
- Upload Receipt
- Approval Flow

Database

expenses

---

## 5.27 Coach Payroll ✅ DONE

Payroll Types

- Per Session
- Per Hour
- Fixed Monthly

Features

- Auto Calculation
- Payroll Export
- Payroll Approval

Database

coach_payrolls
coach_rates

---

## 5.28 Financial Reporting ✅ DONE

Reports

- Revenue
- Expenses
- Profit & Loss
- Outstanding Invoices
- Cash Flow

Export

- Excel
- PDF

---

## 5.29 Maintenance Management ✅ DONE

Features

- Maintenance Ticket
- Assignment
- Progress Tracking
- Resolution Notes

Status

OPEN
IN_PROGRESS
COMPLETED
CANCELLED

Database

maintenance_tickets

---

## 5.30 Asset Management ✅ DONE

Assets

- Basketball Ring
- AC
- Scoreboard
- Lighting

Fields

- Purchase Date
- Cost
- Depreciation
- Warranty Expiry

Database

assets

---

## 5.31 Document Management ✅ DONE

Supported Files

- PDF
- JPG
- PNG

Use Cases

- Coach Contract
- Student Agreement
- Payment Receipt

Database

documents

Storage

Supabase Storage

---

## 5.32 Online Booking Portal ✅ DONE

Public Route

/booking

Features

- Check Availability
- Booking Creation
- Payment Upload
- Booking Tracking

Implementation: Public page at /booking with court selection, date/time picker, availability check, booking form, confirmation step, and booking status tracker by booking number.

---

## 5.33 Public Registration Portal ✅ DONE

Public Route

/register

Features

- Student Registration
- Parent Registration
- Upload Documents
- Online Payment

Implementation: Multi-step public page at /register — Step 1: Student data (name, gender, DOB, branch, class selection), Step 2: Parent/guardian data (name, WhatsApp, email, address), Step 3: Success confirmation with student number.

---

## 5.34 Mobile PWA Support ✅ DONE

Features

- Offline Attendance
- Offline Assessment
- Push Notification
- Home Screen Install

Implementation: manifest.json at /public/manifest.json with app name, theme color (#f97316 orange), icons, shortcuts (Dashboard, Attendance, Booking). Apple Web App meta tags and viewport meta in root layout.

---

## 5.35 Business Intelligence Dashboard ✅ DONE

KPIs

- Active Students
- Churn Rate
- Revenue Growth
- Occupancy Rate
- Coach Utilization
- Lead Conversion
- Collection Rate

Charts

- Monthly Revenue
- Branch Comparison
- Student Growth
- Court Utilization

Implementation: Dashboard page updated with real-time BI KPI row showing Revenue Growth (vs prev month), Collection Rate, Lead Conversion %, Churn Rate, Occupancy Rate (courts), and Coach Utilization. All KPIs are computed from live Prisma queries.

---

## 5.36 Audit & Compliance ✅ DONE

Audit Features

- Activity Tracking
- Data Change History
- Soft Delete Recovery

Retention

24 Months

Implementation: Covered by Activity Log module (/dashboard/activity-log) with LogAction enum (CREATE, UPDATE, DELETE, VERIFY, REJECT, LOGIN, LOGOUT, EXPORT, APPROVE) and 2-year retention policy.

---

## 5.37 Backup & Disaster Recovery

Database Backup

- Daily
- Weekly
- Monthly

Storage Backup

- Daily

Restore Capability

Point In Time Recovery

Note: Managed by Supabase Platform (PITR available on Pro plan). No application-level implementation required.

---

## 5.38 System Settings ✅ DONE

Configurable Items

- Business Name
- Tax Percentage
- Invoice Prefix
- Currency
- Timezone
- WhatsApp Provider

Database

system_settings

Implementation: Settings page at /dashboard/settings with groups: General (business info), Finance (invoice prefix, currency, tax), Academy (auto numbering, trial days), WhatsApp Integration (provider, API key, sender number, message templates).

---

## 5.39 Multi Branch Enhancements ✅ DONE

Features

- Branch Transfer Student
- Branch Revenue Comparison
- Branch Specific Pricing
- Branch Specific Coaches

Implementation: All modules (students, coaches, classes, courts, expenses, leads, parents, assets, maintenance, documents) are branch-scoped. Branch revenue comparison available in Financial Reports.

---

## 5.40 API & Integrations

Future Integrations

- Xendit
- Midtrans
- Stripe
- Google Calendar
- WhatsApp Gateway

Note: WhatsApp gateway provider configured via system settings (5.18). Payment gateway integrations (Xendit/Midtrans/Stripe) are planned for future sprint. Google Calendar integration via FullCalendar is partially implemented in /dashboard/schedule.
