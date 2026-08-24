import { useCallback, useState } from 'react';
import {
  AnalysisResult,
  MIN_ANALYZE_SAMPLES,
  buildAnalysisRequest,
  canAnalyzeReport,
  parseAnalysisResponse,
} from '../../../domain/report/buildAnalysisRequest';
import { getAnthropicApiKey } from '../../../config/anthropic';
import {
  AnalyzeFailure,
  analyzeReport,
} from '../../../services/ai/anthropicAnalysis';
import { SavedReport } from '../../../types';

export interface ReportAnalysisState {
  analyzing: boolean;
  error: string | null;
  result: AnalysisResult | null;
}

export interface ReportAnalysisActions {
  analyze: (report: SavedReport) => Promise<void>;
  clear: () => void;
}

const MISSING_KEY_MESSAGE =
  'Add your key to src/config/anthropic.local.ts (see the example file) and reload.';

function messageForFailure(error: AnalyzeFailure): string {
  switch (error) {
    case 'missing_key':
      return MISSING_KEY_MESSAGE;
    case 'unauthorized':
      return 'Anthropic rejected the API key.';
    case 'network':
      return 'Could not reach Anthropic. Check the network and try again.';
    case 'http':
      return 'Anthropic request failed.';
    case 'empty':
      return 'Anthropic returned an empty response.';
  }
}

export function useReportAnalysis(): {
  state: ReportAnalysisState;
  actions: ReportAnalysisActions;
} {
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const analyze = useCallback(async (report: SavedReport) => {
    setAnalyzing(true);
    setError(null);
    setResult(null);
    try {
      if (!canAnalyzeReport(report)) {
        setError(`Need at least ${MIN_ANALYZE_SAMPLES} samples to analyze.`);
        return;
      }

      const apiKey = getAnthropicApiKey();
      if (apiKey === '') {
        setError(MISSING_KEY_MESSAGE);
        return;
      }

      const request = buildAnalysisRequest(report);
      const outcome = await analyzeReport({
        apiKey,
        system: request.system,
        user: request.user,
      });
      if (!outcome.ok) {
        setError(messageForFailure(outcome.error));
        return;
      }

      try {
        setResult(parseAnalysisResponse(outcome.text));
      } catch {
        setError('Could not parse analysis JSON.');
      }
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const clear = useCallback(() => {
    setAnalyzing(false);
    setError(null);
    setResult(null);
  }, []);

  return { state: { analyzing, error, result }, actions: { analyze, clear } };
}
