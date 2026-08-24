import { plotPpmSamples, PlotBox } from './plotPpmSamples';
import { PpmSample } from '../../types';

export const PDF_CHART_BOX: PlotBox = {
  width: 520,
  height: 160,
  padding: 24,
};

const LEFT_GUTTER = 32;
const BOTTOM_GUTTER = 32;

function formatTick(value: number): string {
  return String(Math.round(value * 10) / 10);
}

function formatSeconds(value: number): string {
  return `${formatTick(value)} s`;
}

function axisLine(x1: number, y1: number, x2: number, y2: number): string {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#9CA3AF" stroke-width="1" />`;
}

export function buildReportPdfChartSvg(samples: PpmSample[]): string {
  const { width, height, padding } = PDF_CHART_BOX;
  const plot = plotPpmSamples(samples, PDF_CHART_BOX);
  const midX = (plot.xAxis.x1 + plot.xAxis.x2) / 2;
  const midY = (plot.yAxis.y1 + plot.yAxis.y2) / 2;
  const svgWidth = width + LEFT_GUTTER;
  const svgHeight = height + BOTTOM_GUTTER;
  const polyline =
    plot.polyline === ''
      ? ''
      : `<polyline points="${plot.polyline}" fill="none" stroke="#2563EB" stroke-width="2" />`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
  <text x="8" y="${midY}" fill="#6B7280" font-size="11" font-weight="600">PPM</text>
  <g transform="translate(${LEFT_GUTTER}, 0)">
    ${axisLine(plot.yAxis.x1, plot.yAxis.y1, plot.yAxis.x2, plot.yAxis.y2)}
    ${axisLine(plot.xAxis.x1, plot.xAxis.y1, plot.xAxis.x2, plot.xAxis.y2)}
    <text x="${padding - 4}" y="${
    plot.yAxis.y1 + 4
  }" text-anchor="end" fill="#6B7280" font-size="10">${formatTick(
    plot.yTicks.high,
  )}</text>
    <text x="${padding - 4}" y="${
    midY + 4
  }" text-anchor="end" fill="#6B7280" font-size="10">${formatTick(
    plot.yTicks.mid,
  )}</text>
    <text x="${padding - 4}" y="${
    plot.yAxis.y2
  }" text-anchor="end" fill="#6B7280" font-size="10">${formatTick(
    plot.yTicks.low,
  )}</text>
    <text x="${plot.xAxis.x1}" y="${
    height - 6
  }" fill="#6B7280" font-size="10">${formatSeconds(
    plot.xTicks.startSeconds,
  )}</text>
    <text x="${midX}" y="${
    height - 6
  }" text-anchor="middle" fill="#6B7280" font-size="10">${formatSeconds(
    plot.xTicks.midSeconds,
  )}</text>
    <text x="${plot.xAxis.x2}" y="${
    height - 6
  }" text-anchor="end" fill="#6B7280" font-size="10">${formatSeconds(
    plot.xTicks.endSeconds,
  )}</text>
    ${polyline}
  </g>
  <text x="${LEFT_GUTTER + midX}" y="${
    svgHeight - 8
  }" text-anchor="middle" fill="#6B7280" font-size="11" font-weight="600">Time (s)</text>
</svg>`;
}
