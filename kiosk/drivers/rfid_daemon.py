#!/usr/bin/env python3
"""
CMS Kiosk - RC522 RFID Virtual Keyboard Daemon (Raspberry Pi 5)
Reads card UIDs via SPI0 and injects them as virtual keyboard keystrokes
directly into the Linux OS input subsystem using evdev/uinput.
"""

import os
import sys
import time
import signal
import spidev

try:
    from evdev import UInput, ecodes as e
except ImportError:
    print("[ERROR] 'evdev' package not found. Install via: pip install evdev")
    sys.exit(1)

# -----------------------------------------------------------------------------
# Configuration & Constants
# -----------------------------------------------------------------------------
SPI_BUS = int(os.getenv("RFID_SPI_BUS", "0"))
SPI_DEVICE = int(os.getenv("RFID_SPI_DEV", "0"))
SPI_SPEED = int(os.getenv("RFID_SPI_SPEED", "1000000"))  # 1 MHz
DEBOUNCE_COOLDOWN = float(os.getenv("RFID_DEBOUNCE_SEC", "2.0"))  # 2s cooldown for same card
USE_COLON_FORMAT = os.getenv("RFID_COLON_SEPARATED", "false").lower() == "true"

# RC522 Registers
CommandReg    = 0x01
ComIEnReg     = 0x02
ComIrqReg     = 0x04
ErrorReg      = 0x06
FIFODataReg   = 0x09
FIFOLevelReg  = 0x0A
ControlReg    = 0x0C
BitFramingReg = 0x0D
CollReg       = 0x0E

ModeReg       = 0x11
TxModeReg     = 0x12
RxModeReg     = 0x13
TxControlReg  = 0x14
TxASKReg      = 0x15

TModeReg      = 0x2A
TPrescalerReg = 0x2B
TReloadRegH   = 0x2C
TReloadRegL   = 0x2D

VersionReg    = 0x37

# RC522 Commands
PCD_Idle       = 0x00
PCD_Transceive = 0x0C

PICC_REQIDL    = 0x26
PICC_ANTICOLL  = 0x93

# Keycode mapping for characters in hex UID
CHAR_KEY_MAP = {
    '0': e.KEY_0,
    '1': e.KEY_1,
    '2': e.KEY_2,
    '3': e.KEY_3,
    '4': e.KEY_4,
    '5': e.KEY_5,
    '6': e.KEY_6,
    '7': e.KEY_7,
    '8': e.KEY_8,
    '9': e.KEY_9,
    'A': e.KEY_A,
    'B': e.KEY_B,
    'C': e.KEY_C,
    'D': e.KEY_D,
    'E': e.KEY_E,
    'F': e.KEY_F,
}

# -----------------------------------------------------------------------------
# Global State
# -----------------------------------------------------------------------------
spi = None
uinput_device = None
running = True


# -----------------------------------------------------------------------------
# Low-Level SPI Register Functions
# -----------------------------------------------------------------------------
def write_register(reg, value):
    address = (reg << 1) & 0x7E
    spi.xfer2([address, value])


def read_register(reg):
    address = ((reg << 1) & 0x7E) | 0x80
    return spi.xfer2([address, 0x00])[1]


def set_bitmask(reg, mask):
    write_register(reg, read_register(reg) | mask)


def clear_bitmask(reg, mask):
    write_register(reg, read_register(reg) & (~mask))


def reset_rc522():
    write_register(CommandReg, 0x0F)
    time.sleep(0.05)


def antenna_on():
    if (read_register(TxControlReg) & 0x03) != 0x03:
        set_bitmask(TxControlReg, 0x03)


def rc522_init():
    reset_rc522()
    write_register(TModeReg, 0x8D)
    write_register(TPrescalerReg, 0x3E)
    write_register(TReloadRegL, 30)
    write_register(TReloadRegH, 0)
    write_register(TxASKReg, 0x40)
    write_register(ModeReg, 0x3D)
    antenna_on()


