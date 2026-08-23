import {
  decodeBase64ToString,
  encodeStringToBase64,
  normalizeBleText,
} from '../../../src/domain/telemetry/base64';

describe('domain/telemetry/base64', () => {
  it('round-trips UTF-8 text', () => {
    const original = '{"p":250,"s":"run","ts":1700000000000}';
    expect(decodeBase64ToString(encodeStringToBase64(original))).toBe(original);
  });

  it('strips null bytes and whitespace', () => {
    expect(normalizeBleText('\0{"p":1}\0  ')).toBe('{"p":1}');
  });

  it('decodes firmware version strings', () => {
    const encoded = encodeStringToBase64('1.2.0');
    expect(decodeBase64ToString(encoded)).toBe('1.2.0');
  });
});
