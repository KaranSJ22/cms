#!/usr/bin/env bash
# ============================================================
# CMS Kiosk - Chromium Kiosk Mode Launcher for Raspberry Pi 5
# ============================================================

# Auto-detect graphical display environment when invoked via SSH
export DISPLAY="${DISPLAY:-:0}"
export XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/run/user/$(id -u)}"

if [ -z "$WAYLAND_DISPLAY" ]; then
    if [ -e "$XDG_RUNTIME_DIR/wayland-1" ]; then
        export WAYLAND_DISPLAY="wayland-1"
    elif [ -e "$XDG_RUNTIME_DIR/wayland-0" ]; then
        export WAYLAND_DISPLAY="wayland-0"
    fi
fi

# Disable screen blanking and power management (X11 & Wayland)
xset s off -dpms s noblank 2>/dev/null || true
which wlopm >/dev/null 2>&1 && wlopm --on '*' 2>/dev/null || true

# Wait until local edge agent HTTP service is healthy
echo "[INFO] Waiting for local Kiosk agent (http://127.0.0.1:5000/health)..."
until curl -s http://127.0.0.1:5000/health > /dev/null; do
    sleep 1
done
echo "[OK] Kiosk agent is ready. Launching Chromium..."

# Resolve available Chromium executable
BROWSER_BIN="chromium-browser"
if ! command -v chromium-browser &> /dev/null && command -v chromium &> /dev/null; then
    BROWSER_BIN="chromium"
fi

# Launch Chromium in dedicated full-screen touch kiosk mode
exec $BROWSER_BIN \
    --kiosk \
    --ozone-platform-hint=auto \
    --user-data-dir="/tmp/chromium-kiosk-profile" \
    --noerrdialogs \
    --disable-infobars \
    --disable-features=Translate,OptimizationHints,MediaRouter \
    --disable-component-update \
    --disable-session-crashed-bubble \
    --password-store=basic \
    --no-first-run \
    --touch-events=enabled \
    --disable-pinch \
    --overscroll-history-navigation=0 \
    --check-for-update-interval=31536000 \
    http://127.0.0.1:5000
