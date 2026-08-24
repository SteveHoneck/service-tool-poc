import { act, renderHook } from '@testing-library/react-native';
import { useShareReportPdf } from '../../../src/features/report/hooks/useShareReportPdf';
import { shareReportPdf } from '../../../src/services/report/reportPdf';
import { SavedReport } from '../../../src/types';

jest.mock('../../../src/services/report/reportPdf', () => ({
  shareReportPdf: jest.fn(),
}));

const shareReportPdfMock = shareReportPdf as jest.MockedFunction<
  typeof shareReportPdf
>;

const namedReport: SavedReport = {
  id: 'report-1',
  jobName: 'Leak check',
  operatorName: 'Alex',
  startedAt: 1_000,
  endedAt: 3_000,
  ppmSamples: [
    { ppm: 100, timestamp: 1_000 },
    { ppm: 180, timestamp: 3_000 },
  ],
  maxPpm: 180,
  partial: false,
  gaps: [],
};

describe('useShareReportPdf', () => {
  beforeEach(() => {
    shareReportPdfMock.mockReset();
    shareReportPdfMock.mockResolvedValue(undefined);
  });

  it('shares HTML and a sanitized file name for the report', async () => {
    const { result } = await renderHook(() => useShareReportPdf());

    await act(async () => {
      await result.current.actions.share(namedReport);
    });

    expect(shareReportPdfMock).toHaveBeenCalledTimes(1);
    const [html, fileName] = shareReportPdfMock.mock.calls[0];
    expect(html).toContain('Leak check');
    expect(html).toContain('Alex');
    expect(fileName).toBe('Leak-check.pdf');
    expect(result.current.state.sharing).toBe(false);
    expect(result.current.state.error).toBeNull();
  });

  it('sets sharing while the share call is in flight', async () => {
    let resolveShare: (() => void) | undefined;
    shareReportPdfMock.mockImplementation(
      () =>
        new Promise(resolve => {
          resolveShare = () => resolve();
        }),
    );
    const { result } = await renderHook(() => useShareReportPdf());

    let sharePromise: Promise<void> | undefined;
    await act(() => {
      sharePromise = result.current.actions.share(namedReport);
    });

    expect(result.current.state.sharing).toBe(true);

    await act(async () => {
      resolveShare?.();
      await sharePromise;
    });

    expect(result.current.state.sharing).toBe(false);
  });

  it('stores an error when share fails', async () => {
    shareReportPdfMock.mockRejectedValue(new Error('Could not create PDF'));
    const { result } = await renderHook(() => useShareReportPdf());

    await act(async () => {
      await result.current.actions.share(namedReport);
    });

    expect(result.current.state.error).toBe('Could not create PDF');
    expect(result.current.state.sharing).toBe(false);
  });

  it('does not store an error when the user cancels the share sheet', async () => {
    shareReportPdfMock.mockRejectedValue(new Error('User did not share'));
    const { result } = await renderHook(() => useShareReportPdf());

    await act(async () => {
      await result.current.actions.share(namedReport);
    });

    expect(result.current.state.error).toBeNull();
    expect(result.current.state.sharing).toBe(false);
  });
});
