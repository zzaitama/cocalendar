# CoCalendar

A wall-mounted family calendar for Raspberry Pi. Syncs with Google Calendar. Built with Next.js 14, NextAuth, and Tailwind CSS.

---

## Local Development

### Prerequisites

- Node.js 18+
- A Google Cloud project with the Calendar API enabled
- OAuth 2.0 credentials (Web application type)

### 1. Clone and install

```bash
git clone https://github.com/zzaitama/cocalendar
cd cocalendar
npm install
```

### 2. Create `.env.local`

```bash
cp .env.local.example .env.local
```

Fill in the values:

```
GOOGLE_CLIENT_ID=        # From Google Cloud Console → Credentials
GOOGLE_CLIENT_SECRET=    # From Google Cloud Console → Credentials
NEXTAUTH_SECRET=         # Run: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CALENDAR_ID=primary
```

### 3. Configure OAuth redirect URI

In Google Cloud Console → Credentials → your OAuth client, add:

```
http://localhost:3000/api/auth/callback/google
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with the shared Google account.

---

## Deploy to Vercel

### 1. Push to GitHub

```bash
git push origin main
```

### 2. Import project in Vercel

Go to [vercel.com](https://vercel.com), import the repo, and set these environment variables:

| Variable | Value |
|---|---|
| `GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Your Vercel URL (e.g. `https://cocalendar.vercel.app`) |
| `GOOGLE_CALENDAR_ID` | `primary` or your shared calendar email |

### 3. Add Vercel redirect URI

In Google Cloud Console → Credentials → your OAuth client, add:

```
https://your-vercel-url.vercel.app/api/auth/callback/google
```

### 4. Sign in once

Visit your Vercel URL, sign in with the shared Google account. The refresh token is stored in the session — subsequent visits stay authenticated.

---

## Raspberry Pi Kiosk Setup

Tested on Raspberry Pi OS (Bookworm, 64-bit) with a 1024×600 touchscreen.

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

Create `/etc/systemd/system/kiosk.service`:

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
  https://cocalendar-one.vercel.app
Restart=always
RestartSec=5

[Install]
WantedBy=graphical.target
```

Enable and start:

```bash
sudo systemctl enable kiosk
sudo systemctl start kiosk
```

### 4. Hide the mouse cursor

```bash
sudo apt install -y unclutter
```

Add to `~/.config/lxsession/LXDE-pi/autostart`:

```
@unclutter -idle 1 -root
```

### 5. Schedule a daily reboot

```bash
sudo crontab -e
```

Add:

```
0 3 * * * /sbin/reboot
```

### 6. Auto-login to desktop

```bash
sudo raspi-config
```

Navigate to **System Options → Boot / Auto Login → Desktop Autologin**.

### Troubleshooting

**Blank white screen on boot**
Chromium launched before the desktop was ready. The `ExecStartPre=/bin/sleep 5` in the service file handles this. If it still happens, increase the sleep value to 10.

**Auth expired / redirect to sign-in page**
The refresh token has been revoked (happens if you sign in to too many devices, or revoke access in your Google account). Visit the Vercel URL from a phone, sign in again, then reload the Pi.

**Chromium crashed / service stopped**
`Restart=always` in the service file restarts Chromium automatically. Check `journalctl -u kiosk -n 50` to see crash logs.

**Events not updating**
The app polls every 30–60 seconds. If the "Sync stale" indicator appears in amber, the Pi has lost internet. Check Wi-Fi with `ping 8.8.8.8`. If DNS is the issue, add `nameserver 8.8.8.8` to `/etc/resolv.conf`.

**Touchscreen not registering taps**
Run `xinput list` to confirm the touchscreen is detected. If the coordinates are inverted, add a `TransformationMatrix` option to `/usr/share/X11/xorg.conf.d/40-libinput.conf`.

---

## Person Color Map

Edit `lib/config.ts` to change names or colors. The `gcalColorId` must match the color ID used in Google Calendar.

| Person | Color | Google Calendar Color |
|---|---|---|
| Dad | Green `#4CAF50` | Sage (2) |
| Mom | Blue `#2196F3` | Peacock (1) |
| Colette | Pink `#FF69B4` | Banana (5) |
| Family | Purple `#9C27B0` | Grape (3) |
