"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SearchableSelect, SearchableSelectItem } from "@/components/ui/searchable-select";
import { Label } from "@/components/ui/label";
import { DataPagination } from "@/components/ui/data-pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Users, Shield, Search, Plus, MoreHorizontal, Key,
  Loader2, UserCheck, UserX, Trash2, Pencil, Crown,
} from "lucide-react";
import {
  createUser, updateUser, deleteUser, toggleUserStatus,
  updateRolePermissions,
} from "@/app/actions/rbac";
import { toast } from "sonner";

interface Props {
  users: any[];
  roles: any[];
  branches: any[];
  currentUserRole: string;
}

const MODULES = [
  "students","coaches","classes","attendance","assessments",
  "invoices","payments","courts","rentals","inventory",
  "branches","users","settings","expenses","payroll",
  "parents","leads","reports",
];
const ACTIONS = ["view","create","update","delete","export","approve"];

const emptyCreate = { email: "", password: "", name: "", phone: "", roleId: "", branchId: "" };
const emptyEdit = { name: "", phone: "", roleId: "", branchId: "", password: "" };

const roleBadgeColor: Record<string, string> = {
  SUPER_ADMIN: "bg-purple-100 text-purple-700",
  ADMIN: "bg-blue-100 text-blue-700",
  OPERATOR: "bg-primary-20 text-primary",
  COACH: "bg-green-100 text-green-700",
};

function initials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function avatarColor(name: string) {
  const colors = ["bg-orange-400","bg-blue-400","bg-green-400","bg-purple-400","bg-pink-400","bg-teal-400"];
  return colors[name.charCodeAt(0) % colors.length];
}

