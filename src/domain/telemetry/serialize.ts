import {TelemetryPayload} from '../../types';
import {encodeStringToBase64} from './base64';

/** Compact JSON keys to minimize BLE packet size. */
export function serializeTelemetry(payload: TelemetryPayload): string {
  return JSON.stringify({
    p: Math.round(payload.ppm),
    s: payload.status === 'running' ? 'run' : payload.status,
    ts: payload.timestamp,
  });
}

export function encodeTelemetryBase64(payload: TelemetryPayload): string {
  return encodeStringToBase64(serializeTelemetry(payload));
}
