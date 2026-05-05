import type { User } from "@/types"

export function getHomeCoords(): { lat: number; lon: number } {
  const lat = process.env.HOME_LAT
  const lon = process.env.HOME_LON
  if (!lat || !lon) throw new Error("HOME_LAT and HOME_LON environment variables are required")
  return { lat: parseFloat(lat), lon: parseFloat(lon) }
}

export const USERS: User[] = [
  { id: "dad",     name: "Daddy",   color: "#33B679", gcalColorId: "2"  }, // Sage = green
  { id: "mom",     name: "Mommy",   color: "#039BE5", gcalColorId: "7"  }, // Peacock = blue
  { id: "colette", name: "Colette", color: "#E67C73", gcalColorId: "4"  }, // Flamingo = pink
  { id: "monti",   name: "Monti",   color: "#F6BF26", gcalColorId: "5"  }, // Banana = yellow
  { id: "family",  name: "Family",  color: "#8E24AA", gcalColorId: "3"  }, // Grape = purple
]
