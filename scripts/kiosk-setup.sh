#!/bin/bash
# CoCalendar Kiosk Setup — Raspberry Pi 5 + Elo 2202L
# Usage: bash kiosk-setup.sh [kiosk-url]
# Example: bash kiosk-setup.sh https://cocalendar.vercel.app/kiosk

set -e

KIOSK_URL="${1:-https://yourcalendarapp.com/kiosk}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "============================================"
echo "  CoCalendar Kiosk Setup"
echo "  URL: $KIOSK_URL"
echo "============================================"
echo ""

# ── 1. System update ─────────────────────────────────────────────────────────
echo "[1/6] Updating system packages..."
sudo apt-get update -y
sudo apt-get upgrade -y

# ── 2. Dependencies ───────────────────────────────────────────────────────────
echo "[2/6] Installing unclutter and chromium-browser..."
sudo apt-get install -y unclutter chromium-browser

# ── 3. Prevent display sleep (/boot/config.txt) ───────────────────────────────
echo "[3/6] Configuring /boot/config.txt (prevent HDMI sleep)..."
BOOT_CONFIG="/boot/config.txt"
if ! grep -q "hdmi_force_hotplug=1" "$BOOT_CONFIG"; then
  echo "" | sudo tee -a "$BOOT_CONFIG"
  echo "# CoCalendar kiosk — prevent display sleep" | sudo tee -a "$BOOT_CONFIG"
  echo "hdmi_force_hotplug=1" | sudo tee -a "$BOOT_CONFIG"
fi

# ── 4. LXDE autostart (xset + unclutter) ─────────────────────────────────────
echo "[4/6] Configuring LXDE autostart (xset dpms off, unclutter)..."
AUTOSTART_DIR="/etc/xdg/lxsession/LXDE-pi"
sudo mkdir -p "$AUTOSTART_DIR"
AUTOSTART="$AUTOSTART_DIR/autostart"

add_autostart_line() {
  if ! grep -qF "$1" "$AUTOSTART" 2>/dev/null; then
    echo "$1" | sudo tee -a "$AUTOSTART" > /dev/null
    echo "  Added: $1"
  else
    echo "  Already present: $1"
  fi
}

add_autostart_line "@xset s off"
add_autostart_line "@xset -dpms"
add_autostart_line "@xset s noblank"
add_autostart_line "@unclutter -idle 0.1 -root"

# ── 5. Install watchdog script ────────────────────────────────────────────────
echo "[5/6] Installing kiosk-watchdog.sh to /usr/local/bin/..."
WATCHDOG_SRC="$SCRIPT_DIR/kiosk-watchdog.sh"
WATCHDOG_DEST="/usr/local/bin/kiosk-watchdog.sh"

if [ ! -f "$WATCHDOG_SRC" ]; then
  echo "ERROR: kiosk-watchdog.sh not found at $WATCHDOG_SRC"
  echo "Run this script from the project's scripts/ directory."
  exit 1
fi

sudo cp "$WATCHDOG_SRC" "$WATCHDOG_DEST"
# Stamp the target URL into the installed copy
sudo sed -i "s|https://yourcalendarapp.com/kiosk|$KIOSK_URL|g" "$WATCHDOG_DEST"
sudo chmod +x "$WATCHDOG_DEST"

# Register watchdog in LXDE autostart (replaces direct chromium line)
add_autostart_line "@bash $WATCHDOG_DEST"

# ── 6. User-level autostart .desktop entry ───────────────────────────────────
echo "[6/6] Creating ~/.config/autostart/kiosk.desktop..."
DESKTOP_DIR="$HOME/.config/autostart"
mkdir -p "$DESKTOP_DIR"

cat > "$DESKTOP_DIR/kiosk.desktop" << EOF
[Desktop Entry]
Type=Application
Name=CoCalendar Kiosk
Exec=bash $WATCHDOG_DEST
X-GNOME-Autostart-enabled=true
EOF

echo ""
echo "============================================"
echo "  Setup complete!"
echo "============================================"
echo ""
echo "NEXT STEPS:"
echo "  1. Assign a static IP to this Pi in your router's DHCP settings."
echo "  2. Confirm $KIOSK_URL is reachable from this Pi:"
echo "     curl -I $KIOSK_URL"
echo "  3. Reboot:"
echo "     sudo reboot"
echo ""
echo "After reboot Chromium will open kiosk mode automatically."
echo "Crash recovery: watchdog restarts Chromium within 5s."
echo "Exit kiosk:     press Alt+F4 or Escape on a physical keyboard."
echo ""
echo "Watchdog log: /tmp/kiosk-watchdog.log"
