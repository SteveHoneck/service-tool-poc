import { nextMaxPpm } from '../signals/ppm';
import { PpmSample } from '../../types';

export interface PlotBox {
  width: number;
  height: number;
  padding: number;
}

export interface PlotPoint {
  x: number;
  y: number;
}

export interface PpmPlot {
  points: PlotPoint[];
  polyline: string;
}

export function plotPpmSamples(samples: PpmSample[], box: PlotBox): PpmPlot {
  if (samples.length === 0) {
    return { points: [], polyline: '' };
  }

  const plotWidth = box.width - 2 * box.padding;
  const plotHeight = box.height - 2 * box.padding;
  const minTime = samples[0].timestamp;
  const maxTime = samples[samples.length - 1].timestamp;
  const timeSpan = maxTime - minTime;
  const maxPpm = samples.reduce(
    (max, sample) => nextMaxPpm(max, sample.ppm),
    0,
  );
  const ppmScale = maxPpm === 0 ? 1 : maxPpm;

  const points = samples.map(sample => {
    const x =
      timeSpan === 0
        ? box.padding
        : box.padding + ((sample.timestamp - minTime) / timeSpan) * plotWidth;
    const y = box.padding + (1 - sample.ppm / ppmScale) * plotHeight;
    return { x, y };
  });

  return {
    points,
    polyline: points.map(point => `${point.x},${point.y}`).join(' '),
  };
}
