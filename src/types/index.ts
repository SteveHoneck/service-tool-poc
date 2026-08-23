export type AppMode = 'client' | 'tool';

export type ConnectionState =
  | 'idle'
  | 'scanning'
  | 'connecting'
  | 'connected'
  | 'streaming'
  | 'reconnecting'
  | 'disconnected'
  | 'error';

export interface TelemetryPayload {
  ppm: number;
  status: string;
  timestamp: number;
}

export interface PpmSample {
  timestamp: number;
  ppm: number;
}

export interface SessionGap {
  at: number;
  reason: 'disconnect';
}

export interface SessionCapture {
  samples: PpmSample[];
  gaps: SessionGap[];
  partial: boolean;
}

export interface SavedReportFields {
  jobName: string;
  operatorName: string;
}

export interface SavedReport {
  id: string;
  jobName: string;
  operatorName: string;
  startedAt: number;
  endedAt: number;
  ppmSamples: PpmSample[];
  maxPpm: number;
  partial: boolean;
  gaps: SessionGap[];
}

export interface ScannedDevice {
  id: string;
  name: string | null;
  rssi: number | null;
}

export type FirmwareCompatibility = 'compatible' | 'incompatible' | 'unknown';
