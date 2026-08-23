import {
  ConnectionState,
  PpmSample,
  SessionCapture,
  SessionGap,
  TelemetryPayload,
} from '../../types';

export type RecordingStatus = 'idle' | 'recording' | 'paused_disconnect';

/** Copy the tool sample time — never substitute client receive time. */
export function toPpmSample(
  telemetry: Pick<TelemetryPayload, 'ppm' | 'timestamp'>,
): PpmSample {
  return {
    timestamp: telemetry.timestamp,
    ppm: telemetry.ppm,
  };
}

/**
 * Append one sample. Same tool timestamp as the last entry is a no-op so
 * React rerenders do not duplicate a 1 Hz reading.
 */
export function appendPpmSample(
  samples: PpmSample[],
  sample: PpmSample,
): PpmSample[] {
  const last = samples[samples.length - 1];
  if (last !== undefined && last.timestamp === sample.timestamp) {
    return samples;
  }
  return [...samples, sample];
}

export function isSessionActive(status: RecordingStatus): boolean {
  return status !== 'idle';
}

export function shouldDiscardRecording(
  status: RecordingStatus,
  hasDevice: boolean,
): boolean {
  return isSessionActive(status) && !hasDevice;
}

export function shouldPauseForDisconnect(
  status: RecordingStatus,
  hasTelemetry: boolean,
  connectionState: ConnectionState,
): boolean {
  if (status !== 'recording' || hasTelemetry) {
    return false;
  }
  return (
    connectionState === 'reconnecting' || connectionState === 'disconnected'
  );
}

export function shouldResumeFromDisconnect(
  status: RecordingStatus,
  hasTelemetry: boolean,
): boolean {
  return status === 'paused_disconnect' && hasTelemetry;
}

export function shouldPromptPartialSave(
  status: RecordingStatus,
  connectionState: ConnectionState,
): boolean {
  return status === 'paused_disconnect' && connectionState === 'disconnected';
}

export function disconnectGapAt(
  lastSample: PpmSample | undefined,
  now: number,
): number {
  return lastSample?.timestamp ?? now;
}

export function appendDisconnectGap(
  gaps: SessionGap[],
  at: number,
): SessionGap[] {
  const last = gaps[gaps.length - 1];
  if (last !== undefined && last.at === at) {
    return gaps;
  }
  return [...gaps, {at, reason: 'disconnect'}];
}

export function toSessionCapture(
  samples: PpmSample[],
  gaps: SessionGap[],
  status: RecordingStatus,
): SessionCapture {
  return {
    samples,
    gaps,
    partial: status === 'paused_disconnect',
  };
}

export function heldPpm(
  livePpm: number | null,
  lastSample: PpmSample | undefined,
  status: RecordingStatus,
): number | null {
  if (livePpm !== null) {
    return livePpm;
  }
  if (isSessionActive(status) && lastSample !== undefined) {
    return lastSample.ppm;
  }
  return null;
}
