import {isVersionCompatible} from '../../src/utils/version';

describe('utils/version', () => {
  it('returns true when version meets minimum', () => {
    expect(isVersionCompatible('1.2.0', '1.0.0')).toBe(true);
  });

  it('returns true for equal versions', () => {
    expect(isVersionCompatible('1.0.0', '1.0.0')).toBe(true);
  });

  it('returns false when major version is lower', () => {
    expect(isVersionCompatible('0.9.9', '1.0.0')).toBe(false);
  });

  it('returns false when only patch is lower', () => {
    expect(isVersionCompatible('1.0.0', '1.0.1')).toBe(false);
  });

  it('compares minor versions', () => {
    expect(isVersionCompatible('1.1.0', '1.2.0')).toBe(false);
    expect(isVersionCompatible('1.3.0', '1.2.0')).toBe(true);
  });
});
