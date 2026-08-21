import {Buffer} from 'buffer';

/** Decode a base64 BLE characteristic value to UTF-8 text. */
export function decodeBase64ToString(base64: string): string {
  return Buffer.from(base64, 'base64').toString('utf8');
}

/** Encode UTF-8 text to base64 for BLE characteristic values. */
export function encodeStringToBase64(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64');
}

/** Strip null bytes and whitespace from decoded BLE text payloads. */
export function normalizeBleText(value: string): string {
  return value.replace(/\0/g, '').trim();
}
