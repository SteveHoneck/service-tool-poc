import {useCallback, useEffect, useRef, useState} from 'react';
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
  startAdvertising,
  stopAdvertising,
  updateValueBase64,
  type EventDidReceiveReadRequest,
  type EventDidReceiveWriteRequests,
  type EventDidStartAdvertising,
} from 'react-native-ble-peripheral-manager';
import {
  COMMAND_CHAR_UUID_FULL,
  DIS_SERVICE_UUID,
  DIS_SERVICE_UUID_FULL,
  FIRMWARE_CHAR_UUID,
  FIRMWARE_CHAR_UUID_FULL,
  FIRMWARE_VERSION,
  STATUS_CHAR_UUID_FULL,
  TELEMETRY_CHAR_UUID_FULL,
  TELEMETRY_INTERVAL_MS,
  TOOL_DEVICE_NAME,
  TOOL_SERVICE_UUID_FULL,
  ADVERTISING_START_TIMEOUT_MS,
  uuidMatches,
} from '../ble/constants';
import {requestToolPermissions} from '../ble/permissions';
import {delay} from '../connection/reconnect';
import {TelemetryPayload} from '../types';
import {encodeTelemetryBase64} from '../utils/telemetry';

type ToolState = 'idle' | 'starting' | 'advertising' | 'connected' | 'error';

function generateTelemetry(): TelemetryPayload {
  return {
    temp: Math.round((20 + Math.random() * 15) * 10) / 10,
    rpm: 1000 + Math.floor(Math.random() * 500),
    status: 'running',
    timestamp: Date.now(),
  };
}

export function useBleTool() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamingRef = useRef(false);
  const startStreamingRef = useRef<() => void>(() => {});
  const stopStreamingRef = useRef<() => void>(() => {});
  const advertisingStartedRef = useRef(false);
  const [toolState, setToolState] = useState<ToolState>('idle');
  const [connectedCentrals, setConnectedCentrals] = useState(0);
  const [lastTelemetry, setLastTelemetry] = useState<TelemetryPayload | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const stopStreaming = useCallback(() => {
    streamingRef.current = false;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const pushTelemetry = useCallback(async () => {
    const payload = generateTelemetry();
    setLastTelemetry(payload);
    await updateValueBase64(
      TOOL_SERVICE_UUID_FULL,
      TELEMETRY_CHAR_UUID_FULL,
      encodeTelemetryBase64(payload),
    );
  }, []);

  const startStreaming = useCallback(() => {
    if (streamingRef.current) {
      return;
    }
    streamingRef.current = true;
    pushTelemetry();
    intervalRef.current = setInterval(pushTelemetry, TELEMETRY_INTERVAL_MS);
  }, [pushTelemetry]);

  startStreamingRef.current = startStreaming;
  stopStreamingRef.current = stopStreaming;

  const setupGattProfile = useCallback(() => {
    removeAllServices();

    addService(TOOL_SERVICE_UUID_FULL, true);
    addCharacteristicToServiceBase64(
      TOOL_SERVICE_UUID_FULL,
      TELEMETRY_CHAR_UUID_FULL,
      CharacteristicProperties.Read | CharacteristicProperties.Notify,
      CharacteristicPermissions.Readable,
      encodeTelemetryBase64(generateTelemetry()),
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
  }, []);

  const resetAdvertisingSession = useCallback(async () => {
    advertisingStartedRef.current = false;
    stopStreamingRef.current();
    stopAdvertising();
    removeAllServices();
    setConnectedCentrals(0);
    await delay(400);
  }, []);

  useEffect(() => {
    const readSub = onDidReceiveReadRequest((event: EventDidReceiveReadRequest) => {
      if (
        uuidMatches(event.serviceUUID, DIS_SERVICE_UUID) &&
        uuidMatches(event.characteristicUUID, FIRMWARE_CHAR_UUID)
      ) {
        respondToRequest(event.requestId, ATTError.Success, FIRMWARE_VERSION);
        return;
      }
      respondToRequest(event.requestId, ATTError.Success);
    });

    const writeSub = onDidReceiveWriteRequests((event: EventDidReceiveWriteRequests) => {
      event.requests.forEach(req => {
        const command = decodeBase64(req.value).trim().toLowerCase();
        if (command === 'start') {
          startStreamingRef.current();
        } else if (command === 'stop') {
          stopStreamingRef.current();
        }
      });
      respondToRequest(event.requestId, ATTError.Success);
    });

    const subscribeSub = onDidSubscribeToCharacteristic(() => {
      setConnectedCentrals(prev => prev + 1);
      setToolState('connected');
      startStreamingRef.current();
    });

    const unsubscribeSub = onDidUnsubscribeFromCharacteristic(() => {
      setConnectedCentrals(prev => Math.max(0, prev - 1));
      stopStreamingRef.current();
      setToolState('advertising');
    });

    const advertisingSub = onDidStartAdvertising((event: EventDidStartAdvertising) => {
      if (event.success) {
        advertisingStartedRef.current = true;
        setToolState(current => (current === 'starting' ? 'advertising' : current));
        setErrorMessage(null);
      } else if (event.error) {
        setErrorMessage(event.error);
        setToolState('error');
      }
    });

    return () => {
      readSub.remove();
      writeSub.remove();
      subscribeSub.remove();
      unsubscribeSub.remove();
      advertisingSub.remove();
    };
  }, []);

  const startTool = useCallback(async () => {
    setErrorMessage(null);
    setToolState('starting');
    advertisingStartedRef.current = false;

    const granted = await requestToolPermissions();
    if (!granted) {
      setErrorMessage('Bluetooth permissions are required');
      setToolState('error');
      return;
    }

    const state = await getState();
    if (state !== ManagerState.PoweredOn) {
      setErrorMessage('Bluetooth is not powered on');
      setToolState('error');
      return;
    }

    try {
      await resetAdvertisingSession();
      setupGattProfile();
      setName(TOOL_DEVICE_NAME);

      await Promise.race([
        startAdvertising({
          localName: TOOL_DEVICE_NAME,
          serviceUUIDs: [TOOL_SERVICE_UUID_FULL],
        }),
        delay(ADVERTISING_START_TIMEOUT_MS).then(() => {
          if (advertisingStartedRef.current) {
            return;
          }
          throw new Error(
            'Advertising timed out — toggle Bluetooth off/on, then retry',
          );
        }),
      ]);

      if (!advertisingStartedRef.current) {
        setToolState('advertising');
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to start advertising';
      setErrorMessage(message);
      setToolState('error');
    }
  }, [resetAdvertisingSession, setupGattProfile]);

  const stopTool = useCallback(async () => {
    await resetAdvertisingSession();
    setToolState('idle');
    setErrorMessage(null);
  }, [resetAdvertisingSession]);

  return {
    toolState,
    connectedCentrals,
    lastTelemetry,
    errorMessage,
    startTool,
    stopTool,
  };
}
