import {
  MAX_RECONNECT_ATTEMPTS,
  RECONNECT_DELAYS_MS,
} from '../../../src/domain/connection/policy';
import {delay, withReconnect} from '../../../src/domain/connection/reconnect';

describe('domain/connection/reconnect', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('delay resolves after the specified time', async () => {
    const promise = delay(1000);
    jest.advanceTimersByTime(999);
    await Promise.resolve();
    let settled = false;
    promise.then(() => {
      settled = true;
    });
    await Promise.resolve();
    expect(settled).toBe(false);

    jest.advanceTimersByTime(1);
    await promise;
  });

  it('returns on first successful operation', async () => {
    const operation = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('ok');
    const onAttempt = jest.fn();

    const promise = withReconnect(operation, onAttempt);
    await jest.advanceTimersByTimeAsync(RECONNECT_DELAYS_MS[0]);
    await expect(promise).resolves.toBe('ok');

    expect(operation).toHaveBeenCalledTimes(2);
    expect(onAttempt).toHaveBeenCalledWith(1);
    expect(onAttempt).toHaveBeenCalledWith(2);
  });

  it('retries up to MAX_RECONNECT_ATTEMPTS then throws', async () => {
    const operation = jest.fn().mockRejectedValue(new Error('still down'));

    const promise = withReconnect(operation);
    const expectation = expect(promise).rejects.toThrow('still down');

    for (let i = 0; i < MAX_RECONNECT_ATTEMPTS - 1; i++) {
      await jest.advanceTimersByTimeAsync(RECONNECT_DELAYS_MS[i] ?? 8000);
    }

    await expectation;
    expect(operation).toHaveBeenCalledTimes(MAX_RECONNECT_ATTEMPTS);
  });

  /**
   * Regression: blind connectToDevice by MAC failed after tool toggled BT off.
   * Reconnect now scans first; these tests cover retry/backoff timing behavior.
   */
  describe('regression: reconnect backoff', () => {
    it('uses six attempts with increasing delays', () => {
      expect(MAX_RECONNECT_ATTEMPTS).toBe(6);
      expect(RECONNECT_DELAYS_MS).toEqual([2000, 3000, 5000, 8000, 10000, 10000]);
    });
  });
});
