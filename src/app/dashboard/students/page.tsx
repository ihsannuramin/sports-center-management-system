export const dynamic = "force-dynamic";

import { Header } from "@/components/layout/header";
import { getStudents } from "@/app/actions/students";
import { getBranches } from "@/app/actions/branches";
import { getClasses } from "@/app/actions/classes";
import { StudentsClient } from "./students-client";

export default async function StudentsPage() {
  const [students, branches, classes] = await Promise.all([
    getStudents().catch(() => []),
    getBranches().catch(() => []),
    getClasses().catch(() => []),
  ]);

  return (
    <>
      <Header title="Manajemen Siswa" />
      <div className="flex flex-1 flex-col gap-5 p-5">
        <StudentsClient students={students} branches={branches} classes={classes} />
      </div>
    </>
  );
}

