/** Simple semver-like comparison: returns true if version >= minVersion. */
export function isVersionCompatible(
  version: string,
  minVersion: string,
): boolean {
  const parse = (v: string) =>
    v.split('.').map(part => parseInt(part, 10) || 0);
  const [aMajor = 0, aMinor = 0, aPatch = 0] = parse(version);
  const [bMajor = 0, bMinor = 0, bPatch = 0] = parse(minVersion);

  if (aMajor !== bMajor) {
    return aMajor > bMajor;
  }
  if (aMinor !== bMinor) {
    return aMinor > bMinor;
  }
  return aPatch >= bPatch;
}
