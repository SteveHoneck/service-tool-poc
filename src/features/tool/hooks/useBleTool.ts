import {useCallback, useEffect, useRef, useState} from 'react';
import {generateMockTelemetry} from '../../../domain/telemetry/mock';
import {encodeTelemetryBase64} from '../../../domain/telemetry/serialize';
import {BlePeripheralService} from '../../../services/ble/BlePeripheralService';
import {TELEMETRY_INTERVAL_MS} from '../../../services/ble/constants';
import {requestToolPermissions} from '../../../services/ble/permissions';
import {TelemetryPayload} from '../../../types';

type ToolState = 'idle' | 'starting' | 'advertising' | 'connected' | 'error';

export function useBleTool() {
  const serviceRef = useRef(new BlePeripheralService());
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
    const payload = generateMockTelemetry();
    setLastTelemetry(payload);
    await serviceRef.current.updateTelemetry(encodeTelemetryBase64(payload));
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
    serviceRef.current.setupGattProfile(
      encodeTelemetryBase64(generateMockTelemetry()),
    );
  }, []);

  const resetAdvertisingSession = useCallback(async () => {
    advertisingStartedRef.current = false;
    stopStreamingRef.current();
    serviceRef.current.stopAdvertising();
    await serviceRef.current.resetSession();
    setConnectedCentrals(0);
  }, []);

  useEffect(() => {
    const service = serviceRef.current;

    return service.subscribeEvents({
      onReadRequest: event => {
        if (
          service.isFirmwareReadRequest(
            event.serviceUUID,
            event.characteristicUUID,
          )
        ) {
          service.handleFirmwareReadRequest(event.requestId);
          return;
        }
        service.respondSuccess(event.requestId);
      },
      onWriteRequests: event => {
        event.requests.forEach(req => {
          const command = service.decodeWriteCommand(req.value);
          if (command === 'start') {
            startStreamingRef.current();
          } else if (command === 'stop') {
            stopStreamingRef.current();
          }
        });
        service.respondSuccess(event.requestId);
      },
      onSubscribe: () => {
        setConnectedCentrals(prev => prev + 1);
        setToolState('connected');
        startStreamingRef.current();
      },
      onUnsubscribe: () => {
        setConnectedCentrals(prev => Math.max(0, prev - 1));
        stopStreamingRef.current();
        setToolState('advertising');
      },
      onAdvertisingStarted: event => {
        if (event.success) {
          advertisingStartedRef.current = true;
          setToolState(current =>
            current === 'starting' ? 'advertising' : current,
          );
          setErrorMessage(null);
        } else if (event.error) {
          setErrorMessage(event.error);
          setToolState('error');
        }
      },
    });
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

    const service = serviceRef.current;
    const state = await service.getBluetoothState();
    if (!service.isPoweredOn(state)) {
      setErrorMessage('Bluetooth is not powered on');
      setToolState('error');
      return;
    }

    try {
      await resetAdvertisingSession();
      setupGattProfile();
      service.setDeviceName();

      await service.startAdvertising(
        () => advertisingStartedRef.current,
      );

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
