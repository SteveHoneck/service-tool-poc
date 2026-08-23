# Service Tool PoC

Proof-of-concept React Native app demonstrating BLE connection management between a **client phone** and a **mock service tool** (second phone running Tool Mode).

## What this proves

- React Native can scan, connect, and manage BLE GATT connections
- Real-time telemetry streaming via notify characteristics (~1 Hz)
- Automatic reconnection with exponential backoff after disconnect
- Firmware version read from Device Information Service (DIS) with compatibility badge
- Record a PPM session, enter Create Report (job, operator, last/MAX PPM), and **Save Report** to a local list
- Settings stack (gear → Settings → Reports) without dropping the BLE connection

## Quick start

```bash
npm install
npx react-native run-android
```

Requires a physical Android device with USB debugging enabled. BLE does not work on emulators.

## Usage (two phones)

1. **Phone 1 (Tool Mode)** — Open app → **Tool Mode** → **Start Advertising**
   - Device advertises as `ServiceTool-001`
2. **Phone 2 (Client Mode)** — Open app → **Client Mode** → **Scan for Tools** → tap **Connect**
   - Live PPM updates every second
   - Firmware badge shows `1.2.0 — Compatible`
   - **Record** → **Stop Recording** opens **Create Report** (sample count, last PPM, MAX, job name, operator)
   - **Save Report** writes the session and opens the **Reports** list; **Back** without Save discards
   - Gear → **Settings** → **Reports** shows the same list; tap a saved row for **Report Details** (job name, operator, notes, last/max reading, session graph)
   - Back walks details → Reports → Settings → Client (BLE stays up)
3. **Reconnection test** — Toggle Bluetooth off on the Tool phone
   - Client shows **Reconnecting…** with attempt count
   - Toggle Bluetooth back on, restart App in Tool mode, **Start Advertising** → auto-reconnects and resumes streaming

   ---OR - if you feel like going for a walk---
    - Walk away from Tool device until Client shows **Signal Strength: Very weak** and disconnects, then walk back to Tool device → auto-reconnects and resumes streaming

**Full two-phone checklist:** [`docs/MANUAL_TESTS.md`](docs/MANUAL_TESTS.md)

## Architecture

Single app, two modes — implemented with **feature modules + layered MVVM** (not classic MVC):

| Mode | Role | Library |
|------|------|---------|
| **Client** | BLE central — scan, connect, subscribe | `react-native-ble-plx` |
| **Tool** | BLE peripheral — GATT server, notify stream | `react-native-ble-peripheral-manager` |

### Code layers

| Layer | Folder | Responsibility |
|-------|--------|----------------|
| **Presentation** | `features/*/screens`, `components` | UI, styles, display formatting |
| **Application** | `features/*/hooks` | Screen state, orchestration |
| **Domain** | `domain/` | Pure rules: telemetry parse, reconnect policy, signal math, recording, saved reports |
| **Infrastructure** | `services/` | BLE adapters, permissions, storage |

**Full specification:** [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

**Agent / editor rules:** [`.cursor/rules/architecture.mdc`](.cursor/rules/architecture.mdc), [`.cursor/rules/ble-services.mdc`](.cursor/rules/ble-services.mdc)

## GATT profile

```
Service FFF0 (vendor tool service)
  ├─ FFF1  NOTIFY  telemetry JSON { p, s, ts }  (p = ppm, s = status, ts = sample time)
  ├─ FFF2  WRITE   command (start/stop stream)
  └─ FFF3  READ    device status

Service 180A (Device Information)
  └─ 2A26  READ    firmware revision "1.2.0"
```

## Project structure

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for layer rules.

```
src/
  app/                    App shell, mode routing (Client stays mounted under overlays)
  features/
    client/               Client Mode, Settings, recording orchestration
    tool/                 Tool Mode screens, hooks
    mode-select/          Mode picker screen
    report/               Create Report, Reports list, report details, session chart
    shared/               Shared UI (BackLink)
  domain/
    telemetry/            Parse/serialize, wire format
    connection/           Reconnect backoff policy
    device/               UUID helpers, firmware compatibility
    signals/              RSSI → strength, PPM math
    session/              Recording capture / gaps
    report/               Build saved report, list label, last PPM, plot points
  services/
    ble/                  Central/peripheral adapters, scan, constants
    storage/              Last device id, saved-report list
  types/                  Shared TypeScript interfaces

__tests__/                Mirrors domain/, services/, features/, app/
docs/
  ARCHITECTURE.md         Layer rules, folder layout, dependencies
  MANUAL_TESTS.md         Two-phone manual test checklist
.cursor/rules/            Cursor agent enforcement rules
```

## RN ecosystem feasibility

| Transport | RN support | Cross-platform | This PoC |
|-----------|-----------|----------------|----------|
| BLE GATT central | Strong (`react-native-ble-plx`) | Yes | **Built** |
| BLE GATT peripheral | Moderate (`react-native-ble-peripheral-manager`) | Yes | **Built** |
| NFC tag bootstrap | Strong (`react-native-nfc-manager`) | Yes | Backlog |
| WiFi Direct | Fragmented (Android/iOS differ) | No | Backlog |

## Backlog

- **PDF** — basic PDF + share sheet from a saved report (not mailto attachment)
- **Settings stretch** — instrument name, Disconnect, firmware OTA, location, sound
- **NFC bootstrap** — NTAG213 sticker with NDEF pairing payload
- **WiFi Direct** — `react-native-wifi-p2p` (Android) / Multipeer (iOS)

## Permissions

**Android** (`AndroidManifest.xml`): `BLUETOOTH_SCAN`, `BLUETOOTH_CONNECT`, `BLUETOOTH_ADVERTISE`, `ACCESS_FINE_LOCATION` (API ≤ 30)

**iOS** (`Info.plist`): `NSBluetoothAlwaysUsageDescription`, `NSBluetoothPeripheralUsageDescription`

## Development

```bash
npm test                  # Jest — domain, services, regressions
npm run lint
```

When adding or moving code, follow the layer rules in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). BLE library imports belong only in `services/ble/`.
