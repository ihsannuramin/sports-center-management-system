import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PRESERVED_EMAIL = "ihsannuramin03@gmail.com";

function d(s: string) { return new Date(s); }
function daysAgo(n: number) { const x = new Date(); x.setDate(x.getDate() - n); return x; }
function daysFromNow(n: number) { const x = new Date(); x.setDate(x.getDate() + n); return x; }
function monthStart(y: number, m: number) { return new Date(y, m - 1, 1); }
function monthEnd(y: number, m: number) { return new Date(y, m, 0); }

const FEMALE_NAMES = new Set([
  "Nayla","Keisha","Calya","Zara","Nabila","Cantika","Hana","Kirana",
  "Meilani","Putri","Qori","Salsabila","Vina","Nisa","Bella","Aurel","Tia","Rara",
  "Dewi","Sari","Linda","Susi","Fitri","Sri","Yuni","Suci",
]);
function genderOf(name: string): "MALE" | "FEMALE" {
  return FEMALE_NAMES.has(name.split(" ")[0]) ? "FEMALE" : "MALE";
}

async function main() {
  // ─── STEP 0: Preserve user ────────────────────────────────────────────────
  const preserved = await prisma.user.findUnique({ where: { email: PRESERVED_EMAIL } });
  console.log(preserved
    ? `✓ Preserved user: ${preserved.name} (${preserved.supabaseId})`
    : `⚠  ${PRESERVED_EMAIL} not in DB — will be skipped`
  );

  // ─── STEP 1: Truncate all tables ──────────────────────────────────────────
  console.log("\nTruncating all tables...");
  await prisma.$executeRaw`TRUNCATE TABLE
    notification_logs, notifications, approval_requests, activity_logs,
    lead_activities, trial_participants, trial_classes, class_waitlists,
    rental_waitlists, student_memberships, membership_plans,
    promotion_rules, promotions, rental_packages,
    parent_notes, parent_communications, parents,
    attendances, assessments, payments, invoices,
    rental_bookings, court_schedules, students,
    coach_payrolls, coach_rates, coaches,
    classes, courts, inventory, leads, expenses,
    maintenance_tickets, assets, documents,
    system_settings, users, role_permissions,
    permissions, roles, branches
    CASCADE`;
  console.log("✓ All tables cleared\n");

  // ─── STEP 2: Branches ─────────────────────────────────────────────────────
  await prisma.branch.createMany({
    data: [
      { id: "branch-jkt", name: "Cabang Jakarta Pusat", address: "Jl. Sudirman No. 123, Jakarta Pusat", phone: "021-5555-1234", isActive: true },
      { id: "branch-bdg", name: "Cabang Bandung",       address: "Jl. Asia Afrika No. 45, Bandung",       phone: "022-4444-5678", isActive: true },
    ],
  });
  console.log("✓ Branches (2)");

  // ─── STEP 3: Roles ────────────────────────────────────────────────────────
  const ROLE_NAMES = ["SUPER_ADMIN","BRANCH_MANAGER","FINANCE","ACADEMY_ADMIN","COURT_OPERATOR","COACH","PARENT","RENTAL_CUSTOMER"];
  await prisma.role.createMany({
    data: ROLE_NAMES.map(name => ({ name })),
  });
  const roles = await prisma.role.findMany();
  const R = Object.fromEntries(roles.map(r => [r.name, r.id]));
  console.log(`✓ Roles (${roles.length})`);

  // ─── STEP 4: Permissions ──────────────────────────────────────────────────
  const MODULES = [
    "branches","users","roles","students","parents","coaches",
    "classes","attendance","assessments","invoices","payments",
    "rentals","courts","schedules","inventory","expenses",
    "payroll","leads","reports","settings","documents",
    "assets","maintenance","notifications","approvals",
  ];
  const ACTIONS = ["view","create","update","delete","approve","export"];
  await prisma.permission.createMany({
    data: MODULES.flatMap(module => ACTIONS.map(action => ({ module, action, label: `${module}:${action}` }))),
  });
  const perms = await prisma.permission.findMany();
  const byKey = Object.fromEntries(perms.map(p => [`${p.module}:${p.action}`, p.id]));
  console.log(`✓ Permissions (${perms.length})`);

  // ─── STEP 5: Role Permissions ─────────────────────────────────────────────
  function rp(roleKey: string, modules: string[], actions: string[] = ACTIONS) {
    return modules.flatMap(m => actions.map(a => `${m}:${a}`))
      .filter(k => byKey[k])
      .map(k => ({ roleId: R[roleKey], permissionId: byKey[k] }));
  }

  const allPerms = perms.map(p => ({ roleId: R["SUPER_ADMIN"], permissionId: p.id }));

  const bmPerms = [
    ...rp("BRANCH_MANAGER", ["branches","users","students","parents","coaches","classes",
      "attendance","assessments","invoices","payments","rentals","courts","schedules",
      "inventory","expenses","payroll","leads","reports","settings","documents",
      "assets","maintenance","notifications","approvals"]),
  ];

  const finPerms = rp("FINANCE",
    ["invoices","payments","expenses","reports"],
  ).concat(rp("FINANCE", ["students","settings"], ["view"]));

  const aaPerms = rp("ACADEMY_ADMIN",
    ["students","parents","coaches","classes","attendance","assessments","leads","reports"],
  );

  const coPerms = rp("COURT_OPERATOR",
    ["rentals","courts","schedules"],
  ).concat(rp("COURT_OPERATOR", ["payments"], ["view","create"]));

  const coachPerms = rp("COACH",
    ["attendance","assessments"], ["view","create","update"],
  ).concat(rp("COACH", ["students","classes"], ["view"]));

  await prisma.rolePermission.createMany({
    data: [...allPerms, ...bmPerms, ...finPerms, ...aaPerms, ...coPerms, ...coachPerms],
    skipDuplicates: true,
  });
  console.log("✓ Role permissions");

  // ─── STEP 6: Users ────────────────────────────────────────────────────────
  const systemUsers = [
    { id: "u-super",    email: "superadmin@sportscenter.id",        name: "Super Admin",       role: "SUPER_ADMIN",    branch: null },
    { id: "u-mgr-jkt",  email: "manager.jakarta@sportscenter.id",   name: "Hartono Wibowo",    role: "BRANCH_MANAGER", branch: "branch-jkt" },
    { id: "u-mgr-bdg",  email: "manager.bandung@sportscenter.id",   name: "Dewi Kusumawati",   role: "BRANCH_MANAGER", branch: "branch-bdg" },
    { id: "u-finance",  email: "finance@sportscenter.id",           name: "Sari Indrawati",    role: "FINANCE",        branch: "branch-jkt" },
    { id: "u-acad-jkt", email: "academy.jakarta@sportscenter.id",   name: "Ahmad Fauzi",       role: "ACADEMY_ADMIN",  branch: "branch-jkt" },
    { id: "u-acad-bdg", email: "academy.bandung@sportscenter.id",   name: "Linda Puspita",     role: "ACADEMY_ADMIN",  branch: "branch-bdg" },
    { id: "u-cop-jkt",  email: "courtop.jakarta@sportscenter.id",   name: "Dian Permana",      role: "COURT_OPERATOR", branch: "branch-jkt" },
    { id: "u-cop-bdg",  email: "courtop.bandung@sportscenter.id",   name: "Rizky Pratama",     role: "COURT_OPERATOR", branch: "branch-bdg" },
    { id: "u-c1",       email: "budi.santoso@sportscenter.id",      name: "Budi Santoso",      role: "COACH",          branch: "branch-jkt" },
    { id: "u-c2",       email: "andi.wijaya@sportscenter.id",       name: "Andi Wijaya",       role: "COACH",          branch: "branch-jkt" },
    { id: "u-c3",       email: "rini.astuti@sportscenter.id",       name: "Rini Astuti",       role: "COACH",          branch: "branch-jkt" },
    { id: "u-c4",       email: "dedi.kurniawan@sportscenter.id",    name: "Dedi Kurniawan",    role: "COACH",          branch: "branch-jkt" },
    { id: "u-c5",       email: "susi.rahayu@sportscenter.id",       name: "Susi Rahayu",       role: "COACH",          branch: "branch-bdg" },
    { id: "u-c6",       email: "hendra.gunawan@sportscenter.id",    name: "Hendra Gunawan",    role: "COACH",          branch: "branch-bdg" },
  ];

  for (const u of systemUsers) {
    await prisma.user.create({
      data: {
        id: u.id,
        supabaseId: `placeholder-${u.id}`,
        email: u.email,
        name: u.name,
        roleId: R[u.role],
        branchId: u.branch,
        isActive: true,
      },
    });
  }

  if (preserved) {
    await prisma.user.create({
      data: {
        id: preserved.id,
        supabaseId: preserved.supabaseId,
        email: preserved.email,
        name: preserved.name,
        phone: preserved.phone,
        avatarUrl: preserved.avatarUrl,
        roleId: R["SUPER_ADMIN"],
        branchId: null,
        isActive: true,
      },
    });
    console.log(`✓ Preserved user restored: ${preserved.email}`);
  }
  console.log(`✓ Users (${systemUsers.length}${preserved ? " + 1 preserved" : ""})`);

  // ─── STEP 7: Coaches ──────────────────────────────────────────────────────
  await prisma.coach.createMany({
    data: [
      { id: "c1", userId: "u-c1", name: "Budi Santoso",   phone: "0812-1111-2222", specialty: "Shooting & Offense",    branchId: "branch-jkt", isActive: true, joinDate: d("2022-03-01") },
      { id: "c2", userId: "u-c2", name: "Andi Wijaya",    phone: "0813-3333-4444", specialty: "Defense & Stamina",      branchId: "branch-jkt", isActive: true, joinDate: d("2022-06-15") },
      { id: "c3", userId: "u-c3", name: "Rini Astuti",    phone: "0814-5555-6666", specialty: "Dribbling & Passing",    branchId: "branch-jkt", isActive: true, joinDate: d("2023-01-10") },
      { id: "c4", userId: "u-c4", name: "Dedi Kurniawan", phone: "0815-7777-8888", specialty: "Goalkeeper Training",    branchId: "branch-jkt", isActive: true, joinDate: d("2023-07-01") },
      { id: "c5", userId: "u-c5", name: "Susi Rahayu",    phone: "0816-9999-0000", specialty: "Youth Development",      branchId: "branch-bdg", isActive: true, joinDate: d("2024-01-15") },
      { id: "c6", userId: "u-c6", name: "Hendra Gunawan", phone: "0817-1111-3333", specialty: "Tactical Formation",     branchId: "branch-bdg", isActive: true, joinDate: d("2024-01-15") },
    ],
  });
  console.log("✓ Coaches (6)");

  // ─── STEP 8: Coach Rates ──────────────────────────────────────────────────
  await prisma.coachRate.createMany({
    data: [
      { coachId: "c1", payrollType: "PER_SESSION",    rateAmount: 150000, effectiveFrom: d("2024-01-01") },
      { coachId: "c1", payrollType: "FIXED_MONTHLY",  rateAmount: 3500000, effectiveFrom: d("2024-01-01") },
      { coachId: "c2", payrollType: "PER_SESSION",    rateAmount: 150000, effectiveFrom: d("2024-01-01") },
      { coachId: "c2", payrollType: "FIXED_MONTHLY",  rateAmount: 3500000, effectiveFrom: d("2024-01-01") },
      { coachId: "c3", payrollType: "PER_SESSION",    rateAmount: 125000, effectiveFrom: d("2024-01-01") },
      { coachId: "c3", payrollType: "FIXED_MONTHLY",  rateAmount: 3000000, effectiveFrom: d("2024-01-01") },
      { coachId: "c4", payrollType: "PER_SESSION",    rateAmount: 125000, effectiveFrom: d("2024-01-01") },
      { coachId: "c5", payrollType: "PER_SESSION",    rateAmount: 125000, effectiveFrom: d("2024-01-01") },
      { coachId: "c6", payrollType: "PER_SESSION",    rateAmount: 150000, effectiveFrom: d("2024-01-01") },
    ],
  });
  console.log("✓ Coach rates");

  // ─── STEP 9: Classes ──────────────────────────────────────────────────────
  await prisma.class.createMany({
    data: [
      { id: "cls-u8-jkt",  name: "Kelas U8",     ageGroup: "U8",     schedule: "Sabtu, 08:00–10:00",              coachId: "c3", maxStudents: 15, branchId: "branch-jkt", isActive: true },
      { id: "cls-u10-jkt", name: "Kelas U10",    ageGroup: "U10",    schedule: "Sabtu, 10:00–12:00",              coachId: "c3", maxStudents: 15, branchId: "branch-jkt", isActive: true },
      { id: "cls-u12-jkt", name: "Kelas U12",    ageGroup: "U12",    schedule: "Senin & Rabu, 15:00–17:00",       coachId: "c1", maxStudents: 20, branchId: "branch-jkt", isActive: true },
      { id: "cls-u14-jkt", name: "Kelas U14",    ageGroup: "U14",    schedule: "Selasa & Kamis, 15:00–17:00",     coachId: "c2", maxStudents: 20, branchId: "branch-jkt", isActive: true },
      { id: "cls-u16-jkt", name: "Kelas U16",    ageGroup: "U16",    schedule: "Senin, Rabu & Jumat, 16:00–18:00", coachId: "c1", maxStudents: 18, branchId: "branch-jkt", isActive: true },
      { id: "cls-snr-jkt", name: "Kelas Senior", ageGroup: "SENIOR", schedule: "Selasa & Kamis, 19:00–21:00",    coachId: "c2", maxStudents: 20, branchId: "branch-jkt", isActive: true },
      { id: "cls-u10-bdg", name: "Kelas U10",    ageGroup: "U10",    schedule: "Sabtu, 09:00–11:00",              coachId: "c5", maxStudents: 12, branchId: "branch-bdg", isActive: true },
      { id: "cls-u12-bdg", name: "Kelas U12",    ageGroup: "U12",    schedule: "Rabu & Jumat, 15:00–17:00",       coachId: "c5", maxStudents: 15, branchId: "branch-bdg", isActive: true },
      { id: "cls-u14-bdg", name: "Kelas U14",    ageGroup: "U14",    schedule: "Senin & Kamis, 15:00–17:00",      coachId: "c6", maxStudents: 15, branchId: "branch-bdg", isActive: true },
      { id: "cls-snr-bdg", name: "Kelas Senior", ageGroup: "SENIOR", schedule: "Selasa & Sabtu, 19:00–21:00",    coachId: "c6", maxStudents: 18, branchId: "branch-bdg", isActive: true },
    ],
  });
  console.log("✓ Classes (10)");

  // ─── STEP 10: Courts ──────────────────────────────────────────────────────
  await prisma.court.createMany({
    data: [
      { id: "crt-1", name: "Lapangan A",       courtNumber: 1, type: "INDOOR",  branchId: "branch-jkt", isActive: true },
      { id: "crt-2", name: "Lapangan B",       courtNumber: 2, type: "INDOOR",  branchId: "branch-jkt", isActive: true },
      { id: "crt-3", name: "Lapangan Outdoor", courtNumber: 3, type: "OUTDOOR", branchId: "branch-jkt", isActive: true },
      { id: "crt-4", name: "Lapangan A",       courtNumber: 1, type: "INDOOR",  branchId: "branch-bdg", isActive: true },
      { id: "crt-5", name: "Lapangan B",       courtNumber: 2, type: "INDOOR",  branchId: "branch-bdg", isActive: true },
      { id: "crt-6", name: "Lapangan Outdoor", courtNumber: 3, type: "OUTDOOR", branchId: "branch-bdg", isActive: true },
    ],
  });
  console.log("✓ Courts (6)");

  // ─── STEP 11: Inventory ───────────────────────────────────────────────────
  await prisma.inventory.createMany({
    data: [
      { name: "Bola Futsal Size 4",    category: "BALL",      quantity: 20, minStock: 5,  unit: "buah", branchId: "branch-jkt" },
      { name: "Bola Futsal Size 3",    category: "BALL",      quantity: 15, minStock: 5,  unit: "buah", branchId: "branch-jkt" },
      { name: "Bola Futsal Size 4",    category: "BALL",      quantity: 12, minStock: 4,  unit: "buah", branchId: "branch-bdg" },
      { name: "Cone Orange",           category: "CONE",      quantity: 50, minStock: 20, unit: "buah", branchId: "branch-jkt" },
      { name: "Cone Biru",             category: "CONE",      quantity: 30, minStock: 10, unit: "buah", branchId: "branch-jkt" },
      { name: "Cone Orange",           category: "CONE",      quantity: 40, minStock: 15, unit: "buah", branchId: "branch-bdg" },
      { name: "Jersey Merah (S)",      category: "JERSEY",    quantity: 25, minStock: 5,  unit: "pcs",  branchId: "branch-jkt" },
      { name: "Jersey Merah (M)",      category: "JERSEY",    quantity: 30, minStock: 5,  unit: "pcs",  branchId: "branch-jkt" },
      { name: "Jersey Merah (L)",      category: "JERSEY",    quantity: 20, minStock: 5,  unit: "pcs",  branchId: "branch-jkt" },
      { name: "Rompi Kuning",          category: "JERSEY",    quantity: 20, minStock: 5,  unit: "pcs",  branchId: "branch-jkt" },
      { name: "Jersey Hijau (S)",      category: "JERSEY",    quantity: 20, minStock: 5,  unit: "pcs",  branchId: "branch-bdg" },
      { name: "Jersey Hijau (M)",      category: "JERSEY",    quantity: 25, minStock: 5,  unit: "pcs",  branchId: "branch-bdg" },
      { name: "Peluit",                category: "EQUIPMENT", quantity: 10, minStock: 3,  unit: "buah", branchId: "branch-jkt" },
      { name: "Papan Taktik",          category: "EQUIPMENT", quantity: 5,  minStock: 2,  unit: "buah", branchId: "branch-jkt" },
      { name: "Gawang Mini",           category: "EQUIPMENT", quantity: 4,  minStock: 2,  unit: "pasang", branchId: "branch-jkt" },
      { name: "Ladder Drill",          category: "EQUIPMENT", quantity: 8,  minStock: 3,  unit: "buah", branchId: "branch-jkt" },
      { name: "Peluit",                category: "EQUIPMENT", quantity: 6,  minStock: 2,  unit: "buah", branchId: "branch-bdg" },
      { name: "Papan Taktik",          category: "EQUIPMENT", quantity: 3,  minStock: 2,  unit: "buah", branchId: "branch-bdg" },
      { name: "Rompi Oranye",          category: "JERSEY",    quantity: 2,  minStock: 5,  unit: "pcs",  branchId: "branch-jkt", description: "STOK MENIPIS" },
    ],
  });
  console.log("✓ Inventory (19)");

  // ─── STEP 12: Parents ─────────────────────────────────────────────────────
  await prisma.parent.createMany({
    data: [
      { id: "p1",  fullName: "Hendra Pratama",    phone: "0812-1001-0001", email: "hendra.pratama@gmail.com",  branchId: "branch-jkt" },
      { id: "p2",  fullName: "Dewi Sari",         phone: "0812-1001-0002", email: "dewi.sari@gmail.com",       branchId: "branch-jkt" },
      { id: "p3",  fullName: "Agus Maulana",      phone: "0812-1001-0003",                                     branchId: "branch-jkt" },
      { id: "p4",  fullName: "Budi Ardiansyah",   phone: "0812-1002-0001", email: "budi.ardi@gmail.com",       branchId: "branch-jkt" },
      { id: "p5",  fullName: "Sri Amelia",        phone: "0812-1002-0002",                                     branchId: "branch-jkt" },
      { id: "p6",  fullName: "Fajar Ramadhan",    phone: "0812-1002-0003",                                     branchId: "branch-jkt" },
      { id: "p7",  fullName: "Siti Nuraini",      phone: "0812-1002-0004",                                     branchId: "branch-jkt" },
      { id: "p8",  fullName: "Hakim Santoso",     phone: "0812-1003-0001", email: "hakim.santoso@gmail.com",   branchId: "branch-jkt" },
      { id: "p9",  fullName: "Fitri Dewi",        phone: "0812-1003-0002",                                     branchId: "branch-jkt" },
      { id: "p10", fullName: "Permana Wijaya",    phone: "0812-1003-0003",                                     branchId: "branch-jkt" },
      { id: "p11", fullName: "Saputra Hadi",      phone: "0812-1004-0001",                                     branchId: "branch-jkt" },
      { id: "p12", fullName: "Dewi Lestari",      phone: "0812-1004-0002",                                     branchId: "branch-jkt" },
      { id: "p13", fullName: "Prasetyo Budi",     phone: "0812-1005-0001", email: "prasetyo.budi@gmail.com",   branchId: "branch-jkt" },
      { id: "p14", fullName: "Bambang Irawan",    phone: "0822-2001-0001", email: "bambang.irawan@gmail.com",  branchId: "branch-bdg" },
      { id: "p15", fullName: "Nani Suryani",      phone: "0822-2001-0002",                                     branchId: "branch-bdg" },
      { id: "p16", fullName: "Iwan Setiawan",     phone: "0822-2002-0001",                                     branchId: "branch-bdg" },
      { id: "p17", fullName: "Yuni Astuti",       phone: "0822-2002-0002",                                     branchId: "branch-bdg" },
      { id: "p18", fullName: "Agung Purnomo",     phone: "0822-2003-0001",                                     branchId: "branch-bdg" },
    ],
  });
  console.log("✓ Parents (18)");

  // ─── STEP 13: Students ────────────────────────────────────────────────────
  type SInput = {
    no: string; name: string; bd: string; cls: string; pid: string; bid: string;
    status?: "ACTIVE"|"INACTIVE"|"SUSPENDED";
  };
  const STUDENTS: SInput[] = [
    // U8 Jakarta
    { no:"STD-2024-001", name:"Farhan Rizky Pratama",  bd:"2017-03-12", cls:"cls-u8-jkt",  pid:"p1",  bid:"branch-jkt" },
    { no:"STD-2024-002", name:"Nayla Putri Sari",      bd:"2017-07-25", cls:"cls-u8-jkt",  pid:"p2",  bid:"branch-jkt" },
    { no:"STD-2024-003", name:"Raihan Maulana",        bd:"2016-11-08", cls:"cls-u8-jkt",  pid:"p3",  bid:"branch-jkt" },
    // U10 Jakarta
    { no:"STD-2024-004", name:"Daffa Ardiansyah",      bd:"2015-02-14", cls:"cls-u10-jkt", pid:"p4",  bid:"branch-jkt" },
    { no:"STD-2024-005", name:"Keisha Amelia",         bd:"2015-09-03", cls:"cls-u10-jkt", pid:"p5",  bid:"branch-jkt" },
    { no:"STD-2024-006", name:"Azka Ramadhan",         bd:"2015-06-20", cls:"cls-u10-jkt", pid:"p6",  bid:"branch-jkt" },
    { no:"STD-2024-007", name:"Calya Nuraini",         bd:"2014-12-01", cls:"cls-u10-jkt", pid:"p7",  bid:"branch-jkt" },
    // U12 Jakarta
    { no:"STD-2024-008", name:"Rafif Hakim",           bd:"2013-04-17", cls:"cls-u12-jkt", pid:"p8",  bid:"branch-jkt" },
    { no:"STD-2024-009", name:"Zara Fitriani",         bd:"2013-08-22", cls:"cls-u12-jkt", pid:"p9",  bid:"branch-jkt" },
    { no:"STD-2024-010", name:"Gilang Permana",        bd:"2012-01-30", cls:"cls-u12-jkt", pid:"p10", bid:"branch-jkt" },
    { no:"STD-2024-011", name:"Nabila Zahra",          bd:"2013-05-15", cls:"cls-u12-jkt", pid:"p9",  bid:"branch-jkt" },
    { no:"STD-2024-012", name:"Rizky Firmansyah",      bd:"2012-10-09", cls:"cls-u12-jkt", pid:"p8",  bid:"branch-jkt" },
    // U14 Jakarta
    { no:"STD-2024-013", name:"Bagas Saputra",         bd:"2011-03-28", cls:"cls-u14-jkt", pid:"p11", bid:"branch-jkt" },
    { no:"STD-2024-014", name:"Cantika Dewi",          bd:"2011-07-11", cls:"cls-u14-jkt", pid:"p12", bid:"branch-jkt" },
    { no:"STD-2024-015", name:"Fauzan Alfarisi",       bd:"2010-12-05", cls:"cls-u14-jkt", pid:"p11", bid:"branch-jkt" },
    { no:"STD-2024-016", name:"Hana Permatasari",      bd:"2011-02-19", cls:"cls-u14-jkt", pid:"p12", bid:"branch-jkt" },
    { no:"STD-2024-017", name:"Ilham Nugraha",         bd:"2010-08-14", cls:"cls-u14-jkt", pid:"p11", bid:"branch-jkt" },
    // U16 Jakarta
    { no:"STD-2024-018", name:"Jovan Prasetyo",        bd:"2009-05-22", cls:"cls-u16-jkt", pid:"p13", bid:"branch-jkt" },
    { no:"STD-2024-019", name:"Kirana Maharani",       bd:"2009-11-03", cls:"cls-u16-jkt", pid:"p13", bid:"branch-jkt" },
    { no:"STD-2024-020", name:"Luthfi Hidayat",        bd:"2008-04-16", cls:"cls-u16-jkt", pid:"p13", bid:"branch-jkt" },
    { no:"STD-2024-021", name:"Meilani Anggraini",     bd:"2009-07-30", cls:"cls-u16-jkt", pid:"p13", bid:"branch-jkt" },
    { no:"STD-2024-022", name:"Naufal Syarif",         bd:"2008-09-12", cls:"cls-u16-jkt", pid:"p13", bid:"branch-jkt" },
    // Senior Jakarta
    { no:"STD-2024-023", name:"Oscar Tambunan",        bd:"2007-01-07", cls:"cls-snr-jkt", pid:"p10", bid:"branch-jkt" },
    { no:"STD-2024-024", name:"Putri Rahayu",          bd:"2006-06-18", cls:"cls-snr-jkt", pid:"p9",  bid:"branch-jkt" },
    { no:"STD-2024-025", name:"Qori Handayani",        bd:"2007-10-25", cls:"cls-snr-jkt", pid:"p8",  bid:"branch-jkt" },
    { no:"STD-2024-026", name:"Rendra Kusuma",         bd:"2006-03-09", cls:"cls-snr-jkt", pid:"p10", bid:"branch-jkt" },
    // Suspended / Inactive
    { no:"STD-2024-027", name:"Umar Farouq",           bd:"2011-05-05", cls:"cls-u14-jkt", pid:"p11", bid:"branch-jkt", status:"SUSPENDED" },
    { no:"STD-2024-028", name:"Vina Oktavia",          bd:"2013-09-17", cls:"cls-u12-jkt", pid:"p9",  bid:"branch-jkt", status:"INACTIVE" },
    // U10 Bandung
    { no:"STD-2024-029", name:"Wisnu Prabowo",         bd:"2014-03-10", cls:"cls-u10-bdg", pid:"p14", bid:"branch-bdg" },
    { no:"STD-2024-030", name:"Bella Santika",         bd:"2014-07-20", cls:"cls-u10-bdg", pid:"p15", bid:"branch-bdg" },
    { no:"STD-2024-031", name:"Yoga Pratama",          bd:"2014-01-05", cls:"cls-u10-bdg", pid:"p16", bid:"branch-bdg" },
    // U12 Bandung
    { no:"STD-2024-032", name:"Aurel Maharani",        bd:"2013-08-05", cls:"cls-u12-bdg", pid:"p17", bid:"branch-bdg" },
    { no:"STD-2024-033", name:"Zaki Ramadhan",         bd:"2013-04-22", cls:"cls-u12-bdg", pid:"p18", bid:"branch-bdg" },
    // U14 Bandung
    { no:"STD-2024-034", name:"Tia Setiawati",         bd:"2011-09-14", cls:"cls-u14-bdg", pid:"p17", bid:"branch-bdg" },
    { no:"STD-2024-035", name:"Farid Maulana",         bd:"2010-11-02", cls:"cls-u14-bdg", pid:"p16", bid:"branch-bdg" },
    // Senior Bandung
    { no:"STD-2024-036", name:"Rio Gunawan",           bd:"2006-12-01", cls:"cls-snr-bdg", pid:"p14", bid:"branch-bdg" },
    { no:"STD-2024-037", name:"Rara Puspita",          bd:"2007-05-17", cls:"cls-snr-bdg", pid:"p15", bid:"branch-bdg" },
    { no:"STD-2024-038", name:"Satria Buana",          bd:"2006-08-30", cls:"cls-snr-bdg", pid:"p18", bid:"branch-bdg" },
  ];

  function sid(no: string) { return `s-${no.replace(/[^a-z0-9]/gi,"-").toLowerCase()}`; }

  for (const s of STUDENTS) {
    await prisma.student.create({
      data: {
        id: sid(s.no),
        studentNumber: s.no,
        name: s.name,
        birthDate: d(s.bd),
        gender: genderOf(s.name),
        branchId: s.bid,
        classId: s.cls,
        parentId: s.pid,
        parentName: (await prisma.parent.findUnique({ where: { id: s.pid } }))?.fullName,
        parentPhone: (await prisma.parent.findUnique({ where: { id: s.pid } }))?.phone,
        status: s.status ?? "ACTIVE",
        joinDate: d("2024-01-15"),
      },
    });
  }
  console.log(`✓ Students (${STUDENTS.length})`);

  // ─── STEP 14: Assessments ─────────────────────────────────────────────────
  const activeStudents = STUDENTS.filter(s => !s.status || s.status === "ACTIVE");
  for (const s of activeStudents.slice(0, 24)) {
    for (const [period, dt] of [["Q1-2025", "2025-03-31"], ["Q2-2025", "2025-06-01"]] as const) {
      const base = 3;
      await prisma.assessment.create({
        data: {
          studentId: sid(s.no),
          period,
          dribbling: base + (Math.abs(s.no.charCodeAt(9) - 48) % 3),
          passing:   base + (Math.abs(s.no.charCodeAt(8) - 48) % 3),
          shooting:  2    + (Math.abs(s.no.charCodeAt(7) - 48) % 3),
          defense:   2    + (Math.abs(s.no.charCodeAt(6) - 48) % 3),
          stamina:   base + (Math.abs(s.no.charCodeAt(5) - 48) % 3),
          attitude:  4    + (Math.abs(s.no.charCodeAt(4) - 48) % 2),
          notes: period === "Q2-2025" ? "Perkembangan baik, pertahankan konsistensi" : null,
          assessedAt: d(dt),
        },
      });
    }
  }
  console.log("✓ Assessments");

  // ─── STEP 15: Attendance (8 weeks of U12 Jakarta) ─────────────────────────
  const u12Students = STUDENTS.filter(s => s.cls === "cls-u12-jkt" && (!s.status || s.status === "ACTIVE"));
  const STATUSES = ["PRESENT","PRESENT","PRESENT","PRESENT","ABSENT","SICK"] as const;
  for (let w = 8; w >= 1; w--) {
    for (const dayOff of [1, 3]) { // Mon, Wed (1=Mon offset from last Mon)
      const dt = daysAgo(w * 7 - dayOff);
      for (const s of u12Students) {
        await prisma.attendance.create({
          data: {
            studentId: sid(s.no),
            coachId: "c1",
            classId: "cls-u12-jkt",
            date: dt,
            status: STATUSES[Math.floor((w + dayOff + s.no.charCodeAt(9)) % STATUSES.length)],
          },
        });
      }
    }
  }
  // Also U14 Jakarta, 4 weeks
  const u14Students = STUDENTS.filter(s => s.cls === "cls-u14-jkt" && (!s.status || s.status === "ACTIVE"));
  for (let w = 4; w >= 1; w--) {
    for (const dayOff of [2, 4]) { // Tue, Thu
      const dt = daysAgo(w * 7 - dayOff);
      for (const s of u14Students) {
        await prisma.attendance.create({
          data: {
            studentId: sid(s.no),
            coachId: "c2",
            classId: "cls-u14-jkt",
            date: dt,
            status: STATUSES[Math.floor((w + dayOff + s.no.charCodeAt(8)) % STATUSES.length)],
          },
        });
      }
    }
  }
  console.log("✓ Attendance records");

  // ─── STEP 16: Invoices & Payments ─────────────────────────────────────────
  let invSeq = 1;
  function invNo(prefix: string) { return `${prefix}-${String(invSeq++).padStart(4,"0")}`; }

  // Registration invoices for all active students
  for (const s of activeStudents) {
    const no = invNo("INV-REG-2024");
    const inv = await prisma.invoice.create({
      data: {
        invoiceNumber: no,
        studentId: sid(s.no),
        type: "REGISTRATION",
        amount: 500000,
        dueDate: d("2024-01-31"),
        description: "Biaya Pendaftaran Akademi 2024",
        status: "PAID",
        createdAt: d("2024-01-10"),
      },
    });
    await prisma.payment.create({
      data: {
        invoiceId: inv.id,
        amount: 500000,
        method: "TRANSFER",
        status: "VERIFIED",
        verifiedAt: d("2024-01-20"),
        verifiedBy: "u-finance",
        createdAt: d("2024-01-20"),
      },
    });
  }

  // Monthly invoices Jan–Jun 2025 for all active students
  const MONTHS = [
    { label:"Jan-2025", due:"2025-01-31", paid: true  },
    { label:"Feb-2025", due:"2025-02-28", paid: true  },
    { label:"Mar-2025", due:"2025-03-31", paid: true  },
    { label:"Apr-2025", due:"2025-04-30", paid: true  },
    { label:"Mei-2025", due:"2025-05-31", paid: true  },
    { label:"Jun-2025", due:"2025-06-30", paid: false },
  ];

  for (const s of activeStudents) {
    for (let mi = 0; mi < MONTHS.length; mi++) {
      const m = MONTHS[mi];
      // Leave some as unpaid for realism (every 5th student in May)
      const isPaid = m.paid && !(mi === 4 && parseInt(s.no.slice(-3)) % 5 === 0);
      const no = invNo(`INV-${m.label}`);
      const inv = await prisma.invoice.create({
        data: {
          invoiceNumber: no,
          studentId: sid(s.no),
          type: "MONTHLY",
          amount: 350000,
          dueDate: d(m.due),
          description: `Iuran Bulanan ${m.label}`,
          status: isPaid ? "PAID" : "UNPAID",
          createdAt: new Date(d(m.due).getTime() - 14 * 86400000),
        },
      });
      if (isPaid) {
        await prisma.payment.create({
          data: {
            invoiceId: inv.id,
            amount: 350000,
            method: mi % 3 === 0 ? "CASH" : "TRANSFER",
            status: "VERIFIED",
            verifiedAt: new Date(d(m.due).getTime() - 5 * 86400000),
            verifiedBy: "u-finance",
          },
        });
      }
    }
  }

  // Tournament invoice for U14
  const tourInv = await prisma.invoice.create({
    data: {
      invoiceNumber: invNo("INV-TOUR-2025"),
      studentId: sid("STD-2024-013"),
      type: "TOURNAMENT",
      amount: 250000,
      dueDate: d("2025-05-15"),
      description: "Kontribusi Turnamen Antar Cabang Juni 2025",
      status: "PAID",
    },
  });
  await prisma.payment.create({
    data: { invoiceId: tourInv.id, amount: 250000, method: "CASH", status: "VERIFIED", verifiedAt: d("2025-05-10"), verifiedBy: "u-finance" },
  });
  console.log("✓ Invoices & payments");

  // ─── STEP 17: Rental Bookings ─────────────────────────────────────────────
  type BInput = {
    id:string; no:string; customer:string; phone:string;
    courtId:string; branchId:string; date:string;
    start:string; end:string; duration:number;
    pph:number; total:number; status:"PENDING"|"CONFIRMED"|"CANCELLED"|"COMPLETED";
    notes?:string;
  };
  const BOOKINGS: BInput[] = [
    { id:"bk-001", no:"BKG-2025-0001", customer:"Ahmad Setiawan",          phone:"0812-9999-1111", courtId:"crt-1", branchId:"branch-jkt", date:"2025-04-15", start:"2025-04-15T08:00:00", end:"2025-04-15T10:00:00", duration:2, pph:100000, total:200000, status:"COMPLETED" },
    { id:"bk-002", no:"BKG-2025-0002", customer:"Bintang FC",              phone:"0813-8888-2222", courtId:"crt-2", branchId:"branch-jkt", date:"2025-04-20", start:"2025-04-20T16:00:00", end:"2025-04-20T18:00:00", duration:2, pph:100000, total:200000, status:"COMPLETED" },
    { id:"bk-003", no:"BKG-2025-0003", customer:"Komunitas Futsal Jakarta", phone:"0814-7777-3333", courtId:"crt-1", branchId:"branch-jkt", date:"2025-05-05", start:"2025-05-05T19:00:00", end:"2025-05-05T21:00:00", duration:2, pph:120000, total:240000, status:"COMPLETED" },
    { id:"bk-004", no:"BKG-2025-0004", customer:"Wahyu Susanto",           phone:"0815-6666-4444", courtId:"crt-3", branchId:"branch-jkt", date:"2025-05-18", start:"2025-05-18T07:00:00", end:"2025-05-18T09:00:00", duration:2, pph:80000,  total:160000, status:"COMPLETED" },
    { id:"bk-005", no:"BKG-2025-0005", customer:"Rajawali FC",             phone:"0816-5555-5555", courtId:"crt-2", branchId:"branch-jkt", date:"2025-06-07", start:"2025-06-07T15:00:00", end:"2025-06-07T17:00:00", duration:2, pph:100000, total:200000, status:"CONFIRMED" },
    { id:"bk-006", no:"BKG-2025-0006", customer:"Garuda Muda Jakarta",     phone:"0817-4444-6666", courtId:"crt-1", branchId:"branch-jkt", date:"2025-06-10", start:"2025-06-10T20:00:00", end:"2025-06-10T22:00:00", duration:2, pph:120000, total:240000, status:"PENDING" },
    { id:"bk-007", no:"BKG-2025-0007", customer:"Rio Santoso",             phone:"0818-3333-7777", courtId:"crt-3", branchId:"branch-jkt", date:"2025-06-12", start:"2025-06-12T07:00:00", end:"2025-06-12T09:00:00", duration:2, pph:80000,  total:160000, status:"PENDING" },
    { id:"bk-008", no:"BKG-2025-0008", customer:"Persib Fans Bandung",     phone:"0822-4444-6666", courtId:"crt-4", branchId:"branch-bdg", date:"2025-05-10", start:"2025-05-10T17:00:00", end:"2025-05-10T19:00:00", duration:2, pph:90000,  total:180000, status:"COMPLETED" },
    { id:"bk-009", no:"BKG-2025-0009", customer:"Maung Bandung FC",        phone:"0822-3333-8888", courtId:"crt-5", branchId:"branch-bdg", date:"2025-05-24", start:"2025-05-24T09:00:00", end:"2025-05-24T11:00:00", duration:2, pph:90000,  total:180000, status:"COMPLETED" },
    { id:"bk-010", no:"BKG-2025-0010", customer:"Dedi Setiabudi",          phone:"0822-1111-9999", courtId:"crt-4", branchId:"branch-bdg", date:"2025-06-08", start:"2025-06-08T16:00:00", end:"2025-06-08T18:00:00", duration:2, pph:90000,  total:180000, status:"CONFIRMED" },
    { id:"bk-011", no:"BKG-2025-0011", customer:"Santoso Brothers",        phone:"0812-5555-1234", courtId:"crt-2", branchId:"branch-jkt", date:"2025-05-28", start:"2025-05-28T14:00:00", end:"2025-05-28T17:00:00", duration:3, pph:100000, total:300000, status:"COMPLETED" },
    { id:"bk-012", no:"BKG-2025-0012", customer:"Tim Basket Karyawan",     phone:"0813-6666-5678", courtId:"crt-1", branchId:"branch-jkt", date:"2025-04-05", start:"2025-04-05T06:00:00", end:"2025-04-05T08:00:00", duration:2, pph:100000, total:200000, status:"CANCELLED", notes:"Dibatalkan H-1 oleh customer" },
  ];

  for (const b of BOOKINGS) {
    await prisma.rentalBooking.create({
      data: {
        id: b.id,
        bookingNumber: b.no,
        customerName: b.customer,
        customerPhone: b.phone,
        courtId: b.courtId,
        branchId: b.branchId,
        date: d(b.date),
        startTime: new Date(b.start),
        endTime: new Date(b.end),
        duration: b.duration,
        pricePerHour: b.pph,
        totalAmount: b.total,
        status: b.status,
        notes: b.notes,
      },
    });
    if (b.status === "COMPLETED" || b.status === "CONFIRMED") {
      await prisma.payment.create({
        data: {
          bookingId: b.id,
          amount: b.total,
          method: "CASH",
          status: b.status === "COMPLETED" ? "VERIFIED" : "PENDING",
          verifiedAt: b.status === "COMPLETED" ? d(b.date) : null,
          verifiedBy: b.status === "COMPLETED" ? (b.branchId === "branch-jkt" ? "u-cop-jkt" : "u-cop-bdg") : null,
        },
      });
    }
  }
  console.log(`✓ Rental bookings (${BOOKINGS.length})`);

  // ─── STEP 18: Court Schedules ─────────────────────────────────────────────
  await prisma.courtSchedule.createMany({
    data: [
      { courtId:"crt-1", branchId:"branch-jkt", title:"Akademi U12 – Senin",    type:"ACADEMY",      startTime: d("2025-06-02T15:00:00"), endTime: d("2025-06-02T17:00:00"), isRecurring:true,  recurDay:1 },
      { courtId:"crt-1", branchId:"branch-jkt", title:"Akademi U12 – Rabu",     type:"ACADEMY",      startTime: d("2025-06-04T15:00:00"), endTime: d("2025-06-04T17:00:00"), isRecurring:true,  recurDay:3 },
      { courtId:"crt-2", branchId:"branch-jkt", title:"Akademi U14 – Selasa",   type:"ACADEMY",      startTime: d("2025-06-03T15:00:00"), endTime: d("2025-06-03T17:00:00"), isRecurring:true,  recurDay:2 },
      { courtId:"crt-2", branchId:"branch-jkt", title:"Akademi U14 – Kamis",    type:"ACADEMY",      startTime: d("2025-06-05T15:00:00"), endTime: d("2025-06-05T17:00:00"), isRecurring:true,  recurDay:4 },
      { courtId:"crt-3", branchId:"branch-jkt", title:"Akademi U8 – Sabtu",     type:"ACADEMY",      startTime: d("2025-06-07T08:00:00"), endTime: d("2025-06-07T10:00:00"), isRecurring:true,  recurDay:6 },
      { courtId:"crt-1", branchId:"branch-jkt", title:"Maintenance Lapangan A", type:"MAINTENANCE",  startTime: d("2025-06-09T06:00:00"), endTime: d("2025-06-09T08:00:00"), isRecurring:false, notes:"Pembersihan dan pengecekan permukaan" },
      { courtId:"crt-1", branchId:"branch-jkt", title:"Akademi U16 – Senin",    type:"ACADEMY",      startTime: d("2025-06-02T16:00:00"), endTime: d("2025-06-02T18:00:00"), isRecurring:true,  recurDay:1 },
      { courtId:"crt-4", branchId:"branch-bdg", title:"Akademi U12 Bdg – Rabu", type:"ACADEMY",      startTime: d("2025-06-04T15:00:00"), endTime: d("2025-06-04T17:00:00"), isRecurring:true,  recurDay:3 },
      { courtId:"crt-5", branchId:"branch-bdg", title:"Akademi U14 Bdg – Senin",type:"ACADEMY",      startTime: d("2025-06-02T15:00:00"), endTime: d("2025-06-02T17:00:00"), isRecurring:true,  recurDay:1 },
    ],
  });
  console.log("✓ Court schedules");

  // ─── STEP 19: Expenses ────────────────────────────────────────────────────
  await prisma.expense.createMany({
    data: [
      { title:"Tagihan Listrik Apr 2025",     category:"UTILITIES",   amount:3200000, date:d("2025-04-05"), branchId:"branch-jkt", status:"APPROVED", approvedBy:"u-mgr-jkt" },
      { title:"Tagihan Air Apr 2025",         category:"UTILITIES",   amount:820000,  date:d("2025-04-07"), branchId:"branch-jkt", status:"APPROVED", approvedBy:"u-mgr-jkt" },
      { title:"Tagihan Listrik Mei 2025",     category:"UTILITIES",   amount:3500000, date:d("2025-05-05"), branchId:"branch-jkt", status:"APPROVED", approvedBy:"u-mgr-jkt" },
      { title:"Tagihan Air Mei 2025",         category:"UTILITIES",   amount:850000,  date:d("2025-05-07"), branchId:"branch-jkt", status:"APPROVED", approvedBy:"u-mgr-jkt" },
      { title:"Pembelian Bola Baru (10 pcs)", category:"EQUIPMENT",   amount:2500000, date:d("2025-04-20"), branchId:"branch-jkt", status:"APPROVED", approvedBy:"u-mgr-jkt" },
      { title:"Pembelian Cone & Ladder Drill",category:"EQUIPMENT",   amount:1200000, date:d("2025-03-15"), branchId:"branch-jkt", status:"APPROVED", approvedBy:"u-mgr-jkt" },
      { title:"Perbaikan AC Lapangan A",      category:"MAINTENANCE", amount:1800000, date:d("2025-05-12"), branchId:"branch-jkt", status:"APPROVED", approvedBy:"u-mgr-jkt" },
      { title:"Pengecatan Lapangan Outdoor",  category:"MAINTENANCE", amount:4500000, date:d("2025-04-01"), branchId:"branch-jkt", status:"APPROVED", approvedBy:"u-mgr-jkt" },
      { title:"Iklan Instagram Apr 2025",     category:"MARKETING",   amount:1000000, date:d("2025-04-01"), branchId:"branch-jkt", status:"APPROVED", approvedBy:"u-mgr-jkt" },
      { title:"Iklan Instagram Mei 2025",     category:"MARKETING",   amount:1200000, date:d("2025-05-01"), branchId:"branch-jkt", status:"APPROVED", approvedBy:"u-mgr-jkt" },
      { title:"Iklan TikTok Mei 2025",        category:"MARKETING",   amount:800000,  date:d("2025-05-15"), branchId:"branch-jkt", status:"PENDING" },
      { title:"Gaji Staff Admin Jun 2025",    category:"PAYROLL",     amount:4500000, date:d("2025-06-01"), branchId:"branch-jkt", status:"PENDING" },
      { title:"Sewa Gedung Jun 2025",         category:"RENT",        amount:8000000, date:d("2025-06-01"), branchId:"branch-jkt", status:"PENDING" },
      // Branch Bandung
      { title:"Tagihan Listrik Mei 2025",     category:"UTILITIES",   amount:2800000, date:d("2025-05-05"), branchId:"branch-bdg", status:"APPROVED", approvedBy:"u-mgr-bdg" },
      { title:"Tagihan Air Mei 2025",         category:"UTILITIES",   amount:650000,  date:d("2025-05-07"), branchId:"branch-bdg", status:"APPROVED", approvedBy:"u-mgr-bdg" },
      { title:"Pembelian Jersey Baru",        category:"EQUIPMENT",   amount:3000000, date:d("2025-04-15"), branchId:"branch-bdg", status:"APPROVED", approvedBy:"u-mgr-bdg" },
      { title:"Perbaikan Atap Lapangan",      category:"MAINTENANCE", amount:5500000, date:d("2025-05-20"), branchId:"branch-bdg", status:"REJECTED", approvedBy:"u-mgr-bdg" },
      { title:"Iklan Instagram Mei 2025",     category:"MARKETING",   amount:900000,  date:d("2025-05-01"), branchId:"branch-bdg", status:"APPROVED", approvedBy:"u-mgr-bdg" },
      { title:"Gaji Staff Admin Jun 2025",    category:"PAYROLL",     amount:4000000, date:d("2025-06-01"), branchId:"branch-bdg", status:"PENDING" },
    ],
  });
  console.log("✓ Expenses (19)");

  // ─── STEP 20: Coach Payrolls ──────────────────────────────────────────────
  await prisma.coachPayroll.createMany({
    data: [
      { coachId:"c1", period:"Mar-2025", payrollType:"PER_SESSION", sessions:22, rateAmount:150000, totalAmount:3300000, status:"PAID",     paidAt:d("2025-04-01"), verifiedBy:"u-mgr-jkt" },
      { coachId:"c1", period:"Apr-2025", payrollType:"PER_SESSION", sessions:20, rateAmount:150000, totalAmount:3000000, status:"PAID",     paidAt:d("2025-05-01"), verifiedBy:"u-mgr-jkt" },
      { coachId:"c1", period:"Mei-2025", payrollType:"PER_SESSION", sessions:22, rateAmount:150000, totalAmount:3300000, status:"PAID",     paidAt:d("2025-06-01"), verifiedBy:"u-mgr-jkt" },
      { coachId:"c1", period:"Jun-2025", payrollType:"PER_SESSION", sessions:10, rateAmount:150000, totalAmount:1500000, status:"PENDING" },
      { coachId:"c2", period:"Mar-2025", payrollType:"PER_SESSION", sessions:20, rateAmount:150000, totalAmount:3000000, status:"PAID",     paidAt:d("2025-04-01"), verifiedBy:"u-mgr-jkt" },
      { coachId:"c2", period:"Apr-2025", payrollType:"PER_SESSION", sessions:18, rateAmount:150000, totalAmount:2700000, status:"PAID",     paidAt:d("2025-05-01"), verifiedBy:"u-mgr-jkt" },
      { coachId:"c2", period:"Mei-2025", payrollType:"PER_SESSION", sessions:20, rateAmount:150000, totalAmount:3000000, status:"PAID",     paidAt:d("2025-06-01"), verifiedBy:"u-mgr-jkt" },
      { coachId:"c2", period:"Jun-2025", payrollType:"PER_SESSION", sessions:9,  rateAmount:150000, totalAmount:1350000, status:"PENDING" },
      { coachId:"c3", period:"Mei-2025", payrollType:"PER_SESSION", sessions:18, rateAmount:125000, totalAmount:2250000, status:"PAID",     paidAt:d("2025-06-01"), verifiedBy:"u-mgr-jkt" },
      { coachId:"c3", period:"Jun-2025", payrollType:"PER_SESSION", sessions:8,  rateAmount:125000, totalAmount:1000000, status:"PENDING" },
      { coachId:"c4", period:"Mei-2025", payrollType:"PER_SESSION", sessions:15, rateAmount:125000, totalAmount:1875000, status:"APPROVED", verifiedBy:"u-mgr-jkt" },
      { coachId:"c5", period:"Mei-2025", payrollType:"PER_SESSION", sessions:16, rateAmount:125000, totalAmount:2000000, status:"PAID",     paidAt:d("2025-06-01"), verifiedBy:"u-mgr-bdg" },
      { coachId:"c6", period:"Mei-2025", payrollType:"PER_SESSION", sessions:18, rateAmount:150000, totalAmount:2700000, status:"PAID",     paidAt:d("2025-06-01"), verifiedBy:"u-mgr-bdg" },
    ],
  });
  console.log("✓ Coach payrolls");

  // ─── STEP 21: Leads & Activities ─────────────────────────────────────────
  await prisma.lead.createMany({
    data: [
      { id:"ld-1",  fullName:"Pak Hasan Ibrahim",   phone:"0812-3001-1111", email:"hasan.ibrahim@gmail.com",  source:"INSTAGRAM", stage:"LEAD",       branchId:"branch-jkt", assignedTo:"u-acad-jkt" },
      { id:"ld-2",  fullName:"Ibu Yanti Sopandi",   phone:"0813-3002-2222",                                  source:"WALK_IN",   stage:"CONTACTED",  branchId:"branch-jkt", assignedTo:"u-acad-jkt", followUpAt:daysFromNow(2) },
      { id:"ld-3",  fullName:"Pak Doni Sutrisno",   phone:"0814-3003-3333", email:"doni.sutrisno@email.com",  source:"REFERRAL",  stage:"TRIAL",      branchId:"branch-jkt", assignedTo:"u-acad-jkt" },
      { id:"ld-4",  fullName:"Ibu Rina Marlina",    phone:"0815-3004-4444",                                  source:"TIKTOK",    stage:"REGISTERED", branchId:"branch-jkt", assignedTo:"u-acad-jkt", convertedAt:daysAgo(5) },
      { id:"ld-5",  fullName:"Pak Teguh Santoso",   phone:"0816-3005-5555", email:"teguh@email.com",          source:"INSTAGRAM", stage:"ACTIVE",     branchId:"branch-jkt", assignedTo:"u-acad-jkt", convertedAt:daysAgo(30) },
      { id:"ld-6",  fullName:"Pak Wawan Setiabudi", phone:"0817-3006-6666",                                  source:"WEBSITE",   stage:"LEAD",       branchId:"branch-jkt" },
      { id:"ld-7",  fullName:"Pak Eko Prasetyo",    phone:"0818-3007-7777",                                  source:"INSTAGRAM", stage:"LEAD",       branchId:"branch-jkt" },
      { id:"ld-8",  fullName:"Ibu Suci Rahayu",     phone:"0822-3001-8888",                                  source:"INSTAGRAM", stage:"CONTACTED",  branchId:"branch-bdg", assignedTo:"u-acad-bdg", followUpAt:daysFromNow(3) },
      { id:"ld-9",  fullName:"Pak Firman Nusantara",phone:"0822-3002-9999", email:"firman@email.com",          source:"REFERRAL",  stage:"TRIAL",      branchId:"branch-bdg", assignedTo:"u-acad-bdg" },
      { id:"ld-10", fullName:"Bpk Agung Prabowo",   phone:"0822-3003-0001",                                  source:"WALK_IN",   stage:"LEAD",       branchId:"branch-bdg" },
      { id:"ld-11", fullName:"Pak Joko Susilo",     phone:"0811-3004-1234",                                  source:"TIKTOK",    stage:"CONTACTED",  branchId:"branch-jkt", assignedTo:"u-acad-jkt", followUpAt:daysFromNow(5) },
      { id:"ld-12", fullName:"Ibu Retno Wulandari", phone:"0819-3005-5678",                                  source:"REFERRAL",  stage:"LEAD",       branchId:"branch-bdg" },
    ],
  });
  await prisma.leadActivity.createMany({
    data: [
      { leadId:"ld-1",  action:"First Contact",      note:"Tertarik kelas U10 untuk anak laki-laki umur 9 tahun, minta brosur" },
      { leadId:"ld-2",  action:"Follow Up Call",     note:"Akan datang survey akhir pekan, jadwal Sabtu jam 10:00" },
      { leadId:"ld-3",  action:"Trial Scheduled",    note:"Jadwal trial Sabtu 07-06-2025 kelas U12" },
      { leadId:"ld-3",  action:"Second Contact",     note:"Konfirmasi ulang kehadiran trial via WA" },
      { leadId:"ld-4",  action:"Registration Done",  note:"Mendaftar kelas U12, bayar biaya pendaftaran Rp500.000" },
      { leadId:"ld-5",  action:"Converted to Active",note:"Aktif mengikuti kelas senior sejak April 2025" },
      { leadId:"ld-8",  action:"First Contact",      note:"Tanya kelas untuk anak perempuan umur 8 tahun" },
      { leadId:"ld-9",  action:"Trial Scheduled",    note:"Trial kelas U14 Bandung dijadwalkan 10 Juni 2025" },
      { leadId:"ld-11", action:"First Contact",      note:"Tertarik paket keluarga, tanya diskon 2 anak sekaligus" },
    ],
  });
  console.log("✓ Leads & activities");

  // ─── STEP 22: Trial Classes & Participants ────────────────────────────────
  await prisma.trialClass.createMany({
    data: [
      { id:"tc-1", classId:"cls-u12-jkt", date:daysFromNow(3),  maxSlots:5, notes:"Trial bulanan Juni – kelas U12" },
      { id:"tc-2", classId:"cls-u10-jkt", date:daysFromNow(10), maxSlots:5 },
      { id:"tc-3", classId:"cls-u14-bdg", date:daysFromNow(6),  maxSlots:4, notes:"Trial khusus Bandung" },
    ],
  });
  await prisma.trialParticipant.createMany({
    data: [
      { trialClassId:"tc-1", name:"Arif Budiman",    phone:"0812-9876-1111", status:"REGISTERED", leadId:"ld-3" },
      { trialClassId:"tc-1", name:"Faris Lubis",     phone:"0813-9876-2222", status:"REGISTERED" },
      { trialClassId:"tc-2", name:"Gio Pratama",     phone:"0814-9876-3333", status:"REGISTERED", leadId:"ld-7" },
      { trialClassId:"tc-3", name:"Haris Kurniawan", phone:"0822-9876-4444", status:"REGISTERED", leadId:"ld-9" },
    ],
  });
  console.log("✓ Trial classes & participants");

  // ─── STEP 23: Waitlists ───────────────────────────────────────────────────
  await prisma.classWaitlist.createMany({
    data: [
      { classId:"cls-u8-jkt",  name:"Pandu Wijaya",    phone:"0812-1111-9999", position:1, status:"WAITING" },
      { classId:"cls-u8-jkt",  name:"Shafira Rizki",   phone:"0813-2222-8888", position:2, status:"WAITING" },
      { classId:"cls-u12-jkt", name:"Theo Pratama",    phone:"0814-3333-7777", position:1, status:"NOTIFIED", notifiedAt:daysAgo(2) },
      { classId:"cls-u10-bdg", name:"Rani Cahyani",    phone:"0822-4444-6666", position:1, status:"WAITING" },
    ],
  });
  await prisma.rentalWaitlist.createMany({
    data: [
      { courtId:"crt-1", name:"Soni Irawan",   phone:"0815-5555-1234", date:daysFromNow(3), startTime:daysFromNow(3), endTime:daysFromNow(3), position:1, status:"WAITING" },
      { courtId:"crt-4", name:"Benny Susanto", phone:"0822-6666-5678", date:daysFromNow(5), startTime:daysFromNow(5), endTime:daysFromNow(5), position:1, status:"WAITING" },
    ],
  });
  console.log("✓ Waitlists");

  // ─── STEP 24: Membership Plans & Student Memberships ─────────────────────
  await prisma.membershipPlan.createMany({
    data: [
      { id:"mp-monthly",  name:"Monthly",     type:"MONTHLY",      durationDays:30,  price:350000,  description:"Paket bulanan fleksibel",               isActive:true },
      { id:"mp-quarter",  name:"Quarterly",   type:"QUARTERLY",    durationDays:90,  price:950000,  description:"Paket 3 bulan, hemat Rp100.000",         isActive:true },
      { id:"mp-semi",     name:"Semi Annual", type:"SEMI_ANNUAL",  durationDays:180, price:1800000, description:"Paket 6 bulan, hemat Rp300.000",         isActive:true },
      { id:"mp-annual",   name:"Annual",      type:"ANNUAL",       durationDays:365, price:3400000, description:"Paket tahunan, hemat Rp800.000",         isActive:true },
    ],
  });

  const memberStudents = activeStudents.slice(0, 15);
  const planCycle: Array<[string, string, string]> = [
    ["mp-annual",  "2025-01-01", "2025-12-31"],
    ["mp-quarter", "2025-04-01", "2025-06-30"],
    ["mp-monthly", "2025-06-01", "2025-06-30"],
  ];
  for (let i = 0; i < memberStudents.length; i++) {
    const [planId, startDate, endDate] = planCycle[i % planCycle.length];
    await prisma.studentMembership.create({
      data: {
        studentId: sid(memberStudents[i].no),
        planId,
        startDate: d(startDate),
        endDate: d(endDate),
        status: "ACTIVE",
        autoRenew: planId === "mp-annual",
      },
    });
  }
  console.log("✓ Membership plans & student memberships");

  // ─── STEP 25: Rental Packages ─────────────────────────────────────────────
  await prisma.rentalPackage.createMany({
    data: [
      { name:"Paket 5 Jam",   hours:5,  price:450000,  validDays:90,  description:"Hemat 10% dari harga normal", isActive:true },
      { name:"Paket 10 Jam",  hours:10, price:850000,  validDays:180, description:"Hemat 15%",                   isActive:true },
      { name:"Paket 20 Jam",  hours:20, price:1600000, validDays:365, description:"Hemat 20%, cocok untuk club", isActive:true },
      { name:"Paket Weekend", hours:8,  price:680000,  validDays:60,  description:"Khusus Sabtu-Minggu, hemat 15%", isActive:true },
    ],
  });
  console.log("✓ Rental packages");

  // ─── STEP 26: Promotions ──────────────────────────────────────────────────
  await prisma.promotion.createMany({
    data: [
      { id:"prm-1", code:"NEWMEMBER2025",  name:"Diskon Anggota Baru",  discountType:"PERCENTAGE", discountValue:20, maxUses:50,  usedCount:12, startDate:d("2025-06-01"), endDate:d("2025-07-31"), isActive:true },
      { id:"prm-2", code:"REFERRAL50K",    name:"Bonus Referral",       discountType:"FIXED",      discountValue:50000, maxUses:100, usedCount:25, startDate:d("2025-01-01"), endDate:d("2025-12-31"), isActive:true },
      { id:"prm-3", code:"RAMADAN2025",    name:"Promo Ramadan",        discountType:"PERCENTAGE", discountValue:15, maxUses:30,  usedCount:30, startDate:d("2025-02-28"), endDate:d("2025-03-31"), isActive:false },
    ],
  });
  await prisma.promotionRule.createMany({
    data: [
      { promotionId:"prm-1", condition:"first_registration", value:"true" },
      { promotionId:"prm-2", condition:"referral_required",  value:"true" },
      { promotionId:"prm-3", condition:"period",             value:"ramadan" },
    ],
  });
  console.log("✓ Promotions");

  // ─── STEP 27: Assets ──────────────────────────────────────────────────────
  await prisma.asset.createMany({
    data: [
      { id:"ast-1", name:"AC Split 1.5 PK Lapangan A",   category:"Elektronik",    purchaseDate:d("2023-03-01"), cost:4500000,  depreciation:20, condition:"GOOD", branchId:"branch-jkt" },
      { id:"ast-2", name:"AC Split 1.5 PK Lapangan B",   category:"Elektronik",    purchaseDate:d("2023-03-01"), cost:4500000,  depreciation:20, condition:"FAIR", branchId:"branch-jkt" },
      { id:"ast-3", name:"Papan Skor Digital",            category:"Elektronik",    purchaseDate:d("2022-06-15"), cost:8000000,  depreciation:15, condition:"GOOD", branchId:"branch-jkt" },
      { id:"ast-4", name:"CCTV System (4 unit)",          category:"Keamanan",      purchaseDate:d("2023-01-10"), cost:6000000,  depreciation:20, condition:"GOOD", branchId:"branch-jkt" },
      { id:"ast-5", name:"Mesin Kasir POS",               category:"Elektronik",    purchaseDate:d("2024-01-01"), cost:3500000,  depreciation:25, warrantyExpiry:d("2026-01-01"), condition:"GOOD", branchId:"branch-jkt" },
      { id:"ast-6", name:"Generator Backup 5000W",        category:"Infrastruktur", purchaseDate:d("2022-07-01"), cost:15000000, depreciation:10, condition:"GOOD", branchId:"branch-jkt" },
      { id:"ast-7", name:"AC Split Lapangan A Bandung",   category:"Elektronik",    purchaseDate:d("2024-01-15"), cost:4500000,  depreciation:20, warrantyExpiry:d("2026-01-15"), condition:"GOOD", branchId:"branch-bdg" },
      { id:"ast-8", name:"CCTV System Bandung (3 unit)",  category:"Keamanan",      purchaseDate:d("2024-02-01"), cost:4500000,  depreciation:20, condition:"GOOD", branchId:"branch-bdg" },
      { id:"ast-9", name:"Meja & Kursi Resepsionis",      category:"Furnitur",      purchaseDate:d("2022-03-01"), cost:2500000,  depreciation:15, condition:"GOOD", branchId:"branch-jkt" },
    ],
  });
  console.log("✓ Assets (9)");

  // ─── STEP 28: Maintenance Tickets ────────────────────────────────────────
  await prisma.maintenanceTicket.createMany({
    data: [
      { title:"AC Lapangan B tidak dingin",    description:"AC mengeluarkan udara panas, perlu cek freon",              status:"IN_PROGRESS", priority:"HIGH",   branchId:"branch-jkt", assetId:"ast-2", assignedTo:"u-cop-jkt" },
      { title:"Lampu arena putus",             description:"2 lampu di sudut lapangan A tidak menyala",                status:"OPEN",        priority:"MEDIUM", branchId:"branch-jkt" },
      { title:"Keramik kamar mandi retak",     description:"Keramik di dekat wastafel pria retak",                     status:"OPEN",        priority:"LOW",    branchId:"branch-jkt" },
      { title:"Jaring gawang sobek",           description:"Jaring gawang lapangan A sobek di bagian bawah kanan",     status:"COMPLETED",   priority:"MEDIUM", branchId:"branch-jkt", resolvedAt:daysAgo(5), resolutionNote:"Jaring telah diganti baru" },
      { title:"Papan skor error",              description:"Digit ke-2 papan skor digital tidak muncul",               status:"OPEN",        priority:"MEDIUM", branchId:"branch-jkt", assetId:"ast-3" },
      { title:"Cat tembok mengelupas",         description:"Cat di area tribun penonton mulai mengelupas",             status:"OPEN",        priority:"LOW",    branchId:"branch-bdg", assignedTo:"u-cop-bdg" },
      { title:"Pintu locker macet",            description:"Engsel pintu locker room kiri macet dan perlu diganti",    status:"IN_PROGRESS", priority:"MEDIUM", branchId:"branch-jkt", assignedTo:"u-cop-jkt" },
      { title:"Kebocoran atap saat hujan",     description:"Terdapat rembesan air dari atap dekat tribun saat hujan", status:"OPEN",        priority:"HIGH",   branchId:"branch-bdg" },
    ],
  });
  console.log("✓ Maintenance tickets");

  // ─── STEP 29: Documents ───────────────────────────────────────────────────
  await prisma.document.createMany({
    data: [
      { name:"Kontrak Coach Budi Santoso 2025",    type:"PDF", fileUrl:"/docs/kontrak-budi-2025.pdf",   fileSize:512000, mimeType:"application/pdf", category:"COACH_CONTRACT",    entityId:"c1", entityType:"Coach",   branchId:"branch-jkt", uploadedBy:"u-mgr-jkt" },
      { name:"Kontrak Coach Andi Wijaya 2025",     type:"PDF", fileUrl:"/docs/kontrak-andi-2025.pdf",   fileSize:512000, mimeType:"application/pdf", category:"COACH_CONTRACT",    entityId:"c2", entityType:"Coach",   branchId:"branch-jkt", uploadedBy:"u-mgr-jkt" },
      { name:"Kontrak Coach Rini Astuti 2025",     type:"PDF", fileUrl:"/docs/kontrak-rini-2025.pdf",   fileSize:490000, mimeType:"application/pdf", category:"COACH_CONTRACT",    entityId:"c3", entityType:"Coach",   branchId:"branch-jkt", uploadedBy:"u-mgr-jkt" },
      { name:"Kontrak Coach Susi Rahayu 2025",     type:"PDF", fileUrl:"/docs/kontrak-susi-2025.pdf",   fileSize:490000, mimeType:"application/pdf", category:"COACH_CONTRACT",    entityId:"c5", entityType:"Coach",   branchId:"branch-bdg", uploadedBy:"u-mgr-bdg" },
      { name:"Persetujuan Siswa – Farhan Rizky",   type:"PDF", fileUrl:"/docs/persetujuan-s001.pdf",    fileSize:256000, mimeType:"application/pdf", category:"STUDENT_AGREEMENT", entityId:sid("STD-2024-001"), entityType:"Student", branchId:"branch-jkt", uploadedBy:"u-acad-jkt" },
      { name:"Persetujuan Siswa – Rafif Hakim",    type:"PDF", fileUrl:"/docs/persetujuan-s008.pdf",    fileSize:256000, mimeType:"application/pdf", category:"STUDENT_AGREEMENT", entityId:sid("STD-2024-008"), entityType:"Student", branchId:"branch-jkt", uploadedBy:"u-acad-jkt" },
    ],
  });
  console.log("✓ Documents");

  // ─── STEP 30: System Settings ─────────────────────────────────────────────
  await prisma.systemSetting.createMany({
    data: [
      { key:"app_name",                   value:"Sports Center Management",    label:"Nama Aplikasi",                  group:"general" },
      { key:"app_tagline",                value:"Akademi Futsal Profesional",  label:"Tagline",                        group:"general" },
      { key:"currency",                   value:"IDR",                         label:"Mata Uang",                      group:"general" },
      { key:"timezone",                   value:"Asia/Jakarta",                label:"Timezone",                       group:"general" },
      { key:"invoice_prefix",             value:"INV",                         label:"Prefix Invoice",                 group:"billing" },
      { key:"invoice_due_days",           value:"14",                          label:"Hari Jatuh Tempo Invoice",        group:"billing" },
      { key:"monthly_fee",                value:"350000",                      label:"Iuran Bulanan Default (IDR)",     group:"billing" },
      { key:"registration_fee",           value:"500000",                      label:"Biaya Pendaftaran (IDR)",         group:"billing" },
      { key:"late_fee_percentage",        value:"5",                           label:"Denda Keterlambatan (%)",         group:"billing" },
      { key:"rental_price_indoor",        value:"100000",                      label:"Harga Sewa Indoor per Jam (IDR)", group:"billing" },
      { key:"rental_price_outdoor",       value:"80000",                       label:"Harga Sewa Outdoor per Jam (IDR)",group:"billing" },
      { key:"wa_notification_enabled",    value:"true",                        label:"Notifikasi WhatsApp",             group:"notification" },
      { key:"email_notification_enabled", value:"true",                        label:"Notifikasi Email",                group:"notification" },
      { key:"reminder_days_before_due",   value:"3",                           label:"Hari Pengingat Jatuh Tempo",      group:"notification" },
      { key:"max_trial_slots",            value:"5",                           label:"Maks Slot Trial per Kelas",       group:"academy" },
      { key:"assessment_period",          value:"quarterly",                   label:"Frekuensi Penilaian Siswa",       group:"academy" },
    ],
  });
  console.log("✓ System settings (16)");

  // ─── STEP 31: Parent Notes & Communications ──────────────────────────────
  await prisma.parentNote.createMany({
    data: [
      { parentId:"p1",  note:"Orang tua sangat aktif dan komunikatif. Sering menanyakan perkembangan Farhan." },
      { parentId:"p4",  note:"Wiraswasta, jadwal terbatas. Lebih mudah dihubungi malam hari setelah 20:00." },
      { parentId:"p8",  note:"Meminta laporan perkembangan anak setiap akhir bulan via WhatsApp." },
      { parentId:"p13", note:"Mendaftarkan 2 anak sekaligus (Jovan & Kirana & Luthfi). Tanya kemungkinan diskon keluarga." },
    ],
  });
  await prisma.parentCommunication.createMany({
    data: [
      { parentId:"p1",  channel:"WHATSAPP", direction:"OUTBOUND", subject:"Info Pertandingan",       message:"Pak Hendra, Farhan terpilih untuk pertandingan antar cabang bulan depan. Mohon konfirmasi kehadiran." },
      { parentId:"p2",  channel:"WHATSAPP", direction:"INBOUND",  subject:"Tanya Jadwal",            message:"Apakah ada perubahan jadwal latihan Sabtu minggu depan? Nayla tidak bisa datang pagi." },
      { parentId:"p8",  channel:"PHONE",    direction:"OUTBOUND", subject:"Follow-up Assessment Q2", message:"Menginformasikan hasil assessment Q2 Rafif yang menunjukkan peningkatan signifikan di dribbling." },
      { parentId:"p13", channel:"WHATSAPP", direction:"OUTBOUND", subject:"Informasi Invoice Juni",  message:"Pak Prasetyo, invoice iuran bulan Juni untuk Jovan, Kirana, Luthfi, dan Meilani sudah diterbitkan." },
      { parentId:"p4",  channel:"EMAIL",    direction:"OUTBOUND", subject:"Laporan Bulanan Mei",     message:"Terlampir laporan kehadiran dan perkembangan Daffa bulan Mei 2025." },
    ],
  });
  console.log("✓ Parent notes & communications");

  // ─── STEP 32: Notifications ───────────────────────────────────────────────
  const notifUserId = preserved?.id ?? "u-super";
  await prisma.notification.createMany({
    data: [
      { userId:notifUserId,  type:"INVOICE_DUE",        channel:"IN_APP",  status:"SENT",  title:"5 Invoice Jatuh Tempo",          message:"Ada 5 invoice yang akan jatuh tempo dalam 3 hari ke depan.", sentAt:daysAgo(1) },
      { userId:notifUserId,  type:"BOOKING_CREATED",    channel:"IN_APP",  status:"READ",  title:"Booking Baru – Rajawali FC",     message:"Booking lapangan B tanggal 7 Juni 2025 dari Rajawali FC.", sentAt:daysAgo(2), readAt:daysAgo(1) },
      { userId:"u-acad-jkt", type:"STUDENT_SUSPENSION", channel:"IN_APP",  status:"READ",  title:"Siswa Diskors",                  message:"Umar Farouq (STD-2024-027) mendapat status diskors mulai hari ini.", sentAt:daysAgo(10), readAt:daysAgo(9) },
      { userId:"u-finance",  type:"INVOICE_OVERDUE",    channel:"IN_APP",  status:"SENT",  title:"Invoice Overdue – 3 Siswa",      message:"3 invoice iuran bulan Mei belum dibayar dan sudah melewati jatuh tempo.", sentAt:daysAgo(3) },
      { userId:"u-cop-jkt",  type:"BOOKING_CONFIRMED",  channel:"IN_APP",  status:"READ",  title:"Booking Dikonfirmasi",           message:"Booking BKG-2025-0005 dari Rajawali FC telah dikonfirmasi.", sentAt:daysAgo(4), readAt:daysAgo(4) },
    ],
  });
  console.log("✓ Notifications");

  // ─── STEP 33: Approval Requests ───────────────────────────────────────────
  await prisma.approvalRequest.createMany({
    data: [
      { type:"REFUND",               status:"PENDING",  entityType:"Payment",       reason:"Siswa mengundurkan diri, minta refund iuran bulan depan Rp350.000", amount:350000, requesterId:"u-acad-jkt" },
      { type:"MANUAL_DISCOUNT",      status:"APPROVED", entityType:"Invoice",       reason:"Diskon khusus keluarga kurang mampu", amount:100000, requesterId:"u-acad-jkt", approverId:"u-mgr-jkt" },
      { type:"BOOKING_CANCELLATION", status:"PENDING",  entityType:"RentalBooking", entityId:"bk-006", reason:"Customer minta batal 3 hari sebelum jadwal", requesterId:"u-cop-jkt" },
      { type:"INVOICE_CANCELLATION", status:"REJECTED", entityType:"Invoice",       reason:"Invoice ganda, minta pembatalan", reviewNote:"Invoice tidak ganda, ditolak", requesterId:"u-finance", approverId:"u-mgr-jkt" },
      { type:"MANUAL_DISCOUNT",      status:"PENDING",  entityType:"Invoice",       reason:"Promo akhir tahun untuk siswa berprestasi", amount:70000, requesterId:"u-acad-jkt" },
    ],
  });
  console.log("✓ Approval requests");

  // ─── STEP 34: Activity Logs ───────────────────────────────────────────────
  const logUserId = preserved?.id ?? "u-super";
  await prisma.activityLog.createMany({
    data: [
      { userId:logUserId,     action:"LOGIN",  module:"auth",       note:"Login berhasil dari browser",                    ipAddress:"192.168.1.100", createdAt:daysAgo(1) },
      { userId:logUserId,     action:"CREATE", module:"students",   entityId:sid("STD-2024-038"), note:"Tambah siswa: Satria Buana", createdAt:daysAgo(3) },
      { userId:"u-acad-jkt",  action:"UPDATE", module:"attendance", note:"Update presensi kelas U12 Rabu",                 ipAddress:"192.168.1.101", createdAt:daysAgo(1) },
      { userId:"u-acad-jkt",  action:"CREATE", module:"assessments",note:"Input assessment Q2-2025 untuk 10 siswa",        createdAt:daysAgo(3) },
      { userId:"u-finance",   action:"VERIFY", module:"payments",   note:"Verifikasi 12 pembayaran iuran Mei",             ipAddress:"192.168.1.102", createdAt:daysAgo(2) },
      { userId:"u-cop-jkt",   action:"CREATE", module:"rentals",    entityId:"bk-006", note:"Booking baru: Garuda Muda Jakarta", createdAt:daysAgo(4) },
      { userId:"u-mgr-jkt",   action:"APPROVE",module:"expenses",   note:"Approve pengeluaran listrik Mei Rp3.500.000",    createdAt:daysAgo(5) },
      { userId:"u-acad-bdg",  action:"CREATE", module:"students",   entityId:sid("STD-2024-038"), note:"Tambah siswa Bandung: Satria Buana", createdAt:daysAgo(7) },
      { userId:"u-mgr-bdg",   action:"REJECT", module:"expenses",   note:"Tolak pengajuan perbaikan atap Rp5.500.000 – anggaran tidak cukup", createdAt:daysAgo(6) },
      { userId:logUserId,     action:"EXPORT", module:"reports",    note:"Export laporan keuangan Mei 2025 ke Excel",      createdAt:daysAgo(2) },
    ],
  });
  console.log("✓ Activity logs");

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log("\n🏆  Seed complete!");
  console.log(`   Branches          : 2`);
  console.log(`   Roles             : ${ROLE_NAMES.length}`);
  console.log(`   Permissions       : ${MODULES.length * ACTIONS.length}`);
  console.log(`   Users             : ${systemUsers.length}${preserved ? " + 1 preserved" : ""}`);
  console.log(`   Coaches           : 6`);
  console.log(`   Classes           : 10 (6 Jakarta, 4 Bandung)`);
  console.log(`   Courts            : 6 (3 per branch)`);
  console.log(`   Students          : ${STUDENTS.length} (${activeStudents.length} active)`);
  console.log(`   Parents           : 18`);
  console.log(`   Leads             : 12`);
  console.log(`   Rental Bookings   : ${BOOKINGS.length}`);
  console.log(`   Assets            : 9`);
  console.log(`   Maintenance Tickets: 8`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
