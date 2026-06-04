"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DataPagination } from "@/components/ui/data-pagination";
import { Plus, AlertTriangle, MoreHorizontal, Download, Package } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { createInventoryItem, updateInventoryItem, deleteInventoryItem } from "@/app/actions/inventory";
import { exportToExcel } from "@/lib/export";
import { toast } from "sonner";

const categoryLabels: Record<string, string> = {
  BALL: "Bola", CONE: "Cone", JERSEY: "Jersey", EQUIPMENT: "Peralatan", OTHER: "Lainnya",
};
const categoryBadge: Record<string, string> = {
  BALL: "badge-orange", CONE: "badge-yellow", JERSEY: "badge-blue", EQUIPMENT: "badge-gray", OTHER: "badge-gray",
};

interface Props { inventory: any[]; branches: any[]; }
const emptyForm = { name: "", category: "BALL" as any, quantity: 0, minStock: 5, unit: "pcs", description: "", branchId: "" };

export function InventoryClient({ inventory: initial, branches }: Props) {
  const router = useRouter();
  const [inventory] = useState(initial);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const lowStock = inventory.filter(i => i.quantity <= i.minStock);
  const paginated = inventory.slice((page - 1) * pageSize, page * pageSize);

  function openCreate() { setEditing(null); setForm(emptyForm); setOpen(true); }
  function openEdit(item: any) {
    setEditing(item);
    setForm({ name: item.name, category: item.category, quantity: item.quantity, minStock: item.minStock, unit: item.unit, description: item.description || "", branchId: item.branchId });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try {
      if (editing) { await updateInventoryItem(editing.id, form); toast.success("Item diperbarui"); }
      else { await createInventoryItem(form); toast.success("Item ditambahkan"); }
      setOpen(false); router.refresh();
    } catch (err: any) { toast.error(err.message); }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus item ini?")) return;
    await deleteInventoryItem(id); toast.success("Item dihapus"); router.refresh();
  }

  function handleExport() {
    const data = inventory.map((item) => ({
      "Nama": item.name, "Kategori": categoryLabels[item.category] || item.category,
      "Stok": item.quantity, "Min. Stok": item.minStock, "Satuan": item.unit,
      "Cabang": item.branch?.name || "-", "Status Stok": item.quantity <= item.minStock ? "Stok Rendah" : "Normal",
    }));
    exportToExcel(data, "Inventaris", "Inventaris");
    toast.success(`${data.length} data diekspor`);
  }

  return (
    <div className="space-y-4">
      {lowStock.length > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <div className="p-1.5 bg-amber-100 rounded-lg"><AlertTriangle className="w-4 h-4 text-amber-600" /></div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-700">{lowStock.length} item stok rendah</p>
            <p className="text-xs text-amber-600 truncate">{lowStock.map(i => i.name).join(", ")}</p>
          </div>
        </div>
      )}

      <Card className="border-gray-100 shadow-sm">
        <CardHeader className="pb-4 border-b border-gray-50">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-xl"><Package className="w-5 h-5 text-amber-500" /></div>
              <div>
                <h2 className="font-semibold text-gray-900">Inventaris</h2>
                <p className="text-xs text-gray-400">{inventory.length} item · {lowStock.length} stok rendah</p>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <Button variant="outline" size="sm" className="h-9 border-gray-200 text-gray-600" onClick={handleExport}>
                <Download className="w-4 h-4 mr-1.5" /> Excel
              </Button>
              <Button size="sm" className="h-9 bg-orange-500 hover:bg-orange-600 shadow-sm shadow-orange-200" onClick={openCreate}>
                <Plus className="w-4 h-4 mr-1.5" /> Tambah Item
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table className="table-row-hover">
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                <TableHead className="text-xs font-semibold text-gray-500 pl-5">Nama</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500">Kategori</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500">Stok</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500">Min. Stok</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500">Satuan</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500">Cabang</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-16">
                  <Package className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Belum ada inventaris</p>
                </TableCell></TableRow>
              ) : (
                paginated.map((item) => {
                  const isLow = item.quantity <= item.minStock;
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="pl-5">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm text-gray-900">{item.name}</p>
                          {isLow && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
                        </div>
                      </TableCell>
                      <TableCell><span className={categoryBadge[item.category]}>{categoryLabels[item.category] || item.category}</span></TableCell>
                      <TableCell>
                        <span className={`text-sm font-bold ${isLow ? "text-red-600" : "text-gray-900"}`}>{item.quantity}</span>
                      </TableCell>
                      <TableCell><span className="text-sm text-gray-500">{item.minStock}</span></TableCell>
                      <TableCell><span className="text-sm text-gray-600">{item.unit}</span></TableCell>
                      <TableCell><span className="text-sm text-gray-600">{item.branch?.name}</span></TableCell>
                      <TableCell className="pr-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-700" aria-label="Aksi" />}>
                            <MoreHorizontal className="w-4 h-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(item)} className="cursor-pointer">Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-500 cursor-pointer" onClick={() => handleDelete(item.id)}>Hapus</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          <DataPagination total={inventory.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Item" : "Tambah Item Inventaris"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5"><Label className="text-xs font-medium text-gray-700">Nama Item *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Kategori *</Label>
                <Select value={form.category} onValueChange={(v) => v && setForm({ ...form, category: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">Satuan</Label><Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">Stok *</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} required /></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-700">Min. Stok</Label><Input type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })} /></div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Cabang *</Label>
                <Select value={form.branchId} onValueChange={(v) => v && setForm({ ...form, branchId: v })}>
                  <SelectTrigger><SelectValue placeholder="Pilih cabang" /></SelectTrigger>
                  <SelectContent>{branches.map((b: any) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600" disabled={loading}>{loading ? "Menyimpan..." : "Simpan"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
