export const dynamic = "force-dynamic";
import { Header } from "@/components/layout/header";
import { getNotifications } from "@/app/actions/notifications";
import { NotificationsClient } from "./notifications-client";

export default async function NotificationsPage() {
  const notifications = await getNotifications(undefined, 200).catch(() => []);
  return (
    <>
      <Header title="Notification Center" />
      <div className="flex flex-1 flex-col gap-5 p-5">
        <NotificationsClient notifications={notifications} />
      </div>
    </>
  );
}
