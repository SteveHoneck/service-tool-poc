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

export interface PlotYTicks {
  low: number;
  mid: number;
  high: number;
}

export interface PlotXTicks {
  startSeconds: number;
  midSeconds: number;
  endSeconds: number;
}

export interface PlotAxis {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface PpmPlot {
  points: PlotPoint[];
  polyline: string;
  yTicks: PlotYTicks;
  xTicks: PlotXTicks;
  yAxis: PlotAxis;
  xAxis: PlotAxis;
}

function plotAxes(box: PlotBox): Pick<PpmPlot, 'yAxis' | 'xAxis'> {
  const left = box.padding;
  const right = box.width - box.padding;
  const top = box.padding;
  const bottom = box.height - box.padding;
  return {
    yAxis: { x1: left, y1: top, x2: left, y2: bottom },
    xAxis: { x1: left, y1: bottom, x2: right, y2: bottom },
  };
}

const ZERO_TICKS: Pick<PpmPlot, 'yTicks' | 'xTicks'> = {
  yTicks: { low: 0, mid: 0, high: 0 },
  xTicks: { startSeconds: 0, midSeconds: 0, endSeconds: 0 },
};

export function plotPpmSamples(samples: PpmSample[], box: PlotBox): PpmPlot {
  const axes = plotAxes(box);
  if (samples.length === 0) {
    return { points: [], polyline: '', ...ZERO_TICKS, ...axes };
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
  const endSeconds = timeSpan / 1000;

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
    yTicks: { low: 0, mid: maxPpm / 2, high: maxPpm },
    xTicks: {
      startSeconds: 0,
      midSeconds: endSeconds / 2,
      endSeconds,
    },
    ...axes,
  };
}
