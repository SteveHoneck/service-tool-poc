import { TelemetryPayload } from '../../types';

export const SCENARIO_PERIOD_SECONDS = 60;

export const LEAK_SCENARIO_IDS = [
  'cloudHunt',
  'pinpoint',
  'twoPeaks',
  'dirtyRoom',
] as const;

export type LeakScenarioId = (typeof LEAK_SCENARIO_IDS)[number];

export interface LeakScenarioGuidance {
  pattern: string;
  nextSteps: string[];
  cannotConclude: string[];
}

export interface LeakScenario {
  id: LeakScenarioId;
  name: string;
  signature: string;
  guidance: LeakScenarioGuidance;
}

export interface ScenarioTickState {
  scenarioId: LeakScenarioId;
  tick: number;
}

export const LEAK_SCENARIOS: LeakScenario[] = [
  {
    id: 'cloudHunt',
    name: 'Cloud hunt',
    signature:
      'Slow climb from a low baseline, then a long plateau with no sharp spike.',
    guidance: {
      pattern:
        'PPM rose gradually and leveled off — consistent with walking into a refrigerant cloud, not passing a single fitting.',
      nextSteps: [
        'Keep moving toward higher PPM instead of stopping at this plateau.',
        'Once the number climbs again, slow the sweep and switch to a pinpoint pass.',
      ],
      cannotConclude: [
        'Leak component or fitting type',
        'True leak rate (lb/year)',
        'Refrigerant cost',
      ],
    },
  },
  {
    id: 'pinpoint',
    name: 'Pinpoint',
    signature:
      'Low baseline, one narrow peak, then exponential-ish decay back to baseline.',
    guidance: {
      pattern:
        'A single short peak then decay — consistent with sweeping the probe past one source and walking off.',
      nextSteps: [
        'Return to the time of the peak and sweep 1–2 in/s across that fitting.',
        'Hold 2–3 seconds on the joint; soap-test if PPM climbs again.',
      ],
      cannotConclude: [
        'Which fitting leaked',
        'True leak rate (lb/year)',
        'Refrigerant cost',
      ],
    },
  },
  {
    id: 'twoPeaks',
    name: 'Two sites',
    signature:
      'Two separate peaks about 20–25s apart; the first peak is higher than the second.',
    guidance: {
      pattern:
        'Two concentration events. Could be two fittings or a second pass over the same area.',
      nextSteps: [
        'Mark both peak times and re-sweep each location.',
        'Confirm which peak is repeatable before closing the job.',
      ],
      cannotConclude: [
        'Whether the peaks are two leaks or two passes',
        'Fitting type',
        'True leak rate (lb/year)',
      ],
    },
  },
  {
    id: 'dirtyRoom',
    name: 'Dirty room',
    signature:
      'High noisy baseline with only small bumps — no sniffer-style spike above the room background.',
    guidance: {
      pattern:
        'Background is elevated and noisy. Small bumps may be contamination, not a pinpoint source.',
      nextSteps: [
        'Step out to cleaner air and zero, then hunt again.',
        'Do not treat small bumps on this baseline as leak sites until the background drops.',
      ],
      cannotConclude: [
        'Leak location',
        'Fitting type',
        'True leak rate (lb/year)',
      ],
    },
  },
];

function wrapTick(tick: number): number {
  return (
    ((tick % SCENARIO_PERIOD_SECONDS) + SCENARIO_PERIOD_SECONDS) %
    SCENARIO_PERIOD_SECONDS
  );
}

function trianglePeak(
  tick: number,
  center: number,
  height: number,
  halfWidth: number,
): number {
  const distance = Math.abs(tick - center);
  if (distance >= halfWidth) {
    return 0;
  }
  return Math.round(height * (1 - distance / halfWidth));
}

export function ppmAtTick(scenarioId: LeakScenarioId, tick: number): number {
  if (scenarioId === 'cloudHunt') {
    const t = Math.max(0, tick);
    if (t < 40) {
      return Math.round(20 + (60 * t) / 40);
    }
    return 80;
  }

  const t = wrapTick(tick);

  if (scenarioId === 'pinpoint') {
    if (t < 15) {
      return 15;
    }
    if (t <= 18) {
      const climb = t - 14;
      return Math.round(15 + (435 * climb) / 4);
    }
    const decay = t - 18;
    const ppm = Math.round(15 + 435 * Math.exp(-0.22 * decay));
    return Math.max(15, ppm);
  }

  if (scenarioId === 'twoPeaks') {
    const first = trianglePeak(t, 12, 385, 6);
    const second = trianglePeak(t, 36, 205, 6);
    return 15 + Math.max(first, second);
  }

  return Math.round(110 + 12 * Math.sin(t * 0.7) + (t % 11 === 0 ? 18 : 0));
}

export function createScenarioTick(
  scenarioId: LeakScenarioId = 'pinpoint',
): ScenarioTickState {
  return { scenarioId, tick: 0 };
}

export function advanceScenarioTick(
  state: ScenarioTickState,
): ScenarioTickState {
  return { ...state, tick: state.tick + 1 };
}

export function telemetryFromScenario(
  state: ScenarioTickState,
  now: () => number = Date.now,
): TelemetryPayload {
  return {
    ppm: ppmAtTick(state.scenarioId, state.tick),
    status: 'running',
    timestamp: now(),
  };
}
