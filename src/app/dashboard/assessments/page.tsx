export const dynamic = "force-dynamic";

import { Header } from "@/components/layout/header";
import { getAssessments } from "@/app/actions/assessments";
import { getStudents } from "@/app/actions/students";
import { AssessmentsClient } from "./assessments-client";

export default async function AssessmentsPage() {
  const [assessments, students] = await Promise.all([
    getAssessments().catch(() => []),
    getStudents().catch(() => []),
  ]);

  return (
    <>
      <Header title="Penilaian Siswa" />
      <div className="flex flex-1 flex-col gap-5 p-5">
        <AssessmentsClient assessments={assessments} students={students} />
      </div>
    </>
  );
}

