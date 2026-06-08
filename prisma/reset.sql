-- ============================================================
-- reset.sql
-- Truncate all operational tables, keep only SUPER_ADMIN users.
-- Compatible with Supabase (no superuser required).
-- Run in Supabase SQL Editor or via psql.
-- ============================================================

-- 1. Null out branchId on users so DELETE FROM branches can succeed per-row
UPDATE users SET "branchId" = NULL;

-- 2. Truncate all operational tables in ONE statement.
--    PostgreSQL resolves internal FK dependencies automatically when all
--    related tables are listed together. Branches is excluded because the
--    structural FK from users→branches would cause TRUNCATE to fail even
--    with NULL values; it is handled via DELETE below instead.
TRUNCATE TABLE
  notification_logs,
  notifications,
  approval_requests,
  activity_logs,
  lead_activities,
  trial_participants,
  trial_classes,
  class_waitlists,
  rental_waitlists,
  student_memberships,
  membership_plans,
  promotion_rules,
  promotions,
  rental_packages,
  parent_notes,
  parent_communications,
  parents,
  attendances,
  assessments,
  payments,
  invoices,
  rental_bookings,
  court_schedules,
  students,
  coach_payrolls,
  coach_rates,
  coaches,
  classes,
  courts,
  inventory,
  leads,
  expenses,
  maintenance_tickets,
  assets,
  documents,
  system_settings;

-- 3. DELETE (not TRUNCATE) branches — avoids the structural FK issue with users.
--    DELETE checks actual rows; since all users.branchId = NULL, no conflict.
DELETE FROM branches;

-- 4. Remove all non-SUPER_ADMIN users
DELETE FROM users
WHERE "roleId" NOT IN (
  SELECT id FROM roles WHERE name = 'SUPER_ADMIN'
);

-- Verify
SELECT u.id, u.name, u.email, r.name AS role
FROM users u
JOIN roles r ON u."roleId" = r.id;
