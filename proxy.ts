import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get("veylora_session")?.value;
  const session = token ? await verifySessionToken(token) : null;
  const isAuthenticated = Boolean(session);

  // API login dan registrasi boleh diakses tanpa login
  const isPublicApi =
    pathname === "/api/login" ||
    pathname === "/api/register";

  if (isPublicApi) {
    return NextResponse.next();
  }

  // Halaman yang boleh diakses tanpa login
  const isPublicPage =
    pathname === "/login" ||
    pathname === "/register";

  if (!isAuthenticated && !isPublicPage) {
    if (pathname.startsWith("/api/")) {
      const response = NextResponse.json(
        { message: "Silakan login terlebih dahulu." },
        { status: 401 }
      );

      if (token) {
        response.cookies.delete("veylora_session");
      }

      return response;
    }

    const redirectUrl = new URL("/login", request.url);
    const response = NextResponse.redirect(redirectUrl);

    if (token) {
      response.cookies.delete("veylora_session");
    }

    return response;
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
