export const dynamic = "force-dynamic";
import { Header } from "@/components/layout/header";
import { getMembershipPlans, getStudentMemberships, getRentalPackages } from "@/app/actions/memberships";
import { getStudents } from "@/app/actions/students";
import { MembershipsClient } from "./memberships-client";

export default async function MembershipsPage() {
  const [plans, memberships, packages, students] = await Promise.all([
    getMembershipPlans().catch(() => []),
    getStudentMemberships().catch(() => []),
    getRentalPackages().catch(() => []),
    getStudents().catch(() => []),
  ]);

  return (
    <>
      <Header title="Membership & Paket" />
      <div className="flex flex-1 flex-col gap-5 p-5">
        <MembershipsClient plans={plans} memberships={memberships} packages={packages} students={students} />
      </div>
    </>
  );
}
