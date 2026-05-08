import type { Metadata, Viewport } from "next"
import { Nunito } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/ThemeProvider"
import { SleepProvider } from "@/components/SleepProvider"
import { AvatarProvider } from "@/context/AvatarContext"
import { FamilyProvider } from "@/context/FamilyContext"
import { ScreensaverLoader } from "@/components/ScreensaverLoader"

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "CoCalendar",
  description: "Family calendar",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CoCalendar",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    apple: "/icon-192.png",
  },
}

export const viewport: Viewport = {
  themeColor: "#FAF9F7",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${nunito.variable} font-[family-name:var(--font-nunito)] antialiased bg-[#FAF9F7] dark:bg-gray-950 text-gray-950 dark:text-gray-50`}>
        {/* SAFETY: this script must never interpolate server/user-supplied values — XSS risk */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var o=localStorage.getItem('theme-override');var dark;if(o==='dark')dark=true;else if(o==='light')dark=false;else{var h=new Date().getHours();dark=h<7||h>=19;}if(dark)document.documentElement.classList.add('dark');}catch(e){}})()`,
          }}
        />
        <SleepProvider>
          <AvatarProvider>
            <FamilyProvider>
              <ThemeProvider>{children}</ThemeProvider>
              <ScreensaverLoader />
            </FamilyProvider>
          </AvatarProvider>
        </SleepProvider>
      </body>
    </html>
  )
}
