# ServiceToolPoC Architecture

This document defines the architecture for the React Native service-tool BLE app.

## Style: feature modules + layered MVVM

Strict MVC is a poor fit for React Native (no natural controller; UI is component-driven).
We use **four layers** with one-way dependencies:

```
Presentation (View)          features/*/screens, features/*/components
        ↓
Application (ViewModel)      features/*/hooks
        ↓
Domain (Model / rules)       domain/*
        ↓ (used by, not imported by domain)
Infrastructure (Services)  services/*
```

| Layer | Responsibility | May import |
|-------|----------------|------------|
| **Presentation** | JSX, styles, layout, formatting for display | hooks, domain types, shared UI helpers |
| **Application** | Screen-level state, orchestration, user actions | domain, services |
| **Domain** | Pure business rules: parse telemetry, reconnect policy, firmware checks, signal math, recording sessions, saved-report build | nothing external (no React, no BLE libs) |
| **Infrastructure** | IO: BLE libraries, permissions, AsyncStorage, platform APIs | domain types only |

## Folder layout

```
src/
  app/
    App.tsx                         # shell, mode routing; keeps Client mounted under overlays

  features/
    client/
      screens/                      # ClientScreen, SettingsScreen
      hooks/                        # useBleClient, useRecordingSession
      components/                   # LivePpmLevelBar
    tool/
      screens/
      hooks/                        # useBleTool
    mode-select/
      screens/
    report/
      screens/                      # CreateReport, ReportsList, ReportStub
      hooks/                        # useSavedReports
    shared/                         # BackLink (UI used by multiple features)

  domain/
    telemetry/                      # serialize, parse, TelemetryPayload rules
    connection/                     # reconnect backoff policy (pure)
    device/                         # UUID helpers, firmware compatibility
    signals/                        # RSSI → strength, PPM math
    session/                        # recording capture / gaps (pure)
    report/                         # buildSavedReport, list label (pure)

  services/
    ble/
      BleCentralService.ts          # wraps react-native-ble-plx
      BlePeripheralService.ts       # wraps react-native-ble-peripheral-manager
      scan.ts
      permissions.ts
      constants.ts                  # GATT UUIDs, timeouts (shared contract)
    storage/
      deviceStorage.ts              # last connected device id
      reportStorage.ts              # AsyncStorage saved-report list

  types/                            # cross-cutting TypeScript interfaces
```

Tests mirror source:

```
__tests__/
  app/
  domain/
  services/
  features/
  regressions/
```

## Dependency rules (mandatory)

1. **`domain/`** must not import `react`, `react-native`, `react-native-ble-plx`, or `react-native-ble-peripheral-manager`.
2. **`services/`** wraps third-party libs; exposes small async APIs to hooks. No JSX.
3. **`features/*/hooks/`** are ViewModels: compose domain + services; expose `{ state, actions }`.
4. **`features/*/screens/`** must not import BLE libraries directly. No `BleManager` in screens.
5. **No cross-feature imports** — e.g. `features/tool/` must not import from `features/client/`.
6. Shared UI math/display helpers used by multiple features live in `domain/` (if pure) or `features/shared/` (if UI-specific).
7. **`app/App.tsx`** is the router. Features do not import each other; App composes client, tool, mode-select, and report screens.

## App routing

Mode Select, Client, and Tool are modes. Settings, Reports, the report stub, and Create Report are **overlays**: Client stays mounted (hidden) so BLE does not drop.

- Settings stack Back is linear: report stub → Reports list → Settings → Client.
- Create Report is a separate entry from **Stop Recording**. **Save Report** navigates to Reports; **Back** without Save discards the capture.

## BLE-specific conventions

- **GATT UUIDs and timeouts** live in `services/ble/constants.ts` (infrastructure contract).
- **Wire format** (compact JSON `{p,s,ts}`, `p` = ppm, `s` = status, `ts` = sample time) is defined and tested in `domain/telemetry/`.
- **Central vs peripheral** code never mixes in one file; two service classes, two feature hooks.
- **Reconnect flow**: domain defines policy (`withReconnect`, delays); services implement scan/connect; hook wires UI state.

## Testing strategy

| Layer | Test type | Mocking |
|-------|-----------|---------|
| `domain/` | Unit tests, no mocks | none |
| `services/` | Unit tests with mocked native modules | BLE libs |
| `app/` | RNTL navigation / overlay tests (Settings, Create Report, Save) | hooks / storage |
| `features/*/hooks/` | Hook tests optional; prefer testing via domain + services | services |
| `features/*/screens/` | RNTL smoke / interaction tests | hooks |
| `regressions/` | Session bug regressions (UUID, MTU, encoding, reconnect) | minimal |

## References

- Cursor rules: `.cursor/rules/architecture.mdc`, `.cursor/rules/ble-services.mdc`
- Demo script and GATT profile: `README.md`
- Two-phone manual tests: `docs/MANUAL_TESTS.md`
