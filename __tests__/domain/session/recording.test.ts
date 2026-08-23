import {
  appendDisconnectGap,
  appendPpmSample,
  disconnectGapAt,
  heldPpm,
  isSessionActive,
  shouldDiscardRecording,
  shouldPauseForDisconnect,
  shouldPromptPartialSave,
  shouldResumeFromDisconnect,
  toPpmSample,
  toSessionCapture,
} from '../../../src/domain/session/recording';

describe('domain/session/recording', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('toPpmSample', () => {
    it('uses the tool timestamp, not client receive time', () => {
      jest.spyOn(Date, 'now').mockReturnValue(9_999_999);

      expect(
        toPpmSample({
          ppm: 250,
          timestamp: 1_700_000_000_000,
        }),
      ).toEqual({
        ppm: 250,
        timestamp: 1_700_000_000_000,
      });
    });
  });

  describe('appendPpmSample', () => {
    it('appends a new sample', () => {
      const next = appendPpmSample([], {
        ppm: 100,
        timestamp: 1,
      });

      expect(next).toEqual([{ppm: 100, timestamp: 1}]);
    });

    it('appends a later sample', () => {
      const next = appendPpmSample([{ppm: 100, timestamp: 1}], {
        ppm: 180,
        timestamp: 2,
      });

      expect(next).toEqual([
        {ppm: 100, timestamp: 1},
        {ppm: 180, timestamp: 2},
      ]);
    });

    it('does not duplicate the same tool timestamp', () => {
      const existing = [{ppm: 100, timestamp: 1}];

      const next = appendPpmSample(existing, {ppm: 100, timestamp: 1});

      expect(next).toBe(existing);
    });
  });

  describe('isSessionActive', () => {
    it('is false only while idle', () => {
      expect(isSessionActive('idle')).toBe(false);
      expect(isSessionActive('recording')).toBe(true);
      expect(isSessionActive('paused_disconnect')).toBe(true);
    });
  });

  describe('shouldDiscardRecording', () => {
    it('discards an active session only when the device is gone', () => {
      expect(shouldDiscardRecording('recording', false)).toBe(true);
      expect(shouldDiscardRecording('paused_disconnect', false)).toBe(true);
      expect(shouldDiscardRecording('idle', false)).toBe(false);
      expect(shouldDiscardRecording('recording', true)).toBe(false);
      expect(shouldDiscardRecording('paused_disconnect', true)).toBe(false);
    });
  });

  describe('shouldPauseForDisconnect', () => {
    it('pauses a live recording when the stream drops on reconnect or hang-up', () => {
      expect(
        shouldPauseForDisconnect('recording', false, 'reconnecting'),
      ).toBe(true);
      expect(
        shouldPauseForDisconnect('recording', false, 'disconnected'),
      ).toBe(true);
    });

    it('does not pause when still receiving telemetry or not recording', () => {
      expect(
        shouldPauseForDisconnect('recording', true, 'reconnecting'),
      ).toBe(false);
      expect(
        shouldPauseForDisconnect('recording', false, 'streaming'),
      ).toBe(false);
      expect(
        shouldPauseForDisconnect('paused_disconnect', false, 'reconnecting'),
      ).toBe(false);
      expect(shouldPauseForDisconnect('idle', false, 'reconnecting')).toBe(
        false,
      );
    });
  });

  describe('shouldResumeFromDisconnect', () => {
    it('resumes only a paused session once telemetry returns', () => {
      expect(shouldResumeFromDisconnect('paused_disconnect', true)).toBe(true);
      expect(shouldResumeFromDisconnect('paused_disconnect', false)).toBe(
        false,
      );
      expect(shouldResumeFromDisconnect('recording', true)).toBe(false);
      expect(shouldResumeFromDisconnect('idle', true)).toBe(false);
    });
  });

  describe('shouldPromptPartialSave', () => {
    it('prompts only after reconnect is exhausted while paused', () => {
      expect(shouldPromptPartialSave('paused_disconnect', 'disconnected')).toBe(
        true,
      );
      expect(shouldPromptPartialSave('paused_disconnect', 'reconnecting')).toBe(
        false,
      );
      expect(shouldPromptPartialSave('recording', 'disconnected')).toBe(false);
      expect(shouldPromptPartialSave('idle', 'disconnected')).toBe(false);
    });
  });

  describe('disconnectGapAt', () => {
    it('uses the last sample time when present', () => {
      expect(disconnectGapAt({ppm: 100, timestamp: 42}, 99)).toBe(42);
    });

    it('falls back to now when there is no last sample', () => {
      expect(disconnectGapAt(undefined, 99)).toBe(99);
    });
  });

  describe('appendDisconnectGap', () => {
    it('appends a disconnect gap', () => {
      expect(appendDisconnectGap([], 10)).toEqual([
        {at: 10, reason: 'disconnect'},
      ]);
    });

    it('does not duplicate the same gap time', () => {
      const existing = [{at: 10, reason: 'disconnect' as const}];
      expect(appendDisconnectGap(existing, 10)).toBe(existing);
    });
  });

  describe('toSessionCapture', () => {
    const samples = [{ppm: 100, timestamp: 1}];
    const gaps = [{at: 1, reason: 'disconnect' as const}];

    it('marks a capture partial only when still paused', () => {
      expect(toSessionCapture(samples, gaps, 'paused_disconnect')).toEqual({
        samples,
        gaps,
        partial: true,
      });
      expect(toSessionCapture(samples, gaps, 'recording')).toEqual({
        samples,
        gaps,
        partial: false,
      });
      expect(toSessionCapture(samples, [], 'idle')).toEqual({
        samples,
        gaps: [],
        partial: false,
      });
    });
  });

  describe('heldPpm', () => {
    const last = {ppm: 180, timestamp: 2};

    it('prefers the live reading', () => {
      expect(heldPpm(90, last, 'paused_disconnect')).toBe(90);
    });

    it('freezes the last sample while the session is active', () => {
      expect(heldPpm(null, last, 'recording')).toBe(180);
      expect(heldPpm(null, last, 'paused_disconnect')).toBe(180);
    });

    it('does not invent a reading when idle or there is no last sample', () => {
      expect(heldPpm(null, last, 'idle')).toBeNull();
      expect(heldPpm(null, undefined, 'paused_disconnect')).toBeNull();
    });
  });
});
