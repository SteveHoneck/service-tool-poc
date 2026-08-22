import {TelemetryPayload} from '../../types';
import {PPM_FULL_SCALE} from '../signals/ppm';

/** Background / baseline leak reading. */
export const MOCK_PPM_LOW_MIN = 8;
export const MOCK_PPM_LOW_MAX = 60;

/** Peak of a simulated leak pulse. */
export const MOCK_PPM_HIGH_MIN = 180;
export const MOCK_PPM_HIGH_MAX = PPM_FULL_SCALE;

/** Ticks (1 Hz) to climb from low to high. */
export const MOCK_PPM_RISE_STEPS_MIN = 6;
export const MOCK_PPM_RISE_STEPS_MAX = 8;

export interface MockPpmPulseState {
  ppm: number;
  low: number;
  high: number;
  riseStep: number;
}

function pickInt(min: number, max: number, random: () => number): number {
  return Math.round(min + random() * (max - min));
}

function startPulse(random: () => number): MockPpmPulseState {
  const low = pickInt(MOCK_PPM_LOW_MIN, MOCK_PPM_LOW_MAX, random);
  let high = pickInt(MOCK_PPM_HIGH_MIN, MOCK_PPM_HIGH_MAX, random);
  if (high <= low) {
    high = Math.min(MOCK_PPM_HIGH_MAX, low + MOCK_PPM_HIGH_MIN);
  }
  const steps = pickInt(
    MOCK_PPM_RISE_STEPS_MIN,
    MOCK_PPM_RISE_STEPS_MAX,
    random,
  );
  const riseStep = Math.max(1, Math.round((high - low) / steps));
  return {ppm: low, low, high, riseStep};
}

export function createMockPpmPulse(
  random: () => number = Math.random,
): MockPpmPulseState {
  return startPulse(random);
}

/**
 * Climbs toward the current high. After the peak sample, the next tick
 * snaps to a new random low and starts the next pulse.
 */
export function advanceMockPpmPulse(
  state: MockPpmPulseState,
  random: () => number = Math.random,
): MockPpmPulseState {
  if (state.ppm >= state.high) {
    return startPulse(random);
  }
  return {
    ...state,
    ppm: Math.min(state.high, state.ppm + state.riseStep),
  };
}

export function telemetryFromPulse(
  pulse: MockPpmPulseState,
  now: () => number = Date.now,
): TelemetryPayload {
  return {
    ppm: pulse.ppm,
    status: 'running',
    timestamp: now(),
  };
}
