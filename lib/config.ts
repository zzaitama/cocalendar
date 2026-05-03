import type { User } from "@/types"

// Override via HOME_LAT / HOME_LON env vars to avoid committing home coordinates
export const HOME_COORDS = {
  lat: parseFloat(process.env.HOME_LAT ?? "37.6879"),
  lon: parseFloat(process.env.HOME_LON ?? "-122.4702"),
}

export const USERS: User[] = [
  { id: "dad",     name: "Dad",     color: "#4CAF50", gcalColorId: "2" },
  { id: "mom",     name: "Mom",     color: "#2196F3", gcalColorId: "1" },
  { id: "colette", name: "Colette", color: "#FF69B4", gcalColorId: "5" },
  { id: "family",  name: "Family",  color: "#9C27B0", gcalColorId: "3" },
]
