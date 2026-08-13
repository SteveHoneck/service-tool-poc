import {
  DIS_SERVICE_UUID,
  FIRMWARE_CHAR_UUID,
  TOOL_SERVICE_UUID,
  TOOL_SERVICE_UUID_FULL,
  toFullUuid,
  uuidMatches,
} from '../../src/ble/constants';

describe('ble/constants', () => {
  describe('toFullUuid', () => {
    it('expands 16-bit vendor service UUID FFF0', () => {
      expect(toFullUuid('FFF0')).toBe(
        '0000FFF0-0000-1000-8000-00805F9B34FB',
      );
    });

    it('expands DIS service UUID 180A', () => {
      expect(toFullUuid('180A')).toBe(
        '0000180A-0000-1000-8000-00805F9B34FB',
      );
    });

    it('normalizes lowercase short UUIDs', () => {
      expect(toFullUuid('fff0')).toBe(TOOL_SERVICE_UUID_FULL);
    });

    it('leaves full UUIDs unchanged (case-normalized)', () => {
      const full = '0000fff0-0000-1000-8000-00805f9b34fb';
      expect(toFullUuid(full)).toBe(full.toUpperCase());
    });
  });

  describe('uuidMatches', () => {
    it('matches short UUID against full UUID', () => {
      expect(uuidMatches('FFF0', TOOL_SERVICE_UUID_FULL)).toBe(true);
    });

    it('matches discovered lowercase full UUID against short expected', () => {
      expect(
        uuidMatches(
          '0000fff0-0000-1000-8000-00805f9b34fb',
          TOOL_SERVICE_UUID,
        ),
      ).toBe(true);
    });

    it('returns false for different services', () => {
      expect(uuidMatches(DIS_SERVICE_UUID, TOOL_SERVICE_UUID)).toBe(false);
    });
  });

  /**
   * Regression: client looked up 0000FFF0-... but peripheral registered
   * short UUIDs that Android rejected — service not found on connect.
   */
  describe('regression: android peripheral requires full UUIDs', () => {
    it('uses three F digits in expanded FFF0 service UUID (not FF0)', () => {
      const expanded = toFullUuid(TOOL_SERVICE_UUID);
      expect(expanded).toContain('0000FFF0');
      expect(expanded).not.toContain('0000FF0-');
    });

    it('exports full UUID constants for GATT registration', () => {
      expect(TOOL_SERVICE_UUID_FULL).toBe(toFullUuid(TOOL_SERVICE_UUID));
      expect(toFullUuid(FIRMWARE_CHAR_UUID)).toBe(
        '00002A26-0000-1000-8000-00805F9B34FB',
      );
    });
  });
});
