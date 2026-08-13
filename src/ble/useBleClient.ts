import {useCallback, useEffect, useRef, useState} from 'react';
import {BleManager, Device, Subscription} from 'react-native-ble-plx';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BLE_REQUESTED_MTU,
  DIS_SERVICE_UUID,
  DIS_SERVICE_UUID_FULL,
  FIRMWARE_CHAR_UUID,
  FIRMWARE_CHAR_UUID_FULL,
  MIN_COMPATIBLE_FIRMWARE,
  RECONNECT_SCAN_TIMEOUT_MS,
  TELEMETRY_CHAR_UUID,
  TELEMETRY_CHAR_UUID_FULL,
  TELEMETRY_INTERVAL_MS,
  TOOL_DEVICE_NAME_PREFIX,
  TOOL_SERVICE_UUID,
  TOOL_SERVICE_UUID_FULL,
  uuidMatches,
} from '../ble/constants';
import {requestClientPermissions} from '../ble/permissions';
import {startStreamingRssiPolling} from '../ble/rssiPolling';
import {scanForToolDevice} from '../ble/scan';
import {withReconnect} from '../connection/reconnect';
import {
  ConnectionState,
  FirmwareCompatibility,
  ScannedDevice,
  TelemetryPayload,
} from '../types';
import {decodeBase64ToString} from '../utils/base64';
import {parseTelemetryBase64} from '../utils/telemetry';
import {isVersionCompatible} from '../utils/version';

const LAST_DEVICE_KEY = '@servicetool/last_device_id';

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

