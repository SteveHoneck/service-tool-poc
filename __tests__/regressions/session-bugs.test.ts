/**
 * Regression tests for bugs encountered during the BLE PoC bring-up session.
 * Each describe block maps to a real failure observed on device.
 */
import {
  TOOL_SERVICE_UUID,
  TOOL_SERVICE_UUID_FULL,
  toFullUuid,
  uuidMatches,
} from '../../src/ble/constants';
import {scanForToolDevice} from '../../src/ble/scan';
import {
  encodeTelemetryBase64,
  parseTelemetryBase64,
  serializeTelemetry,
} from '../../src/utils/telemetry';
import {encodeStringToBase64} from '../../src/utils/base64';
import {BleManager} from 'react-native-ble-plx';

describe('session bug regressions', () => {
  describe('service UUID not found on client connect', () => {
    it('expands FFF0 to 0000FFF0-... for react-native-ble-plx lookups', () => {
      expect(toFullUuid('FFF0')).toBe(
        '0000FFF0-0000-1000-8000-00805F9B34FB',
      );
    });

    it('matches peripheral-registered full UUID with client short UUID constant', () => {
      expect(uuidMatches(TOOL_SERVICE_UUID_FULL, TOOL_SERVICE_UUID)).toBe(true);
    });
  });

  describe('failed to parse telemetry payload (double encoding)', () => {
    it('decodes correctly when tool sends single base64-encoded compact JSON', () => {
      const payload = {temp: 24.3, rpm: 131, status: 'running', timestamp: 1};
      const wire = encodeTelemetryBase64(payload);
      const parsed = parseTelemetryBase64(wire);
      expect(parsed.temp).toBe(24.3);
      expect(parsed.rpm).toBe(131);
    });

    it('still parses if legacy double-encoding bug is present on the wire', () => {
      const json = serializeTelemetry({
        temp: 24.3,
        rpm: 144,
        status: 'running',
        timestamp: 1,
      });
      const doubleEncoded = encodeStringToBase64(encodeStringToBase64(json));
      expect(parseTelemetryBase64(doubleEncoded).rpm).toBe(144);
    });
  });

  describe('invalid telemetry payload truncated at ~20 bytes (MTU)', () => {
    it('fails parse for truncated notify data seen on device', () => {
      const truncated = '{"temp":24.3,"rpm":1';
      expect(() =>
        parseTelemetryBase64(encodeStringToBase64(truncated)),
      ).toThrow(/Invalid telemetry payload/);
    });

    it('compact wire format is shorter than verbose JSON', () => {
      const compact = serializeTelemetry({
        temp: 24.3,
        rpm: 114,
        status: 'running',
        timestamp: Date.now(),
      });
      const verbose = JSON.stringify({
        temp: 24.3,
        rpm: 114,
        status: 'running',
        timestamp: Date.now(),
      });
      expect(compact.length).toBeLessThan(verbose.length);
    });
  });

  describe('reconnection failed after multiple attempts', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('scan helper finds re-advertised ServiceTool-001 before reconnect', async () => {
      const manager = {
        startDeviceScan: jest.fn(
          (_a: null, _b: unknown, listener: (error: null, device: {id: string; name: string}) => void) => {
            listener(null, {id: 'saved-mac', name: 'ServiceTool-001'});
            return Promise.resolve();
          },
        ),
        stopDeviceScan: jest.fn().mockResolvedValue(undefined),
      } as unknown as BleManager;

      const promise = scanForToolDevice(manager, 'saved-mac', 12000);
      await jest.runAllTimersAsync();
      await expect(promise).resolves.toBe('saved-mac');
    });
  });
});
