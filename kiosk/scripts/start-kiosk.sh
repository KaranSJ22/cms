#!/usr/bin/env bash
# ============================================================
# CMS Kiosk - Chromium Kiosk Mode Launcher for Raspberry Pi 5
# ============================================================

# Disable screen blanking and power management
xset s off -dpms s noblank 2>/dev/null || true

# Wait until local edge agent HTTP service is healthy
echo "[INFO] Waiting for local Kiosk agent (http://127.0.0.1:5000/health)..."
until curl -s http://127.0.0.1:5000/health > /dev/null; do
    sleep 1
done
echo "[OK] Kiosk agent is ready. Launching Chromium..."

# Launch Chromium in dedicated full-screen touch kiosk mode
exec chromium-browser \
    --kiosk \
    --noerrdialogs \
    --disable-infobars \
    --disable-features=TranslateUI \
    --no-first-run \
    --fast \
    --fast-start \
    --disable-pinch \
    --overscroll-history-navigation=0 \
    --check-for-update-interval=31536000 \
    http://127.0.0.1:5000
