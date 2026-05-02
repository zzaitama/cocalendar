# CLAUDE.md — Family Calendar (FamCal)

> This file is the source of truth for every build decision.
> When in doubt: do the simpler thing. Ship the smaller scope. Read this file first.

---

## 1. Project Goal

A wall-mounted family calendar web app running on a Raspberry Pi touchscreen kiosk.

- Always-on display showing today's events at a glance
- Syncs with a single shared Google Calendar (source of truth)
- Quick-add from the wall; full edit from phone/desktop
- Ships as a Vercel-hosted Next.js app

This is a **read-heavy, glanceable display** first. CRUD is secondary.

---

## 2. V1 Scope (Strict — No Exceptions)

### INCLUDED

| Feature | Detail |
|---|---|
| Today View | Default screen. Day label, current time, next event highlighted, all-day list |
| Week View | 7-column Mon–Sun. Stacked event cards. No hourly grid |
| Navigation | Header tap to toggle Today/Week. Prev/Next arrows |
| Event cards | Title, time, color-coded person dot/bar |
| Quick Add (wall) | Modal: Title + Time + Person. Save goes to Google Calendar |
| Edit event | Tap event → edit modal (same fields as Quick Add) |
| Delete event | Inside edit modal |
| Google Calendar sync | Poll every 30–60s. Read + Write |
| Google OAuth | One-time setup. Single shared family account |
| Person color config | Static config file: Dad, Mom, Colette, Family |
| Responsive layout | Works on phone, desktop, and Pi touchscreen |

### EXCLUDED — Hard No for V1

- Notifications / reminders
- Photos, screensavers, weather widgets
- Meal planning, chore tracking
- Voice input
- AI features
- Multi-calendar support
- Per-user login / auth system (one shared Google account only)
- Drag-to-reschedule
- Recurrence creation UI (Google Calendar handles recurrence; we display recurring events, not create them)
- Webhooks / push sync
- Offline mode
- Dark/light mode toggle

---

## 3. Tech Stack (Locked)

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 14 (App Router) | API routes + SSR in one deploy |
| Auth | NextAuth.js (Google provider) | Handles OAuth + token refresh out of the box |
| Google API | `googleapis` npm package | Official SDK |
| Styling | Tailwind CSS | Already in scaffold |
| Date handling | `date-fns` | Tiny, tree-shakeable, no moment.js |
| Hosting | Vercel | Zero config, Next.js native |
| Pi browser | Chromium in kiosk mode | Standard |

**No additional dependencies without explicit justification.**
No Redux, Zustand, React Query, Radix, shadcn, Framer Motion, or any other library not listed above.

---

## 4. File Structure

```
family-cal/
├── app/
│   ├── layout.tsx              # Root layout, global font, metadata
│   ├── page.tsx                # Today View (default route)
│   ├── week/
│   │   └── page.tsx            # Week View
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts    # NextAuth handler
│   │   └── events/
│   │       ├── route.ts        # GET /api/events, POST /api/events
│   │       └── [id]/
│   │           └── route.ts    # PATCH, DELETE /api/events/[id]
├── components/
│   ├── TodayView.tsx           # Today layout component
│   ├── WeekView.tsx            # Week layout component
│   ├── EventCard.tsx           # Single event card (shared)
│   ├── EventModal.tsx          # Create/Edit modal
│   ├── NavHeader.tsx           # Top nav: Today/Week toggle + date
│   └── AddButton.tsx           # Floating "+" button
├── lib/
│   ├── google-calendar.ts      # All Google Calendar API calls
│   ├── config.ts               # USERS config (static person/color map)
│   └── utils.ts                # Date formatting helpers
├── types/
│   └── index.ts                # CalendarEvent, User types
├── .env.local                  # Secrets (never commit)
└── CLAUDE.md                   # This file
```

**Rules:**
- No `/components/ui/` abstraction layer
- No barrel `index.ts` files
- Components are flat, not nested by domain
- One file per component, no co-located test files in V1

---

## 5. Data Model

### Users (static config in `lib/config.ts`)

```ts
export const USERS = [
  { id: "dad",     name: "Dad",     color: "#4CAF50", gcalColorId: "2" },
  { id: "mom",     name: "Mom",     color: "#2196F3", gcalColorId: "1" },
  { id: "colette", name: "Colette", color: "#FF69B4", gcalColorId: "5" },
  { id: "family",  name: "Family",  color: "#9C27B0", gcalColorId: "3" },
]
```

### CalendarEvent (internal type)

```ts
type CalendarEvent = {
  id: string           // Google event ID
  title: string
  start: string        // ISO datetime or date (all-day)
  end: string          // ISO datetime or date (all-day)
  colorId: string      // Google colorId → maps to user
  isAllDay: boolean
}
```

### Person assignment strategy
Events are assigned to a person via Google Calendar's event-level `colorId`.
`colorId` maps 1:1 to a user in the static USERS config.
No title prefixes. No custom fields.

---

## 6. API Routes

### `GET /api/events?start=ISO&end=ISO`
Fetches events from Google Calendar for the given range.
Returns: `CalendarEvent[]`

### `POST /api/events`
Creates a new event.
Body: `{ title, start, end, colorId }`

### `PATCH /api/events/[id]`
Updates an existing event.
Body: `{ title, start, end, colorId }`

### `DELETE /api/events/[id]`
Deletes an event.

All routes are authenticated via NextAuth session. They proxy directly to Google Calendar — no DB, no caching layer.

---

## 7. Sync Strategy

