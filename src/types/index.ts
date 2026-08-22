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

export interface ScannedDevice {
  id: string;
  name: string | null;
  rssi: number | null;
}

export type FirmwareCompatibility = 'compatible' | 'incompatible' | 'unknown';
