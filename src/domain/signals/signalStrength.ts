export type SignalStrengthLabel = 'Strong' | 'Normal' | 'Weak' | 'Very weak';

export function rssiToSignalStrength(
  rssi: number | null,
): SignalStrengthLabel | null {
  if (rssi === null) {
    return null;
  }
  if (rssi >= -50) {
    return 'Strong';
  }
  if (rssi >= -70) {
    return 'Normal';
  }
  if (rssi >= -90) {
    return 'Weak';
  }
  return 'Very weak';
}
