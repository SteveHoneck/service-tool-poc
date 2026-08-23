/** Level bar is full at this ppm. */
export const PPM_FULL_SCALE = 500;

export function ppmLevelFraction(
  ppm: number,
  fullScale: number = PPM_FULL_SCALE,
): number {
  if (!Number.isFinite(ppm) || !Number.isFinite(fullScale) || fullScale <= 0) {
    return 0;
  }
  return Math.min(1, Math.max(0, ppm / fullScale));
}

export function nextMaxPpm(currentMax: number, ppm: number): number {
  return Math.max(currentMax, ppm);
}