def request_a():
    write_register(BitFramingReg, 0x07)
    write_register(CommandReg, PCD_Idle)
    write_register(ComIrqReg, 0x7F)
    set_bitmask(FIFOLevelReg, 0x80)
    write_register(FIFODataReg, PICC_REQIDL)
    write_register(CommandReg, PCD_Transceive)
    set_bitmask(BitFramingReg, 0x80)

    timeout = time.time() + 0.1
    while time.time() < timeout:
        irq = read_register(ComIrqReg)
        if irq & 0x30:
            break
        if irq & 0x01:
            return False

    clear_bitmask(BitFramingReg, 0x80)
    error = read_register(ErrorReg)
    if error & 0x1B:
        return False

    return read_register(FIFOLevelReg) > 0


def read_uid():
    write_register(BitFramingReg, 0x00)
    write_register(CommandReg, PCD_Idle)
    write_register(ComIrqReg, 0x7F)
    set_bitmask(FIFOLevelReg, 0x80)
    write_register(FIFODataReg, PICC_ANTICOLL)
    write_register(FIFODataReg, 0x20)
    write_register(CommandReg, PCD_Transceive)
    set_bitmask(BitFramingReg, 0x80)

    timeout = time.time() + 0.1
    while time.time() < timeout:
        irq = read_register(ComIrqReg)
        if irq & 0x30:
            break
        if irq & 0x01:
            return None

    clear_bitmask(BitFramingReg, 0x80)
    error = read_register(ErrorReg)
    if error & 0x1B:
        return None

    length = read_register(FIFOLevelReg)
    if length < 5:
        return None

    uid = []
    for _ in range(5):
        uid.append(read_register(FIFODataReg))

    # Checksum validation (BCC)
    bcc = uid[4]
    calculated_bcc = uid[0] ^ uid[1] ^ uid[2] ^ uid[3]
    if bcc != calculated_bcc:
        return None

    return uid[:4]


# -----------------------------------------------------------------------------
# Virtual Keyboard Keystroke Emulation
# -----------------------------------------------------------------------------
def init_virtual_keyboard():
    """Initializes a virtual Linux keyboard via /dev/uinput."""
    cap = {
        e.EV_KEY: [
            e.KEY_0, e.KEY_1, e.KEY_2, e.KEY_3, e.KEY_4,
            e.KEY_5, e.KEY_6, e.KEY_7, e.KEY_8, e.KEY_9,
            e.KEY_A, e.KEY_B, e.KEY_C, e.KEY_D, e.KEY_E, e.KEY_F,
            e.KEY_ENTER, e.KEY_LEFTSHIFT, e.KEY_SEMICOLON
        ]
    }
    device = UInput(cap, name="CMS-RFID-Virtual-Scanner", version=0x3)
    # Small pause to allow uinput device node creation in /dev/input/
    time.sleep(0.2)
    return device


def emit_keystrokes(ui, text):
    """Types characters one-by-one followed by Enter key."""
    for ch in text.upper():
        if ch in CHAR_KEY_MAP:
            key_code = CHAR_KEY_MAP[ch]
            ui.write(e.EV_KEY, key_code, 1)  # Key down
            ui.write(e.EV_KEY, key_code, 0)  # Key up
            ui.syn()
        elif ch == ':':
            # Colon requires Shift + Semicolon
            ui.write(e.EV_KEY, e.KEY_LEFTSHIFT, 1)
            ui.write(e.EV_KEY, e.KEY_SEMICOLON, 1)
            ui.write(e.EV_KEY, e.KEY_SEMICOLON, 0)
            ui.write(e.EV_KEY, e.KEY_LEFTSHIFT, 0)
            ui.syn()
        time.sleep(0.01)

    # Press Enter to submit the scan
    ui.write(e.EV_KEY, e.KEY_ENTER, 1)
    ui.write(e.EV_KEY, e.KEY_ENTER, 0)
    ui.syn()


