"use server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function getCurrentUserWithRole() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    return prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: { role: true },
    });
  } catch {
    return null;
  }
}

export async function getUsers() {
  return prisma.user.findMany({
    include: { role: true, branch: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getRoles() {
  return prisma.role.findMany({
    include: {
      rolePermissions: { include: { permission: true } },
      _count: { select: { users: true } },
    },
  });
}

export async function getPermissions() {
  return prisma.permission.findMany({ orderBy: [{ module: "asc" }, { action: "asc" }] });
}

export async function createUser(data: {
  email: string;
  password: string;
  name: string;
  phone?: string;
  roleId: string;
  branchId?: string;
}) {
  const currentUser = await getCurrentUserWithRole();
  if (!currentUser) throw new Error("Tidak terautentikasi");

  const targetRole = await prisma.role.findUnique({ where: { id: data.roleId } });
  if (targetRole?.name === "SUPER_ADMIN" && currentUser.role.name !== "SUPER_ADMIN") {
    throw new Error("Hanya SUPER_ADMIN yang dapat membuat pengguna dengan role SUPER_ADMIN");
  }

  const admin = getAdminClient();
  const { data: authData, error } = await admin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
  });
  if (error || !authData.user) throw new Error(error?.message ?? "Gagal membuat akun");

  await prisma.user.create({
    data: {
      supabaseId: authData.user.id,
      email: data.email,
      name: data.name,
      phone: data.phone || null,
      roleId: data.roleId,
      branchId: data.branchId || null,
    },
  });

  revalidatePath("/dashboard/users");
}

export async function updateUser(id: string, data: {
  name: string;
  phone?: string;
  roleId: string;
  branchId?: string;
}) {
  const currentUser = await getCurrentUserWithRole();
  if (!currentUser) throw new Error("Tidak terautentikasi");

  const targetRole = await prisma.role.findUnique({ where: { id: data.roleId } });
  if (targetRole?.name === "SUPER_ADMIN" && currentUser.role.name !== "SUPER_ADMIN") {
    throw new Error("Hanya SUPER_ADMIN yang dapat menetapkan role SUPER_ADMIN");
  }

  await prisma.user.update({
    where: { id },
    data: {
      name: data.name,
      phone: data.phone || null,
      roleId: data.roleId,
      branchId: data.branchId || null,
    },
  });

  revalidatePath("/dashboard/users");
}

export async function deleteUser(id: string) {
  const currentUser = await getCurrentUserWithRole();
  if (!currentUser) throw new Error("Tidak terautentikasi");
  if (currentUser.role.name !== "SUPER_ADMIN") throw new Error("Tidak memiliki akses");

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new Error("Pengguna tidak ditemukan");

  // Ban in Supabase Auth then soft-delete in DB
  const admin = getAdminClient();
  await admin.auth.admin.updateUserById(user.supabaseId, { ban_duration: "876600h" });
  await prisma.user.update({ where: { id }, data: { isActive: false } });

  revalidatePath("/dashboard/users");
}

export async function updateUserRole(userId: string, roleId: string) {
  await prisma.user.update({ where: { id: userId }, data: { roleId } });
  revalidatePath("/dashboard/users");
}

export async function toggleUserStatus(userId: string, isActive: boolean) {
  await prisma.user.update({ where: { id: userId }, data: { isActive } });
  revalidatePath("/dashboard/users");
}

export async function updateRolePermissions(roleId: string, permissionIds: string[]) {
  await prisma.rolePermission.deleteMany({ where: { roleId } });
  if (permissionIds.length > 0) {
    await prisma.rolePermission.createMany({
      data: permissionIds.map(permissionId => ({ roleId, permissionId })),
      skipDuplicates: true,
    });
  }
  revalidatePath("/dashboard/users");
}

export async function seedPermissions() {
  const modules = ["students","coaches","classes","attendance","assessments","invoices","payments","courts","rentals","inventory","branches","users","settings","expenses","payroll","parents","leads","reports"];
  const actions = ["view","create","update","delete","export","approve"];
  for (const module of modules) {
    for (const action of actions) {
      await prisma.permission.upsert({
        where: { module_action: { module, action } },
        update: {},
        create: { module, action, label: `${action} ${module}` },
      });
    }
  }
}