- Client polls `GET /api/events` every **30 seconds** via `setInterval`
- No webhooks, no WebSockets
- On create/edit/delete: immediately re-fetch after mutation (no optimistic UI)
- Acceptable lag: up to 60 seconds

---

## 8. UX Principles (Non-Negotiable)

1. **Readable at 10 feet** — minimum 24px body text. Event titles: 28–36px. Time: large.
2. **Touch targets ≥ 56px** — every tappable element. No hover-only interactions.
3. **Today View is the default** — never land on week view cold
4. **Color = person identity** — every event shows its person color immediately
5. **Quick Add < 10 seconds** — Title field auto-focuses. Time defaults to next hour. One tap per person selector.
6. **No loading spinners on the wall** — show stale data with a subtle indicator rather than blank screen
7. **No modals on top of modals** — one modal max, always dismissable via Cancel or backdrop tap
8. **Empty states are friendly** — "Nothing today — enjoy the day!" not blank whitespace

---

## 9. Coding Rules

1. **No abstractions unless used 3+ times.** Don't create a `useCalendar` hook for one page.
2. **Co-locate state with the component that needs it.** Lift only when two siblings need it.
3. **Fetch in Server Components where possible.** Use Client Components only when interactivity is required.
4. **No `any` types.** Use the types in `types/index.ts`.
5. **Error boundaries are optional in V1.** Console.error + user-visible fallback text is fine.
6. **Tailwind only.** No inline styles. No CSS modules. No styled-components.
7. **Named exports only.** No default exports except page/layout files (Next.js requires it).
8. **Keep files under 200 lines.** If a file exceeds this, split it — but only if the split is obvious.
9. **No comments explaining what code does.** Write code that reads itself. Comments only for *why*.
10. **Every API route must handle errors** and return a JSON error with a status code.

---

## 10. Environment Variables

```bash
# .env.local
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_SECRET=          # openssl rand -base64 32
NEXTAUTH_URL=             # http://localhost:3000 locally, Vercel URL in prod
GOOGLE_CALENDAR_ID=       # usually "primary" or the family calendar email
```

---

## 11. Definition of Done

V1 is DONE when all of the following are true:

- [ ] Pi boots → Chromium launches → app loads automatically
- [ ] Today View loads in < 2 seconds on Pi
- [ ] Event titles are readable from 10 feet
- [ ] Events from Google Calendar appear within 60s of being created
- [ ] Quick Add from wall creates event in Google Calendar (verified in GCal)
- [ ] Edit from phone updates event on wall within 60s
- [ ] Delete works
- [ ] App runs 24/7 for 48h without intervention
- [ ] No console errors in normal operation
- [ ] Deployed to Vercel with a stable URL

---

## 12. Build Phases

### Phase 1 — Foundation (Days 1–2)
- Next.js scaffold (done)
- Install: `next-auth`, `googleapis`, `date-fns`
- Google OAuth via NextAuth
- `GET /api/events` returns real data
- Hard-coded date range test, logged to console

**Shippable check:** Auth works, events print to console.

### Phase 2 — Today View (Days 3–4)
- `TodayView.tsx` with real event data
- `EventCard.tsx` component
- `NavHeader.tsx` with date display
- Person color rendering
- 30s polling loop

**Shippable check:** Wall-mounted Pi shows today's events, updates every 30s.

### Phase 3 — Week View + Navigation (Days 5–6)
- `WeekView.tsx` 7-column layout
- Header tap to toggle views
- Prev/Next navigation (arrows)

**Shippable check:** Full read-only kiosk experience.

### Phase 4 — CRUD (Days 7–9)
- `EventModal.tsx` (create + edit)
- `AddButton.tsx` floating FAB
- `POST /api/events`, `PATCH /api/events/[id]`, `DELETE /api/events/[id]`
- Tap event card → open edit modal

**Shippable check:** Full create/edit/delete cycle works, syncs to Google Calendar.

### Phase 5 — Polish + Pi (Days 10–12)
- Responsive layout (mobile, desktop, 1024px Pi screen)
- Large typography pass
- Touch target audit (≥ 56px)
- Pi kiosk setup instructions in README
- Stale data indicator

**Shippable check:** Looks good on all three form factors.

### Phase 6 — Ship (Days 13–14)
- Vercel deploy
- End-to-end smoke test on Pi
- README with setup instructions

---

## 13. What NOT to Build (Ever in V1)

If a PR or prompt asks for any of the following, the answer is NO:

- A database (Postgres, SQLite, Redis, anything)
- A caching layer
- A separate backend service
- Websockets or webhooks
- User accounts beyond the single shared Google account
- A component library or design system
- Global state management (Redux, Zustand, Jotai)
- Tests (nice to have, not blocking V1)
- Storybook
- Drag and drop
- Animations beyond CSS transitions
- A native mobile app
- Push notifications
- Any AI feature

---

## 14. Key Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Google OAuth token expires on Pi (long-lived session) | NextAuth auto-refreshes tokens via refresh_token grant. Verify refresh_token is stored in session. |
| Next.js bundle too heavy for Pi | Minimize client JS. Keep polling logic simple. No large libraries. |
| Event-level colorId write not supported | Test early in Phase 1. Fallback: title prefix `[Dad]` if colorId fails. |
| Touch targets too small on Pi screen | Explicit min-h-14 (56px) on all interactive elements. Test physically. |
| Pi Chromium crashes | systemd `Restart=always` on the kiosk service. Daily 3am reboot via cron. |

---

*Last updated: project kickoff. Update this file if scope changes — do not silently drift.*
