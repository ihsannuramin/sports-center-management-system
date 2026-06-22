"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { upsertSettings } from "@/app/actions/settings";
import { toast } from "sonner";
import { Settings, Building2, DollarSign, GraduationCap, Save, MessageCircle, CheckCircle2, Loader2 } from "lucide-react";

const GROUPS = [
  {
    key: "general",
    label: "Umum",
    icon: Building2,
    fields: ["business_name", "business_phone", "business_address", "business_email", "timezone"],
  },
  {
    key: "finance",
    label: "Keuangan",
    icon: DollarSign,
    fields: ["invoice_prefix", "currency", "tax_percentage"],
  },
  {
    key: "academy",
    label: "Akademi",
    icon: GraduationCap,
    fields: ["student_auto_num", "max_trial_days"],
  },
];

const LABELS: Record<string, string> = {
  business_name: "Nama Bisnis",
  business_phone: "Telepon",
  business_address: "Alamat",
  business_email: "Email",
  timezone: "Zona Waktu",
  invoice_prefix: "Prefix Invoice",
  currency: "Mata Uang",
  tax_percentage: "Pajak (%)",
  student_auto_num: "Auto Nomor Siswa",
  max_trial_days: "Maks. Hari Trial",
};

const WA_PROVIDERS = ["Fonnte", "Qontak", "Wablas"];

const WA_TEMPLATES = [
  { key: "tpl_invoice_reminder", label: "Invoice Reminder" },
  { key: "tpl_booking_confirmation", label: "Booking Confirmation" },
  { key: "tpl_payment_confirmation", label: "Payment Confirmation" },
  { key: "tpl_attendance_alert", label: "Attendance Alert" },
];

export function SettingsClient({ settings: initial }: { settings: Record<string, string> }) {
  const [form, setForm] = useState(initial);
  useEffect(() => { setForm(initial); }, [initial]);
  const [loading, setLoading] = useState(false);
  const [waLoading, setWaLoading] = useState(false);

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setLoading(true);
    try {
      await upsertSettings(form);
      toast.success("Pengaturan disimpan");
    } catch (err: any) {
      toast.error(err.message);
    }
    setLoading(false);
  }

  async function handleWaSave() {
    setWaLoading(true);
    try {
      const waData: Record<string, string> = {
        wa_provider: form.wa_provider ?? "",
        wa_api_key: form.wa_api_key ?? "",
        wa_sender_number: form.wa_sender_number ?? "",
      };
      WA_TEMPLATES.forEach((t) => {
        waData[t.key] = form[t.key] ?? "";
      });
      await upsertSettings(waData);
      toast.success("Konfigurasi WhatsApp disimpan");
    } catch (err: any) {
      toast.error(err.message);
    }
    setWaLoading(false);
  }

  return (
    <div className="space-y-5 max-w-2xl">
      {/* General groups */}
      {GROUPS.map((group) => (
        <Card key={group.key} className="border-gray-50 shadow-sm">
          <CardHeader className="pb-4 border-b border-gray-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 rounded-xl">
                <group.icon className="w-5 h-5 text-orange-500" />
              </div>
              <h2 className="font-semibold text-gray-900">{group.label}</h2>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            {group.fields.map((key) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">{LABELS[key] ?? key}</Label>
                <Input
                  value={form[key] ?? ""}
                  onChange={(e) => set(key, e.target.value)}
                  className="border-gray-200"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* WhatsApp Integration (5.18) */}
      <Card className="border-gray-50 shadow-sm">
        <CardHeader className="pb-4 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-xl">
              <MessageCircle className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">WhatsApp Integration</h2>
              <p className="text-xs text-gray-400 mt-0.5">Konfigurasi gateway untuk pengiriman notifikasi WhatsApp</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 space-y-5">
          {/* Provider + Connection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Provider</Label>
              <select
                value={form.wa_provider ?? ""}
                onChange={(e) => set("wa_provider", e.target.value)}
                className="flex h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              >
                <option value="">-- Pilih Provider --</option>
                {WA_PROVIDERS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Nomor Pengirim</Label>
              <Input
                value={form.wa_sender_number ?? ""}
                onChange={(e) => set("wa_sender_number", e.target.value)}
                placeholder="628xxxxxxxxx"
                className="border-gray-200"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-700">API Key</Label>
            <Input
              type="password"
              value={form.wa_api_key ?? ""}
              onChange={(e) => set("wa_api_key", e.target.value)}
              placeholder="Masukkan API Key provider"
              className="border-gray-200"
            />
          </div>

          {/* Status indicator */}
          {form.wa_api_key && form.wa_provider && (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-100 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="text-xs text-green-700 font-medium">
                Provider {form.wa_provider} terkonfigurasi
              </span>
            </div>
          )}

          {/* Templates */}
          <div className="space-y-3 pt-2 border-t border-gray-50">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Template Pesan</p>
            {WA_TEMPLATES.map((tpl) => (
              <div key={tpl.key} className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">{tpl.label}</Label>
                <textarea
                  rows={2}
                  value={form[tpl.key] ?? ""}
                  onChange={(e) => set(tpl.key, e.target.value)}
                  placeholder={`Template pesan ${tpl.label}. Gunakan {nama}, {amount}, {tanggal}, dll.`}
                  className="flex w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent placeholder:text-gray-300"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleWaSave}
              disabled={waLoading}
              className="bg-green-500 hover:bg-green-600 text-white shadow-sm shadow-green-200"
            >
              <MessageCircle className="w-4 h-4 mr-1.5" />
              {waLoading ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Menyimpan...</> : "Simpan Konfigurasi WhatsApp"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save general */}
      <div className="flex justify-end">
        <Button
          className="bg-orange-500 hover:bg-orange-600 shadow-sm shadow-orange-200"
          onClick={handleSave}
          disabled={loading}
        >
          <Save className="w-4 h-4 mr-1.5" />
          {loading ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Menyimpan...</> : "Simpan Pengaturan"}
        </Button>
      </div>
    </div>
  );
}
