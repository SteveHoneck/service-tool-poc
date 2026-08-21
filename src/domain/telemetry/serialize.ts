import {TelemetryPayload} from '../../types';
import {encodeStringToBase64} from './base64';

/** Compact JSON keys to minimize BLE packet size. */
export function serializeTelemetry(payload: TelemetryPayload): string {
  return JSON.stringify({
    t: payload.temp,
    r: Math.round(payload.rpm),
    s: payload.status === 'running' ? 'run' : payload.status,
  });
}

export function encodeTelemetryBase64(payload: TelemetryPayload): string {
  return encodeStringToBase64(serializeTelemetry(payload));
}
