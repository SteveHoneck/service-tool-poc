import {TelemetryPayload} from '../../types';
import {PPM_FULL_SCALE} from '../signals/ppm';

/** Mock leak-detector telemetry for Tool Mode. Values span 0–PPM_FULL_SCALE. */
export function generateMockTelemetry(
  random: () => number = Math.random,
  now: () => number = Date.now,
): TelemetryPayload {
  return {
    ppm: Math.round(random() * PPM_FULL_SCALE),
    status: 'running',
    timestamp: now(),
  };
}
