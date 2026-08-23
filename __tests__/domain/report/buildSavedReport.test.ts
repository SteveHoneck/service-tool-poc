import {
  buildSavedReport,
  reportListLabel,
} from '../../../src/domain/report/buildSavedReport';
import {SessionCapture} from '../../../src/types';

const capture: SessionCapture = {
  samples: [
    {ppm: 100, timestamp: 1_000},
    {ppm: 250, timestamp: 2_000},
    {ppm: 180, timestamp: 3_000},
  ],
  gaps: [{at: 2_000, reason: 'disconnect'}],
  partial: true,
};

describe('buildSavedReport', () => {
  it('copies samples, gaps, and partial, and derives maxPpm and timestamps', () => {
    const report = buildSavedReport(
      capture,
      {jobName: 'Leak check', operatorName: 'Alex'},
      9_999,
    );

    expect(report).toEqual({
      id: 'report-9999',
      jobName: 'Leak check',
      operatorName: 'Alex',
      startedAt: 1_000,
      endedAt: 3_000,
      ppmSamples: capture.samples,
      maxPpm: 250,
      partial: true,
      gaps: capture.gaps,
    });
  });

  it('trims job and operator names', () => {
    const report = buildSavedReport(
      capture,
      {jobName: '  Job A  ', operatorName: '  Sam  '},
      1,
    );

    expect(report.jobName).toBe('Job A');
    expect(report.operatorName).toBe('Sam');
  });

  it('stores a blank job name as empty after trim', () => {
    const report = buildSavedReport(
      capture,
      {jobName: '   ', operatorName: '  '},
      1,
    );

    expect(report.jobName).toBe('');
    expect(report.operatorName).toBe('');
  });

  it('uses now for timestamps and 0 maxPpm when there are no samples', () => {
    const report = buildSavedReport(
      {samples: [], gaps: [], partial: false},
      {jobName: 'Empty', operatorName: 'Pat'},
      42,
    );

    expect(report.startedAt).toBe(42);
    expect(report.endedAt).toBe(42);
    expect(report.maxPpm).toBe(0);
    expect(report.ppmSamples).toEqual([]);
  });
});

describe('reportListLabel', () => {
  it('uses the job name when it is present', () => {
    const report = buildSavedReport(
      capture,
      {jobName: 'Leak check', operatorName: 'Alex'},
      1,
    );

    expect(reportListLabel(report)).toBe('Leak check');
  });

  it('uses Untitled report when the job name is blank', () => {
    const report = buildSavedReport(
      capture,
      {jobName: '  ', operatorName: 'Alex'},
      1,
    );

    expect(reportListLabel(report)).toBe('Untitled report');
  });
});
