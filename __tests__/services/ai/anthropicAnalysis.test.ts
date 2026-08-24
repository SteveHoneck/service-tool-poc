import { getAnthropicApiKey } from '../../../src/config/anthropic';
import {
  ANTHROPIC_MESSAGES_URL,
  ANTHROPIC_MODEL,
  analyzeReport,
} from '../../../src/services/ai/anthropicAnalysis';

describe('getAnthropicApiKey', () => {
  it('returns empty when the gitignored local file is missing', () => {
    expect(getAnthropicApiKey()).toBe('');
  });
});

describe('analyzeReport', () => {
  const fetchMock = jest.fn();
  const originalFetch = global.fetch;

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('does not call the network when the API key is missing', async () => {
    await expect(
      analyzeReport({ apiKey: '  ', system: 'sys', user: 'usr' }),
    ).resolves.toEqual({ ok: false, error: 'missing_key' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('posts the Messages API body and returns the text block', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: '{"matchId":"pinpoint"}' }],
      }),
    });

    await expect(
      analyzeReport({
        apiKey: 'sk-ant-test',
        system: 'classify',
        user: '{"library":[]}',
      }),
    ).resolves.toEqual({ ok: true, text: '{"matchId":"pinpoint"}' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(ANTHROPIC_MESSAGES_URL);
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({
      'x-api-key': 'sk-ant-test',
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    });
    expect(JSON.parse(init.body as string)).toEqual({
      model: ANTHROPIC_MODEL,
      max_tokens: 800,
      system: 'classify',
      messages: [{ role: 'user', content: '{"library":[]}' }],
    });
    expect(ANTHROPIC_MODEL).toBe('claude-haiku-4-5');
  });

  it('maps 401 to unauthorized', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 401 });

    await expect(
      analyzeReport({ apiKey: 'sk-bad', system: 's', user: 'u' }),
    ).resolves.toEqual({ ok: false, error: 'unauthorized' });
  });

  it('maps other HTTP failures', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 });

    await expect(
      analyzeReport({ apiKey: 'sk-ant-test', system: 's', user: 'u' }),
    ).resolves.toEqual({ ok: false, error: 'http' });
  });

  it('maps a thrown fetch to network', async () => {
    fetchMock.mockRejectedValue(new TypeError('Network request failed'));

    await expect(
      analyzeReport({ apiKey: 'sk-ant-test', system: 's', user: 'u' }),
    ).resolves.toEqual({ ok: false, error: 'network' });
  });

  it('maps a response with no text block to empty', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ content: [] }),
    });

    await expect(
      analyzeReport({ apiKey: 'sk-ant-test', system: 's', user: 'u' }),
    ).resolves.toEqual({ ok: false, error: 'empty' });
  });
});
