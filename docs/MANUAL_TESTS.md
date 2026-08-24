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
| **Pass** | Scan lists `ServiceTool-*`. After connect: **Streaming**; live **PPM** updates ~1 Hz (see `main-ppm-live`); Tool shows **Connected centrals: 1** and last telemetry sent. Client firmware badge `Firmware 1.2.0 — Compatible`. |
| **Source** | `README.md` Usage; [App & Arch explanation](9c16588d-d6df-4bfc-b72a-066966b693e8) |

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

### `client-stale-scan-after-drop`

| | |
|---|---|
| **Status** | `current` |
| **Setup** | Streaming, **not** recording. |
| **Steps** | Turn Tool Bluetooth **off** and leave it off through all retries. |
| **Pass** | Connection card, **Scan for Tools**, and **Reconnect Last Device**. No leftover **ServiceTool-001** / **Signal Strength: Strong** / **Connect** row (tool BLE is off). Same leftover row must not appear after **Keep trying** while recording. |
| **Source** | [1: Main PPM](4951f28d-5e43-4f83-bcfc-d4658557e7e2) leftover scan results after drop |

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

## Main PPM

Live PPM on Client Mode.

### `main-ppm-live`

| | |
|---|---|
| **Status** | `current` |
| **Steps** | Tool advertise → Client connect. |
| **Pass** | **Live PPM** updates ~1 Hz. **MAX** only rises during the connection (resets after a full telemetry drop). Level bar fills (full scale 500 ppm). Tool last-sent shows **N ppm**. Mock leak **pulses**: climb ~6–8 s from a low (~8–60) toward a high (~180–500), then snap to a new low. |
| **Source** | [1: Main PPM](4951f28d-5e43-4f83-bcfc-d4658557e7e2) A + mock pulse |

### `main-ppm-record-toggle`

| | |
|---|---|
| **Status** | `current` |
| **Steps** | 1. Idle / scanning: **Record** is not on screen. 2. Connect until PPM is live → **Record** appears, enabled. 3. Tap **Record** → **Stop Recording**. 4. Tap **Stop Recording** → **Create Report** (does **not** toggle back to Record). 5. While the button still reads **Stop Recording** (do not tap it): **BLE off / walk-away / auto-reconnect** → stays **Stop Recording**. 6. Same, but tap **Disconnect** → button hides; later reconnect shows **Record**. |
| **Pass** | Record only after connect/stream. Stop Recording always leaves Client Mode for Create Report. BLE-drop does not clear an in-progress recording. Explicit Disconnect is a hang-up. |
| **Source** | [1: Main PPM](4951f28d-5e43-4f83-bcfc-d4658557e7e2) B/D (device-checked) |

### `main-ppm-record-log`

| | |
|---|---|
| **Status** | `current` |
| **Steps** | 1. Stream, tap **Record** — sample count shows **1 sample**, then climbs ~1 Hz while PPM keeps updating. 2. Optional: leave it on **Stop Recording**, turn Tool BLE off, then on — count freezes, button stays **Stop Recording**, then climbs on the **same** log. 3. Do **not** expect to tap **Record** again on this screen: **Stop Recording** goes to Create Report. New log = Back from Create Report, then **Record** (see `main-ppm-stop-create-report`). |
| **Pass** | Samples use tool `ts`, not client receive time. No fake 0 ppm during the gap. Count is only on Client Mode while recording. |
| **Source** | [1: Main PPM](4951f28d-5e43-4f83-bcfc-d4658557e7e2) C/D (device-checked) |

### `main-ppm-stop-create-report`

| | |
|---|---|
| **Status** | `current` |
| **Steps** | 1. Record a few samples. 2. **Stop Recording** → **Create Report** with **N samples captured**. Do **not** tap **Save Report**. 3. **Back** — still connected, button **Record**, no leftover count. 4. Record/Stop again — new count, not the previous session. |
| **Pass** | BLE stays up (Client mounted in background). Stop ends capture and navigates; **Back** without Save does not persist a report. |
| **Source** | [1: Main PPM](4951f28d-5e43-4f83-bcfc-d4658557e7e2) D |

### `main-ppm-reconnect-fail-keep-trying`

