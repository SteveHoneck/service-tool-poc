import {
  MOCK_PPM_HIGH_MAX,
  MOCK_PPM_HIGH_MIN,
  MOCK_PPM_LOW_MAX,
  MOCK_PPM_LOW_MIN,
  advanceMockPpmPulse,
  createMockPpmPulse,
  telemetryFromPulse,
} from '../../../src/domain/telemetry/mock';

function sequence(values: number[]): () => number {
  let index = 0;
  return () => values[Math.min(index++, values.length - 1)];
}

describe('domain/telemetry/mock', () => {
  describe('createMockPpmPulse', () => {
    it('starts at a random low below a random high', () => {
      const pulse = createMockPpmPulse(sequence([0, 1, 0.5]));

      expect(pulse.low).toBe(MOCK_PPM_LOW_MIN);
      expect(pulse.high).toBe(MOCK_PPM_HIGH_MAX);
      expect(pulse.ppm).toBe(pulse.low);
      expect(pulse.high).toBeGreaterThan(pulse.low);
      expect(pulse.riseStep).toBeGreaterThan(0);
    });

    it('keeps generated lows and highs inside the leak range', () => {
      for (let i = 0; i < 20; i++) {
        const pulse = createMockPpmPulse();
        expect(pulse.low).toBeGreaterThanOrEqual(MOCK_PPM_LOW_MIN);
        expect(pulse.low).toBeLessThanOrEqual(MOCK_PPM_LOW_MAX);
        expect(pulse.high).toBeGreaterThanOrEqual(MOCK_PPM_HIGH_MIN);
        expect(pulse.high).toBeLessThanOrEqual(MOCK_PPM_HIGH_MAX);
        expect(pulse.ppm).toBe(pulse.low);
      }
    });
  });

  describe('advanceMockPpmPulse', () => {
    it('rises toward the high without overshooting', () => {
      const start = createMockPpmPulse(sequence([0, 1, 1]));
      const next = advanceMockPpmPulse(start, () => 0);

      expect(next.ppm).toBe(start.ppm + start.riseStep);
      expect(next.ppm).toBeLessThanOrEqual(start.high);
      expect(next.low).toBe(start.low);
      expect(next.high).toBe(start.high);
    });

    it('lands on the high then snaps to a new low on the following tick', () => {
      let pulse = {
        ppm: 190,
        low: 10,
        high: 200,
        riseStep: 20,
      };

      pulse = advanceMockPpmPulse(pulse);
      expect(pulse.ppm).toBe(200);

      pulse = advanceMockPpmPulse(pulse, sequence([0, 0, 0.5]));
      expect(pulse.ppm).toBe(MOCK_PPM_LOW_MIN);
      expect(pulse.low).toBe(MOCK_PPM_LOW_MIN);
      expect(pulse.high).toBe(MOCK_PPM_HIGH_MIN);
      expect(pulse.ppm).toBeLessThan(200);
    });
  });

  describe('telemetryFromPulse', () => {
    it('copies the current pulse ppm onto a telemetry payload', () => {
      const payload = telemetryFromPulse(
        {ppm: 42, low: 10, high: 200, riseStep: 15},
        () => 1_700_000_000_000,
      );

      expect(payload).toEqual({
        ppm: 42,
        status: 'running',
        timestamp: 1_700_000_000_000,
      });
    });
  });
});
