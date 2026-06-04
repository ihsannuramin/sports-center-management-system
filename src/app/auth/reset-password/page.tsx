"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
          <p className="text-sm text-gray-600">
            Password hanya dapat direset oleh administrator melalui halaman manajemen pengguna.
            Silakan hubungi admin atau Super Admin sistem Anda.
          </p>
          <Button asChild className="w-full bg-orange-500 hover:bg-orange-600">
            <Link href="/auth/login">Kembali ke Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
