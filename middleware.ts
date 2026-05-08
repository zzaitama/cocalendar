import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

const PROTECTED_PAGES = ["/", "/week", "/month", "/list", "/screensaver", "/chores"]
const PROTECTED_API_PREFIX = "/api/"
const UNPROTECTED_API_PREFIXES = ["/api/auth/", "/api/kiosk/", "/api/screensaver/"]

function isProtectedRoute(pathname: string): boolean {
  if (pathname.startsWith(PROTECTED_API_PREFIX)) {
    return !UNPROTECTED_API_PREFIXES.some(p => pathname.startsWith(p))
  }
  return PROTECTED_PAGES.some(p => pathname === p || pathname.startsWith(p + "/"))
}

function buildCSP(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://res.cloudinary.com",
    "connect-src 'self' https://api.open-meteo.com https://*.upstash.io",
    "manifest-src 'self'",
    "frame-ancestors 'none'",
  ].join("; ")
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isProtectedRoute(pathname)) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (token === null) {
      const signInUrl = new URL("/signin", request.url)
      return NextResponse.redirect(signInUrl)
    }
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64")
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-nonce", nonce)

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set("Content-Security-Policy", buildCSP(nonce))
  return response
}

export const config = {
  matcher: [
    // All routes except Next.js internals and static files
    "/((?!_next/static|_next/image|favicon\\.ico|manifest\\.json|icon-|apple-|sw\\.js).*)",
  ],
}
