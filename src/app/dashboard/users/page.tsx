export const dynamic = "force-dynamic";
import { Header } from "@/components/layout/header";
import { getUsers, getRoles, getCurrentUserWithRole } from "@/app/actions/rbac";
import { getBranches } from "@/app/actions/branches";
import { UsersClient } from "./users-client";

export default async function UsersPage() {
  const [users, roles, branches, currentUser] = await Promise.all([
    getUsers().catch(() => []),
    getRoles().catch(() => []),
    getBranches().catch(() => []),
    getCurrentUserWithRole().catch(() => null),
  ]);

  return (
    <>
      <Header title="Manajemen Pengguna & Hak Akses" />
      <div className="flex flex-1 flex-col gap-5 p-5">
        <UsersClient
          users={users}
          roles={roles}
          branches={branches}
          currentUserRole={currentUser?.role?.name ?? ""}
        />
      </div>
    </>
  );
}
