export { default } from "next-auth/middleware"

export const config = {
  matcher: [
    // Protect all API routes except the auth endpoint itself
    "/api/((?!auth).*)",
    // Protect app pages
    "/",
    "/week",
    "/month",
    "/list",
    "/kiosk",
    "/screensaver",
    "/chores/:path*",
  ],
}