# -----------------------------------------------------------------------------
# Process Lifecycle & Signal Handling
# -----------------------------------------------------------------------------
def shutdown_handler(signum, frame):
    global running
    print(f"\n[INFO] Received signal {signum}. Shutting down cleanly...")
    running = False


# -----------------------------------------------------------------------------
# Main Loop
# -----------------------------------------------------------------------------
def main():
    global spi, uinput_device, running

    signal.signal(signal.SIGINT, shutdown_handler)
    signal.signal(signal.SIGTERM, shutdown_handler)

    print("==================================================")
    print(" CMS Kiosk - RFID Virtual Keyboard Daemon")
    print("==================================================")

    # 1. Initialize SPI
    try:
        spi = spidev.SpiDev()
        spi.open(SPI_BUS, SPI_DEVICE)
        spi.max_speed_hz = SPI_SPEED
        spi.mode = 0
        rc522_init()
        version = read_register(VersionReg)
        print(f"[OK] SPI0 initialized (Bus: {SPI_BUS}, Device: {SPI_DEVICE})")
        print(f"[OK] RC522 Firmware Version: 0x{version:02X}")
    except Exception as ex:
        print(f"[FATAL] Failed to initialize SPI: {ex}")
        sys.exit(1)

    # 2. Initialize Virtual Keyboard
    try:
        uinput_device = init_virtual_keyboard()
        print("[OK] Virtual keyboard device created: 'CMS-RFID-Virtual-Scanner'")
    except Exception as ex:
        print(f"[FATAL] Failed to create virtual uinput keyboard: {ex}")
        print("       (Ensure current user has write access to /dev/uinput or run as root/input group)")
        sys.exit(1)

    print(f"[INFO] Debounce cooldown: {DEBOUNCE_COOLDOWN}s")
    print(f"[INFO] Colon format: {USE_COLON_FORMAT}")
    print("[READY] Place an RFID card on the reader...\n")

    last_uid = None
    last_scan_time = 0

    while running:
        try:
            if request_a():
                uid = read_uid()
                current_time = time.time()

                if uid:
                    if USE_COLON_FORMAT:
                        uid_string = ":".join(f"{x:02X}" for x in uid)
                    else:
                        uid_string = "".join(f"{x:02X}" for x in uid)

                    # Debounce logic: emit only if card changed or cooldown expired
                    is_new_card = (uid_string != last_uid)
                    is_past_cooldown = (current_time - last_scan_time) >= DEBOUNCE_COOLDOWN

                    if is_new_card or is_past_cooldown:
                        print(f"[{time.strftime('%X')}] [TAP] Card detected: {uid_string} -> Emitting keystrokes...")
                        emit_keystrokes(uinput_device, uid_string)
                        last_uid = uid_string
                        last_scan_time = current_time

                    time.sleep(0.5)
            else:
                # Reset card tracker once card is lifted from reader
                last_uid = None

            time.sleep(0.08)

        except Exception as ex:
            print(f"[WARN] Error in read cycle: {ex}. Re-opening SPI interface...")
            try:
                if spi:
                    try:
                        spi.close()
                    except Exception:
                        pass
                spi = spidev.SpiDev()
                spi.open(SPI_BUS, SPI_DEVICE)
                spi.max_speed_hz = SPI_SPEED
                spi.mode = 0
                rc522_init()
                print("[OK] SPI interface re-initialized successfully")
            except Exception as reinit_err:
                print(f"[ERROR] SPI re-initialization failed: {reinit_err}")
            time.sleep(1.0)

    # Clean Exit
    print("[INFO] Closing hardware interfaces...")
    if spi:
        try:
            spi.close()
        except Exception:
            pass
    if uinput_device:
        try:
            uinput_device.close()
        except Exception:
            pass
    print("[OK] Daemon stopped.")


if __name__ == "__main__":
    main()
