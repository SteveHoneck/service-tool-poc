# Manual tests

Canonical two-phone checklist for ServiceToolPoC. Jest covers domain and services; these scenarios cover what only physical BLE hardware can prove.

**Do not rebuild this file from chat history.** Update it in place: add, replace, or retire a scenario by stable `id`. `/sync-manual-tests` is for catch-up when a chat forgot.

## Hardware

- Two physical Android phones (BLE does not work on emulators).
- Typical pair: **Tool** = Galaxy S22, **Client** = Pixel 9.
- Same APK on both. USB debugging on for install; demo itself is wireless BLE.

## Status

| Status | Meaning |
|--------|---------|
| `current` | Expected to pass on `main` |
| `feature/<branch>` | Implemented on that branch; not on `main` yet |
| `planned` | Specified (plan or chat) but not built — do not fail a `main` demo on these |

When a feature branch merges, promote those ids to `current` and retire checks the new UI replaced.

## Shared setup

1. Install the app on both phones (`npx react-native run-android` on each, or `adb install`).
2. Grant Bluetooth (and location, if prompted) on first **Scan** / **Start Advertising**.
3. Tool phone: **Tool Mode** → **Start Advertising** → name `ServiceTool-001`, status **Advertising**.
4. Client phone: **Client Mode**.

Turning Bluetooth off on the Tool phone usually kills the peripheral. After BT comes back: reopen the app → **Tool Mode** → **Start Advertising** again.

---

## Mode select and permissions

### `mode-select`

| | |
|---|---|
| **Status** | `current` |
| **Steps** | Launch app. Tap **Client Mode**, then **← Back**. Tap **Tool Mode**, then **← Back**. |
| **Pass** | Mode picker shows both cards. Each mode opens its screen and Back returns to the picker. |
| **Source** | `README.md`, ModeSelect screen |

### `permissions-first-run`

| | |
|---|---|
| **Status** | `current` |
| **Steps** | Fresh install (or revoke BT/location). Tool: **Start Advertising**. Client: **Scan for Tools**. |
| **Pass** | OS permission prompts appear; after Allow, Tool advertises and Client can scan. Deny → scan/advertise fails with an error, not a silent hang. |
| **Source** | `README.md` Permissions, `services/ble/permissions.ts` |

---

## Tool advertising

### `tool-advertise`

| | |
|---|---|
| **Status** | `current` |
| **Setup** | Tool Mode |
| **Steps** | **Start Advertising**. Confirm device name. **Stop Advertising**, then start again. |
| **Pass** | Name is `ServiceTool-001`. Status **Advertising**. Stop returns to Idle and the start button returns. |
| **Source** | `README.md` Usage, Tool screen |

---

## Client scan, connect, stream

### `client-scan-connect-stream`

| | |
|---|---|
| **Status** | `current` |
| **Setup** | Tool advertising |
| **Steps** | Client: **Scan for Tools**. Tap **Connect** on `ServiceTool-001`. |
| **Pass** | Scan lists `ServiceTool-*`. After connect: **Streaming**; live telemetry updates ~1 Hz; Tool shows **Connected centrals: 1** and last telemetry sent. Client firmware badge `Firmware 1.2.0 — Compatible`. |
| **Source** | `README.md` Usage; [App & Arch explanation](9c16588d-d6df-4bfc-b72a-066966b693e8) |

On `main`, live values are **temperature °C** and **RPM**. On `feature/main_screen_ui`, this screen is Live PPM (see `main-ppm-live`).

### `client-disconnect`

| | |
|---|---|
| **Status** | `current` |
| **Steps** | While streaming, tap **Disconnect** on the Client. |
| **Pass** | Client returns to idle/scan. Tool centrals drop to 0. **Reconnect Last Device** is available. |
| **Source** | Client screen; [1: Main PPM](4951f28d-5e43-4f83-bcfc-d4658557e7e2) (explicit hang-up vs BLE drop) |

### `reconnect-last-device`

