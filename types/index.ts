export type CalendarEvent = {
  id: string
  title: string
  start: string
  end: string
  colorId: string
  isAllDay: boolean
}

export type User = {
  id: string
  name: string
  color: string
  gcalColorId: string
}

declare module "next-auth" {
  interface Session {
    accessToken: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    refreshToken?: string
    expiresAt?: number
  }
}
