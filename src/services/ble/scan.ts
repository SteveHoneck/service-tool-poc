import {BleManager} from 'react-native-ble-plx';
import {TOOL_DEVICE_NAME_PREFIX} from './constants';

/** Scan until the tool is advertising again, then return its device id. */
export function scanForToolDevice(
  manager: BleManager,
  preferredDeviceId: string,
  timeoutMs: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    let settled = false;

    const finish = (action: () => void) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      action();
    };

    const timer = setTimeout(() => {
      manager.stopDeviceScan().catch(() => {});
      finish(() =>
        reject(
          new Error(
            'Tool not found — open Tool Mode and tap Start Advertising',
          ),
        ),
      );
    }, timeoutMs);

    manager
      .startDeviceScan(null, {allowDuplicates: false}, (error, device) => {
        if (settled || error || !device) {
          return;
        }

        const isTarget =
          device.id === preferredDeviceId ||
          device.name?.startsWith(TOOL_DEVICE_NAME_PREFIX);

        if (isTarget) {
          manager.stopDeviceScan().catch(() => {});
          finish(() => resolve(device.id));
        }
      })
      .catch(error => {
        finish(() => reject(error));
      });
  });
}
