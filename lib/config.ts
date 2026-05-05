import type { User } from "@/types"

export function getHomeCoords(): { lat: number; lon: number } {
  const lat = process.env.HOME_LAT
  const lon = process.env.HOME_LON
  if (!lat || !lon) throw new Error("HOME_LAT and HOME_LON environment variables are required")
  return { lat: parseFloat(lat), lon: parseFloat(lon) }
}

export const USERS: User[] = [
  { id: "dad",     name: "Dad",     color: "#4CAF50", gcalColorId: "2" },
  { id: "mom",     name: "Mom",     color: "#2196F3", gcalColorId: "1" },
  { id: "colette", name: "Colette", color: "#FF69B4", gcalColorId: "5" },
  { id: "family",  name: "Family",  color: "#9C27B0", gcalColorId: "3" },
]
