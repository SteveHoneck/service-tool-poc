import { plotPpmSamples } from '../../../src/domain/report/plotPpmSamples';
import { PpmSample } from '../../../src/types';

const box = { width: 100, height: 50, padding: 10 };

describe('plotPpmSamples', () => {
  it('returns no points for an empty session', () => {
    expect(plotPpmSamples([], box)).toEqual({
      points: [],
      polyline: '',
    });
  });

  it('maps time to x and ppm to y, with y growing upward', () => {
    const samples: PpmSample[] = [
      { timestamp: 0, ppm: 0 },
      { timestamp: 10, ppm: 100 },
    ];

    expect(plotPpmSamples(samples, box)).toEqual({
      points: [
        { x: 10, y: 40 },
        { x: 90, y: 10 },
      ],
      polyline: '10,40 90,10',
    });
  });

  it('places a single sample at the left of the plot', () => {
    const samples: PpmSample[] = [{ timestamp: 5, ppm: 50 }];

    expect(plotPpmSamples(samples, box)).toEqual({
      points: [{ x: 10, y: 10 }],
      polyline: '10,10',
    });
  });

  it('uses a ppm scale of 1 when every sample is 0', () => {
    const samples: PpmSample[] = [
      { timestamp: 0, ppm: 0 },
      { timestamp: 10, ppm: 0 },
    ];

    expect(plotPpmSamples(samples, box)).toEqual({
      points: [
        { x: 10, y: 40 },
        { x: 90, y: 40 },
      ],
      polyline: '10,40 90,40',
    });
  });
});
