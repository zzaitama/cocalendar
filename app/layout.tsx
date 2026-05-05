import type { Metadata } from "next"
import localFont from "next/font/local"
import dynamic from "next/dynamic"
import "./globals.css"
import { ThemeProvider } from "@/components/ThemeProvider"

const Screensaver = dynamic(
  () => import("@/components/Screensaver").then(m => m.Screensaver),
  { ssr: false }
)

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
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
      <body className={`${geistSans.variable} antialiased bg-white dark:bg-gray-950 text-gray-950 dark:text-gray-50`}>
        {/* SAFETY: this script must never interpolate server/user-supplied values — XSS risk */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var o=localStorage.getItem('theme-override');var dark;if(o==='dark')dark=true;else if(o==='light')dark=false;else{var h=new Date().getHours();dark=h<7||h>=19;}if(dark)document.documentElement.classList.add('dark');}catch(e){}})()`,
          }}
        />
        <ThemeProvider>{children}</ThemeProvider>
        <Screensaver />
      </body>
    </html>
  )
}
