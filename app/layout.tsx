import type { Metadata } from "next"
import { Nunito } from "next/font/google"
import dynamic from "next/dynamic"
import "./globals.css"
import { ThemeProvider } from "@/components/ThemeProvider"
import { SleepProvider } from "@/components/SleepProvider"
import { AvatarProvider } from "@/context/AvatarContext"

const Screensaver = dynamic(
  () => import("@/components/Screensaver").then(m => m.Screensaver),
  { ssr: false }
)

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "Family Calendar",
  description: "Family wall calendar",
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
            <ThemeProvider>{children}</ThemeProvider>
            <Screensaver />
          </AvatarProvider>
        </SleepProvider>
      </body>
    </html>
  )
}
