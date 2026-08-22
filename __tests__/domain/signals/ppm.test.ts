import {
  PPM_FULL_SCALE,
  nextMaxPpm,
  ppmLevelFraction,
} from '../../../src/domain/signals/ppm';

describe('domain/signals/ppm', () => {
  describe('ppmLevelFraction', () => {
    it('is 0 at 0 ppm', () => {
      expect(ppmLevelFraction(0)).toBe(0);
    });

    it('is 1 at full scale', () => {
      expect(ppmLevelFraction(PPM_FULL_SCALE)).toBe(1);
    });

    it('scales linearly between 0 and full scale', () => {
      expect(ppmLevelFraction(250)).toBe(0.5);
    });

    it('clamps above full scale', () => {
      expect(ppmLevelFraction(PPM_FULL_SCALE * 2)).toBe(1);
    });

    it('clamps negative ppm', () => {
      expect(ppmLevelFraction(-10)).toBe(0);
    });

    it('returns 0 for invalid inputs', () => {
      expect(ppmLevelFraction(Number.NaN)).toBe(0);
      expect(ppmLevelFraction(100, 0)).toBe(0);
      expect(ppmLevelFraction(100, -500)).toBe(0);
    });
  });

  describe('nextMaxPpm', () => {
    it('raises the max when the new reading is higher', () => {
      expect(nextMaxPpm(100, 250)).toBe(250);
    });

    it('keeps the previous max when the new reading is lower', () => {
      expect(nextMaxPpm(300, 50)).toBe(300);
    });
  });
});
