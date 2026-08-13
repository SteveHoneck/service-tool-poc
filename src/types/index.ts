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
  temp: number;
  rpm: number;
  status: string;
  timestamp: number;
}

export interface ScannedDevice {
  id: string;
  name: string | null;
  rssi: number | null;
}

export type FirmwareCompatibility = 'compatible' | 'incompatible' | 'unknown';
