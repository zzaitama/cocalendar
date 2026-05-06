export interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  colorId: string
  isAllDay: boolean
}

export interface User {
  id: string
  name: string
  color: string
  gcalColorId: string
  avatar?: string
}

export interface ScreensaverConfig {
  idleTimeout: number
  clockStyle: "digital" | "analog"
  quietHoursEnabled: boolean
  quietHoursStart: string
  quietHoursEnd: string
}

export interface ShoppingItem {
  id: string
  text: string
  checked: boolean
}

export interface ShoppingStore {
  id: string
  name: string
  order: number
  color: string
  emoji: string
  items: ShoppingItem[]
}

export interface ShoppingListData {
  stores: ShoppingStore[]
}
