import {BleManager, Device, Subscription} from 'react-native-ble-plx';
import {uuidMatches} from '../../domain/device/uuid';
import {decodeBase64ToString} from '../../domain/telemetry/base64';
import {parseTelemetryBase64} from '../../domain/telemetry/parse';
import {ScannedDevice, TelemetryPayload} from '../../types';
import {
  BLE_REQUESTED_MTU,
  DIS_SERVICE_UUID,
  DIS_SERVICE_UUID_FULL,
  FIRMWARE_CHAR_UUID,
  FIRMWARE_CHAR_UUID_FULL,
  TELEMETRY_CHAR_UUID,
  TELEMETRY_CHAR_UUID_FULL,
  TOOL_DEVICE_NAME_PREFIX,
  TOOL_SERVICE_UUID,
  TOOL_SERVICE_UUID_FULL,
} from './constants';
import {startStreamingRssiPolling} from './rssiPolling';
import {scanForToolDevice} from './scan';

async function resolveServiceUuid(device: Device): Promise<string> {
  const services = await device.services();
  const match = services.find(s => uuidMatches(s.uuid, TOOL_SERVICE_UUID));
  return match?.uuid ?? TOOL_SERVICE_UUID_FULL;
}

async function resolveCharacteristicUuid(
  device: Device,
  serviceUuid: string,
  shortUuid: string,
  fullUuid: string,
): Promise<string> {
  const characteristics = await device.characteristicsForService(serviceUuid);
  const match = characteristics.find(c => uuidMatches(c.uuid, shortUuid));
  return match?.uuid ?? fullUuid;
}

export class BleCentralService {
  private readonly manager: BleManager;
  private connectedDevice: Device | null = null;
  private monitorSub: Subscription | null = null;
  private disconnectSub: Subscription | null = null;

  constructor(manager?: BleManager) {
    this.manager = manager ?? new BleManager();
  }

  destroy(): void {
    this.removeSubscriptions();
    this.connectedDevice = null;
    this.manager.destroy();
  }

  removeSubscriptions(): void {
    this.monitorSub?.remove();
    this.monitorSub = null;
    this.disconnectSub?.remove();
    this.disconnectSub = null;
  }

  async stopScan(): Promise<void> {
    await this.manager.stopDeviceScan().catch(() => {});
  }

  startScan(
    onDevice: (device: ScannedDevice) => void,
    onError: (message: string) => void,
  ): void {
    this.manager.startDeviceScan(null, {allowDuplicates: false}, (error, device) => {
      if (error) {
        onError(error.message);
        return;
      }
      if (!device?.name?.startsWith(TOOL_DEVICE_NAME_PREFIX)) {
        return;
      }

      onDevice({
        id: device.id,
        name: device.name,
        rssi: device.rssi,
      });
    });
  }

  async findToolDevice(
    preferredDeviceId: string,
    timeoutMs: number,
  ): Promise<string> {
    return scanForToolDevice(this.manager, preferredDeviceId, timeoutMs);
  }

  async connect(deviceId: string): Promise<ScannedDevice> {
    await this.stopScan();

    const device = await this.manager.connectToDevice(deviceId, {
      autoConnect: false,
    });
    this.connectedDevice = device;

    try {
      await device.requestMTU(BLE_REQUESTED_MTU);
    } catch {
      // Continue with default MTU if negotiation fails.
    }

    await device.discoverAllServicesAndCharacteristics();

    return {
      id: device.id,
      name: device.name,
      rssi: device.rssi,
    };
  }

  async readFirmwareVersion(): Promise<string | null> {
    const device = this.connectedDevice;
    if (!device) {
      return null;
    }

    const services = await device.services();
    const disService =
      services.find(s => uuidMatches(s.uuid, DIS_SERVICE_UUID))?.uuid ??
      DIS_SERVICE_UUID_FULL;
    const firmwareChar = await resolveCharacteristicUuid(
      device,
      disService,
      FIRMWARE_CHAR_UUID,
      FIRMWARE_CHAR_UUID_FULL,
    );
    const characteristic = await device.readCharacteristicForService(
      disService,
      firmwareChar,
    );

    if (!characteristic.value) {
      return null;
    }

    return decodeBase64ToString(characteristic.value).trim();
  }

  monitorTelemetry(
    onPayload: (payload: TelemetryPayload) => void,
    onError: (message: string) => void,
  ): void {
    const device = this.connectedDevice;
    if (!device) {
      return;
    }

    void (async () => {
      const toolService = await resolveServiceUuid(device);
      const telemetryChar = await resolveCharacteristicUuid(
        device,
        toolService,
        TELEMETRY_CHAR_UUID,
        TELEMETRY_CHAR_UUID_FULL,
      );

      this.monitorSub?.remove();
      this.monitorSub = device.monitorCharacteristicForService(
        toolService,
        telemetryChar,
        (error, characteristic) => {
          if (error) {
            onError(error.message);
            return;
          }
          if (!characteristic?.value) {
            return;
          }
          try {
            onPayload(parseTelemetryBase64(characteristic.value));
          } catch (parseError) {
            const message =
              parseError instanceof Error
                ? parseError.message
                : 'Failed to parse telemetry payload';
            onError(message);
          }
        },
      );
    })();
  }

  onDisconnected(handler: () => void): void {
    const device = this.connectedDevice;
    if (!device) {
      return;
    }

    this.disconnectSub?.remove();
    this.disconnectSub = device.onDisconnected(handler);
  }

  startRssiPolling(
    intervalMs: number,
    onRssi: (rssi: number | null) => void,
  ): () => void {
    const device = this.connectedDevice;
    if (!device) {
      return () => {};
    }

    return startStreamingRssiPolling(device, intervalMs, onRssi);
  }

  async disconnect(): Promise<void> {
    this.removeSubscriptions();
    const device = this.connectedDevice;
    this.connectedDevice = null;

    if (device) {
      try {
        await device.cancelConnection();
      } catch {
        // Device may already be disconnected.
      }
    }
  }

  clearConnectedDevice(): void {
    this.connectedDevice = null;
  }
}
