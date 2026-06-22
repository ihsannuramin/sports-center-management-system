"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-blue-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Lupa Password?</CardTitle>
          <CardDescription>
            Hubungi administrator sistem untuk mereset password Anda
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-gray-700">
            Password hanya dapat direset oleh administrator melalui halaman manajemen pengguna.
            Silakan hubungi admin atau Super Admin sistem Anda.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex w-full items-center justify-center rounded-full bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
          >
            Kembali ke Login
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
