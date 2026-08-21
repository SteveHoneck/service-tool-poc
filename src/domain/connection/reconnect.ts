import {MAX_RECONNECT_ATTEMPTS, RECONNECT_DELAYS_MS} from './policy';

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function withReconnect<T>(
  operation: () => Promise<T>,
  onAttempt?: (attempt: number) => void,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_RECONNECT_ATTEMPTS; attempt++) {
    onAttempt?.(attempt + 1);
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < MAX_RECONNECT_ATTEMPTS - 1) {
        await delay(RECONNECT_DELAYS_MS[attempt] ?? 8000);
      }
    }
  }

  throw lastError;
}
