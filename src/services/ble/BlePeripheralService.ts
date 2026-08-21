import {
  ATTError,
  CharacteristicPermissions,
  CharacteristicProperties,
  ManagerState,
  addCharacteristicToService,
  addCharacteristicToServiceBase64,
  addService,
  decodeBase64,
  getState,
  onDidReceiveReadRequest,
  onDidReceiveWriteRequests,
  onDidStartAdvertising,
  onDidSubscribeToCharacteristic,
  onDidUnsubscribeFromCharacteristic,
  removeAllServices,
  respondToRequest,
  setName,
  startAdvertising as startNativeAdvertising,
  stopAdvertising as stopNativeAdvertising,
  updateValueBase64,
  type EventDidReceiveReadRequest,
  type EventDidReceiveWriteRequests,
  type EventDidStartAdvertising,
} from 'react-native-ble-peripheral-manager';
import {delay} from '../../domain/connection/reconnect';
import {uuidMatches} from '../../domain/device/uuid';
import {
  ADVERTISING_START_TIMEOUT_MS,
  COMMAND_CHAR_UUID_FULL,
  DIS_SERVICE_UUID,
  DIS_SERVICE_UUID_FULL,
  FIRMWARE_CHAR_UUID,
  FIRMWARE_CHAR_UUID_FULL,
  FIRMWARE_VERSION,
  STATUS_CHAR_UUID_FULL,
  TELEMETRY_CHAR_UUID_FULL,
  TOOL_DEVICE_NAME,
  TOOL_SERVICE_UUID_FULL,
} from './constants';

export type PeripheralEventHandlers = {
  onReadRequest: (event: EventDidReceiveReadRequest) => void;
  onWriteRequests: (event: EventDidReceiveWriteRequests) => void;
  onSubscribe: () => void;
  onUnsubscribe: () => void;
  onAdvertisingStarted: (event: EventDidStartAdvertising) => void;
};

export class BlePeripheralService {
  setupGattProfile(initialTelemetryBase64: string): void {
    removeAllServices();

    addService(TOOL_SERVICE_UUID_FULL, true);
    addCharacteristicToServiceBase64(
      TOOL_SERVICE_UUID_FULL,
      TELEMETRY_CHAR_UUID_FULL,
      CharacteristicProperties.Read | CharacteristicProperties.Notify,
      CharacteristicPermissions.Readable,
      initialTelemetryBase64,
    );
    addCharacteristicToService(
      TOOL_SERVICE_UUID_FULL,
      COMMAND_CHAR_UUID_FULL,
      CharacteristicProperties.Write,
      CharacteristicPermissions.Writeable,
    );
    addCharacteristicToService(
      TOOL_SERVICE_UUID_FULL,
      STATUS_CHAR_UUID_FULL,
      CharacteristicProperties.Read,
      CharacteristicPermissions.Readable,
      'idle',
    );

    addService(DIS_SERVICE_UUID_FULL, true);
    addCharacteristicToService(
      DIS_SERVICE_UUID_FULL,
      FIRMWARE_CHAR_UUID_FULL,
      CharacteristicProperties.Read,
      CharacteristicPermissions.Readable,
      FIRMWARE_VERSION,
    );
  }

  async resetSession(): Promise<void> {
    stopNativeAdvertising();
    removeAllServices();
    await delay(400);
  }

  setDeviceName(name: string = TOOL_DEVICE_NAME): void {
    setName(name);
  }

  async startAdvertising(
    isStarted: () => boolean,
    timeoutMs: number = ADVERTISING_START_TIMEOUT_MS,
  ): Promise<void> {
    await Promise.race([
      startNativeAdvertising({
        localName: TOOL_DEVICE_NAME,
        serviceUUIDs: [TOOL_SERVICE_UUID_FULL],
      }),
      delay(timeoutMs).then(() => {
        if (isStarted()) {
          return;
        }
        throw new Error(
          'Advertising timed out — toggle Bluetooth off/on, then retry',
        );
      }),
    ]);
  }

  stopAdvertising(): void {
    stopNativeAdvertising();
  }

  async updateTelemetry(base64Value: string): Promise<void> {
    await updateValueBase64(
      TOOL_SERVICE_UUID_FULL,
      TELEMETRY_CHAR_UUID_FULL,
      base64Value,
    );
  }

  async getBluetoothState(): Promise<ManagerState> {
    return getState();
  }

  isPoweredOn(state: ManagerState): boolean {
    return state === ManagerState.PoweredOn;
  }

  subscribeEvents(handlers: PeripheralEventHandlers): () => void {
    const readSub = onDidReceiveReadRequest(handlers.onReadRequest);
    const writeSub = onDidReceiveWriteRequests(handlers.onWriteRequests);
    const subscribeSub = onDidSubscribeToCharacteristic(handlers.onSubscribe);
    const unsubscribeSub = onDidUnsubscribeFromCharacteristic(
      handlers.onUnsubscribe,
    );
    const advertisingSub = onDidStartAdvertising(handlers.onAdvertisingStarted);

    return () => {
      readSub.remove();
      writeSub.remove();
      subscribeSub.remove();
      unsubscribeSub.remove();
      advertisingSub.remove();
    };
  }

  handleFirmwareReadRequest(requestId: number): void {
    respondToRequest(requestId, ATTError.Success, FIRMWARE_VERSION);
  }

  respondSuccess(requestId: number): void {
    respondToRequest(requestId, ATTError.Success);
  }

  decodeWriteCommand(value: string): string {
    return decodeBase64(value).trim().toLowerCase();
  }

  isFirmwareReadRequest(
    serviceUUID: string,
    characteristicUUID: string,
  ): boolean {
    return (
      uuidMatches(serviceUUID, DIS_SERVICE_UUID) &&
      uuidMatches(characteristicUUID, FIRMWARE_CHAR_UUID)
    );
  }
}
