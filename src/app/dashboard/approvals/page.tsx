export const dynamic = "force-dynamic";
import { Header } from "@/components/layout/header";
import { getApprovalRequests } from "@/app/actions/approvals";
import { ApprovalsClient } from "./approvals-client";

export default async function ApprovalsPage() {
  const requests = await getApprovalRequests().catch(() => []);
  return (
    <>
      <Header title="Approval Workflow" />
      <div className="flex flex-1 flex-col gap-5 p-5">
        <ApprovalsClient requests={requests} />
      </div>
    </>
  );
}
