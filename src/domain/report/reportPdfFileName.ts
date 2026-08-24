import { reportListLabel } from './buildSavedReport';
import { SavedReport } from '../../types';

export function reportPdfFileName(
  report: Pick<SavedReport, 'jobName'>,
): string {
  const base = reportListLabel(report)
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${base}.pdf`;
}
