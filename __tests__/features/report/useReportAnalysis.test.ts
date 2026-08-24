import { act, renderHook } from '@testing-library/react-native';
import { useReportAnalysis } from '../../../src/features/report/hooks/useReportAnalysis';
import { analyzeReport } from '../../../src/services/ai/anthropicAnalysis';
import { getAnthropicApiKey } from '../../../src/config/anthropic';
import { SavedReport } from '../../../src/types';

jest.mock('../../../src/services/ai/anthropicAnalysis', () => ({
  analyzeReport: jest.fn(),
}));

jest.mock('../../../src/config/anthropic', () => ({
  getAnthropicApiKey: jest.fn(),
}));

const analyzeReportMock = analyzeReport as jest.MockedFunction<
  typeof analyzeReport
>;
const getAnthropicApiKeyMock = getAnthropicApiKey as jest.MockedFunction<
  typeof getAnthropicApiKey
>;

function reportWithSamples(count: number): SavedReport {
  const samples = Array.from({ length: count }, (_, index) => ({
    ppm: 15 + index,
    timestamp: index * 1000,
  }));
  return {
    id: 'report-1',
    jobName: 'Leak check',
    operatorName: 'Alex',
    startedAt: 0,
    endedAt: Math.max(0, count - 1) * 1000,
    ppmSamples: samples,
    maxPpm: count === 0 ? 0 : 15 + count - 1,
    partial: false,
    gaps: [],
  };
}

const parsedBody = {
  matchId: 'pinpoint',
  confidence: 'high',
  why: 'One narrow peak then decay.',
  pattern: 'Pinpoint-style peak',
  nextSteps: ['Re-sweep the peak'],
  cannotConclude: ['True leak rate (lb/year)'],
};

describe('useReportAnalysis', () => {
  beforeEach(() => {
    analyzeReportMock.mockReset();
    getAnthropicApiKeyMock.mockReset();
    getAnthropicApiKeyMock.mockReturnValue('sk-ant-test');
    analyzeReportMock.mockResolvedValue({
      ok: true,
      text: JSON.stringify(parsedBody),
    });
  });

  it('does not call Anthropic when the session is too short', async () => {
    const { result } = await renderHook(() => useReportAnalysis());

    await act(async () => {
      await result.current.actions.analyze(reportWithSamples(19));
    });

    expect(analyzeReportMock).not.toHaveBeenCalled();
    expect(result.current.state.error).toMatch(/20 samples/i);
    expect(result.current.state.result).toBeNull();
  });

  it('does not call Anthropic when the API key is missing', async () => {
    getAnthropicApiKeyMock.mockReturnValue('');
    const { result } = await renderHook(() => useReportAnalysis());

    await act(async () => {
      await result.current.actions.analyze(reportWithSamples(20));
    });

    expect(analyzeReportMock).not.toHaveBeenCalled();
    expect(result.current.state.error).toMatch(/anthropic\.local\.ts/);
  });

  it('stores parsed guidance after a successful analyze', async () => {
    const { result } = await renderHook(() => useReportAnalysis());
    const report = reportWithSamples(20);

    await act(async () => {
      await result.current.actions.analyze(report);
    });

    expect(analyzeReportMock).toHaveBeenCalledTimes(1);
    const input = analyzeReportMock.mock.calls[0][0];
    expect(input.apiKey).toBe('sk-ant-test');
    expect(input.system).toMatch(/JSON only/);
    expect(JSON.parse(input.user).recording.samples).toHaveLength(20);
    expect(result.current.state.analyzing).toBe(false);
    expect(result.current.state.error).toBeNull();
    expect(result.current.state.result).toEqual(parsedBody);
  });

  it('maps a missing-key service result to the local-file message', async () => {
    analyzeReportMock.mockResolvedValue({ ok: false, error: 'missing_key' });
    const { result } = await renderHook(() => useReportAnalysis());

    await act(async () => {
      await result.current.actions.analyze(reportWithSamples(20));
    });

    expect(result.current.state.error).toMatch(/anthropic\.local\.ts/);
    expect(result.current.state.result).toBeNull();
  });

  it('stores an error when JSON cannot be parsed', async () => {
    analyzeReportMock.mockResolvedValue({ ok: true, text: 'not json' });
    const { result } = await renderHook(() => useReportAnalysis());

    await act(async () => {
      await result.current.actions.analyze(reportWithSamples(20));
    });

    expect(result.current.state.error).toMatch(/parse/i);
    expect(result.current.state.result).toBeNull();
  });
});
