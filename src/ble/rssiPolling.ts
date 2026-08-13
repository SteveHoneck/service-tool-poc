import {Device} from 'react-native-ble-plx';

export function startStreamingRssiPolling(
  device: Pick<Device, 'readRSSI'>,
  intervalMs: number,
  onRssi: (rssi: number | null) => void,
): () => void {
  let cancelled = false;

  const refreshRssi = async () => {
    try {
      const updated = await device.readRSSI();
      if (cancelled) {
        return;
      }
      onRssi(updated.rssi);
    } catch {
      // Ignore RSSI read failures while connected.
    }
  };

  void refreshRssi();
  const interval = setInterval(refreshRssi, intervalMs);

  return () => {
    cancelled = true;
    clearInterval(interval);
  };
}
