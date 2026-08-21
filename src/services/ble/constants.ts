import {toFullUuid} from '../../domain/device/uuid';

/** Custom vendor service tool GATT profile (16-bit UUIDs). */
export const TOOL_SERVICE_UUID = 'FFF0';
export const TELEMETRY_CHAR_UUID = 'FFF1';
export const COMMAND_CHAR_UUID = 'FFF2';
export const STATUS_CHAR_UUID = 'FFF3';

/** Device Information Service — firmware revision. */
export const DIS_SERVICE_UUID = '180A';
export const FIRMWARE_CHAR_UUID = '2A26';

export const TOOL_DEVICE_NAME_PREFIX = 'ServiceTool';
export const TOOL_DEVICE_NAME = 'ServiceTool-001';

export const FIRMWARE_VERSION = '1.2.0';
export const MIN_COMPATIBLE_FIRMWARE = '1.0.0';

export const TELEMETRY_INTERVAL_MS = 1000;

export const RECONNECT_SCAN_TIMEOUT_MS = 12000;

/** Requested ATT MTU — default BLE packets truncate JSON telemetry (~20 byte limit). */
export const BLE_REQUESTED_MTU = 512;

/** Max wait for startAdvertising() before showing a timeout error. */
export const ADVERTISING_START_TIMEOUT_MS = 120_000;

/** Full UUIDs for native BLE APIs (required on Android peripheral). */
export const TOOL_SERVICE_UUID_FULL = toFullUuid(TOOL_SERVICE_UUID);
export const TELEMETRY_CHAR_UUID_FULL = toFullUuid(TELEMETRY_CHAR_UUID);
export const COMMAND_CHAR_UUID_FULL = toFullUuid(COMMAND_CHAR_UUID);
export const STATUS_CHAR_UUID_FULL = toFullUuid(STATUS_CHAR_UUID);
export const DIS_SERVICE_UUID_FULL = toFullUuid(DIS_SERVICE_UUID);
export const FIRMWARE_CHAR_UUID_FULL = toFullUuid(FIRMWARE_CHAR_UUID);
