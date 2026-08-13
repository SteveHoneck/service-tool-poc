# Service Tool PoC

Proof-of-concept React Native app demonstrating BLE connection management between a **client phone** and a **mock service tool** (second phone running Tool Mode).

## What this proves

- React Native can scan, connect, and manage BLE GATT connections
- Real-time telemetry streaming via notify characteristics (~1 Hz)
- Automatic reconnection with exponential backoff after disconnect
- Firmware version read from Device Information Service (DIS) with compatibility badge

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
   - Live telemetry (temperature, RPM) updates every second
   - Firmware badge shows `1.2.0 — Compatible`
3. **Reconnection test** — Toggle Bluetooth off on the Tool phone
   - Client shows **Reconnecting…** with attempt count
   - Toggle Bluetooth back on → auto-reconnects and resumes streaming

## Architecture

Single app, two modes:

| Mode | Role | Library |
|------|------|---------|
| **Client** | BLE central — scan, connect, subscribe | `react-native-ble-plx` |
| **Tool** | BLE peripheral — GATT server, notify stream | `react-native-ble-peripheral-manager` |

## GATT profile

```
Service FFF0 (vendor tool service)
  ├─ FFF1  NOTIFY  telemetry JSON { temp, rpm, status, timestamp }
  ├─ FFF2  WRITE   command (start/stop stream)
  └─ FFF3  READ    device status

Service 180A (Device Information)
  └─ 2A26  READ    firmware revision "1.2.0"
```

## Project structure

```
src/
  ble/           constants, permissions, useBleClient hook
  peripheral/    useBleTool hook (GATT server)
  connection/    reconnect backoff helper
  screens/       ModeSelect, Client, Tool
  types/         shared TypeScript types
  utils/         base64, version compare
```

## RN ecosystem feasibility

| Transport | RN support | Cross-platform | This PoC |
|-----------|-----------|----------------|----------|
| BLE GATT central | Strong (`react-native-ble-plx`) | Yes | **Built** |
| BLE GATT peripheral | Moderate (`react-native-ble-peripheral-manager`) | Yes | **Built** |
| NFC tag bootstrap | Strong (`react-native-nfc-manager`) | Yes | Backlog |
| WiFi Direct | Fragmented (Android/iOS differ) | No | Backlog |

## Backlog

- **NFC bootstrap** — NTAG213 sticker with NDEF pairing payload
- **WiFi Direct** — `react-native-wifi-p2p` (Android) / Multipeer (iOS)

## Permissions

**Android** (`AndroidManifest.xml`): `BLUETOOTH_SCAN`, `BLUETOOTH_CONNECT`, `BLUETOOTH_ADVERTISE`, `ACCESS_FINE_LOCATION` (API ≤ 30)

**iOS** (`Info.plist`): `NSBluetoothAlwaysUsageDescription`, `NSBluetoothPeripheralUsageDescription`
