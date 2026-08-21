import {rssiToSignalStrength} from '../../../src/domain/signals/signalStrength';

describe('domain/signals/signalStrength', () => {
  it('maps strong signal for RSSI between -30 and -50', () => {
    expect(rssiToSignalStrength(-30)).toBe('Strong');
    expect(rssiToSignalStrength(-40)).toBe('Strong');
    expect(rssiToSignalStrength(-50)).toBe('Strong');
  });

  it('maps normal signal for RSSI between -50 and -70', () => {
    expect(rssiToSignalStrength(-51)).toBe('Normal');
    expect(rssiToSignalStrength(-60)).toBe('Normal');
    expect(rssiToSignalStrength(-70)).toBe('Normal');
  });

  it('maps weak signal for RSSI between -70 and -90', () => {
    expect(rssiToSignalStrength(-71)).toBe('Weak');
    expect(rssiToSignalStrength(-80)).toBe('Weak');
    expect(rssiToSignalStrength(-90)).toBe('Weak');
  });

  it('maps very weak signal for RSSI below -90', () => {
    expect(rssiToSignalStrength(-91)).toBe('Very weak');
    expect(rssiToSignalStrength(-100)).toBe('Very weak');
  });

  it('returns null when RSSI is unavailable', () => {
    expect(rssiToSignalStrength(null)).toBeNull();
  });
});
