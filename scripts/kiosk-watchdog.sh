#!/bin/bash
# CoCalendar Kiosk Watchdog
# Runs in LXDE autostart. Restarts Chromium within 5s if it exits or crashes.

KIOSK_URL="https://yourcalendarapp.com/kiosk"

# Give the desktop a moment to fully load before launching
sleep 5

while true; do
  chromium-browser \
    --kiosk \
    --noerrdialogs \
    --disable-infobars \
    --no-first-run \
    --start-maximized \
    --disable-session-crashed-bubble \
    --disable-restore-session-state \
    --app="$KIOSK_URL"

  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Chromium exited — restarting in 5s..." \
    >> /tmp/kiosk-watchdog.log
  sleep 5
done
