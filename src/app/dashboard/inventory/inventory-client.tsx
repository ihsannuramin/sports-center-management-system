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
import { Plus, AlertTriangle, MoreHorizontal, Download, Package, Pencil, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
  const inventory = initial;
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

      <Card className="border-neutral shadow-sm">
        <CardHeader className="pb-4 border-b border-neutral">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-xl"><Package className="w-5 h-5 text-amber-500" /></div>
              <div>
                <h2 className="font-semibold text-on-surface">Inventaris</h2>
                <p className="text-xs text-muted-foreground">{inventory.length} item · {lowStock.length} stok rendah</p>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <Button variant="outline" size="sm" className="h-9 border-border text-foreground" onClick={handleExport}>
                <Download className="w-4 h-4 mr-1.5" /> Excel
              </Button>
              <Button size="sm" className="h-9 bg-primary hover:bg-primary-80 shadow-sm shadow-primary/20" onClick={openCreate}>
                <Plus className="w-4 h-4 mr-1.5" /> Tambah Item
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table className="table-row-hover">
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="text-xs font-semibold text-tertiary pl-5">Nama</TableHead>
                <TableHead className="text-xs font-semibold text-tertiary">Kategori</TableHead>
                <TableHead className="text-xs font-semibold text-tertiary">Stok</TableHead>
                <TableHead className="text-xs font-semibold text-tertiary">Min. Stok</TableHead>
                <TableHead className="text-xs font-semibold text-tertiary">Satuan</TableHead>
                <TableHead className="text-xs font-semibold text-tertiary">Cabang</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-16">
                  <Package className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Belum ada inventaris</p>
                </TableCell></TableRow>
              ) : (
                paginated.map((item) => {
                  const isLow = item.quantity <= item.minStock;
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="pl-5">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm text-on-surface">{item.name}</p>
                          {isLow && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
                        </div>
                      </TableCell>
                      <TableCell><span className={categoryBadge[item.category]}>{categoryLabels[item.category] || item.category}</span></TableCell>
                      <TableCell>
                        <span className={`text-sm font-bold ${isLow ? "text-destructive" : "text-on-surface"}`}>{item.quantity}</span>
                      </TableCell>
                      <TableCell><span className="text-sm text-tertiary">{item.minStock}</span></TableCell>
                      <TableCell><span className="text-sm text-foreground">{item.unit}</span></TableCell>
                      <TableCell><span className="text-sm text-foreground">{item.branch?.name}</span></TableCell>
                      <TableCell className="pr-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" aria-label="Aksi" />}>
                            <MoreHorizontal className="w-4 h-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(item)} className="cursor-pointer gap-2"><Pencil className="w-3.5 h-3.5" /> Edit</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer gap-2" onClick={() => handleDelete(item.id)}><Trash2 className="w-3.5 h-3.5" /> Hapus</DropdownMenuItem>
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
              <div className="col-span-2 space-y-1.5"><Label className="text-xs font-medium text-foreground">Nama Item *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Kategori *</Label>
                <SearchableSelect value={form.category} onValueChange={(v) => v && setForm({ ...form, category: v as any })} placeholder="Pilih kategori">
                  {Object.entries(categoryLabels).map(([k, v]) => <SearchableSelectItem key={k} value={k}>{v}</SearchableSelectItem>)}
                </SearchableSelect>
              </div>
              <div className="space-y-1.5"><Label className="text-xs font-medium text-foreground">Satuan</Label><Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium text-foreground">Stok *</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} required /></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium text-foreground">Min. Stok</Label><Input type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })} /></div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Cabang *</Label>
                <SearchableSelect value={form.branchId} onValueChange={(v) => v && setForm({ ...form, branchId: v })} placeholder="Pilih cabang">
                  {branches.map((b: any) => <SearchableSelectItem key={b.id} value={b.id}>{b.name}</SearchableSelectItem>)}
                </SearchableSelect>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-neutral">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-primary hover:bg-primary-80" disabled={loading}>{loading ? "Menyimpan..." : "Simpan"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
