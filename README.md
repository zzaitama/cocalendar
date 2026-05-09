<div align="center">

# 📅 CoCalendar

**A private family calendar built for the wall, the fridge, and the pocket.**

*Google Calendar sync · Kiosk mode · PWA · Screensaver · Chores*

![Next.js](https://img.shields.io/badge/Next.js_14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel)
![Google Calendar](https://img.shields.io/badge/Google_Calendar-4285F4?style=flat-square&logo=google-calendar&logoColor=white)

</div>

---

## What it is

CoCalendar is a household calendar app built for the family. It runs on a **22" Elo touchscreen** mounted in the kitchen, on iPhones as a **PWA**, and in the browser on desktop — all synced to Google Calendar in real time.

```
┌─────────────────────────────────────────────────────┐
│  Kitchen Wall  │  iPhone (PWA)  │  Desktop Browser  │
│  22" Kiosk     │  Add to Home   │  Full experience  │
│  Always-on     │  Screen        │                   │
└─────────────────────────────────────────────────────┘
                        ↕ Google Calendar API
```

---

## Features

| | Feature | Detail |
|---|---|---|
| 📆 | **Day / Week / Month / List views** | Timeline grid on desktop, agenda list on mobile |
| 👥 | **Swimlane view** | Events split by family member side-by-side |
| ✏️ | **Event CRUD** | Create, edit, delete — synced to Google Calendar |
| 📺 | **Kiosk mode** | Portrait layout, clock, weather, Next Up, chores |
| 🔒 | **Kiosk auth** | Secret-based — no session expiry on the Pi |
| 🖼️ | **Screensaver** | Bouncing photo cards or full-screen static photo |
| ✅ | **Chores** | Weekly chore list with tap-to-complete, auto-reset |
| 📱 | **PWA** | Installable on iPhone via Safari → Add to Home Screen |
| 🌓 | **Dark mode** | Auto by time of day, overridable |
| 🌤️ | **Weather** | Live current conditions via Open-Meteo |
| 📷 | **Photo gallery** | Upload photos to Cloudinary for the screensaver |

---

## People & Colors

Defined in `lib/config.ts` — Google Calendar `colorId` is the source of truth for person assignment.

| Person | Color | Hex | Calendar Color |
|---|---|---|---|
| Daddy | 🟢 Green | `#33B679` | Sage (2) |
| Mommy | 🔵 Blue | `#039BE5` | Peacock (7) |
| Daughter | 🟣 Purple | `#9C27B0` | Grape (3) |
| Son | 🟡 Yellow | `#F6BF26` | Banana (5) |
| Family | 🩵 Aqua | `#00BCD4` | Peacock (10) |

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Auth | NextAuth.js — Google OAuth |
| Calendar | Google Calendar API (`googleapis`) |
| Styling | Tailwind CSS |
| Dates | `date-fns` |
| Storage | Upstash Redis — chores, settings, kiosk refresh token |
| Photos | Cloudinary |
| Weather | Open-Meteo (no API key required) |
| Hosting | Vercel |

---

## Local Development

### Prerequisites

- Node.js 18+
- Google Cloud project with **Calendar API** enabled
- OAuth 2.0 credentials (Web application type)

### Setup

```bash
git clone https://github.com/zzaitama/cocalendar
cd cocalendar
npm install
cp .env.local.example .env.local  # then fill in values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with Google.

### Environment variables

```bash
# Auth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_SECRET=         # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000

# Calendar
GOOGLE_CALENDAR_ID=primary
GOOGLE_EXTRA_CALENDAR_IDS=   # comma-separated, optional

# Kiosk
KIOSK_SECRET=

# Storage
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Photos
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Weather (defaults to Fremont, CA)
HOME_LAT=
HOME_LON=
```

Add this to your OAuth client's redirect URIs:

```
http://localhost:3000/api/auth/callback/google
```

---

## Deploy to Vercel

1. Push to GitHub → import repo at [vercel.com](https://vercel.com)
2. Add all environment variables from the list above
3. Add your Vercel URL to Google OAuth redirect URIs:
   ```
   https://your-app.vercel.app/api/auth/callback/google
   ```
4. Visit the URL and sign in once — the kiosk refresh token is stored automatically in Redis

---

## Raspberry Pi Kiosk Setup

Tested on Raspberry Pi OS (Bookworm, 64-bit) with a 22" Elo touchscreen in portrait mode.

### 1. Install Chromium

```bash
sudo apt update && sudo apt install -y chromium-browser unclutter
```

### 2. Disable screen blanking

Add to `~/.config/lxsession/LXDE-pi/autostart`:

```
@xset s off
@xset -dpms
@xset s noblank
```

### 3. Create the kiosk service

`/etc/systemd/system/kiosk.service`:

```ini
[Unit]
Description=Chromium Kiosk
After=graphical.target

[Service]
User=pi
Environment=DISPLAY=:0
Environment=XAUTHORITY=/home/pi/.Xauthority
ExecStartPre=/bin/sleep 5
ExecStart=/usr/bin/chromium-browser \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --disable-restore-session-state \
  --disable-translate \
  --no-first-run \
  --start-maximized \
  --check-for-update-interval=31536000 \
  https://cocalendar-one.vercel.app/kiosk?secret=YOUR_KIOSK_SECRET
Restart=always
RestartSec=5

[Install]
WantedBy=graphical.target
```

```bash
sudo systemctl enable kiosk
sudo systemctl start kiosk
```

### 4. Hide the cursor + daily reboot

```bash
# Hide mouse cursor
sudo apt install -y unclutter
# Add to ~/.config/lxsession/LXDE-pi/autostart:
#   @unclutter -idle 1 -root

# Daily reboot at 3 AM
sudo crontab -e
# Add: 0 3 * * * /sbin/reboot
```

### 5. Auto-login to desktop

```bash
sudo raspi-config
# System Options → Boot / Auto Login → Desktop Autologin
```

### Troubleshooting

| Symptom | Fix |
|---|---|
| Blank white screen on boot | Chromium launched before desktop was ready. Increase `ExecStartPre` sleep to 10s |
| Auth expired / redirects to sign-in | Refresh token was revoked. Sign in again from any browser — Pi picks it up automatically |
| Chromium crashed | `Restart=always` handles this. Check `journalctl -u kiosk -n 50` |
| Events not updating | App polls every 30s. "Sync stale" in amber = no internet. Check `ping 8.8.8.8` |
| Touchscreen taps not registering | Run `xinput list` to confirm detection. If coordinates are inverted, add a `TransformationMatrix` to `/usr/share/X11/xorg.conf.d/40-libinput.conf` |
