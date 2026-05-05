# CoCalendar Kiosk Mode — PRD v1.0
**Status:** Ready to ship  
**Target:** 1 week  
**Hardware:** Raspberry Pi 5 + Elo 2202L 22" Touchscreen (1920×1080)  
**Stack:** Next.js 14 (existing app), new `/kiosk` route  

---

## 1. Problem Statement

The family uses CoCalendar on phones and laptops — but those require intentional interaction. The result: family members miss events, forget chores, and need to ask each other "what's happening today?" multiple times a day.

The Raspberry Pi + Elo touchscreen mounted on the wall is wasted potential. Right now it's either off or showing a generic dashboard. It should be **the single source of truth** that every family member glances at without thinking.

Specific pain points:
- Kids leave for school without checking their chores
- Parents forget the afternoon schedule while working
- No one knows what's for dinner / what errands are happening
- The wall screen is not being used at all

Kiosk Mode fixes this: a **passive, always-on display** that answers "what's happening today?" in under 3 seconds, from 6 feet away, with zero interaction required.

---

## 2. Success Criteria

| # | Metric | Pass |
|---|--------|------|
| 1 | Time-to-understand | User understands their full day in ≤ 3 seconds from 6 feet away |
| 2 | Zero-interaction value | Core info (time, next event, today's schedule, chores) visible without any tap |
| 3 | Auto-refresh | Screen reflects calendar changes within 60 seconds, no manual reload |
| 4 | Uptime | Screen stays on and functional for 24h+ without intervention |
| 5 | No regressions | Existing `/` `/week` `/month` routes unaffected |

---

## 3. User Scenarios

### Morning Routine (7:00–8:30am)
Dad walks into the kitchen. Glances at screen. Sees: "Soccer practice — 4:30pm" and "Trash day." Knows what the day looks like before coffee is done.

### Leaving the House
Mom is grabbing keys. Glances at screen from 8 feet away. Sees next event is "Dentist — 2pm / 45 min." Knows she has time. No phone needed.

### Kids Checking Chores
8-year-old walks by screen after school. Sees "Chores: 2 remaining" with their name highlighted. Taps nothing — just knows what's expected.

### Passive Glance
Dad is on a work call, walking to the kitchen. Peripheral vision catches the clock (2:47pm) and "Piano — 3:15pm." No interaction, full context. Returns to call.

---

## 4. Kiosk Layout

**Screen:** 1920×1080, landscape, fullscreen Chromium. Font sizes tuned for 6–10 foot readability.

```
┌─────────────────────────────────────────────────────────────────────┐
│  MONDAY, MAY 5                                          2:47 PM     │  ← TOP BAR (80px)
│                                                                     │     Date left, Clock right
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │  NEXT UP                                                     │  │  ← HERO PANEL (280px tall)
│   │  Soccer Practice                          4:30 PM            │  │     72px event name
│   │  Riverside Field · in 1h 43min                               │  │     48px time
│   └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
├──────────────────────────┬──────────────────────────────────────────┤
│  TODAY'S EVENTS          │  CHORES                                  │
│  ─────────────────────── │  ──────────────────────────────────────  │
│  9:00a  School           │  ✅ Emma — Make bed                      │
│  12:30p Lunch w/ Jen     │  ✅ Emma — Feed dog                      │  ← SPLIT LOWER PANEL
│  4:30p  Soccer ●         │  ⬜ Liam — Take out trash                │     (remaining height)
│  7:00p  Family Dinner    │  ⬜ Liam — Vacuum living room            │     Left: event list (32px text)
│                          │  ─────────────────────────────────────  │     Right: chores list (32px)
│                          │  2 of 4 done today                       │
└──────────────────────────┴──────────────────────────────────────────┘
```

**Color coding:**  
- Each event dot = person's color (existing system)  
- Completed chore = muted green ✅  
- Incomplete = white ⬜  

**Typography:**
- Date/clock: 36px / bold
- Next event name: 72px / bold
- Next event time: 48px / medium
- "in X hours" countdown: 28px / light
- Today event list: 32px
- Chore list: 30px

**No shopping list. No countdowns. No weather.** (see Non-Goals)

---

## 5. Information Hierarchy

### Primary (largest, most important)
- **Current time** — always visible, top right, 48px
- **Next event** — hero card, 72px name, 48px time + "in X hours"

### Secondary
- Today's remaining events (listed, with time prefix + person dot)
- Chore completion status per person

### Hidden / Removed from Kiosk
- ❌ Shopping list
- ❌ Countdowns
- ❌ Event creation / edit
- ❌ Person filter selector
- ❌ Week/month/day view switcher
- ❌ Navigation bar
- ❌ Settings
- ❌ Past events (before current time)

**Rationale:** Shopping list is viewed when shopping, not from the hall. Countdowns are nice-to-have, not daily-critical. The tradeoff is: less clutter = faster comprehension.

---

## 6. Interaction Model

### What can be tapped
- **Nothing required.** Kiosk is fully passive.
- Optional: tapping a chore row marks it complete (toggle). Uses existing chore API.
- Optional: tapping the hero "Next Event" card does nothing (prevents accidental navigation).

### Fullscreen Entry
- Chromium launched with `--kiosk` flag via autostart script on Pi boot
- Directly loads `https://yourcalendarapp.com/kiosk`
- No address bar, no tabs, no cursor (hidden via CSS)

### Exit Mechanism
- Physical keyboard shortcut only: `Alt+F4` or `Escape` (standard Chromium kiosk exit)
- No visible exit button on screen
- No swipe gesture to exit

---

## 7. Data & Refresh Strategy

| Data | Interval | Endpoint |
|------|----------|----------|
| Calendar events | Every 60s | Existing `/api/events` |
| Chores | Every 60s | Existing `/api/chores` |
| Clock/date | Every 1s | Local JS (`setInterval`) |
| "Time until" countdown | Every 30s | Derived from fetched events |

**Implementation:** Single `useKioskData()` hook that runs two `setInterval` loops (1s for clock, 60s for data). No WebSocket, no SWR, no React Query — plain fetch + useState.

**Stale state handling:** If fetch fails, show last known data. Show a subtle "Last updated X min ago" footer in gray if data is >5 min stale. No error modals or spinners — never interrupt the passive display.

**Over-fetching prevention:** Only fetch `/api/events?date=today` and `/api/chores?date=today`. Not full calendar history.

---

## 8. Burn-in / Screen Safety

**Simple solution: CSS pixel shift every 30 minutes.**

```js
// Every 30 min, shift entire layout by ±2px x/y randomly
// Imperceptible to viewer, prevents static burn-in
useEffect(() => {
  const interval = setInterval(() => {
    const x = Math.floor(Math.random() * 5) - 2;
    const y = Math.floor(Math.random() * 5) - 2;
    document.body.style.transform = `translate(${x}px, ${y}px)`;
  }, 30 * 60 * 1000);
  return () => clearInterval(interval);
}, []);
```

No screensaver. No dimming (screen must be readable at all times — it's a command center). Elo 2202L has commercial-grade panel rated for always-on use.

---

## 9. Raspberry Pi Setup Requirements

### OS
- Raspberry Pi OS Lite (64-bit) or Desktop — either works
- Chromium browser pre-installed (included in RPi OS Desktop)

### Boot Configuration (`/boot/config.txt`)
```ini
# Prevent display sleep
hdmi_force_hotplug=1

# Screen rotation (if needed for portrait mount — this PRD assumes landscape)
# display_rotate=0
```

### Prevent Sleep (`/etc/xdg/lxsession/LXDE-pi/autostart`)
```
@xset s off
@xset -dpms
@xset s noblank
```

### Auto-Launch Chromium (`~/.config/autostart/kiosk.desktop`)
```ini
[Desktop Entry]
Type=Application
Name=CoCalendar Kiosk
Exec=chromium-browser --kiosk --noerrdialogs --disable-infobars --no-first-run --start-maximized --app=https://yourcalendarapp.com/kiosk
X-GNOME-Autostart-enabled=true
```

### Hide Cursor
```bash
# Install unclutter
sudo apt install unclutter

# Add to autostart
@unclutter -idle 0.1 -root
```

### Crash Recovery
```bash
# Wrap Chromium in a shell loop (create: /usr/local/bin/kiosk-watchdog.sh)
#!/bin/bash
while true; do
  chromium-browser --kiosk --noerrdialogs --disable-infobars \
    --no-first-run --app=https://yourcalendarapp.com/kiosk
  sleep 5  # restart after 5s if it crashes
done
```
```ini
# autostart entry uses the watchdog instead:
Exec=bash /usr/local/bin/kiosk-watchdog.sh
```

### Network
- Pi connected via Ethernet (preferred) or dedicated WiFi SSID
- Static IP assigned in router for reliability

---

## 10. Technical Implementation Plan

### New Route
```
app/
  kiosk/
    page.tsx          ← Server component shell, metadata: no-index
    KioskClient.tsx   ← 'use client' — all the display logic
    useKioskData.ts   ← Data fetching hook
    kiosk.css         ← Kiosk-specific overrides (hide scrollbar, cursor: none)
```

### Reused vs New

| Component | Action |
|-----------|--------|
| `/api/events` | Reuse as-is, add `?date=today` filter if not already supported |
| `/api/chores` | Reuse as-is |
| Event color system | Reuse person color mapping |
| Chore toggle API | Reuse existing PATCH endpoint |
| All nav/header components | **Not used** — kiosk has zero chrome |

### Layout
- Pure CSS Grid / Flexbox — no component library
- `height: 100vh`, `overflow: hidden`, `position: fixed`
- Two-column lower section: `grid-template-columns: 1fr 1.2fr`
- Font sizes in `rem`, base set to 18px for kiosk route

### State Management
```ts
// useKioskData.ts — no external libraries
const [events, setEvents] = useState<Event[]>([]);
const [chores, setChores] = useState<Chore[]>([]);
const [lastFetched, setLastFetched] = useState<Date | null>(null);

useEffect(() => {
  const fetchAll = async () => {
    const [evRes, chRes] = await Promise.all([
      fetch('/api/events?date=today'),
      fetch('/api/chores?date=today'),
    ]);
    // ... set state, set lastFetched
  };
  fetchAll();
  const interval = setInterval(fetchAll, 60_000);
  return () => clearInterval(interval);
}, []);
```

### Performance
- No images (all text-based UI)
- No heavy animations — only CSS transitions on chore toggle
- Chromium on Pi 5 handles a plain React page with no issues at 1080p
- `next/font` with system fallback — no external font load on kiosk

### Metadata (prevent indexing, set title)
```ts
// app/kiosk/page.tsx
export const metadata = {
  title: 'CoCalendar Kiosk',
  robots: 'noindex',
};
```

---

## 11. Non-Goals

These are explicitly **not** included in V1:

- ❌ Weather widget
- ❌ Shopping list on kiosk
- ❌ Countdown timers
- ❌ Multiple layout themes or configuration UI
- ❌ Voice interaction
- ❌ Touch-to-navigate to full calendar
- ❌ Multi-screen / multi-room support
- ❌ WebSocket / real-time push (polling is fine)
- ❌ Offline mode / service worker
- ❌ Dark/light mode toggle
- ❌ Admin PIN to exit kiosk

---

## 12. Risks & Tradeoffs

| Risk | Tradeoff | Decision |
|------|----------|----------|
| Polling vs real-time | 60s polling = up to 1min lag. WebSockets = complexity | **Accept the lag.** 60s is fine for a family calendar. |
| Web app vs native feel | Web has tap latency, can't do true native haptics | **Web is fine.** Interaction is minimal. |
| Simplicity vs power | No shopping list, no countdowns on kiosk | **Cut it.** Clutter kills glanceability. Add later if family requests. |
| Pi crashes | Uncommon but possible; kiosk breaks | **Watchdog script** restarts Chromium within 5s. |
| WiFi drops | Stale data shown | **Show last-updated timestamp** if >5min stale. Acceptable. |
| Burn-in | Elo 2202L is commercial-grade but still a risk | **2px pixel shift every 30min.** Simple, effective. |
| Touch register accuracy | Elo is USB HID — works natively in Chromium | No driver issues expected. Test chore tap targets at ≥60px height. |

---

## Build Plan (Day 1–Day 5)

### Day 1 — Scaffold + Layout
**Goal:** Pixel-perfect static layout, no real data yet.

- [ ] Create `app/kiosk/page.tsx` and `KioskClient.tsx`
- [ ] Build full layout with hardcoded mock data
- [ ] CSS: full viewport, no scrollbar, hidden cursor, correct font sizes
- [ ] Test in browser at 1920×1080 (Chrome DevTools)
- [ ] Verify no existing routes broken

**Done when:** Screenshot at 1080p matches the layout spec in §4.

---

### Day 2 — Data Integration
**Goal:** Real data flowing from existing APIs.

- [ ] Build `useKioskData.ts` hook
- [ ] Connect to `/api/events` — render today's events in order
- [ ] Connect to `/api/chores` — render by person, show completion state
- [ ] Derive "Next Event" from event list (first future event by time)
- [ ] Derive "in X hours Y min" countdown string
- [ ] 60s polling, stale indicator if fetch fails

**Done when:** Screen shows real family calendar data with accurate times.

---

### Day 3 — Chore Tap + Polish
**Goal:** Chore toggle works, screen is visually ready.

- [ ] Add tap handler on chore rows → PATCH `/api/chores/:id`
- [ ] Optimistic UI update (instant toggle, reconcile on next poll)
- [ ] Add burn-in pixel shift (§8)
- [ ] Typography pass: verify all text readable at 6ft (print screenshot, hold it up)
- [ ] Add person color dots to event list
- [ ] Test clock: 1s updates, correct AM/PM

**Done when:** Family members can use kiosk naturally without coaching.

---

### Day 4 — Raspberry Pi Setup
**Goal:** Pi boots straight into kiosk, no intervention needed.

- [ ] Flash RPi OS on Pi 5
- [ ] Install Chromium, configure autostart
- [ ] Set up kiosk-watchdog.sh
- [ ] Install unclutter, configure xset for no sleep
- [ ] Plug into Elo 2202L, verify display at 1920×1080
- [ ] Point to production Vercel URL
- [ ] Test crash recovery (kill Chromium manually, verify auto-restart)
- [ ] Mount on wall (or desk-test position)

**Done when:** Pi boots to kiosk screen in <60s from power-on, stays on indefinitely.

---

### Day 5 — Family Testing + Fixes
**Goal:** Real family uses it for one full day, fix what breaks.

- [ ] Morning: Does the "Next Event" update correctly through the day?
- [ ] Do chore taps register reliably on Elo touchscreen?
- [ ] Is text readable from the couch / kitchen entry?
- [ ] Fix any layout issues found on actual hardware
- [ ] Adjust font sizes if needed (Pi GPU rendering ≠ laptop Chrome)
- [ ] Document Pi IP + restart instructions on a sticky note on the back

**Done when:** No family member asks "what's wrong with the screen?"

---

*This PRD is complete. Start with Day 1. Do not deviate into non-goals. Ship it.*
