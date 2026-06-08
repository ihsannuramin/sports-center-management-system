"use server";
import { prisma } from "@/lib/prisma";
import { LogAction } from "@prisma/client";

export async function logActivity(params: {
  userId?: string;
  action: LogAction;
  module: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  note?: string;
}) {
  try {
    await prisma.activityLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        module: params.module,
        entityId: params.entityId,
        oldValue: params.oldValue ?? undefined,
        newValue: params.newValue ?? undefined,
        note: params.note,
      },
    });
  } catch {
    // fire-and-forget, never throw
  }
}

export async function getActivityLogs(params?: {
  module?: string;
  userId?: string;
  limit?: number;
  offset?: number;
}) {
  const where: any = {};
  if (params?.module) where.module = params.module;
  if (params?.userId) where.userId = params.userId;

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: params?.limit ?? 50,
      skip: params?.offset ?? 0,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.activityLog.count({ where }),
  ]);
  return { logs, total };
}