"use client";

import dynamic from "next/dynamic";

const RentalsClient = dynamic(
  () => import("./rentals-client").then((m) => m.RentalsClient),
  {
    ssr: false,
    loading: () => (
      <div className="h-96 flex items-center justify-center text-gray-400 rounded-lg border bg-gray-100/20">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm">Memuat kalender jadwal...</p>
        </div>
      </div>
    ),
  }
);

export function RentalsWrapper(props: { courts: any[]; rentals: any[]; branches: any[] }) {
  return <RentalsClient {...props} />;
}
