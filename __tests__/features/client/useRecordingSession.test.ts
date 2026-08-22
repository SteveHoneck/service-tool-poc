import {act, renderHook} from '@testing-library/react-native';
import {useRecordingSession} from '../../../src/features/client/hooks/useRecordingSession';
import {ConnectionState, TelemetryPayload} from '../../../src/types';

function payload(ppm: number, timestamp: number): TelemetryPayload {
  return {ppm, status: 'running', timestamp};
}

describe('useRecordingSession', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const streaming = {
    connectionState: 'streaming' as ConnectionState,
    hasDevice: true,
    canStartRecording: true,
  };

  it('logs the live sample when recording starts', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(50);

    const {result} = await renderHook(() =>
      useRecordingSession({
        ...streaming,
        telemetry: payload(100, 1_700_000_000_000),
      }),
    );

    await act(() => {
      result.current.actions.startRecording();
    });

    expect(result.current.state.isRecording).toBe(true);
    expect(result.current.state.status).toBe('recording');
    expect(result.current.state.samples).toEqual([
      {ppm: 100, timestamp: 1_700_000_000_000},
    ]);
  });

  it('appends later samples and ignores a missing stream', async () => {
    const {result, rerender} = await renderHook(
      ({telemetry}: {telemetry: TelemetryPayload | null}) =>
        useRecordingSession({
          ...streaming,
          telemetry,
        }),
      {initialProps: {telemetry: payload(100, 1)}},
    );

    await act(() => {
      result.current.actions.startRecording();
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
    expect(result.current.state.status).toBe('recording');

    await rerender({telemetry: payload(90, 3)});
    expect(result.current.state.samples).toEqual([
      {ppm: 100, timestamp: 1},
      {ppm: 180, timestamp: 2},
      {ppm: 90, timestamp: 3},
    ]);
  });

  it('endCapture returns the log, clears it, and does not append further', async () => {
    const {result, rerender} = await renderHook(
      ({telemetry}: {telemetry: TelemetryPayload}) =>
        useRecordingSession({
          ...streaming,
          telemetry,
        }),
      {initialProps: {telemetry: payload(100, 1)}},
    );

    await act(() => {
      result.current.actions.startRecording();
    });
    await rerender({telemetry: payload(180, 2)});

    let captured;
    await act(() => {
      captured = result.current.actions.endCapture();
    });
    expect(captured).toEqual({
      samples: [
        {ppm: 100, timestamp: 1},
        {ppm: 180, timestamp: 2},
      ],
      gaps: [],
      partial: false,
    });
    expect(result.current.state.isRecording).toBe(false);
    expect(result.current.state.samples).toEqual([]);

    await rerender({telemetry: payload(200, 3)});
    expect(result.current.state.samples).toEqual([]);

    await act(() => {
      result.current.actions.startRecording();
    });
    expect(result.current.state.isRecording).toBe(true);
    expect(result.current.state.samples).toEqual([
      {ppm: 200, timestamp: 3},
    ]);
  });

  it('pauses on BLE drop, keeps the log after reconnect fails, and discards on hang-up', async () => {
    const {result, rerender} = await renderHook(
      ({
        telemetry,
        connectionState,
        hasDevice,
        canStartRecording,
      }: {
        telemetry: TelemetryPayload | null;
        connectionState: ConnectionState;
        hasDevice: boolean;
        canStartRecording: boolean;
      }) =>
        useRecordingSession({
          telemetry,
          connectionState,
          hasDevice,
          canStartRecording,
        }),
      {
        initialProps: {
          telemetry: payload(100, 1),
          connectionState: 'streaming' as ConnectionState,
          hasDevice: true,
          canStartRecording: true,
        },
      },
    );

    await act(() => {
      result.current.actions.startRecording();
    });

    await rerender({
      telemetry: null,
      connectionState: 'reconnecting',
      hasDevice: true,
      canStartRecording: false,
    });
    expect(result.current.state.status).toBe('paused_disconnect');
    expect(result.current.state.samples).toEqual([{ppm: 100, timestamp: 1}]);
    expect(result.current.state.gaps).toEqual([
      {at: 1, reason: 'disconnect'},
    ]);

    await rerender({
      telemetry: null,
      connectionState: 'disconnected',
      hasDevice: true,
      canStartRecording: false,
    });
    expect(result.current.state.status).toBe('paused_disconnect');
    expect(result.current.state.samples).toEqual([{ppm: 100, timestamp: 1}]);

    await rerender({
      telemetry: payload(80, 2),
      connectionState: 'streaming',
      hasDevice: true,
      canStartRecording: true,
    });
    expect(result.current.state.status).toBe('recording');
    expect(result.current.state.samples).toEqual([
      {ppm: 100, timestamp: 1},
      {ppm: 80, timestamp: 2},
    ]);

    await rerender({
      telemetry: null,
      connectionState: 'disconnected',
      hasDevice: false,
      canStartRecording: false,
    });
    expect(result.current.state.status).toBe('idle');
    expect(result.current.state.samples).toEqual([]);
    expect(result.current.state.gaps).toEqual([]);
  });

  it('marks a capture partial when Stop happens while paused', async () => {
    const {result, rerender} = await renderHook(
      ({
        telemetry,
        connectionState,
      }: {
        telemetry: TelemetryPayload | null;
        connectionState: ConnectionState;
      }) =>
        useRecordingSession({
          ...streaming,
          telemetry,
          connectionState,
        }),
      {
        initialProps: {
          telemetry: payload(100, 1),
          connectionState: 'streaming' as ConnectionState,
        },
      },
    );

    await act(() => {
      result.current.actions.startRecording();
    });
    await rerender({
      telemetry: null,
      connectionState: 'reconnecting',
    });

    let captured;
    await act(() => {
      captured = result.current.actions.endCapture();
    });
    expect(captured).toEqual({
      samples: [{ppm: 100, timestamp: 1}],
      gaps: [{at: 1, reason: 'disconnect'}],
      partial: true,
    });
  });

  it('keeps the gap but is not partial after reconnect then Stop', async () => {
    const {result, rerender} = await renderHook(
      ({
        telemetry,
        connectionState,
      }: {
        telemetry: TelemetryPayload | null;
        connectionState: ConnectionState;
      }) =>
        useRecordingSession({
          ...streaming,
          telemetry,
          connectionState,
        }),
      {
        initialProps: {
          telemetry: payload(100, 1),
          connectionState: 'streaming' as ConnectionState,
        },
      },
    );

    await act(() => {
      result.current.actions.startRecording();
    });
    await rerender({
      telemetry: null,
      connectionState: 'reconnecting',
    });
    await rerender({
      telemetry: payload(80, 2),
      connectionState: 'streaming',
    });

    let captured;
    await act(() => {
      captured = result.current.actions.endCapture();
    });
    expect(captured).toEqual({
      samples: [
        {ppm: 100, timestamp: 1},
        {ppm: 80, timestamp: 2},
      ],
      gaps: [{at: 1, reason: 'disconnect'}],
      partial: false,
    });
  });
});
