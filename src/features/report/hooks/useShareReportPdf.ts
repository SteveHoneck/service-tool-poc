import { useCallback, useState } from 'react';
import { buildReportPdfHtml } from '../../../domain/report/buildReportPdfHtml';
import { reportPdfFileName } from '../../../domain/report/reportPdfFileName';
import { shareReportPdf } from '../../../services/report/reportPdf';
import { SavedReport } from '../../../types';

export interface ShareReportPdfState {
  sharing: boolean;
  error: string | null;
}

export interface ShareReportPdfActions {
  share: (report: SavedReport) => Promise<void>;
}

function isShareCancelled(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /cancel|did not share/i.test(message);
}

export function useShareReportPdf(): {
  state: ShareReportPdfState;
  actions: ShareReportPdfActions;
} {
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const share = useCallback(async (report: SavedReport) => {
    setSharing(true);
    setError(null);
    try {
      await shareReportPdf(
        buildReportPdfHtml(report),
        reportPdfFileName(report),
      );
    } catch (caught) {
      if (!isShareCancelled(caught)) {
        setError(
          caught instanceof Error ? caught.message : 'Could not share PDF',
        );
      }
    } finally {
      setSharing(false);
    }
  }, []);

  return { state: { sharing, error }, actions: { share } };
}
