import {TelemetryPayload} from '../../../src/types';
import {encodeStringToBase64} from '../../../src/domain/telemetry/base64';
import {parseTelemetryBase64} from '../../../src/domain/telemetry/parse';
import {
  encodeTelemetryBase64,
  serializeTelemetry,
} from '../../../src/domain/telemetry/serialize';

const samplePayload: TelemetryPayload = {
  temp: 24.3,
  rpm: 1234,
  status: 'running',
  timestamp: 1_700_000_000_000,
};

describe('domain/telemetry', () => {
  describe('serializeTelemetry', () => {
    it('uses compact keys to reduce BLE packet size', () => {
      const json = serializeTelemetry(samplePayload);
      expect(json).toBe('{"t":24.3,"r":1234,"s":"run"}');
      expect(json.length).toBeLessThan(40);
    });

    it('rounds rpm to an integer', () => {
      const json = serializeTelemetry({...samplePayload, rpm: 1234.7});
      expect(JSON.parse(json).r).toBe(1235);
    });
  });

  describe('encodeTelemetryBase64 / parseTelemetryBase64', () => {
    it('round-trips compact telemetry', () => {
      const encoded = encodeTelemetryBase64(samplePayload);
      const parsed = parseTelemetryBase64(encoded);
      expect(parsed.temp).toBe(24.3);
      expect(parsed.rpm).toBe(1234);
      expect(parsed.status).toBe('running');
    });

    it('parses legacy long-key JSON format', () => {
      const legacy = encodeStringToBase64(
        JSON.stringify({
          temp: 20,
          rpm: 1100,
          status: 'running',
          timestamp: 123,
        }),
      );
      const parsed = parseTelemetryBase64(legacy);
      expect(parsed.temp).toBe(20);
      expect(parsed.rpm).toBe(1100);
      expect(parsed.status).toBe('running');
      expect(parsed.timestamp).toBe(123);
    });
  });

  /**
   * Regression: updateValue/addCharacteristicToService already call btoa(),
   * so calling encodeBase64() first double-encoded the payload.
   */
  describe('regression: double base64 encoding', () => {
    it('parses single-encoded compact JSON from tool', () => {
      const wire = encodeStringToBase64('{"t":24.3,"r":1234,"s":"run"}');
      expect(parseTelemetryBase64(wire).rpm).toBe(1234);
    });

    it('recovers from legacy double-encoded payloads', () => {
      const once = encodeStringToBase64('{"t":24.3,"r":1234,"s":"run"}');
      const twice = encodeStringToBase64(once);
      expect(parseTelemetryBase64(twice).temp).toBe(24.3);
    });
  });

  /**
   * Regression: default BLE ATT MTU (~20 bytes) truncated JSON mid-field.
   * User saw: Invalid telemetry payload (payload: {"temp": 24.3, "rpm:1)
   */
  describe('regression: mtu truncation', () => {
    it('rejects truncated JSON with a preview in the error', () => {
      const truncated = '{"temp":24.3,"rpm":1';
      const encoded = encodeStringToBase64(truncated);

      expect(() => parseTelemetryBase64(encoded)).toThrow(
        /Invalid telemetry payload \(payload: \{"temp":24\.3,"rpm":1\)/,
      );
    });

    it('compact format is small enough for typical negotiated MTU headroom', () => {
      const compact = serializeTelemetry(samplePayload);
      // Still larger than default 20-byte ATT payload — MTU negotiation required.
      expect(compact.length).toBeGreaterThan(20);
      // But much smaller than legacy verbose JSON would have been.
      const verbose = JSON.stringify(samplePayload);
      expect(compact.length).toBeLessThan(verbose.length);
    });
  });
});
