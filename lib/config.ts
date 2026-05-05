import type { User } from "@/types"

if (!process.env.HOME_LAT || !process.env.HOME_LON) {
  throw new Error("HOME_LAT and HOME_LON environment variables are required")
}

export const HOME_COORDS = {
  lat: parseFloat(process.env.HOME_LAT),
  lon: parseFloat(process.env.HOME_LON),
}

export const USERS: User[] = [
  { id: "dad",     name: "Dad",     color: "#4CAF50", gcalColorId: "2" },
  { id: "mom",     name: "Mom",     color: "#2196F3", gcalColorId: "1" },
  { id: "colette", name: "Colette", color: "#FF69B4", gcalColorId: "5" },
  { id: "family",  name: "Family",  color: "#9C27B0", gcalColorId: "3" },
]