| | |
|---|---|
| **Status** | `current` |
| **Steps** | After a successful connect + Disconnect (or after reconnect exhausted): Tool advertising again. Client: **Reconnect Last Device** (do not pick from the scan list). |
| **Pass** | Reconnects to the last tool and resumes **Streaming** without a fresh scan tap. |
| **Source** | Client screen; [App & Arch explanation](9c16588d-d6df-4bfc-b72a-066966b693e8) |

---

## Reconnect

Backoff is 6 attempts (`MAX_RECONNECT_ATTEMPTS`). UI must say `Attempt n of 6`, never a hardcoded `of 4`.

### `reconnect-bt-off`

| | |
|---|---|
| **Status** | `current` |
| **Setup** | Streaming |
| **Steps** | Keep Client streaming. On Tool, turn **Bluetooth off**. Client should show **Reconnecting…** with attempt count. Turn BT **on** on Tool, reopen app → Tool Mode → **Start Advertising**. |
| **Pass** | Client: Streaming → Reconnecting… (`Attempt n of 6`) → Streaming, **without** tapping Connect. Telemetry resumes. Tool centrals return to 1. |
| **Source** | `README.md` Reconnection test; plan 3-step demo; [App & Arch explanation](9c16588d-d6df-4bfc-b72a-066966b693e8) |

### `reconnect-walk-away`

| | |
|---|---|
| **Status** | `current` |
| **Setup** | Streaming |
| **Steps** | Walk Client away until **Signal Strength: Very weak** then disconnect. Walk back. |
| **Pass** | Auto-reconnects and resumes streaming (same as BT-off, without toggling Bluetooth). Tool may still need **Start Advertising** if the OS dropped the peripheral. |
| **Source** | `README.md` Usage |

### `reconnect-exhausted`

| | |
|---|---|
| **Status** | `current` |
| **Setup** | Streaming |
| **Steps** | Turn Tool Bluetooth **off** and leave it off through all retries. |
| **Pass** | Attempts count up to 6 (`Attempt 6 of 6`), then failure. Error tells you to start advertising on the tool and use **Reconnect Last Device**. No `n of 4` and no `5 of 4`. |
| **Source** | [Reconnect retry count UI](68a2782b-98ad-48af-851a-00905d5d0fee); `useBleClient` failure copy |

---

## Signal and firmware

### `signal-strength`

| | |
|---|---|
| **Status** | `current` |
| **Steps** | While streaming, move phones together then apart. |
| **Pass** | Client **Signal Strength** moves among Strong / Normal / Weak / Very weak (UI uses lowercase **w** on weak). Weak/Very weak cards highlight. Scan list also shows signal per device. |
| **Source** | Client screen; `domain/signals/signalStrength.ts` |

### `firmware-badge`

| | |
|---|---|
| **Status** | `current` |
| **Steps** | Connect until streaming. |
| **Pass** | Badge `Firmware 1.2.0 — Compatible` (DIS `2A26`). |
| **Source** | `README.md`; plan firmware badge |

OTA / incompatible-version UI is backlog — not a `current` case.

---

## Main PPM (`feature/main_screen_ui`)

These replace temp/RPM on Client Mode. Run on that branch, not `main`.

### `main-ppm-live`

| | |
|---|---|
| **Status** | `feature/main_screen_ui` |
| **Steps** | Tool advertise → Client connect. |
| **Pass** | **Live PPM** updates ~1 Hz. **MAX** only rises during the connection (resets after a full telemetry drop). Level bar fills (full scale 500 ppm). Tool last-sent shows **N ppm**, not temp/RPM. Mock leak **pulses**: climb ~6–8 s from a low (~8–60) toward a high (~180–500), then snap to a new low. |
| **Source** | [1: Main PPM](4951f28d-5e43-4f83-bcfc-d4658557e7e2) A + mock pulse |

### `main-ppm-record-toggle`

| | |
|---|---|
| **Status** | `feature/main_screen_ui` |
| **Steps** | 1. Connect until PPM is live → **Record** enabled. 2. Tap **Record** → **Stop Recording**; tap again → **Record**. 3. Before streaming, Record is visible but not tappable. 4. **BLE off / walk-away / auto-reconnect** while on Stop Recording → button **stays Stop Recording**. 5. Tap **Disconnect** while on Stop Recording → button hides; later reconnect shows **Record**. |
| **Pass** | All five. BLE-drop must not clear the toggle (reconnect still counts as connected). Explicit Disconnect is a hang-up. |
| **Source** | [1: Main PPM](4951f28d-5e43-4f83-bcfc-d4658557e7e2) B |

