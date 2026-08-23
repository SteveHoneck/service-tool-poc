import {scanResultsForDisplay} from '../../../src/domain/connection/scanResults';
import {ScannedDevice} from '../../../src/types';

const tool: ScannedDevice = {
  id: 'tool-1',
  name: 'ServiceTool-001',
  rssi: -40,
};

describe('scanResultsForDisplay', () => {
  it('returns devices only while scanning', () => {
    expect(scanResultsForDisplay('scanning', [tool])).toEqual([tool]);
  });

  it('hides leftover hits after the connection drops', () => {
    expect(scanResultsForDisplay('disconnected', [tool])).toEqual([]);
    expect(scanResultsForDisplay('idle', [tool])).toEqual([]);
    expect(scanResultsForDisplay('reconnecting', [tool])).toEqual([]);
    expect(scanResultsForDisplay('streaming', [tool])).toEqual([]);
  });
});
