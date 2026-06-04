export const dynamic = "force-dynamic";

import { Header } from "@/components/layout/header";
import { getClassesForAttendance } from "@/app/actions/classes";
import { AttendanceClient } from "./attendance-client";

export default async function AttendancePage() {
  const classes = await getClassesForAttendance().catch(() => []);

  return (
    <>
      <Header title="Absensi" />
      <div className="flex flex-1 flex-col gap-5 p-5">
        <AttendanceClient classes={classes} />
      </div>
    </>
  );
}

