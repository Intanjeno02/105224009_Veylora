import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const session = request.cookies.get("veylora_session")?.value;
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
      return NextResponse.json(
        { message: "Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }

  if (isAuthenticated && isPublicPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};