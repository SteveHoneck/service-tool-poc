import { buildReportPdfHtml } from '../../../src/domain/report/buildReportPdfHtml';
import { SavedReport } from '../../../src/types';

const namedReport: SavedReport = {
  id: 'report-1',
  jobName: 'Leak check',
  operatorName: 'Alex',
  startedAt: 1_000,
  endedAt: 3_000,
  ppmSamples: [
    { ppm: 100, timestamp: 1_000 },
    { ppm: 250, timestamp: 2_000 },
    { ppm: 180, timestamp: 3_000 },
  ],
  maxPpm: 250,
  partial: false,
  gaps: [],
};

describe('buildReportPdfHtml', () => {
  it('includes job, operator, notes, readings, times, and sample count', () => {
    const html = buildReportPdfHtml(namedReport);

    expect(html).toContain('Leak check');
    expect(html).toContain('Alex');
    expect(html).toContain('Notes: -');
    expect(html).toContain('Last reading: 180 ppm');
    expect(html).toContain('Max. reading: 250 ppm');
    expect(html).toContain(new Date(1_000).toISOString());
    expect(html).toContain(new Date(3_000).toISOString());
    expect(html).toContain('3 samples');
  });

  it('uses Untitled report when the job name is blank', () => {
    const html = buildReportPdfHtml({ ...namedReport, jobName: '' });

    expect(html).toContain('Untitled report');
    expect(html).not.toContain('Leak check');
  });

  it('uses the connection-lost note when the session is partial', () => {
    const html = buildReportPdfHtml({ ...namedReport, partial: true });

    expect(html).toContain('Connection lost during session');
  });

  it('uses 0 ppm and zero samples when the session is empty', () => {
    const html = buildReportPdfHtml({
      ...namedReport,
      ppmSamples: [],
      maxPpm: 0,
    });

    expect(html).toContain('0 ppm');
    expect(html).toContain('0 samples');
  });

  it('uses the singular sample label when there is one sample', () => {
    const html = buildReportPdfHtml({
      ...namedReport,
      ppmSamples: [{ ppm: 100, timestamp: 1_000 }],
      maxPpm: 100,
    });

    expect(html).toContain('1 sample');
    expect(html).not.toContain('1 samples');
  });

  it('escapes job and operator HTML', () => {
    const html = buildReportPdfHtml({
      ...namedReport,
      jobName: 'Leak <check> & more',
      operatorName: 'Alex & <Sam>',
    });

    expect(html).toContain('Leak &lt;check&gt; &amp; more');
    expect(html).toContain('Alex &amp; &lt;Sam&gt;');
    expect(html).not.toContain('Leak <check>');
    expect(html).not.toContain('Alex & <Sam>');
  });
});
