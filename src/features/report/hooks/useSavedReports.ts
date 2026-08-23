import {useCallback, useEffect, useState} from 'react';
import {buildSavedReport} from '../../../domain/report/buildSavedReport';
import {
  appendReport,
  listReports,
} from '../../../services/storage/reportStorage';
import {SavedReport, SavedReportFields, SessionCapture} from '../../../types';

export interface SavedReportsState {
  reports: SavedReport[];
}

export interface SavedReportsActions {
  save: (capture: SessionCapture, fields: SavedReportFields) => Promise<void>;
}

export function useSavedReports(): {
  state: SavedReportsState;
  actions: SavedReportsActions;
} {
  const [reports, setReports] = useState<SavedReport[]>([]);

  useEffect(() => {
    let cancelled = false;
    listReports().then(loaded => {
      if (!cancelled) {
        setReports(loaded);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const save = useCallback(
    async (capture: SessionCapture, fields: SavedReportFields) => {
      const report = buildSavedReport(capture, fields, Date.now());
      await appendReport(report);
      setReports(current => [report, ...current]);
    },
    [],
  );

  return {state: {reports}, actions: {save}};
}
