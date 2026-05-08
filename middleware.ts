export { default } from "next-auth/middleware"

export const config = {
  matcher: [
    // Protect all API routes except auth and kiosk data endpoint
    "/api/((?!auth|kiosk).*)",
    // Protect app pages — /kiosk is intentionally excluded (uses KIOSK_SECRET instead)
    "/",
    "/week",
    "/month",
    "/list",
    "/screensaver",
    "/chores/:path*",
  ],
}
