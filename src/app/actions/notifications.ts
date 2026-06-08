"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { NotificationType, NotifChannel } from "@prisma/client";

export async function getNotifications(userId?: string, limit = 50) {
  return prisma.notification.findMany({
    where: userId ? { userId } : undefined,
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function createNotification(data: {
  type: NotificationType;
  channel: NotifChannel;
  title: string;
  message: string;
  userId?: string;
  metadata?: Record<string, any>;
}) {
  const notif = await prisma.notification.create({ data });
  revalidatePath("/dashboard/notifications");
  return notif;
}

export async function markAsRead(id: string) {
  await prisma.notification.update({
    where: { id },
    data: { status: "READ", readAt: new Date() },
  });
  revalidatePath("/dashboard/notifications");
}

export async function markAllAsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, status: { not: "READ" } },
    data: { status: "READ", readAt: new Date() },
  });
  revalidatePath("/dashboard/notifications");
}

export async function deleteNotification(id: string) {
  await prisma.notification.delete({ where: { id } });
  revalidatePath("/dashboard/notifications");
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({ where: { userId, status: { not: "READ" } } });
}
