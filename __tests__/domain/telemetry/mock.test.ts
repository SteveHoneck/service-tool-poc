import {PPM_FULL_SCALE} from '../../../src/domain/signals/ppm';
import {generateMockTelemetry} from '../../../src/domain/telemetry/mock';

describe('domain/telemetry/mock', () => {
  it('emits integer ppm within the live bar scale', () => {
    const payload = generateMockTelemetry(() => 0.5, () => 1_700_000_000_000);

    expect(payload).toEqual({
      ppm: Math.round(0.5 * PPM_FULL_SCALE),
      status: 'running',
      timestamp: 1_700_000_000_000,
    });
  });

  it('covers the 0 and full-scale ends of the mock range', () => {
    expect(generateMockTelemetry(() => 0).ppm).toBe(0);
    expect(generateMockTelemetry(() => 1).ppm).toBe(PPM_FULL_SCALE);
  });
});
