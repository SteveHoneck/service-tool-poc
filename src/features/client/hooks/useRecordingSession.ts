import {useCallback, useEffect, useState} from 'react';
import {
  appendDisconnectGap,
  appendPpmSample,
  disconnectGapAt,
  isSessionActive,
  shouldDiscardRecording,
  shouldPauseForDisconnect,
  shouldResumeFromDisconnect,
  toPpmSample,
  toSessionCapture,
  RecordingStatus,
} from '../../../domain/session/recording';
import {
  ConnectionState,
  PpmSample,
  SessionCapture,
  SessionGap,
  TelemetryPayload,
} from '../../../types';

export interface RecordingSessionState {
  status: RecordingStatus;
  isRecording: boolean;
  samples: PpmSample[];
  gaps: SessionGap[];
  isRecordDisabled: boolean;
}

export interface RecordingSessionActions {
  startRecording: () => void;
  endCapture: () => SessionCapture;
}

interface Params {
  telemetry: TelemetryPayload | null;
  connectionState: ConnectionState;
  hasDevice: boolean;
  canStartRecording: boolean;
}

export function useRecordingSession({
  telemetry,
  connectionState,
  hasDevice,
  canStartRecording,
}: Params): {
  state: RecordingSessionState;
  actions: RecordingSessionActions;
} {
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [samples, setSamples] = useState<PpmSample[]>([]);
  const [gaps, setGaps] = useState<SessionGap[]>([]);

  if (shouldDiscardRecording(status, hasDevice)) {
    setStatus('idle');
    setSamples([]);
    setGaps([]);
  }

  useEffect(() => {
    const hasTelemetry = telemetry != null;
    if (shouldPauseForDisconnect(status, hasTelemetry, connectionState)) {
      setStatus('paused_disconnect');
      setGaps(prev =>
        appendDisconnectGap(
          prev,
          disconnectGapAt(samples[samples.length - 1], Date.now()),
        ),
      );
      return;
    }
    if (shouldResumeFromDisconnect(status, hasTelemetry) && telemetry) {
      setStatus('recording');
      setSamples(prev => appendPpmSample(prev, toPpmSample(telemetry)));
      return;
    }
    if (status === 'recording' && telemetry) {
      setSamples(prev => appendPpmSample(prev, toPpmSample(telemetry)));
    }
  }, [connectionState, samples, status, telemetry]);

  const startRecording = useCallback(() => {
    setGaps([]);
    setSamples([]);
    setStatus('recording');
  }, []);

  const endCapture = useCallback((): SessionCapture => {
    const captured = toSessionCapture(samples, gaps, status);
    setStatus('idle');
    setSamples([]);
    setGaps([]);
    return captured;
  }, [gaps, samples, status]);

  const isRecording = isSessionActive(status);

  return {
    state: {
      status,
      isRecording,
      samples,
      gaps,
      isRecordDisabled: !isRecording && !canStartRecording,
    },
    actions: {startRecording, endCapture},
  };
}
