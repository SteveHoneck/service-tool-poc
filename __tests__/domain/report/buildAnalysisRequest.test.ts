import { LEAK_SCENARIOS } from '../../../src/domain/telemetry/leakScenarios';
import {
  MIN_ANALYZE_SAMPLES,
  buildAnalysisRequest,
  canAnalyzeReport,
  parseAnalysisResponse,
} from '../../../src/domain/report/buildAnalysisRequest';
import { SavedReport } from '../../../src/types';

function reportWithSamples(
  count: number,
  extras: Partial<SavedReport> = {},
): SavedReport {
  const samples = Array.from({ length: count }, (_, index) => ({
    timestamp: 1_000 + index * 1_000,
    ppm: 20 + index,
  }));
  const last = samples[samples.length - 1];

  return {
    id: 'report-1',
    jobName: 'Leak check',
    operatorName: 'Alex',
    startedAt: samples[0]?.timestamp ?? 0,
    endedAt: last?.timestamp ?? 0,
    ppmSamples: samples,
    maxPpm: last ? 20 + count - 1 : 0,
    partial: false,
    gaps: [],
    ...extras,
  };
}

describe('canAnalyzeReport', () => {
  it('rejects logs shorter than 20 samples', () => {
    expect(MIN_ANALYZE_SAMPLES).toBe(20);
    expect(canAnalyzeReport(reportWithSamples(19))).toBe(false);
  });

  it('allows logs with at least 20 samples', () => {
    expect(canAnalyzeReport(reportWithSamples(20))).toBe(true);
  });
});

describe('buildAnalysisRequest', () => {
  it('sends the four-scenario library and a session summary with relative timestamps', () => {
    const report = reportWithSamples(20, {
      maxPpm: 80,
      partial: true,
      gaps: [
        { at: 5_000, reason: 'disconnect' },
        { at: 12_000, reason: 'disconnect' },
      ],
    });
    const { system, user } = buildAnalysisRequest(report);
    const payload = JSON.parse(user) as {
      library: typeof LEAK_SCENARIOS;
      recording: {
        durationSec: number;
        maxPpm: number;
        lastPpm: number;
        partial: boolean;
        gapCount: number;
        samples: Array<{ t: number; ppm: number }>;
      };
    };

    expect(payload.library).toEqual(
      LEAK_SCENARIOS.map(scenario => ({
        id: scenario.id,
        name: scenario.name,
        signature: scenario.signature,
        guidance: scenario.guidance,
      })),
    );
    expect(payload.recording.durationSec).toBe(19);
    expect(payload.recording.maxPpm).toBe(80);
    expect(payload.recording.lastPpm).toBe(39);
    expect(payload.recording.partial).toBe(true);
    expect(payload.recording.gapCount).toBe(2);
    expect(payload.recording.samples[0]).toEqual({ t: 0, ppm: 20 });
    expect(payload.recording.samples[1]).toEqual({ t: 1, ppm: 21 });
    expect(payload.recording.samples).toHaveLength(20);
    expect(user).not.toMatch(/scenarioId|playedScenario|answerKey/i);

    expect(system).toMatch(/id or none/i);
    expect(system).toMatch(/cite/i);
    expect(system).toMatch(/guidance/i);
    expect(system).toMatch(/fitting type/i);
    expect(system).toMatch(/leak rate/i);
    expect(system).toMatch(/JSON only/i);
    expect(system).toMatch(/matchId/);
    expect(system).toMatch(/cannotConclude/);
  });
});

describe('parseAnalysisResponse', () => {
  const valid = {
    matchId: 'pinpoint',
    confidence: 'high',
    why: 'One narrow peak then decay.',
    pattern: 'Pinpoint-style peak',
    nextSteps: ['Re-sweep the peak'],
    cannotConclude: ['True leak rate (lb/year)'],
  };

  it('parses a JSON analysis object', () => {
    expect(parseAnalysisResponse(JSON.stringify(valid))).toEqual(valid);
  });

  it('strips a markdown fence before parsing', () => {
    expect(
      parseAnalysisResponse(`\`\`\`json\n${JSON.stringify(valid)}\n\`\`\``),
    ).toEqual(valid);
  });

  it('accepts matchId none', () => {
    expect(
      parseAnalysisResponse(JSON.stringify({ ...valid, matchId: 'none' }))
        .matchId,
    ).toBe('none');
  });

  it('rejects an unknown matchId', () => {
    expect(() =>
      parseAnalysisResponse(JSON.stringify({ ...valid, matchId: 'schrader' })),
    ).toThrow(/matchId/);
  });

  it('rejects malformed JSON', () => {
    expect(() => parseAnalysisResponse('not json')).toThrow(/JSON/);
  });
});
