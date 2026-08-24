import { plotPpmSamples } from '../../../src/domain/report/plotPpmSamples';
import {
  PDF_CHART_BOX,
  buildReportPdfChartSvg,
} from '../../../src/domain/report/reportPdfChartSvg';
import { PpmSample } from '../../../src/types';

const twoPointSession: PpmSample[] = [
  { timestamp: 0, ppm: 0 },
  { timestamp: 10_000, ppm: 100 },
];

describe('buildReportPdfChartSvg', () => {
  it('draws the plot polyline and axis labels for a session', () => {
    const svg = buildReportPdfChartSvg(twoPointSession);
    const plot = plotPpmSamples(twoPointSession, PDF_CHART_BOX);

    expect(svg).toContain('<svg');
    expect(svg).toContain(`points="${plot.polyline}"`);
    expect(svg).toContain('#2563EB');
    expect(svg).toContain('PPM');
    expect(svg).toContain('Time (s)');
    expect(svg).toContain('100');
    expect(svg).toContain('0 s');
    expect(svg).toContain('10 s');
  });

  it('places PPM left of the plot and Time (s) below the x-axis', () => {
    const svg = buildReportPdfChartSvg(twoPointSession);
    const ppm = svg.match(/<text x="([^"]+)"[^>]*>PPM</);
    const time = svg.match(/<text[^>]*y="([^"]+)"[^>]*>Time \(s\)</);

    expect(ppm).not.toBeNull();
    expect(time).not.toBeNull();
    expect(Number(ppm?.[1])).toBeLessThan(PDF_CHART_BOX.padding);
    expect(Number(time?.[1])).toBeGreaterThan(PDF_CHART_BOX.height);
    expect(svg).toContain('translate(');
  });

  it('draws an empty plot box with no polyline when there are no samples', () => {
    const svg = buildReportPdfChartSvg([]);

    expect(svg).toContain('<svg');
    expect(svg).toContain('PPM');
    expect(svg).toContain('Time (s)');
    expect(svg).not.toContain('<polyline');
  });
});
