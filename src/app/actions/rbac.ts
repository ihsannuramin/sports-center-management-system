"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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