### `main-ppm-record-log`

| | |
|---|---|
| **Status** | `feature/main_screen_ui` |
| **Steps** | 1. Stream, tap **Record** — sample count shows **1 sample**, then climbs ~1 Hz. 2. **Stop Recording** — count holds while PPM keeps updating. 3. **Record** again — count resets to **1 sample**. 4. Optional: Record, Tool BLE off, then on — count freezes, stays **Stop Recording**, then climbs on the **same** log. |
| **Pass** | Samples use tool `ts`, not client receive time. No fake 0 ppm during the gap. |
| **Source** | [1: Main PPM](4951f28d-5e43-4f83-bcfc-d4658557e7e2) C |

### `main-ppm-stop-create-report`

| | |
|---|---|
| **Status** | `feature/main_screen_ui` |
| **Steps** | 1. Record a few samples. 2. **Stop Recording** → **Create Report** stub with **N samples captured**. 3. **Back** — still connected, button **Record**, no leftover count. 4. Record/Stop again — new count, not the previous session. |
| **Pass** | BLE stays up across the stub (Client mounted in background). Stop ends capture and navigates; it does not persist a report yet. |
| **Source** | [1: Main PPM](4951f28d-5e43-4f83-bcfc-d4658557e7e2) D |

---

## Planned (do not run as current)

### `main-ppm-ble-drop-session` (Phase 6 E)

| | |
|---|---|
| **Status** | `planned` |
| **When built** | After D. Distinct from C’s thin “no samples while disconnected”. |
| **Pass (target)** | Mid-record BLE drop: banner `Connection lost — Reconnecting… (attempt n/4)` is **wrong** — must use real max (6). PPM frozen at last value. Logging paused; optional gap `{ type: 'disconnect', at }`. Reconnect → same session resumes, still **Stop Recording**. Exhausted → prompt save partial vs keep trying. **Stop** during reconnect → Create Report with samples until drop. Do **not** auto-navigate, auto-stop, append 0 ppm, or start a new session on reconnect. Disconnect **before** Record = existing reconnect UI only. |
| **Source** | Plan “Disconnect while on Main screen”; [1: Main PPM](4951f28d-5e43-4f83-bcfc-d4658557e7e2) |

### `create-report-save-list-pdf`

| | |
|---|---|
| **Status** | `planned` |
| **Pass (target)** | Create Report step 1: job name, operator, session PPM. **Save Report** → Reports list (via Settings). **Email PDF Report** → basic PDF + share sheet (not mailto attachment). Record disabled until streaming. |
| **Source** | Plan Phase 6 |

### `client-disconnect-while-recording`

| | |
|---|---|
| **Status** | `planned` (UX undecided) |
| **Notes** | Operator taps **Disconnect** while **Stop Recording**. Options A–D in the plan. **Not** the same as BLE-drop E. Do not implement or test as if decided. |
| **Source** | Plan backlog open question |

### Backlog transports (not Phase 6)

NFC tap-to-pair, WiFi Direct / Multipeer, iOS two-phone demo, firmware OTA, Flag Event, full 14-page INFICON PDF. Keep out of this list until scoped.

---

## Happy-path demo (`current` on `main`)

1. `tool-advertise`
2. `client-scan-connect-stream`
3. `reconnect-bt-off` **or** `reconnect-walk-away`

On `feature/main_screen_ui`, insert `main-ppm-live` → `main-ppm-record-toggle` → `main-ppm-record-log` → `main-ppm-stop-create-report` after connect, then reconnect.

---

## What not to add

One-off debug (UUID mismatch rebuild, double-base64, MTU truncation, Metro `--reset-cache`) stays in Jest regressions / chat. Promote to this file only if it is a **durable two-phone** scenario an operator should repeat after the bug is fixed.
