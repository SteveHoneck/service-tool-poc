import {nextMaxPpm} from '../signals/ppm';
import {SavedReport, SavedReportFields, SessionCapture} from '../../types';

export function buildSavedReport(
  capture: SessionCapture,
  fields: SavedReportFields,
  now: number,
): SavedReport {
  const samples = capture.samples;
  const first = samples[0];
  const last = samples[samples.length - 1];

  return {
    id: `report-${now}`,
    jobName: fields.jobName.trim(),
    operatorName: fields.operatorName.trim(),
    startedAt: first?.timestamp ?? now,
    endedAt: last?.timestamp ?? now,
    ppmSamples: samples,
    maxPpm: samples.reduce((max, sample) => nextMaxPpm(max, sample.ppm), 0),
    partial: capture.partial,
    gaps: capture.gaps,
  };
}

export function reportListLabel(report: Pick<SavedReport, 'jobName'>): string {
  return report.jobName === '' ? 'Untitled report' : report.jobName;
}
