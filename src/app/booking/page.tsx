import { prisma } from "@/lib/prisma";
import { BookingClient } from "./booking-client";

export const metadata = {
  title: "Booking Lapangan | Sports Center",
  description: "Pesan lapangan basket online dengan mudah dan cepat",
};

async function getPublicCourts() {
  return prisma.court.findMany({
    where: { isActive: true },
    select: { id: true, name: true, courtNumber: true, type: true, description: true, branch: { select: { id: true, name: true } } },
    orderBy: [{ branch: { name: "asc" } }, { courtNumber: "asc" }],
  });
}

async function getBusinessName() {
  const setting = await prisma.systemSetting.findUnique({ where: { key: "business_name" } });
  return setting?.value ?? "Sports Center";
}

export default async function BookingPage() {
  const [courts, businessName] = await Promise.all([
    getPublicCourts().catch(() => []),
    getBusinessName().catch(() => "Sports Center"),
  ]);

  return <BookingClient courts={courts} businessName={businessName} />;
}
