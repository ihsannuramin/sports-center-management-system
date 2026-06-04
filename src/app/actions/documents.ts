"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { DocCategory } from "@/generated/prisma";

export async function getDocuments(branchId?: string, category?: DocCategory) {
  return prisma.document.findMany({
    where: {
      ...(branchId ? { branchId } : {}),
      ...(category ? { category } : {}),
    },
    include: {
      uploader: { select: { name: true } },
      branch: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createDocument(data: {
  name: string;
  type: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  category: DocCategory;
  entityId?: string;
  entityType?: string;
  uploadedBy?: string;
  branchId?: string;
}) {
  await prisma.document.create({ data });
  revalidatePath("/dashboard/documents");
}

export async function deleteDocument(id: string) {
  await prisma.document.delete({ where: { id } });
  revalidatePath("/dashboard/documents");
}

export async function getDocumentsByEntity(entityId: string, entityType: string) {
  return prisma.document.findMany({
    where: { entityId, entityType },
    include: { uploader: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
}
