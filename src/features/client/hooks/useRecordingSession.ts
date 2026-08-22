import {useCallback, useEffect, useState} from 'react';
import {
  appendPpmSample,
  toPpmSample,
} from '../../../domain/session/recording';
import {PpmSample, TelemetryPayload} from '../../../types';

export interface RecordingSessionState {
  isRecording: boolean;
  samples: PpmSample[];
  isRecordDisabled: boolean;
}

export interface RecordingSessionActions {
  startRecording: () => void;
  endCapture: () => PpmSample[];
}

interface Params {
  telemetry: TelemetryPayload | null;
  isConnected: boolean;
  canStartRecording: boolean;
}

export function useRecordingSession({
  telemetry,
  isConnected,
  canStartRecording,
}: Params): {
  state: RecordingSessionState;
  actions: RecordingSessionActions;
} {
  const [isRecording, setIsRecording] = useState(false);
  const [samples, setSamples] = useState<PpmSample[]>([]);

  if (!isConnected) {
    if (isRecording) {
      setIsRecording(false);
    }
    if (samples.length > 0) {
      setSamples([]);
    }
  }

  useEffect(() => {
    if (!isRecording || telemetry == null) {
      return;
    }
    setSamples(prev => appendPpmSample(prev, toPpmSample(telemetry)));
  }, [isRecording, telemetry]);

  const startRecording = useCallback(() => {
    setSamples([]);
    setIsRecording(true);
  }, []);

  const endCapture = useCallback((): PpmSample[] => {
    const captured = samples;
    setIsRecording(false);
    setSamples([]);
    return captured;
  }, [samples]);

  return {
    state: {
      isRecording,
      samples,
      isRecordDisabled: !isRecording && !canStartRecording,
    },
    actions: {startRecording, endCapture},
  };
}
