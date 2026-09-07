#!/usr/bin/env python3
"""
Raspberry Pi 5 RC522 to Virtual Keyboard Wedge Bridge
-----------------------------------------------------------------
This daemon reads RFID card UIDs from an RC522 module connected via SPI
on a Raspberry Pi 5 and injects the UID as keyboard keystrokes + Enter (KEY_ENTER)
into the Linux /dev/uinput device.

Prerequisites on Raspberry Pi OS:
  sudo apt-get install python3-pip python3-spidev
  pip3 install evdev mfrc522 --break-system-packages
  sudo modprobe uinput

Systemd Service: /etc/systemd/system/cms-rfid.service
"""

import time
import sys
try:
    from mfrc522 import SimpleMFRC522
    import RPi.GPIO as GPIO
    import evdev
    from evdev import UInput, ecodes as e
except ImportError:
    print("Warning: Hardware libraries not found. Ensure this runs on Raspberry Pi with RPi.GPIO, mfrc522, and evdev installed.")

# Map characters to evdev keycodes
CHAR_TO_KEY = {
    '0': e.KEY_0, '1': e.KEY_1, '2': e.KEY_2, '3': e.KEY_3, '4': e.KEY_4,
    '5': e.KEY_5, '6': e.KEY_6, '7': e.KEY_7, '8': e.KEY_8, '9': e.KEY_9,
    'a': e.KEY_A, 'b': e.KEY_B, 'c': e.KEY_C, 'd': e.KEY_D, 'e': e.KEY_E,
    'f': e.KEY_F, 'g': e.KEY_G, 'h': e.KEY_H, 'i': e.KEY_I, 'j': e.KEY_J,
    'k': e.KEY_K, 'l': e.KEY_L, 'm': e.KEY_M, 'n': e.KEY_N, 'o': e.KEY_O,
    'p': e.KEY_P, 'q': e.KEY_Q, 'r': e.KEY_R, 's': e.KEY_S, 't': e.KEY_T,
    'u': e.KEY_U, 'v': e.KEY_V, 'w': e.KEY_W, 'x': e.KEY_X, 'y': e.KEY_Y,
    'z': e.KEY_Z,
}

def type_string(ui, text):
    """Types a string into the virtual keyboard device followed by Enter"""
    for char in text.lower():
        keycode = CHAR_TO_KEY.get(char)
        if keycode:
            ui.write(e.EV_KEY, keycode, 1)
            ui.write(e.EV_KEY, keycode, 0)
            ui.syn()
            time.sleep(0.01)
    # Send Enter key
    ui.write(e.EV_KEY, e.KEY_ENTER, 1)
    ui.write(e.EV_KEY, e.KEY_ENTER, 0)
    ui.syn()

def main():
    print("Initializing ISRO CMS RC522 RFID Bridge on Raspberry Pi 5...")
    reader = SimpleMFRC522()
    ui = UInput(name="CMS-RC522-Virtual-Keyboard")
    time.sleep(1)
    print("RC522 Reader Active. Ready to scan cards...")

    last_card_id = None
    last_scan_time = 0

    try:
        while True:
            # Read card UID (non-blocking / fast polling)
            card_id, text = reader.read_no_block()
            current_time = time.time()

            if card_id:
                card_str = str(card_id).strip()
                # Debounce: Prevent duplicate read if card is held on reader for less than 1.5 seconds
                if card_str != last_card_id or (current_time - last_scan_time) > 1.5:
                    print(f"Card Scanned: {card_str}")
                    type_string(ui, card_str)
                    last_card_id = card_str
                    last_scan_time = current_time

            time.sleep(0.1)

    except KeyboardInterrupt:
        print("Stopping RC522 bridge...")
    finally:
        GPIO.cleanup()
        ui.close()

if __name__ == "__main__":
    main()
