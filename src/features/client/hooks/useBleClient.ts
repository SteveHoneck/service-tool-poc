import {useCallback, useEffect, useRef, useState} from 'react';
import {withReconnect} from '../../../domain/connection/reconnect';
import {isVersionCompatible} from '../../../domain/device/version';
import {BleCentralService} from '../../../services/ble/BleCentralService';
import {
  MIN_COMPATIBLE_FIRMWARE,
  RECONNECT_SCAN_TIMEOUT_MS,
  TELEMETRY_INTERVAL_MS,
} from '../../../services/ble/constants';
import {requestClientPermissions} from '../../../services/ble/permissions';
import {
  getLastDeviceId,
  setLastDeviceId,
} from '../../../services/storage/deviceStorage';
import {
  ConnectionState,
  FirmwareCompatibility,
  ScannedDevice,
  TelemetryPayload,
} from '../../../types';

export function useBleClient() {
  const serviceRef = useRef(new BleCentralService());
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
    serviceRef.current.removeSubscriptions();
  }, []);

  const cleanupConnection = useCallback(async () => {
    await serviceRef.current.disconnect();
  }, []);

  useEffect(() => {
    const service = serviceRef.current;
    return () => {
      reconnectingRef.current = false;
      void cleanupConnection();
      service.destroy();
    };
  }, [cleanupConnection]);

  useEffect(() => {
    if (connectionState !== 'streaming') {
      return;
    }

    return serviceRef.current.startRssiPolling(TELEMETRY_INTERVAL_MS, rssi =>
      setConnectedDevice(prev => (prev ? {...prev, rssi} : null)),
    );
  }, [connectionState]);

  const applyFirmwareVersion = useCallback(async () => {
    try {
      const version = await serviceRef.current.readFirmwareVersion();
      if (!version) {
        setFirmwareVersion(null);
        setFirmwareCompatibility('unknown');
        return;
      }

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

  const startMonitoring = useCallback(() => {
    serviceRef.current.monitorTelemetry(
      payload => {
        setTelemetry(payload);
        setConnectionState('streaming');
        setErrorMessage(null);
      },
      message => setErrorMessage(message),
    );
  }, []);

  const connectToDevice = useCallback(
    async (deviceId: string, isReconnect = false) => {
      setErrorMessage(null);
      setConnectionState(isReconnect ? 'reconnecting' : 'connecting');

      const service = serviceRef.current;
      const scanned = await service.connect(deviceId);
      targetDeviceIdRef.current = deviceId;

      await applyFirmwareVersion();
      startMonitoring();

      setConnectedDevice(scanned);
      setConnectionState('connected');
      await setLastDeviceId(deviceId);

      service.onDisconnected(async () => {
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
              service.clearConnectedDevice();
              await service.stopScan();
              const visibleDeviceId = await service.findToolDevice(
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
    [applyFirmwareVersion, cleanupSubscriptions, startMonitoring],
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

    const seen = new Map<string, ScannedDevice>();

    serviceRef.current.startScan(
      device => {
        seen.set(device.id, device);
        setDevices(Array.from(seen.values()));
      },
      message => {
        setErrorMessage(message);
        setConnectionState('error');
      },
    );
  }, []);

  const stopScan = useCallback(async () => {
    await serviceRef.current.stopScan();
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
    const lastId = await getLastDeviceId();
    if (!lastId) {
      setErrorMessage('No previously connected device found');
      return;
    }

    setErrorMessage(null);
    setConnectionState('reconnecting');

    try {
      const service = serviceRef.current;
      await service.stopScan();
      const visibleDeviceId = await service.findToolDevice(
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
