import type { Metadata } from 'next'
import KioskClient from './KioskClient'

export const metadata: Metadata = {
  title: 'CoCalendar Kiosk',
  robots: { index: false, follow: false },
}

export default function KioskPage() {
  return <KioskClient />
}
