import { plotPpmSamples } from '../../../src/domain/report/plotPpmSamples';
import { PpmSample } from '../../../src/types';

const box = { width: 100, height: 50, padding: 10 };

const emptyTicks = {
  yTicks: { low: 0, mid: 0, high: 0 },
  xTicks: { startSeconds: 0, midSeconds: 0, endSeconds: 0 },
};

const axes = {
  yAxis: { x1: 10, y1: 10, x2: 10, y2: 40 },
  xAxis: { x1: 10, y1: 40, x2: 90, y2: 40 },
};

describe('plotPpmSamples', () => {
  it('returns no points for an empty session', () => {
    expect(plotPpmSamples([], box)).toEqual({
      points: [],
      polyline: '',
      ...emptyTicks,
      ...axes,
    });
  });

  it('maps time to x and ppm to y, with y growing upward', () => {
    const samples: PpmSample[] = [
      { timestamp: 0, ppm: 0 },
      { timestamp: 10_000, ppm: 100 },
    ];

    expect(plotPpmSamples(samples, box)).toEqual({
      points: [
        { x: 10, y: 40 },
        { x: 90, y: 10 },
      ],
      polyline: '10,40 90,10',
      yTicks: { low: 0, mid: 50, high: 100 },
      xTicks: { startSeconds: 0, midSeconds: 5, endSeconds: 10 },
      ...axes,
    });
  });

  it('places a single sample at the left of the plot', () => {
    const samples: PpmSample[] = [{ timestamp: 5_000, ppm: 50 }];

    expect(plotPpmSamples(samples, box)).toEqual({
      points: [{ x: 10, y: 10 }],
      polyline: '10,10',
      yTicks: { low: 0, mid: 25, high: 50 },
      xTicks: { startSeconds: 0, midSeconds: 0, endSeconds: 0 },
      ...axes,
    });
  });

  it('uses a ppm scale of 1 when every sample is 0', () => {
    const samples: PpmSample[] = [
      { timestamp: 0, ppm: 0 },
      { timestamp: 10_000, ppm: 0 },
    ];

    expect(plotPpmSamples(samples, box)).toEqual({
      points: [
        { x: 10, y: 40 },
        { x: 90, y: 40 },
      ],
      polyline: '10,40 90,40',
      yTicks: { low: 0, mid: 0, high: 0 },
      xTicks: { startSeconds: 0, midSeconds: 5, endSeconds: 10 },
      ...axes,
    });
  });
});