| | |
|---|---|
| **Status** | `current` |
| **Setup** | Streaming, **Record** already tapped (**Stop Recording** showing). |
| **Steps** | 1. Turn Tool Bluetooth **off** and leave it off through all retries. 2. Alert **Could not reconnect** / **Save partial report or keep trying?** → **Keep trying**. 3. Tool: BT on → Tool Mode → **Start Advertising**. 4. Client: **Reconnect Last Device** (do not tap Connect on a scan row). |
| **Pass** | After Keep trying: still on Client Mode, **Stop Recording** stays, sample count unchanged. After Reconnect Last Device: streaming resumes and the **same** recording continues (count climbs, still **Stop Recording**). |
| **Source** | [1: Main PPM](4951f28d-5e43-4f83-bcfc-d4658557e7e2) E |

### `main-ppm-reconnect-fail-save-partial`

| | |
|---|---|
| **Status** | `current` |
| **Setup** | Streaming, **Record** already tapped (**Stop Recording** showing). |
| **Steps** | 1. Turn Tool Bluetooth **off** and leave it off through all retries. 2. Alert **Could not reconnect** / **Save partial report or keep trying?** → **Save partial report**. |
| **Pass** | Create Report opens with the captured sample count and **Connection lost during session**. |
| **Source** | [1: Main PPM](4951f28d-5e43-4f83-bcfc-d4658557e7e2) E |

### `main-ppm-ble-drop-session`

| | |
|---|---|
| **Status** | `current` |
| **Setup** | Streaming, **Record** already tapped (**Stop Recording** showing). |
| **Steps** | 1. Turn Tool Bluetooth **off**. Watch Client while it shows **Reconnecting…**. 2. Do **not** tap Stop. Turn BT **on**, Tool Mode → **Start Advertising**, wait for auto-reconnect. |
| **Pass** | Last **PPM** and **MAX** stay on screen (no **Waiting for notify stream…**). Sample count frozen until reconnect, then the **same** log continues; still **Stop Recording**. Attempt count is `n of 6` (never `of 4`). Does **not** auto-navigate to Create Report, auto-stop, append 0 ppm, or start a new session. |
| **Source** | [1: Main PPM](4951f28d-5e43-4f83-bcfc-d4658557e7e2) E; plan “Disconnect while on Main screen” |

### `main-ppm-stop-while-dropped`

| | |
|---|---|
| **Status** | `current` |
| **Setup** | Streaming, **Record** already tapped (**Stop Recording** showing). |
| **Steps** | Turn Tool Bluetooth **off**. While Client is **Reconnecting…** (or after **Keep trying**, still dropped): tap **Stop Recording**. Do not use **Save partial report** on the alert. |
| **Pass** | Create Report opens with samples captured until the drop and **Connection lost during session**. |
| **Source** | [1: Main PPM](4951f28d-5e43-4f83-bcfc-d4658557e7e2) E |

### `main-ppm-stop-after-reconnect`

| | |
|---|---|
| **Status** | `current` |
| **Setup** | Streaming, **Record** already tapped (**Stop Recording** showing). |
| **Steps** | Turn Tool Bluetooth **off**, then on → Tool Mode → **Start Advertising**. Wait until live **PPM** is updating again. Tap **Stop Recording**. |
| **Pass** | Create Report opens with the captured samples and **does not** show **Connection lost during session**. |
| **Source** | [1: Main PPM](4951f28d-5e43-4f83-bcfc-d4658557e7e2) E |

---

## Settings

### `settings-from-main-gear`

| | |
|---|---|
| **Status** | `current` |
| **Setup** | Client Mode. Optional: streaming. |
| **Steps** | Tap the **⚙** gear. Confirm **Settings**. Tap **Back**. |
| **Pass** | Gear opens Settings. Back returns to Client Mode (not Mode Select). If you were streaming, live PPM is still updating — BLE did not drop. |
| **Source** | [Settings screen feature branch](fe8505e7-d9fc-41ab-895a-950d083b2b76) |

### `settings-to-reports-list`

| | |
|---|---|
| **Status** | `current` |
| **Setup** | Client Mode. Optional: streaming. No saved reports. |
| **Steps** | Gear → **Settings** → **Reports**. Confirm **Reports** list and **No saved reports yet**. There is **no** Untitled placeholder row. Tap **Back**. |
| **Pass** | Reports list opens from Settings. Empty copy only. Back returns to **Settings** (not Main). If you were streaming, BLE did not drop. |
| **Source** | Create Report Step 1; [Settings screen feature branch](fe8505e7-d9fc-41ab-895a-950d083b2b76) |

