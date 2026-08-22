import {
  appendPpmSample,
  toPpmSample,
} from '../../../src/domain/session/recording';

describe('domain/session/recording', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('toPpmSample', () => {
    it('uses the tool timestamp, not client receive time', () => {
      jest.spyOn(Date, 'now').mockReturnValue(9_999_999);

      expect(
        toPpmSample({
          ppm: 250,
          timestamp: 1_700_000_000_000,
        }),
      ).toEqual({
        ppm: 250,
        timestamp: 1_700_000_000_000,
      });
    });
  });

  describe('appendPpmSample', () => {
    it('appends a new sample', () => {
      const next = appendPpmSample([], {
        ppm: 100,
        timestamp: 1,
      });

      expect(next).toEqual([{ppm: 100, timestamp: 1}]);
    });

    it('appends a later sample', () => {
      const next = appendPpmSample([{ppm: 100, timestamp: 1}], {
        ppm: 180,
        timestamp: 2,
      });

      expect(next).toEqual([
        {ppm: 100, timestamp: 1},
        {ppm: 180, timestamp: 2},
      ]);
    });

    it('does not duplicate the same tool timestamp', () => {
      const existing = [{ppm: 100, timestamp: 1}];

      const next = appendPpmSample(existing, {ppm: 100, timestamp: 1});

      expect(next).toBe(existing);
    });
  });
});
