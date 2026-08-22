import {PpmSample, TelemetryPayload} from '../../types';

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
