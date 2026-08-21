import {TELEMETRY_INTERVAL_MS} from '../../../src/services/ble/constants';
import {startStreamingRssiPolling} from '../../../src/services/ble/rssiPolling';

describe('services/ble/rssiPolling', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function createDevice(rssiValues: number[]) {
    let callIndex = 0;
    const readRSSI = jest.fn(async () => ({
      rssi: rssiValues[Math.min(callIndex++, rssiValues.length - 1)],
    }));

    return {readRSSI};
  }

  it('reads RSSI immediately when streaming polling starts', async () => {
    const device = createDevice([-55]);
    const onRssi = jest.fn();

    startStreamingRssiPolling(device, TELEMETRY_INTERVAL_MS, onRssi);
    await Promise.resolve();

    expect(device.readRSSI).toHaveBeenCalledTimes(1);
    expect(onRssi).toHaveBeenCalledWith(-55);
  });

  it('polls RSSI again at the telemetry interval', async () => {
    const device = createDevice([-55, -72]);
    const onRssi = jest.fn();

    startStreamingRssiPolling(device, TELEMETRY_INTERVAL_MS, onRssi);
    await Promise.resolve();
    expect(onRssi).toHaveBeenCalledWith(-55);

    await jest.advanceTimersByTimeAsync(TELEMETRY_INTERVAL_MS);
    await Promise.resolve();

    expect(device.readRSSI).toHaveBeenCalledTimes(2);
    expect(onRssi).toHaveBeenCalledWith(-72);
  });

  it('stops polling when cleanup is called', async () => {
    const device = createDevice([-55, -72, -88]);
    const onRssi = jest.fn();

    const stopPolling = startStreamingRssiPolling(
      device,
      TELEMETRY_INTERVAL_MS,
      onRssi,
    );
    await Promise.resolve();
    stopPolling();

    await jest.advanceTimersByTimeAsync(TELEMETRY_INTERVAL_MS * 3);
    await Promise.resolve();

    expect(device.readRSSI).toHaveBeenCalledTimes(1);
    expect(onRssi).toHaveBeenCalledTimes(1);
  });

  it('ignores RSSI values that resolve after polling stops', async () => {
    let resolveRead: ((value: {rssi: number}) => void) | undefined;
    const readRSSI = jest.fn(
      () =>
        new Promise<{rssi: number}>(resolve => {
          resolveRead = resolve;
        }),
    );
    const onRssi = jest.fn();

    const stopPolling = startStreamingRssiPolling(
      {readRSSI},
      TELEMETRY_INTERVAL_MS,
      onRssi,
    );
    stopPolling();
    resolveRead?.({rssi: -40});
    await Promise.resolve();

    expect(onRssi).not.toHaveBeenCalled();
  });

  it('ignores readRSSI failures without crashing', async () => {
    const readRSSI = jest
      .fn()
      .mockRejectedValueOnce(new Error('RSSI unavailable'))
      .mockResolvedValueOnce({rssi: -65});
    const onRssi = jest.fn();

    startStreamingRssiPolling({readRSSI}, TELEMETRY_INTERVAL_MS, onRssi);
    await Promise.resolve();
    expect(onRssi).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(TELEMETRY_INTERVAL_MS);
    await Promise.resolve();

    expect(readRSSI).toHaveBeenCalledTimes(2);
    expect(onRssi).toHaveBeenCalledWith(-65);
  });
});
