export const dynamic = "force-dynamic";
import { Header } from "@/components/layout/header";
import { getUsers, getRoles } from "@/app/actions/rbac";
import { UsersClient } from "./users-client";

export default async function UsersPage() {
  const [users, roles] = await Promise.all([
    getUsers().catch(() => []),
    getRoles().catch(() => []),
  ]);

  return (
    <>
      <Header title="Manajemen Pengguna & Hak Akses" />
      <div className="flex flex-1 flex-col gap-5 p-5">
        <UsersClient users={users} roles={roles} />
      </div>
    </>
  );
}
