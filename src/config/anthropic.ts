export function getAnthropicApiKey(): string {
  try {
    // Local file is gitignored. Metro bundles it when present.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const local = require('./anthropic.local') as {
      ANTHROPIC_API_KEY?: string;
    };
    return typeof local.ANTHROPIC_API_KEY === 'string'
      ? local.ANTHROPIC_API_KEY.trim()
      : '';
  } catch {
    return '';
  }
}
