import {ConnectionState, ScannedDevice} from '../../types';

/** Scan hits are only current while a scan is running — not after a drop. */
export function scanResultsForDisplay(
  connectionState: ConnectionState,
  devices: ScannedDevice[],
): ScannedDevice[] {
  if (connectionState !== 'scanning') {
    return [];
  }
  return devices;
}
