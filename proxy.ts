import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession, SESSION_COOKIE_NAME } from "@/lib/auth";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Rute publik yang boleh diakses siapa saja
  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/kalender") ||
    pathname.startsWith("/aktivitas") ||
    pathname.startsWith("/api/kalender") ||
    pathname.startsWith("/api/rapor/check") ||
    pathname.startsWith("/api/auth/") ||
    (pathname.startsWith("/api/aktivitas") && req.method === "GET");

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // 2. Ambil token sesi dari cookie
  const sessionToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ success: false, message: "Unauthorized: Silakan login terlebih dahulu." }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Verifikasi keabsahan sesi
  const session = verifySession(sessionToken);
  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ success: false, message: "Sesi Anda telah kedaluwarsa. Silakan login kembali." }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 4. Verifikasi RBAC untuk Rute Admin (/admin/*)
  if (pathname.startsWith("/admin")) {
    const role = (session.levelAkses || "").toUpperCase();
    if (!role.includes("GURU") && !role.includes("ADMIN")) {
      // Wali murid mencoba masuk admin, alihkan ke dashboard wali
      return NextResponse.redirect(new URL("/wali/dashboard", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
