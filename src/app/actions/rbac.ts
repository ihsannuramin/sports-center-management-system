"use server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function getCurrentUserWithRole() {
  try {
    const session = await getSession();
    if (!session?.userId) return null;
    return prisma.user.findUnique({
      where: { id: session.userId },
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

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new Error("Email sudah terdaftar");

  if (data.password.length < 6) throw new Error("Password minimal 6 karakter");

  const hashedPassword = await bcrypt.hash(data.password, 12);

  await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      name: data.name,
      phone: data.phone || null,
      roleId: data.roleId,
      branchId: data.branchId || null,
    },
  });

  revalidatePath("/dashboard/users");
}

export async function updateUser(
  id: string,
  data: {
    name: string;
    phone?: string;
    roleId: string;
    branchId?: string;
    password?: string;
  }
) {
  const currentUser = await getCurrentUserWithRole();
  if (!currentUser) throw new Error("Tidak terautentikasi");

  const targetRole = await prisma.role.findUnique({ where: { id: data.roleId } });
  if (targetRole?.name === "SUPER_ADMIN" && currentUser.role.name !== "SUPER_ADMIN") {
    throw new Error("Hanya SUPER_ADMIN yang dapat menetapkan role SUPER_ADMIN");
  }

  const updateData: {
    name: string;
    phone: string | null;
    roleId: string;
    branchId: string | null;
    password?: string;
  } = {
    name: data.name,
    phone: data.phone || null,
    roleId: data.roleId,
    branchId: data.branchId || null,
  };

  if (data.password && data.password.length >= 6) {
    updateData.password = await bcrypt.hash(data.password, 12);
  }

  await prisma.user.update({ where: { id }, data: updateData });

  revalidatePath("/dashboard/users");
}

export async function deleteUser(id: string) {
  const currentUser = await getCurrentUserWithRole();
  if (!currentUser) throw new Error("Tidak terautentikasi");
  if (currentUser.role.name !== "SUPER_ADMIN") throw new Error("Tidak memiliki akses");

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new Error("Pengguna tidak ditemukan");
  if (user.id === currentUser.id) throw new Error("Tidak dapat menghapus akun sendiri");

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
      data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
      skipDuplicates: true,
    });
  }
  revalidatePath("/dashboard/users");
}

export async function seedPermissions() {
  const modules = [
    "students","coaches","classes","attendance","assessments","invoices",
    "payments","courts","rentals","inventory","branches","users","settings",
    "expenses","payroll","parents","leads","reports",
  ];
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
