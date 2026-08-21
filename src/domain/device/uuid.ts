/** Expand a 16-bit (or 32-bit) UUID to the standard 128-bit BLE base UUID. */
export function toFullUuid(uuid: string): string {
  const normalized = uuid.replace(/-/g, '').toUpperCase();
  if (normalized.length === 4) {
    return `0000${normalized}-0000-1000-8000-00805F9B34FB`;
  }
  if (normalized.length === 8) {
    return `${normalized}-0000-1000-8000-00805F9B34FB`;
  }
  if (normalized.length === 32) {
    return `${normalized.slice(0, 8)}-${normalized.slice(8, 12)}-${normalized.slice(12, 16)}-${normalized.slice(16, 20)}-${normalized.slice(20)}`;
  }
  return uuid.toUpperCase();
}

/** Match a discovered UUID against a short or full expected UUID. */
export function uuidMatches(actual: string, expected: string): boolean {
  return toFullUuid(actual) === toFullUuid(expected);
}