export function UsersClient({ users: initial, roles: initialRoles, branches, currentUserRole }: Props) {
  const router = useRouter();
  const users = initial;
  const roles = initialRoles;

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreate);
  const [createLoading, setCreateLoading] = useState(false);

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [editForm, setEditForm] = useState(emptyEdit);
  const [editLoading, setEditLoading] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Per-row toggle loading
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Permissions dialog
  const [permRole, setPermRole] = useState<any>(null);
  const [permOpen, setPermOpen] = useState(false);
  const [checkedPerms, setCheckedPerms] = useState<string[]>([]);
  const [permLoading, setPermLoading] = useState(false);

  // Visible roles: SUPER_ADMIN option only for SUPER_ADMIN current user
  const visibleRoles = roles.filter((r: any) =>
    r.name !== "SUPER_ADMIN" || currentUserRole === "SUPER_ADMIN"
  );

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  // ── Create ──────────────────────────────────────────────────────────────────

  function openCreate() {
    setCreateForm(emptyCreate);
    setCreateOpen(true);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateLoading(true);
    try {
      await createUser({
        email: createForm.email,
        password: createForm.password,
        name: createForm.name,
        phone: createForm.phone || undefined,
        roleId: createForm.roleId,
        branchId: createForm.branchId || undefined,
      });
      toast.success("Pengguna berhasil dibuat");
      setCreateOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message ?? "Gagal membuat pengguna");
    } finally {
      setCreateLoading(false);
    }
  }

  // ── Edit ────────────────────────────────────────────────────────────────────

  function openEdit(user: any) {
    setEditTarget(user);
    setEditForm({
      name: user.name,
      phone: user.phone ?? "",
      roleId: user.roleId,
      branchId: user.branchId ?? "",
      password: "",
    });
    setEditOpen(true);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    setEditLoading(true);
    try {
      await updateUser(editTarget.id, {
        name: editForm.name,
        phone: editForm.phone || undefined,
        roleId: editForm.roleId,
        branchId: editForm.branchId || undefined,
        password: editForm.password || undefined,
      });
      toast.success("Pengguna diperbarui");
      setEditOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message ?? "Gagal memperbarui pengguna");
    } finally {
      setEditLoading(false);
    }
  }

  // ── Toggle status ────────────────────────────────────────────────────────────

  async function handleToggle(user: any) {
    setTogglingId(user.id);
    try {
      await toggleUserStatus(user.id, !user.isActive);
      toast.success(user.isActive ? "Pengguna dinonaktifkan" : "Pengguna diaktifkan");
      router.refresh();
    } catch {
      toast.error("Gagal mengubah status");
    } finally {
      setTogglingId(null);
    }
  }

  // ── Delete ───────────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteUser(deleteTarget.id);
      toast.success("Pengguna dihapus");
      setDeleteTarget(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message ?? "Gagal menghapus pengguna");
    } finally {
      setDeleteLoading(false);
    }
  }

  // ── Permissions ──────────────────────────────────────────────────────────────

  function openPermissions(role: any) {
    setPermRole(role);
    setCheckedPerms(role.rolePermissions.map((rp: any) => `${rp.permission.module}:${rp.permission.action}`));
    setPermOpen(true);
  }

  function togglePerm(key: string) {
    setCheckedPerms(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  }

  async function savePermissions() {
    if (!permRole) return;
    setPermLoading(true);
    try {
      const all = await fetch("/api/permissions").then(r => r.json()).catch(() => []);
      const ids = all
        .filter((p: any) => checkedPerms.includes(`${p.module}:${p.action}`))
        .map((p: any) => p.id);
      await updateRolePermissions(permRole.id, ids);
      toast.success("Hak akses disimpan");
      setPermOpen(false);
      router.refresh();
    } catch {
      toast.error("Gagal menyimpan hak akses");
    } finally {
      setPermLoading(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      <Tabs defaultValue="users">
        <TabsList className="h-9 bg-muted/80">
          <TabsTrigger value="users" className="text-xs px-4">Pengguna</TabsTrigger>
          <TabsTrigger value="roles" className="text-xs px-4">Role & Hak Akses</TabsTrigger>
        </TabsList>

        {/* ── Users Tab ─────────────────────────────────────────────────────── */}
        <TabsContent value="users" className="mt-5">
          <Card className="border-neutral shadow-sm">
            <CardHeader className="pb-4 border-b border-neutral">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-10 rounded-xl">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-on-surface">Daftar Pengguna</h2>
                    <p className="text-xs text-muted-foreground">{users.length} pengguna terdaftar</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Cari pengguna..."
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                      className="pl-9 h-9 w-56 border-border text-sm"
                    />
                  </div>
                  <Button
                    size="sm"
                    className="h-9 bg-primary hover:bg-primary-80 shadow-sm shadow-primary/20"
                    onClick={openCreate}
                  >
                    <Plus className="w-4 h-4 mr-1.5" /> Tambah Pengguna
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table className="table-row-hover">
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="text-xs font-semibold text-tertiary pl-5">Pengguna</TableHead>
                    <TableHead className="text-xs font-semibold text-tertiary">Role</TableHead>
                    <TableHead className="text-xs font-semibold text-tertiary">Cabang</TableHead>
                    <TableHead className="text-xs font-semibold text-tertiary">Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-16">
                        <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Belum ada pengguna</p>
                        <Button
                          size="sm"
                          className="mt-3 bg-primary hover:bg-primary-80"
                          onClick={openCreate}
                        >
                          <Plus className="w-3.5 h-3.5 mr-1.5" /> Tambah Pengguna
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginated.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="pl-5">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 ${avatarColor(user.name)}`}>
                              {initials(user.name)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-on-surface flex items-center gap-1.5">
                                {user.name}
                                {user.role?.name === "SUPER_ADMIN" && (
                                  <Crown className="w-3 h-3 text-purple-500" />
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleBadgeColor[user.role?.name] ?? "bg-muted text-foreground"}`}>
                            {user.role?.name ?? "-"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-foreground">{user.branch?.name ?? "-"}</span>
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.isActive ? "bg-green-50 text-green-700" : "bg-muted text-tertiary"}`}>
                            {user.isActive ? "Aktif" : "Nonaktif"}
                          </span>
                        </TableCell>
                        <TableCell className="pr-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" aria-label="Aksi" />}>
                              {togglingId === user.id
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <MoreHorizontal className="w-4 h-4" />}
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem
                                className="cursor-pointer gap-2"
                                onClick={() => openEdit(user)}
                              >
                                <Pencil className="w-3.5 h-3.5" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="cursor-pointer gap-2"
                                onClick={() => handleToggle(user)}
                                disabled={togglingId === user.id}
                              >
                                {user.isActive
                                  ? <><UserX className="w-3.5 h-3.5" /> Nonaktifkan</>
                                  : <><UserCheck className="w-3.5 h-3.5" /> Aktifkan</>}
                              </DropdownMenuItem>
                              {currentUserRole === "SUPER_ADMIN" && (
                                <DropdownMenuItem
                                  className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                                  onClick={() => setDeleteTarget(user)}
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Hapus
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <DataPagination
                total={filtered.length}
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Roles Tab ─────────────────────────────────────────────────────── */}
        <TabsContent value="roles" className="mt-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-10 rounded-xl">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-on-surface">Role & Hak Akses</h2>
              <p className="text-xs text-muted-foreground">{roles.length} role terdaftar</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roles.map((role: any) => (
              <Card key={role.id} className="border-neutral shadow-sm hover:shadow-md transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-on-surface flex items-center gap-1.5">
                        {role.name}
                        {role.name === "SUPER_ADMIN" && <Crown className="w-3.5 h-3.5 text-purple-500" />}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{role._count?.users ?? 0} pengguna</p>
                    </div>
                    <div className="p-2 bg-primary-10 rounded-lg">
                      <Shield className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-tertiary mb-3">
                    {role.rolePermissions?.length ?? 0} hak akses aktif
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full h-8 text-xs border-border"
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

      {/* ── Create Dialog ──────────────────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Pengguna Baru</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Nama Lengkap *</Label>
                <Input
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="Nama lengkap"
                  required
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Email *</Label>
                <Input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="email@example.com"
                  required
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Password *</Label>
                <Input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="Min. 6 karakter"
                  minLength={6}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">No. HP</Label>
                <Input
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  placeholder="08xx..."
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Role *</Label>
                <SearchableSelect
                  value={createForm.roleId}
                  onValueChange={(v) => v && setCreateForm({ ...createForm, roleId: v })}
                  placeholder="Pilih role"
                >
                  {visibleRoles.map((r: any) => (
                    <SearchableSelectItem key={r.id} value={r.id}>{r.name}</SearchableSelectItem>
                  ))}
                </SearchableSelect>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Cabang</Label>
                <SearchableSelect
                  value={createForm.branchId}
                  onValueChange={(v) => v && setCreateForm({ ...createForm, branchId: v })}
                  placeholder="Pilih cabang (opsional)"
                >
                  <SearchableSelectItem value="">— Tidak ada cabang —</SearchableSelectItem>
                  {branches.map((b: any) => (
                    <SearchableSelectItem key={b.id} value={b.id}>{b.name}</SearchableSelectItem>
                  ))}
                </SearchableSelect>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-neutral">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
                disabled={createLoading}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary-80 min-w-24"
                disabled={createLoading}
              >
                {createLoading
                  ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Menyimpan...</>
                  : "Simpan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ────────────────────────────────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Pengguna — {editTarget?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Nama Lengkap *</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Password Baru (opsional)</Label>
                <Input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder="Kosongkan jika tidak ingin mengubah"
                  minLength={editForm.password ? 6 : undefined}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">No. HP</Label>
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="08xx..."
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Role *</Label>
                <SearchableSelect
                  value={editForm.roleId}
                  onValueChange={(v) => v && setEditForm({ ...editForm, roleId: v })}
                  placeholder="Pilih role"
                >
                  {visibleRoles.map((r: any) => (
                    <SearchableSelectItem key={r.id} value={r.id}>{r.name}</SearchableSelectItem>
                  ))}
                </SearchableSelect>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Cabang</Label>
                <SearchableSelect
                  value={editForm.branchId}
                  onValueChange={(v) => setEditForm({ ...editForm, branchId: v ?? "" })}
                  placeholder="Pilih cabang (opsional)"
                >
                  <SearchableSelectItem value="">— Tidak ada cabang —</SearchableSelectItem>
                  {branches.map((b: any) => (
                    <SearchableSelectItem key={b.id} value={b.id}>{b.name}</SearchableSelectItem>
                  ))}
                </SearchableSelect>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-neutral">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
                disabled={editLoading}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary-80 min-w-24"
                disabled={editLoading}
              >
                {editLoading
                  ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Menyimpan...</>
                  : "Simpan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm Dialog ──────────────────────────────────────────── */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive">Hapus Pengguna</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-sm text-foreground">
              Tindakan ini akan menonaktifkan akun{" "}
              <span className="font-semibold text-on-surface">{deleteTarget?.name}</span>{" "}
              dan mencabut aksesnya. Tindakan ini tidak dapat langsung dibatalkan.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-neutral">
              <Button
                variant="outline"
                onClick={() => setDeleteTarget(null)}
                disabled={deleteLoading}
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                className="min-w-24"
                onClick={handleDelete}
                disabled={deleteLoading}
              >
                {deleteLoading
                  ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Menghapus...</>
                  : <><Trash2 className="w-4 h-4 mr-1.5" /> Hapus</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Permissions Dialog ─────────────────────────────────────────────── */}
      <Dialog open={permOpen} onOpenChange={setPermOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Hak Akses —{" "}
              <span className={`text-sm px-2 py-0.5 rounded-full font-medium ${roleBadgeColor[permRole?.name] ?? "bg-muted text-foreground"}`}>
                {permRole?.name}
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="mt-3 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold text-tertiary uppercase tracking-wide">Modul</th>
                    {ACTIONS.map((a) => (
                      <th key={a} className="text-center px-2 py-2 font-semibold text-tertiary uppercase tracking-wide capitalize">{a}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {MODULES.map((mod) => (
                    <tr key={mod} className="hover:bg-muted/50">
                      <td className="px-3 py-2 font-medium text-foreground capitalize">{mod}</td>
                      {ACTIONS.map((action) => {
                        const key = `${mod}:${action}`;
                        return (
                          <td key={action} className="px-2 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={checkedPerms.includes(key)}
                              onChange={() => togglePerm(key)}
                              className="w-4 h-4 rounded border-foreground/20 text-primary"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-neutral">
              <Button
                variant="outline"
                onClick={() => setPermOpen(false)}
                disabled={permLoading}
              >
                Batal
              </Button>
              <Button
                className="bg-primary hover:bg-primary-80 min-w-36"
                onClick={savePermissions}
                disabled={permLoading}
              >
                {permLoading
                  ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Menyimpan...</>
                  : <><Key className="w-4 h-4 mr-1.5" /> Simpan Hak Akses</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