### `create-report-save-list`

| | |
|---|---|
| **Status** | `current` |
| **Setup** | Tool advertising. Client streaming. |
| **Steps** | 1. **Record** a few samples. 2. **Stop Recording** → Create Report. Confirm sample count, last PPM, MAX, and job name / operator fields. 3. Enter a job name (e.g. Leak check) and operator. 4. **Save Report**. Confirm the Reports list shows that job name (no placeholder). 5. **Back** → Settings. Open **Reports** again — same row. |
| **Pass** | Save lands on Reports with the named row. Settings → Reports shows the same row. Back from the list is Settings. If you were streaming, live PPM is still updating — BLE did not drop. |
| **Source** | [3: Create report step 1](21efc521-cc08-47d7-a2a4-50dbdccf146e); main #4 |

### `reports-list-to-report-details`

| | |
|---|---|
| **Status** | `current` |
| **Setup** | Client Mode. A report already saved (`create-report-save-list`). Optional: streaming. Native rebuild after adding `react-native-svg`. |
| **Steps** | Gear → Settings → Reports → tap the saved job name (or **Untitled report** if the job name was blank). Confirm title **Report Details**, **Job name**, **Operator**, **Notes** (`-` or **Connection lost during session**), **Last reading**, **Max. reading**, and a session graph with **PPM** / **Time (s)** axis labels, drawn X and Y axes, Y low/mid/high ticks, and X 0 / mid / end seconds. Tap **Back**. |
| **Pass** | Details open from the **saved** row with those labeled fields (and the connection-lost note when relevant) plus X/Y axes and axis labels on the graph. Back returns to **Reports** (not Settings). If you were streaming, BLE did not drop. |
| **Source** | Report details screen; main #5 |

### `create-report-save-list-pdf`

| | |
|---|---|
| **Status** | `feature/pdf_report` |
| **Setup** | Client Mode. A report already saved (`create-report-save-list`). Optional: streaming. Native rebuild after adding `react-native-html-to-pdf` and `react-native-share`. |
| **Steps** | 1. Gear → Settings → Reports → tap the saved row → **Report Details**. 2. Scroll to **Share PDF** and tap it. 3. Confirm the OS share sheet (not a mailto compose). **Print** is a valid target. 4. Open or print the PDF: job name (or **Untitled report**), operator, notes, last/MAX PPM, Started/Ended as local times, sample count, and a session graph with **PPM** left of the Y-axis and **Time (s)** below the X-axis. 5. Dismiss the sheet. **Back** to Reports. |
| **Pass** | Share PDF is only on Report Details (not Settings, not Create Report). Sheet opens with a PDF. Cancel/dismiss does not crash. Back returns to **Reports**. If you were streaming, BLE did not drop. Gmail failing to attach a cache file is out of scope. |
| **Source** | Plan Phase 6 PDF; [PDF report branch](b353c0b8-0f94-4c37-b818-16f865654360) |

---

## Planned (do not run as current)

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
3. `main-ppm-live` → `main-ppm-record-toggle` → `main-ppm-record-log` → `main-ppm-ble-drop-session` → `main-ppm-stop-create-report`
4. `reconnect-bt-off` **or** `reconnect-walk-away`, then `client-stale-scan-after-drop` (not recording)
5. `settings-from-main-gear` → `settings-to-reports-list` (empty, no placeholder)
6. `create-report-save-list` → `reports-list-to-report-details` → `create-report-save-list-pdf` (`feature/pdf_report` until merge)

Exhausted while recording: `main-ppm-reconnect-fail-keep-trying` **or** `main-ppm-reconnect-fail-save-partial`; also `main-ppm-stop-while-dropped` and `main-ppm-stop-after-reconnect`.

---

## What not to add

One-off debug (UUID mismatch rebuild, double-base64, MTU truncation, Metro `--reset-cache`) stays in Jest regressions / chat. Promote to this file only if it is a **durable two-phone** scenario an operator should repeat after the bug is fixed.
