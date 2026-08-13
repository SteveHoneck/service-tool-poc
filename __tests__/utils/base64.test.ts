import {
  decodeBase64ToString,
  encodeStringToBase64,
  normalizeBleText,
} from '../../src/utils/base64';

describe('utils/base64', () => {
  it('round-trips UTF-8 text', () => {
    const original = '{"t":24.3,"r":1234,"s":"run"}';
    expect(decodeBase64ToString(encodeStringToBase64(original))).toBe(original);
  });

  it('strips null bytes and whitespace', () => {
    expect(normalizeBleText('\0{"t":1}\0  ')).toBe('{"t":1}');
  });

  it('decodes firmware version strings', () => {
    const encoded = encodeStringToBase64('1.2.0');
    expect(decodeBase64ToString(encoded)).toBe('1.2.0');
  });
});
