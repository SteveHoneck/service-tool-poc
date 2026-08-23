import {TelemetryPayload} from '../../../src/types';
import {encodeStringToBase64} from '../../../src/domain/telemetry/base64';
import {parseTelemetryBase64} from '../../../src/domain/telemetry/parse';
import {
  encodeTelemetryBase64,
  serializeTelemetry,
} from '../../../src/domain/telemetry/serialize';

const samplePayload: TelemetryPayload = {
  ppm: 250,
  status: 'running',
  timestamp: 1_700_000_000_000,
};

describe('domain/telemetry', () => {
  describe('serializeTelemetry', () => {
    it('uses compact keys to reduce BLE packet size', () => {
      const json = serializeTelemetry(samplePayload);
      expect(json).toBe('{"p":250,"s":"run","ts":1700000000000}');
      expect(json.length).toBeLessThan(40);
    });

    it('rounds ppm to an integer', () => {
      const json = serializeTelemetry({...samplePayload, ppm: 250.7});
      expect(JSON.parse(json).p).toBe(251);
    });
  });

  describe('encodeTelemetryBase64 / parseTelemetryBase64', () => {
    it('round-trips compact telemetry including tool timestamp', () => {
      const encoded = encodeTelemetryBase64(samplePayload);
      const parsed = parseTelemetryBase64(encoded);
      expect(parsed.ppm).toBe(250);
      expect(parsed.status).toBe('running');
      expect(parsed.timestamp).toBe(1_700_000_000_000);
    });

    it('stamps receive time when ts is omitted', () => {
      const before = Date.now();
      const parsed = parseTelemetryBase64(
        encodeStringToBase64('{"p":250,"s":"run"}'),
      );
      const after = Date.now();
      expect(parsed.timestamp).toBeGreaterThanOrEqual(before);
      expect(parsed.timestamp).toBeLessThanOrEqual(after);
    });

    it('parses long-key JSON format', () => {
      const legacy = encodeStringToBase64(
        JSON.stringify({
          ppm: 20,
          status: 'running',
          timestamp: 123,
        }),
      );
      const parsed = parseTelemetryBase64(legacy);
      expect(parsed.ppm).toBe(20);
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
      const wire = encodeStringToBase64(
        '{"p":250,"s":"run","ts":1700000000000}',
      );
      expect(parseTelemetryBase64(wire).ppm).toBe(250);
      expect(parseTelemetryBase64(wire).timestamp).toBe(1_700_000_000_000);
    });

    it('recovers from legacy double-encoded payloads', () => {
      const once = encodeStringToBase64(
        '{"p":250,"s":"run","ts":1700000000000}',
      );
      const twice = encodeStringToBase64(once);
      const parsed = parseTelemetryBase64(twice);
      expect(parsed.ppm).toBe(250);
      expect(parsed.timestamp).toBe(1_700_000_000_000);
    });
  });

  /**
   * Regression: default BLE ATT MTU (~20 bytes) truncated JSON mid-field.
   * Same parse error applies to compact ppm JSON.
   */
  describe('regression: mtu truncation', () => {
    it('rejects truncated JSON with a preview in the error', () => {
      const truncated = '{"p":250,"s":"ru';
      const encoded = encodeStringToBase64(truncated);

      expect(() => parseTelemetryBase64(encoded)).toThrow(
        /Invalid telemetry payload \(payload: \{"p":250,"s":"ru\)/,
      );
    });

    it('compact format is smaller than verbose JSON', () => {
      const compact = serializeTelemetry(samplePayload);
      const verbose = JSON.stringify(samplePayload);
      expect(compact.length).toBeLessThan(verbose.length);
    });
  });
});
