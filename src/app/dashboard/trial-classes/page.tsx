export const dynamic = "force-dynamic";
import { Header } from "@/components/layout/header";
import { getTrialClasses } from "@/app/actions/trial-classes";
import { getClasses } from "@/app/actions/classes";
import { TrialClassesClient } from "./trial-classes-client";

export default async function TrialClassesPage() {
  const [trials, classes] = await Promise.all([
    getTrialClasses().catch(() => []),
    getClasses().catch(() => []),
  ]);

  return (
    <>
      <Header title="Kelas Trial" />
      <div className="flex flex-1 flex-col gap-5 p-5">
        <TrialClassesClient trials={trials} classes={classes} />
      </div>
    </>
  );
}
