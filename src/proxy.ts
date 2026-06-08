import { verifyJwt } from "@/lib/jwt";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAuthRoute = pathname.startsWith("/auth");
  const isPublicRoute = pathname === "/";
  const isApiRoute = pathname.startsWith("/api");

  if (isApiRoute || isPublicRoute) return NextResponse.next();

  const token = request.cookies.get("session")?.value;
  const session = token ? await verifyJwt(token) : null;

  if (!session && !isAuthRoute) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