export function useBleClient() {
  const managerRef = useRef(new BleManager());
  const deviceRef = useRef<Device | null>(null);
  const monitorSubRef = useRef<Subscription | null>(null);
  const disconnectSubRef = useRef<Subscription | null>(null);
  const reconnectingRef = useRef(false);
  const targetDeviceIdRef = useRef<string | null>(null);

  const [connectionState, setConnectionState] =
    useState<ConnectionState>('idle');
  const [devices, setDevices] = useState<ScannedDevice[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<ScannedDevice | null>(
    null,
  );
  const [telemetry, setTelemetry] = useState<TelemetryPayload | null>(null);
  const [firmwareVersion, setFirmwareVersion] = useState<string | null>(null);
  const [firmwareCompatibility, setFirmwareCompatibility] =
    useState<FirmwareCompatibility>('unknown');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);

  const cleanupSubscriptions = useCallback(() => {
    monitorSubRef.current?.remove();
    monitorSubRef.current = null;
    disconnectSubRef.current?.remove();
    disconnectSubRef.current = null;
  }, []);

  const cleanupConnection = useCallback(async () => {
    cleanupSubscriptions();
    const device = deviceRef.current;
    deviceRef.current = null;
    if (device) {
      try {
        await device.cancelConnection();
      } catch {
        // Device may already be disconnected.
      }
    }
  }, [cleanupSubscriptions]);

  useEffect(() => {
    const manager = managerRef.current;
    return () => {
      reconnectingRef.current = false;
      cleanupConnection();
      manager.destroy();
    };
  }, [cleanupConnection]);

  useEffect(() => {
    if (connectionState !== 'streaming') {
      return;
    }

    const device = deviceRef.current;
    if (!device) {
      return;
    }

    return startStreamingRssiPolling(
      device,
      TELEMETRY_INTERVAL_MS,
      rssi =>
        setConnectedDevice(prev => (prev ? {...prev, rssi} : null)),
    );
  }, [connectionState]);

  const readFirmware = useCallback(async (device: Device) => {
    try {
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
        return;
      }
      const version = decodeBase64ToString(characteristic.value).trim();
      setFirmwareVersion(version);
      setFirmwareCompatibility(
        isVersionCompatible(version, MIN_COMPATIBLE_FIRMWARE)
          ? 'compatible'
          : 'incompatible',
      );
    } catch {
      setFirmwareVersion(null);
      setFirmwareCompatibility('unknown');
    }
  }, []);

  const startMonitoring = useCallback(async (device: Device) => {
    const toolService = await resolveServiceUuid(device);
    const telemetryChar = await resolveCharacteristicUuid(
      device,
      toolService,
      TELEMETRY_CHAR_UUID,
      TELEMETRY_CHAR_UUID_FULL,
    );

    monitorSubRef.current?.remove();
    monitorSubRef.current = device.monitorCharacteristicForService(
      toolService,
      telemetryChar,
      (error, characteristic) => {
        if (error) {
          setErrorMessage(error.message);
          return;
        }
        if (!characteristic?.value) {
          return;
        }
        try {
          const payload = parseTelemetryBase64(characteristic.value);
          setTelemetry(payload);
          setConnectionState('streaming');
          setErrorMessage(null);
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : 'Failed to parse telemetry payload';
          setErrorMessage(message);
        }
      },
    );
  }, []);

  const connectToDevice = useCallback(
    async (deviceId: string, isReconnect = false) => {
      setErrorMessage(null);
      setConnectionState(isReconnect ? 'reconnecting' : 'connecting');

      const manager = managerRef.current;
      await manager.stopDeviceScan();

      const device = await manager.connectToDevice(deviceId, {
        autoConnect: false,
      });
      deviceRef.current = device;
      targetDeviceIdRef.current = deviceId;

      try {
        await device.requestMTU(BLE_REQUESTED_MTU);
      } catch {
        // Continue with default MTU if negotiation fails.
      }

      await device.discoverAllServicesAndCharacteristics();
      await readFirmware(device);
      await startMonitoring(device);

      const scanned: ScannedDevice = {
        id: device.id,
        name: device.name,
        rssi: device.rssi,
      };
      setConnectedDevice(scanned);
      setConnectionState('connected');
      await AsyncStorage.setItem(LAST_DEVICE_KEY, deviceId);

      disconnectSubRef.current?.remove();
      disconnectSubRef.current = device.onDisconnected(async () => {
        if (reconnectingRef.current) {
          return;
        }
        reconnectingRef.current = true;
        setConnectionState('reconnecting');
        setTelemetry(null);

        try {
          await withReconnect(
            async () => {
              cleanupSubscriptions();
              deviceRef.current = null;
              await managerRef.current.stopDeviceScan().catch(() => {});
              const visibleDeviceId = await scanForToolDevice(
                managerRef.current,
                deviceId,
                RECONNECT_SCAN_TIMEOUT_MS,
              );
              await connectToDevice(visibleDeviceId, true);
            },
            attempt => setReconnectAttempt(attempt),
          );
        } catch {
          setConnectionState('disconnected');
          setErrorMessage(
            'Reconnection failed. Start advertising on the tool phone, then tap Reconnect Last Device.',
          );
        } finally {
          reconnectingRef.current = false;
          setReconnectAttempt(0);
        }
      });
    },
    [cleanupSubscriptions, readFirmware, startMonitoring],
  );

  const startScan = useCallback(async () => {
    const granted = await requestClientPermissions();
    if (!granted) {
      setErrorMessage('Bluetooth permissions are required');
      setConnectionState('error');
      return;
    }

    setDevices([]);
    setErrorMessage(null);
    setConnectionState('scanning');

    const manager = managerRef.current;
    const seen = new Map<string, ScannedDevice>();

    manager.startDeviceScan(null, {allowDuplicates: false}, (error, device) => {
      if (error) {
        setErrorMessage(error.message);
        setConnectionState('error');
        return;
      }
      if (!device?.name?.startsWith(TOOL_DEVICE_NAME_PREFIX)) {
        return;
      }

      seen.set(device.id, {
        id: device.id,
        name: device.name,
        rssi: device.rssi,
      });
      setDevices(Array.from(seen.values()));
    });
  }, []);

  const stopScan = useCallback(async () => {
    await managerRef.current.stopDeviceScan();
    if (connectionState === 'scanning') {
      setConnectionState('idle');
    }
  }, [connectionState]);

  const connect = useCallback(
    async (deviceId: string) => {
      await stopScan();
      try {
        await connectToDevice(deviceId);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Connection failed';
        setErrorMessage(message);
        setConnectionState('error');
      }
    },
    [connectToDevice, stopScan],
  );

  const disconnect = useCallback(async () => {
    reconnectingRef.current = true;
    targetDeviceIdRef.current = null;
    await cleanupConnection();
    reconnectingRef.current = false;
    setConnectedDevice(null);
    setTelemetry(null);
    setFirmwareVersion(null);
    setFirmwareCompatibility('unknown');
    setConnectionState('disconnected');
  }, [cleanupConnection]);

  const reconnectLastDevice = useCallback(async () => {
    const lastId = await AsyncStorage.getItem(LAST_DEVICE_KEY);
    if (!lastId) {
      setErrorMessage('No previously connected device found');
      return;
    }

    setErrorMessage(null);
    setConnectionState('reconnecting');

    try {
      await managerRef.current.stopDeviceScan().catch(() => {});
      const visibleDeviceId = await scanForToolDevice(
        managerRef.current,
        lastId,
        RECONNECT_SCAN_TIMEOUT_MS,
      );
      await connectToDevice(visibleDeviceId, true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Reconnection failed';
      setErrorMessage(message);
      setConnectionState('disconnected');
    }
  }, [connectToDevice]);

  return {
    connectionState,
    devices,
    connectedDevice,
    telemetry,
    firmwareVersion,
    firmwareCompatibility,
    errorMessage,
    reconnectAttempt,
    startScan,
    stopScan,
    connect,
    disconnect,
    reconnectLastDevice,
  };
}
