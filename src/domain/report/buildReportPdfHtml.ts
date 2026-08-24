import { lastPpm, reportListLabel } from './buildSavedReport';
import { SavedReport } from '../../types';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function notesLabel(partial: boolean): string {
  return partial ? 'Connection lost during session' : '-';
}

function sampleCountLabel(count: number): string {
  return count === 1 ? '1 sample' : `${count} samples`;
}

export function buildReportPdfHtml(report: SavedReport): string {
  const jobName = escapeHtml(reportListLabel(report));
  const operatorName = escapeHtml(report.operatorName);

  return `<!DOCTYPE html>
<html>
  <body>
    <h1>${jobName}</h1>
    <p>Job name: ${jobName}</p>
    <p>Operator: ${operatorName}</p>
    <p>Notes: ${escapeHtml(notesLabel(report.partial))}</p>
    <p>Last reading: ${lastPpm(report.ppmSamples)} ppm</p>
    <p>Max. reading: ${report.maxPpm} ppm</p>
    <p>Started: ${new Date(report.startedAt).toISOString()}</p>
    <p>Ended: ${new Date(report.endedAt).toISOString()}</p>
    <p>${sampleCountLabel(report.ppmSamples.length)}</p>
  </body>
</html>`;
}
