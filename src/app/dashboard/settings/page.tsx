export const dynamic = "force-dynamic";
import { Header } from "@/components/layout/header";
import { getSettings } from "@/app/actions/settings";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const settings = await getSettings();
  return (
    <>
      <Header title="Pengaturan Sistem" />
      <div className="flex flex-1 flex-col gap-5 p-5">
        <SettingsClient settings={settings} />
      </div>
    </>
  );
}