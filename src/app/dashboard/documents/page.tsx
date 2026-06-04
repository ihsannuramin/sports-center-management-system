export const dynamic = "force-dynamic";
import { Header } from "@/components/layout/header";
import { getDocuments } from "@/app/actions/documents";
import { getBranches } from "@/app/actions/branches";
import { DocumentsClient } from "./documents-client";

export default async function DocumentsPage() {
  const [documents, branches] = await Promise.all([
    getDocuments().catch(() => []),
    getBranches().catch(() => []),
  ]);

  return (
    <>
      <Header title="Manajemen Dokumen" />
      <div className="flex flex-1 flex-col gap-5 p-5">
        <DocumentsClient documents={documents} branches={branches} />
      </div>
    </>
  );
}
