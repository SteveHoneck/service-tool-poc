import {act, renderHook} from '@testing-library/react-native';
import {useRecordingSession} from '../../../src/features/client/hooks/useRecordingSession';
import {TelemetryPayload} from '../../../src/types';

function payload(ppm: number, timestamp: number): TelemetryPayload {
  return {ppm, status: 'running', timestamp};
}

describe('useRecordingSession', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const connected = {
    isConnected: true,
    canStartRecording: true,
  };

  it('logs the live sample when Record is pressed', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(50);

    const {result} = await renderHook(() =>
      useRecordingSession({
        ...connected,
        telemetry: payload(100, 1_700_000_000_000),
      }),
    );

    await act(() => {
      result.current.actions.toggleRecording();
    });

    expect(result.current.state.isRecording).toBe(true);
    expect(result.current.state.samples).toEqual([
      {ppm: 100, timestamp: 1_700_000_000_000},
    ]);
  });

  it('appends later samples and ignores a missing stream', async () => {
    const {result, rerender} = await renderHook(
      ({telemetry}: {telemetry: TelemetryPayload | null}) =>
        useRecordingSession({
          ...connected,
          telemetry,
        }),
      {initialProps: {telemetry: payload(100, 1)}},
    );

    await act(() => {
      result.current.actions.toggleRecording();
    });

    await rerender({telemetry: payload(180, 2)});
    expect(result.current.state.samples).toEqual([
      {ppm: 100, timestamp: 1},
      {ppm: 180, timestamp: 2},
    ]);

    await rerender({telemetry: null});
    expect(result.current.state.samples).toEqual([
      {ppm: 100, timestamp: 1},
      {ppm: 180, timestamp: 2},
    ]);
    expect(result.current.state.isRecording).toBe(true);

    await rerender({telemetry: payload(90, 3)});
    expect(result.current.state.samples).toEqual([
      {ppm: 100, timestamp: 1},
      {ppm: 180, timestamp: 2},
      {ppm: 90, timestamp: 3},
    ]);
  });

  it('stops appending after Stop and starts a new log on Record', async () => {
    const {result, rerender} = await renderHook(
      ({telemetry}: {telemetry: TelemetryPayload}) =>
        useRecordingSession({
          ...connected,
          telemetry,
        }),
      {initialProps: {telemetry: payload(100, 1)}},
    );

    await act(() => {
      result.current.actions.toggleRecording();
    });
    await rerender({telemetry: payload(180, 2)});

    await act(() => {
      result.current.actions.toggleRecording();
    });
    expect(result.current.state.isRecording).toBe(false);

    await rerender({telemetry: payload(200, 3)});
    expect(result.current.state.samples).toEqual([
      {ppm: 100, timestamp: 1},
      {ppm: 180, timestamp: 2},
    ]);

    await act(() => {
      result.current.actions.toggleRecording();
    });
    expect(result.current.state.isRecording).toBe(true);
    expect(result.current.state.samples).toEqual([
      {ppm: 200, timestamp: 3},
    ]);
  });

  it('clears recording on full disconnect and keeps it across reconnecting', async () => {
    const {result, rerender} = await renderHook(
      ({
        telemetry,
        isConnected,
        canStartRecording,
      }: {
        telemetry: TelemetryPayload | null;
        isConnected: boolean;
        canStartRecording: boolean;
      }) =>
        useRecordingSession({telemetry, isConnected, canStartRecording}),
      {
        initialProps: {
          telemetry: payload(100, 1),
          isConnected: true,
          canStartRecording: true,
        },
      },
    );

    await act(() => {
      result.current.actions.toggleRecording();
    });

    await rerender({
      telemetry: null,
      isConnected: true,
      canStartRecording: false,
    });
    expect(result.current.state.isRecording).toBe(true);
    expect(result.current.state.samples).toEqual([{ppm: 100, timestamp: 1}]);

    await rerender({
      telemetry: payload(80, 2),
      isConnected: true,
      canStartRecording: true,
    });
    expect(result.current.state.samples).toEqual([
      {ppm: 100, timestamp: 1},
      {ppm: 80, timestamp: 2},
    ]);

    await rerender({
      telemetry: null,
      isConnected: false,
      canStartRecording: false,
    });
    expect(result.current.state.isRecording).toBe(false);
    expect(result.current.state.samples).toEqual([]);
  });
});
