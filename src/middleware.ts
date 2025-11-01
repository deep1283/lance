import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "./lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // Get Supabase client with cookie handling
  const { supabase, response } = await createClient(request);

  // ✅ Universal Security Headers
  const headers = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy":
      "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  };

  // Apply headers
  Object.entries(headers).forEach(([key, value]) =>
    response.headers.set(key, value)
  );

  // HSTS - Only in production
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  // Get user session for auth checks
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Define protected paths
  const protectedPaths = ["/dashboard", "/admin", "/welcome"];
  const authPaths = ["/login"];
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );
  const isAuthPath = authPaths.includes(request.nextUrl.pathname);

  // Redirect logic
  if (isProtectedPath && !user) {
    // Protected path but no user → redirect to login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthPath && user) {
    // Auth path but user logged in → redirect to approval
    return NextResponse.redirect(new URL("/approval", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico|robots.txt|sitemap.xml).*)"],
};
