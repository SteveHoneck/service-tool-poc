import {BleManager} from 'react-native-ble-plx';
import {scanForToolDevice} from '../../src/ble/scan';

describe('ble/scan', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function createManager(options: {
    devices?: Array<{id: string; name: string | null}>;
    scanError?: Error;
    startScanRejects?: Error;
  }) {
    const stopDeviceScan = jest.fn().mockResolvedValue(undefined);
    const startDeviceScan = jest.fn(
      (_uuids: null, _opts: unknown, listener: (error: Error | null, device: {id: string; name: string | null} | null) => void) => {
        if (options.startScanRejects) {
          return Promise.reject(options.startScanRejects);
        }

        return Promise.resolve(undefined).then(() => {
          if (options.scanError) {
            listener(options.scanError, null);
            return;
          }

          for (const device of options.devices ?? []) {
            listener(null, device);
          }
        });
      },
    );

    return {
      startDeviceScan,
      stopDeviceScan,
    } as unknown as BleManager;
  }

  it('resolves when preferred device id appears in scan', async () => {
    const manager = createManager({
      devices: [{id: 'AA:BB:CC:DD:EE:FF', name: 'ServiceTool-001'}],
    });

    const promise = scanForToolDevice(
      manager,
      'AA:BB:CC:DD:EE:FF',
      5000,
    );

    await jest.runAllTimersAsync();
    await expect(promise).resolves.toBe('AA:BB:CC:DD:EE:FF');
    expect(manager.stopDeviceScan).toHaveBeenCalled();
  });

  it('resolves when any ServiceTool-* name appears', async () => {
    const manager = createManager({
      devices: [{id: '11:22:33:44:55:66', name: 'ServiceTool-001'}],
    });

    const promise = scanForToolDevice(manager, 'different-id', 5000);
    await jest.runAllTimersAsync();
    await expect(promise).resolves.toBe('11:22:33:44:55:66');
  });

  it('rejects after timeout when tool is not advertising', async () => {
    const manager = createManager({devices: []});

    const promise = scanForToolDevice(manager, 'AA:BB:CC:DD:EE:FF', 3000);
    const expectation = expect(promise).rejects.toThrow(
      /Tool not found — open Tool Mode/,
    );

    await jest.advanceTimersByTimeAsync(3000);
    await expectation;
    expect(manager.stopDeviceScan).toHaveBeenCalled();
  });

  it('ignores unrelated devices', async () => {
    const manager = createManager({
      devices: [{id: '99:99:99:99:99:99', name: 'SomeOtherDevice'}],
    });

    const promise = scanForToolDevice(manager, 'AA:BB:CC:DD:EE:FF', 2000);
    const expectation = expect(promise).rejects.toThrow(/Tool not found/);

    await jest.advanceTimersByTimeAsync(2000);
    await expectation;
  });

  /**
   * Regression: after toggling Bluetooth off on the tool phone, the client
   * must scan for ServiceTool-* before reconnecting instead of blind connect.
   */
  describe('regression: scan-before-reconnect', () => {
    it('finds ServiceTool-001 visible in scan results after tool re-advertises', async () => {
      const manager = createManager({
        devices: [{id: 'tool-mac', name: 'ServiceTool-001'}],
      });

      const promise = scanForToolDevice(manager, 'tool-mac', 12000);
      await jest.runAllTimersAsync();
      await expect(promise).resolves.toBe('tool-mac');
    });
  });
});
