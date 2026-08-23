import {TelemetryPayload} from '../../types';
import {
  decodeBase64ToString,
  encodeStringToBase64,
  normalizeBleText,
} from './base64';

function statusFromWire(value: unknown): string {
  if (value === 'run') {
    return 'running';
  }
  return typeof value === 'string' ? value : 'unknown';
}

function tryParseTelemetryJson(text: string): TelemetryPayload | null {
  const parsed = JSON.parse(text) as Record<string, unknown>;

  if (typeof parsed.p === 'number') {
    return {
      ppm: Math.round(parsed.p),
      status: statusFromWire(parsed.s),
      timestamp: typeof parsed.ts === 'number' ? parsed.ts : Date.now(),
    };
  }

  if (typeof parsed.ppm === 'number') {
    return {
      ppm: Math.round(parsed.ppm),
      status: statusFromWire(parsed.status ?? parsed.s),
      timestamp:
        typeof parsed.timestamp === 'number'
          ? parsed.timestamp
          : typeof parsed.ts === 'number'
            ? parsed.ts
            : Date.now(),
    };
  }

  return null;
}

export function parseTelemetryBase64(base64Value: string): TelemetryPayload {
  const candidates: string[] = [];

  try {
    candidates.push(normalizeBleText(decodeBase64ToString(base64Value)));
  } catch {
    // Fall through to error below.
  }

  const first = candidates[0];
  if (first && /^[A-Za-z0-9+/=]+$/.test(first)) {
    try {
      candidates.push(normalizeBleText(decodeBase64ToString(first)));
    } catch {
      // Ignore double-decode failures.
    }
  }

  for (const candidate of candidates) {
    try {
      if (!candidate.startsWith('{')) {
        continue;
      }
      const parsed = tryParseTelemetryJson(candidate);
      if (parsed) {
        return parsed;
      }
    } catch {
      // Try next candidate.
    }
  }

  const preview = candidates[0]?.slice(0, 48) ?? base64Value.slice(0, 48);
  throw new Error(`Invalid telemetry payload (payload: ${preview})`);
}

export {encodeStringToBase64} from './base64';
