export const dynamic = "force-dynamic";
import { Header } from "@/components/layout/header";
import { getClassWaitlists, getRentalWaitlists } from "@/app/actions/waitlists";
import { getClasses } from "@/app/actions/classes";
import { getCourts } from "@/app/actions/courts";
import { WaitlistsClient } from "./waitlists-client";

export default async function WaitlistsPage() {
  const [classWaitlists, rentalWaitlists, classes, courts] = await Promise.all([
    getClassWaitlists().catch(() => []),
    getRentalWaitlists().catch(() => []),
    getClasses().catch(() => []),
    getCourts().catch(() => []),
  ]);

  return (
    <>
      <Header title="Waiting List" />
      <div className="flex flex-1 flex-col gap-5 p-5">
        <WaitlistsClient classWaitlists={classWaitlists} rentalWaitlists={rentalWaitlists} classes={classes} courts={courts} />
      </div>
    </>
  );
}
