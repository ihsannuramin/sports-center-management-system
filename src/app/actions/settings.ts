"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const DEFAULTS: Record<string, { label: string; value: string; group: string }> = {
  business_name:         { label: "Nama Bisnis",               value: "Sports Center",  group: "general" },
  business_phone:        { label: "Telepon Bisnis",             value: "",               group: "general" },
  business_address:      { label: "Alamat Bisnis",              value: "",               group: "general" },
  business_email:        { label: "Email Bisnis",               value: "",               group: "general" },
  invoice_prefix:        { label: "Prefix Invoice",             value: "INV",            group: "finance" },
  currency:              { label: "Mata Uang",                  value: "IDR",            group: "finance" },
  tax_percentage:        { label: "Pajak (%)",                  value: "0",              group: "finance" },
  timezone:              { label: "Zona Waktu",                 value: "Asia/Jakarta",   group: "general" },
  student_auto_num:      { label: "Auto Nomor Siswa",           value: "true",           group: "academy" },
  max_trial_days:        { label: "Maks. Hari Trial",           value: "7",              group: "academy" },
  wa_provider:           { label: "WhatsApp Provider",          value: "",               group: "whatsapp" },
  wa_api_key:            { label: "WhatsApp API Key",           value: "",               group: "whatsapp" },
  wa_sender_number:      { label: "WhatsApp Sender Number",     value: "",               group: "whatsapp" },
  tpl_invoice_reminder:  { label: "Template Invoice Reminder",  value: "",               group: "whatsapp" },
  tpl_booking_confirmation: { label: "Template Booking Confirmation", value: "",         group: "whatsapp" },
  tpl_payment_confirmation: { label: "Template Payment Confirmation", value: "",         group: "whatsapp" },
  tpl_attendance_alert:  { label: "Template Attendance Alert",  value: "",               group: "whatsapp" },
};

export async function getSettings() {
  const rows = await prisma.systemSetting.findMany({ orderBy: { group: "asc" } });
  const map: Record<string, string> = {};
  rows.forEach(r => { map[r.key] = r.value; });
  return map;
}

export async function getSetting(key: string): Promise<string> {
  const row = await prisma.systemSetting.findUnique({ where: { key } });
  return row?.value ?? DEFAULTS[key]?.value ?? "";
}

export async function upsertSettings(data: Record<string, string>) {
  for (const [key, value] of Object.entries(data)) {
    const def = DEFAULTS[key];
    await prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value, label: def?.label, group: def?.group ?? "general" },
    });
  }
  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function seedDefaultSettings() {
  for (const [key, def] of Object.entries(DEFAULTS)) {
    await prisma.systemSetting.upsert({
      where: { key },
      update: {},
      create: { key, value: def.value, label: def.label, group: def.group },
    });
  }
}