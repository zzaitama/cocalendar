import { getHomeCoords } from "@/lib/config"

export type WeatherData = {
  current: number
  icon: string
  morning: { hi: number; lo: number; icon: string }
  afternoon: { hi: number; lo: number; icon: string }
  evening: { hi: number; lo: number; icon: string }
}

interface OpenMeteoResponse {
  hourly: { temperature_2m: number[]; weathercode: number[] }
}

function weatherIcon(code: number): string {
  if (code === 0) return "☀️"
  if (code <= 3) return "⛅"
  if (code <= 48) return "☁️"
  if (code <= 67) return "🌧️"
  if (code <= 77) return "❄️"
  if (code <= 82) return "🌧️"
  return "⛈️"
}

function sliceStats(temps: number[], codes: number[], start: number, end: number) {
  const slice = temps.slice(start, end)
  const mid = codes[start + Math.floor((end - start) / 2)]
  return {
    hi: Math.round(Math.max(...slice)),
    lo: Math.round(Math.min(...slice)),
    icon: weatherIcon(mid),
  }
}

// Default to Fremont, CA if env vars not set
const DEFAULT_LAT = 37.6879
const DEFAULT_LON = -122.4702

export async function fetchWeather(): Promise<WeatherData | null> {
  try {
    let lat = DEFAULT_LAT
    let lon = DEFAULT_LON
    try {
      const coords = getHomeCoords()
      lat = coords.lat
      lon = coords.lon
    } catch {
      // HOME_LAT/HOME_LON not set — use Fremont default
    }

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,weathercode&temperature_unit=fahrenheit&timezone=America%2FLos_Angeles&forecast_days=1`
    const res = await fetch(url, { next: { revalidate: 0 } })
    if (!res.ok) return null
    const data = (await res.json()) as OpenMeteoResponse
    const { temperature_2m: temps, weathercode: codes } = data.hourly
    const currentHour = new Date().getHours()
    return {
      current: Math.round(temps[currentHour] ?? temps[0]),
      icon: weatherIcon(codes[currentHour] ?? codes[0]),
      morning: sliceStats(temps, codes, 6, 12),
      afternoon: sliceStats(temps, codes, 12, 18),
      evening: sliceStats(temps, codes, 18, 24),
    }
  } catch {
    return null
  }
}

