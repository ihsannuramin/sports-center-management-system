"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Users, Shield, Search, UserCheck, UserX, Key } from "lucide-react";
import { updateUserRole, toggleUserStatus, updateRolePermissions } from "@/app/actions/rbac";
import { toast } from "sonner";

interface Props { users: any[]; roles: any[]; }

const MODULES = ["students","coaches","classes","attendance","assessments","invoices","payments","courts","rentals","inventory","branches","users","settings","expenses","payroll","parents","leads","reports"];
const ACTIONS = ["view","create","update","delete","export","approve"];

export function UsersClient({ users: initial, roles: initialRoles }: Props) {
  const [users] = useState(initial);
  const [roles] = useState(initialRoles);
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [permDialog, setPermDialog] = useState(false);
  const [checkedPerms, setCheckedPerms] = useState<string[]>([]);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  async function handleRoleChange(userId: string, roleId: string) {
    try {
      await updateUserRole(userId, roleId);
      toast.success("Role diperbarui");
      window.location.reload();
    } catch { toast.error("Gagal memperbarui role"); }
  }

  async function handleToggle(userId: string, isActive: boolean) {
    try {
      await toggleUserStatus(userId, !isActive);
      toast.success(isActive ? "Pengguna dinonaktifkan" : "Pengguna diaktifkan");
      window.location.reload();
    } catch { toast.error("Gagal mengubah status"); }
  }

  function openPermissions(role: any) {
    setSelectedRole(role);
    const perms = role.rolePermissions.map((rp: any) => `${rp.permission.module}:${rp.permission.action}`);
    setCheckedPerms(perms);
    setPermDialog(true);
  }

  async function savePermissions() {
    if (!selectedRole) return;
    try {
      const all = await fetch("/api/permissions").then(r => r.json()).catch(() => []);
      const ids = all.filter((p: any) => checkedPerms.includes(`${p.module}:${p.action}`)).map((p: any) => p.id);
      await updateRolePermissions(selectedRole.id, ids);
      toast.success("Hak akses disimpan");
      setPermDialog(false);
      window.location.reload();
    } catch { toast.error("Gagal menyimpan hak akses"); }
  }

  function togglePerm(key: string) {
    setCheckedPerms(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  }

  return (
    <div className="space-y-5">
      <Tabs defaultValue="users">
        <TabsList className="h-9 bg-gray-100/80">
          <TabsTrigger value="users" className="text-xs px-4">Pengguna</TabsTrigger>
          <TabsTrigger value="roles" className="text-xs px-4">Role & Hak Akses</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-5 space-y-4">
          <div className="flex items-center gap-3 flex-wrap justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 rounded-xl"><Users className="w-5 h-5 text-orange-500" /></div>
              <div>
                <h2 className="font-semibold text-gray-900">Daftar Pengguna</h2>
                <p className="text-xs text-gray-400">{users.length} pengguna terdaftar</p>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Cari pengguna..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 w-64 border-gray-200 text-sm"
              />
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Pengguna</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cabang</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-900">{user.name}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{user.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={user.roleId}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white"
                      >
                        {roles.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{user.branch?.name ?? "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.isActive ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500"}`}>
                        {user.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggle(user.id, user.isActive)}
                        className={`p-1.5 rounded-lg transition-colors ${user.isActive ? "hover:bg-red-50 text-gray-400 hover:text-red-500" : "hover:bg-green-50 text-gray-400 hover:text-green-500"}`}
                      >
                        {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="roles" className="mt-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-xl"><Shield className="w-5 h-5 text-orange-500" /></div>
            <div>
              <h2 className="font-semibold text-gray-900">Role & Hak Akses</h2>
              <p className="text-xs text-gray-400">{roles.length} role terdaftar</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roles.map((role: any) => (
              <Card key={role.id} className="border-gray-100 shadow-sm hover:shadow-md transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{role.name}</CardTitle>
                      <p className="text-xs text-gray-400 mt-0.5">{role._count?.users ?? 0} pengguna</p>
                    </div>
                    <div className="p-2 bg-orange-50 rounded-lg">
                      <Shield className="w-4 h-4 text-orange-500" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-gray-500 mb-3">{role.rolePermissions?.length ?? 0} hak akses aktif</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full h-8 text-xs border-gray-200"
                    onClick={() => openPermissions(role)}
                  >
                    <Key className="w-3.5 h-3.5 mr-1.5" /> Kelola Hak Akses
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={permDialog} onOpenChange={setPermDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Hak Akses — {selectedRole?.name}</DialogTitle>
          </DialogHeader>
          <div className="mt-3 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold text-gray-500 uppercase tracking-wide">Modul</th>
                    {ACTIONS.map((a) => (
                      <th key={a} className="text-center px-2 py-2 font-semibold text-gray-500 uppercase tracking-wide capitalize">{a}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {MODULES.map((mod) => (
                    <tr key={mod} className="hover:bg-gray-50/50">
                      <td className="px-3 py-2 font-medium text-gray-700 capitalize">{mod}</td>
                      {ACTIONS.map((action) => {
                        const key = `${mod}:${action}`;
                        return (
                          <td key={action} className="px-2 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={checkedPerms.includes(key)}
                              onChange={() => togglePerm(key)}
                              className="w-4 h-4 rounded border-gray-300 text-orange-500"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button variant="outline" onClick={() => setPermDialog(false)}>Batal</Button>
              <Button className="bg-orange-500 hover:bg-orange-600" onClick={savePermissions}>Simpan Hak Akses</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
