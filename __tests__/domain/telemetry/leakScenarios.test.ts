import {
  LEAK_SCENARIO_IDS,
  LEAK_SCENARIOS,
  SCENARIO_PERIOD_SECONDS,
  advanceScenarioTick,
  createScenarioTick,
  ppmAtTick,
  telemetryFromScenario,
} from '../../../src/domain/telemetry/leakScenarios';

function samples(id: (typeof LEAK_SCENARIO_IDS)[number]): number[] {
  return Array.from({ length: SCENARIO_PERIOD_SECONDS }, (_, tick) =>
    ppmAtTick(id, tick),
  );
}

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function maxStep(values: number[]): number {
  let largest = 0;
  for (let i = 1; i < values.length; i++) {
    largest = Math.max(largest, Math.abs(values[i] - values[i - 1]));
  }
  return largest;
}

function runsAbove(values: number[], threshold: number): number {
  let runs = 0;
  let inRun = false;
  for (const value of values) {
    if (value > threshold) {
      if (!inRun) {
        runs += 1;
        inRun = true;
      }
    } else {
      inRun = false;
    }
  }
  return runs;
}

describe('domain/telemetry/leakScenarios', () => {
  describe('LEAK_SCENARIOS library', () => {
    it('lists four labeled scenarios with signature and guidance copy', () => {
      expect(LEAK_SCENARIO_IDS).toEqual([
        'cloudHunt',
        'pinpoint',
        'twoPeaks',
        'dirtyRoom',
      ]);
      expect(LEAK_SCENARIOS).toHaveLength(4);

      for (const scenario of LEAK_SCENARIOS) {
        expect(scenario.name.length).toBeGreaterThan(0);
        expect(scenario.signature.length).toBeGreaterThan(20);
        expect(scenario.guidance.pattern.length).toBeGreaterThan(10);
        expect(scenario.guidance.nextSteps.length).toBeGreaterThanOrEqual(2);
        expect(scenario.guidance.cannotConclude.join(' ')).toMatch(
          /leak rate|lb\/year|fitting/i,
        );
      }
    });
  });

  describe('ppmAtTick', () => {
    it('repeats every 60 seconds except cloud hunt', () => {
      for (const id of LEAK_SCENARIO_IDS.filter(id => id !== 'cloudHunt')) {
        expect(ppmAtTick(id, SCENARIO_PERIOD_SECONDS)).toBe(ppmAtTick(id, 0));
        expect(ppmAtTick(id, SCENARIO_PERIOD_SECONDS + 7)).toBe(
          ppmAtTick(id, 7),
        );
      }
    });

    it('holds cloud hunt at the plateau instead of looping', () => {
      expect(ppmAtTick('cloudHunt', 0)).toBeLessThan(30);
      expect(ppmAtTick('cloudHunt', 40)).toBe(80);
      expect(ppmAtTick('cloudHunt', SCENARIO_PERIOD_SECONDS)).toBe(80);
      expect(ppmAtTick('cloudHunt', SCENARIO_PERIOD_SECONDS + 20)).toBe(80);
    });

    it('keeps cloud hunt as a slow climb then a plateau', () => {
      const ppm = samples('cloudHunt');
      expect(ppm[0]).toBeLessThan(30);
      expect(Math.max(...ppm)).toBeLessThanOrEqual(90);
      expect(maxStep(ppm)).toBeLessThanOrEqual(5);
      expect(runsAbove(ppm, 200)).toBe(0);
      expect(new Set(ppm.slice(-10)).size).toBe(1);
    });

    it('keeps pinpoint as one high peak then decay to baseline', () => {
      const ppm = samples('pinpoint');
      expect(ppm[0]).toBeLessThanOrEqual(20);
      expect(ppm[ppm.length - 1]).toBeLessThanOrEqual(20);
      expect(Math.max(...ppm)).toBeGreaterThanOrEqual(400);
      expect(runsAbove(ppm, 200)).toBe(1);
    });

    it('keeps two-peaks as two separate spikes with the first higher', () => {
      const ppm = samples('twoPeaks');
      const firstHalf = ppm.slice(0, 30);
      const secondHalf = ppm.slice(30);
      expect(runsAbove(ppm, 150)).toBe(2);
      expect(Math.max(...firstHalf)).toBeGreaterThan(Math.max(...secondHalf));
      expect(Math.max(...secondHalf)).toBeGreaterThan(150);
    });

    it('keeps dirty room as a high noisy baseline without a sniffer peak', () => {
      const ppm = samples('dirtyRoom');
      expect(Math.min(...ppm)).toBeGreaterThanOrEqual(80);
      expect(Math.max(...ppm)).toBeLessThan(180);
      expect(mean(ppm)).toBeGreaterThan(100);
      expect(runsAbove(ppm, 200)).toBe(0);
    });
  });

  describe('scenario tick state', () => {
    it('starts at tick 0 and advances one sample at a time', () => {
      let state = createScenarioTick('pinpoint');
      expect(state).toEqual({ scenarioId: 'pinpoint', tick: 0 });

      state = advanceScenarioTick(state);
      expect(state.tick).toBe(1);
      expect(state.scenarioId).toBe('pinpoint');
    });

    it('copies ppm onto a running telemetry payload without a scenario id', () => {
      const payload = telemetryFromScenario(
        { scenarioId: 'pinpoint', tick: 0 },
        () => 1_700_000_000_000,
      );

      expect(payload).toEqual({
        ppm: ppmAtTick('pinpoint', 0),
        status: 'running',
        timestamp: 1_700_000_000_000,
      });
      expect(JSON.stringify(payload)).not.toMatch(/pinpoint|scenario/i);
    });
  });
});
