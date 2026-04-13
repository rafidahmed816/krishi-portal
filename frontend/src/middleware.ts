import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware protects /dashboard routes.
 * We check for the presence of a token cookie or rely on client-side
 * auth context. Since tokens are in localStorage (client only), we
 * redirect unauthenticated users to /login via a lightweight cookie check.
 *
 * For a production app you'd validate the JWT server-side here.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected routes
  const protectedPaths = ["/dashboard"];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected) {
    // Check for auth token cookie (set by client after login)
    const token = request.cookies.get("agrolink_authenticated");
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect authenticated users away from auth pages
  const authPaths = ["/login", "/register", "/verify"];
  const isAuthPage = authPaths.some((p) => pathname.startsWith(p));
  if (isAuthPage) {
    const token = request.cookies.get("agrolink_authenticated");
    if (token) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register", "/verify"],
};
