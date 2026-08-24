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

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

export function formatReportPdfDate(timestamp: number): string {
  const date = new Date(timestamp);
  const month = MONTHS[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  const hour24 = date.getHours();
  const minute = String(date.getMinutes()).padStart(2, '0');
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 || 12;
  return `${month} ${day}, ${year}, ${hour12}:${minute} ${period}`;
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
    <p>Started: ${formatReportPdfDate(report.startedAt)}</p>
    <p>Ended: ${formatReportPdfDate(report.endedAt)}</p>
    <p>${sampleCountLabel(report.ppmSamples.length)}</p>
  </body>
</html>`;
}
