export const ANTHROPIC_MESSAGES_URL = 'https://api.anthropic.com/v1/messages';
export const ANTHROPIC_MODEL = 'claude-haiku-4-5';
export const ANTHROPIC_MAX_TOKENS = 800;
export const ANTHROPIC_VERSION = '2023-06-01';

export type AnalyzeFailure =
  | 'missing_key'
  | 'unauthorized'
  | 'network'
  | 'http'
  | 'empty';

export type AnalyzeOutcome =
  | { ok: true; text: string }
  | { ok: false; error: AnalyzeFailure };

export interface AnalyzeReportInput {
  apiKey: string;
  system: string;
  user: string;
}

function textFromContent(body: unknown): string | null {
  if (body === null || typeof body !== 'object') {
    return null;
  }
  const content = (body as { content?: unknown }).content;
  if (!Array.isArray(content)) {
    return null;
  }
  const block = content.find(
    item =>
      item !== null &&
      typeof item === 'object' &&
      (item as { type?: string }).type === 'text' &&
      typeof (item as { text?: unknown }).text === 'string',
  ) as { text: string } | undefined;
  const text = block?.text.trim() ?? '';
  return text.length > 0 ? text : null;
}

export async function analyzeReport(
  input: AnalyzeReportInput,
): Promise<AnalyzeOutcome> {
  const apiKey = input.apiKey.trim();
  if (apiKey === '') {
    return { ok: false, error: 'missing_key' };
  }

  try {
    const response = await fetch(ANTHROPIC_MESSAGES_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: ANTHROPIC_MAX_TOKENS,
        system: input.system,
        messages: [{ role: 'user', content: input.user }],
      }),
    });

    if (!response.ok) {
      return {
        ok: false,
        error: response.status === 401 ? 'unauthorized' : 'http',
      };
    }

    const text = textFromContent(await response.json());
    if (text === null) {
      return { ok: false, error: 'empty' };
    }
    return { ok: true, text };
  } catch {
    return { ok: false, error: 'network' };
  }
}
