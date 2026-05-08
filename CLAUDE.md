# CLAUDE.md — CoCalendar

> Read this first. Do the simpler thing. Ship the smaller scope.

---

## What This Is

A private family calendar and household management app for the Mei household.

- **Wall kiosk** — 22" Elo touchscreen, portrait, kitchen wall, always-on
- **Phone** — PWA on iPhone (Safari + Chrome), added to home screen
- **Desktop** — full browser experience

Hosted on Vercel. Raspberry Pi runs Chromium in kiosk mode pointing at the Vercel URL.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) |
| Auth | NextAuth.js — Google OAuth |
| Calendar | Google Calendar API (`googleapis`) |
| Styling | Tailwind CSS only — no CSS modules, no inline styles |
| Dates | `date-fns` |
| Storage | Upstash Redis (`@upstash/redis`) — chores, settings, kiosk refresh token |
| Photos | Cloudinary — screensaver photo uploads |
| Weather | Open-Meteo API (no key needed) |
| Hosting | Vercel |

---

## People & Colors

Defined in `lib/config.ts`. Source of truth for person → color → gcalColorId mapping.

```ts
{ id: "dad",     name: "Daddy",   color: "#33B679", gcalColorId: "2"  }
{ id: "mom",     name: "Mommy",   color: "#039BE5", gcalColorId: "7"  }
{ id: "colette", name: "Colette", color: "#9C27B0", gcalColorId: "3"  }
{ id: "monti",   name: "Monti",   color: "#F6BF26", gcalColorId: "5"  }
{ id: "family",  name: "Family",  color: "#00BCD4", gcalColorId: "10" } // iCloud family cal
```

Person assignment = Google Calendar event `colorId`. No title prefixes.

---

## Key Types (`types/index.ts`)

```ts
type CalendarEvent = {
  id: string
  title: string
  start: string        // ISO
  end: string          // ISO
  colorId: string
  isAllDay: boolean
  description?: string
}

type ScreensaverConfig = {
  idleTimeout: number
  clockStyle: "digital" | "analog"
  mode: "bouncing" | "static"
  staticPhotoUrl?: string
  staticFit?: "cover" | "contain"
  quietHoursEnabled: boolean
  quietHoursStart: string
  quietHoursEnd: string
}
```

---

## Routes & APIs

### Pages
| Route | What |
|---|---|
| `/` | Today view (default) |
| `/week` | Week view (3-day on mobile, 7-day desktop) |
| `/month` | Month view |
| `/list` | List view |
| `/kiosk` | Wall display — no auth required if `?secret=` present |
| `/signin` | Landing + Google OAuth |
| `/privacy` | Privacy policy (public) |
| `/terms` | Terms of service (public) |

### API Routes
| Route | What |
|---|---|
| `GET/POST /api/events` | Fetch or create calendar events |
| `PATCH/DELETE /api/events/[id]` | Update or delete event |
| `GET /api/weather` | Current + forecast from Open-Meteo |
| `GET/POST /api/chores` | Chore list from Redis |
| `PATCH /api/chores/[id]` | Toggle chore complete |
| `GET /api/screensaver/photos` | List Cloudinary photos |
| `POST /api/screensaver/upload` | Upload photo to Cloudinary |
| `DELETE /api/screensaver/photos/[id]` | Delete photo |
| `GET /api/kiosk/data?secret=` | Events + chores, no session needed |
| `PATCH /api/kiosk/chore/[id]?secret=` | Toggle chore from kiosk |

---

## Calendars

Primary calendar = `process.env.GOOGLE_CALENDAR_ID` (default `"primary"`).  
Extra calendars (iCloud Family) = `process.env.GOOGLE_EXTRA_CALENDAR_IDS` (comma-separated).  
Extra calendar events are stamped with `colorId: "10"` (Family/aqua).

---

## Kiosk Auth

The Pi wall display uses `KIOSK_SECRET` instead of a browser session.

**Flow:**
1. Any family member signs in normally → `auth.ts` saves Google refresh token to Redis key `cocalendar:kiosk_refresh_token`
2. Pi opens `/kiosk?secret=KIOSK_SECRET`
3. `/api/kiosk/data` validates the secret, fetches a fresh access token from Redis, returns events + chores
4. Wall runs forever with no human intervention

**Required env vars for kiosk:** `KIOSK_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

---

## Screensaver

Stored in `localStorage` key `cocalendar-screensaver`. Two modes:

- **Bouncing** — photo cards float around screen with clock overlay
- **Static** — single full-screen photo, clock + date + weather bottom-right

Static mode: user picks a photo from Cloudinary gallery in Settings → Screensaver tab. Fit mode = `cover` (fill) or `contain` (fit).

---

## Mobile (iPhone)

- PWA — `manifest.json` + apple meta tags → Add to Home Screen
- Day view = agenda list on mobile, timeline on desktop (`hidden md:block` / `md:hidden`)
- Week view = 3-day on mobile, 7-day on desktop (same CSS pattern)
- Swipe left/right for day/week/month navigation
- Floating `+` button (mobile only, `sm:hidden`)
- **Never use JS `window.innerWidth` for mobile detection** — always use Tailwind `md:` breakpoints

---

## Settings

Settings modal has 3 tabs: General (theme, family members), Screensaver (mode, timeout, quiet hours), Photos (Cloudinary upload/manage).

Screensaver config persisted in `localStorage`. Theme persisted in `localStorage` key `theme-override`.

---

## Coding Rules

1. No abstractions unless used 3+ times
2. Tailwind only — no inline styles, no CSS modules
3. No `any` types
4. Named exports only (except Next.js page/layout files)
5. Mobile detection via Tailwind `md:` breakpoints — never `window.innerWidth` in render
6. Keep files under 200 lines — split if obvious
7. Every API route returns JSON error + status code on failure
8. No new dependencies without good reason

---

## Environment Variables

```bash
# Auth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Calendar
GOOGLE_CALENDAR_ID=primary
GOOGLE_EXTRA_CALENDAR_IDS=4tq2ngt3nvpb0kshmr0tkeu4elgooamb@import.calendar.google.com

# Kiosk
KIOSK_SECRET=

# Storage
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Photos
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Weather (optional — defaults to Fremont CA)
HOME_LAT=
HOME_LON=
```

---

## What's Done (V1)

- Google Calendar sync + iCloud Family calendar overlay
- Day / Week / Month / List views
- Swimlane view by person
- Event CRUD
- Chores with weekly reset
- Kiosk view (portrait, 22" Elo) — clock, weather, Next Up, events, chores
- Kiosk secret auth — no session expiry on Pi
- Screensaver — bouncing photos + static display with clock/weather
- PWA — installable on iPhone
- Mobile agenda view, 3-day week, swipe navigation
- Dark mode (auto by time of day, overridable)
- Photo upload to Cloudinary
- Privacy policy + terms at `/privacy` and `/terms`