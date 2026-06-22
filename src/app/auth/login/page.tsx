"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { getImageProps } from "next/image";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      router.refresh();
      router.push("/dashboard");
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Email atau password salah");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-slate-50 p-4">
      <div className="w-full max-w-sm space-y-6">

        {/* Branding */}
        <div className="flex flex-col items-center mb-2">
          {(() => {
            const { props } = getImageProps({
              src: "/rams-logo-without-cibubur.png",
              alt: "Rams Sports Center",
              width: 150,
              height: 150,
              priority: true,
            });
            {/* eslint-disable-next-line @next/next/no-img-element */}
            return <img {...props} className="h-auto object-contain" />;
          })()}
          <div className="text-center">
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">Sports Center</h1>
            <p className="text-[11px] text-gray-400 font-medium tracking-widest uppercase mt-0.5">
              Management System
            </p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="shadow-xl shadow-neutral/40 border-gray-50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900">Masuk</CardTitle>
            <CardDescription className="text-gray-500 text-sm leading-relaxed">
              Masukkan kredensial Anda untuk mengakses sistem
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@sportsenter.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                  className="h-10 border-gray-200 bg-gray-50 focus:bg-white transition-colors"
                  aria-label="Alamat email"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="h-10 border-gray-200 bg-gray-50 focus:bg-white transition-colors pr-10"
                    aria-label="Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors p-0.5 rounded"
                  >
                    {showPassword
                      ? <EyeOff className="w-4 h-4" />
                      : <Eye className="w-4 h-4" />
                    }
                  </button>
                </div>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full h-10 bg-orange-500 hover:bg-orange-600 shadow-sm shadow-orange-200 font-medium mt-1"
                disabled={loading || !email || !password}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : "Masuk"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} Sports Center Management System
        </p>
      </div>
    </div>
  );
}
