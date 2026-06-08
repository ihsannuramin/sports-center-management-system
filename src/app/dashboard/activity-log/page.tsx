export const dynamic = "force-dynamic";
import { Header } from "@/components/layout/header";
import { getActivityLogs } from "@/app/actions/activity-log";
import { ActivityLogClient } from "./activity-log-client";

export default async function ActivityLogPage() {
  const { logs, total } = await getActivityLogs({ limit: 100 }).catch(() => ({ logs: [], total: 0 }));
  return (
    <>
      <Header title="Log Aktivitas" />
      <div className="flex flex-1 flex-col gap-5 p-5">
        <ActivityLogClient logs={logs} total={total} />
      </div>
    </>
  );
}
