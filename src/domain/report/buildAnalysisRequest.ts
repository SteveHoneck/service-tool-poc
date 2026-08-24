import { lastPpm } from './buildSavedReport';
import {
  LEAK_SCENARIO_IDS,
  LEAK_SCENARIOS,
  LeakScenarioId,
} from '../telemetry/leakScenarios';
import { SavedReport } from '../../types';

export const MIN_ANALYZE_SAMPLES = 20;

export type AnalysisMatchId = LeakScenarioId | 'none';

export interface AnalysisResult {
  matchId: AnalysisMatchId;
  confidence: string;
  why: string;
  pattern: string;
  nextSteps: string[];
  cannotConclude: string[];
}

export interface AnalysisRequest {
  system: string;
  user: string;
}

const MATCH_IDS = new Set<string>([...LEAK_SCENARIO_IDS, 'none']);

export const ANALYSIS_SYSTEM_PROMPT = [
  'You classify a handheld leak-detector PPM session against a small labeled library.',
  'Pick exactly one library id or none.',
  'Cite this session’s numbers (duration, max, last, gaps) in why.',
  'Copy that item’s guidance into pattern, nextSteps, and cannotConclude; adapt wording only to cite the numbers.',
  'Never invent a fitting type, leak rate, or cost.',
  'Reply with JSON only:',
  '{ "matchId", "confidence", "why", "pattern", "nextSteps", "cannotConclude" }',
].join(' ');

export function canAnalyzeReport(
  report: Pick<SavedReport, 'ppmSamples'>,
): boolean {
  return report.ppmSamples.length >= MIN_ANALYZE_SAMPLES;
}

export function buildAnalysisRequest(report: SavedReport): AnalysisRequest {
  const samples = report.ppmSamples;
  const first = samples[0];
  const last = samples[samples.length - 1];
  const origin = first?.timestamp ?? report.startedAt;
  const durationMs = (last?.timestamp ?? report.endedAt) - origin;

  const recording = {
    durationSec: durationMs / 1000,
    maxPpm: report.maxPpm,
    lastPpm: lastPpm(samples),
    partial: report.partial,
    gapCount: report.gaps.length,
    samples: samples.map(sample => ({
      t: (sample.timestamp - origin) / 1000,
      ppm: sample.ppm,
    })),
  };

  const library = LEAK_SCENARIOS.map(scenario => ({
    id: scenario.id,
    name: scenario.name,
    signature: scenario.signature,
    guidance: scenario.guidance,
  }));

  return {
    system: ANALYSIS_SYSTEM_PROMPT,
    user: JSON.stringify({ library, recording }),
  };
}

function stripMarkdownFence(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced?.[1]?.trim() ?? trimmed;
}

function asString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Invalid analysis JSON: ${field}`);
  }
  return value;
}

function asConfidence(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return asString(value, 'confidence');
}

function asStringArray(value: unknown, field: string): string[] {
  if (
    !Array.isArray(value) ||
    value.some(item => typeof item !== 'string' || item.length === 0)
  ) {
    throw new Error(`Invalid analysis JSON: ${field}`);
  }
  return value;
}

export function parseAnalysisResponse(text: string): AnalysisResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripMarkdownFence(text));
  } catch {
    throw new Error('Invalid analysis JSON');
  }

  if (parsed === null || typeof parsed !== 'object') {
    throw new Error('Invalid analysis JSON');
  }

  const body = parsed as Record<string, unknown>;
  const matchId = asString(body.matchId, 'matchId');
  if (!MATCH_IDS.has(matchId)) {
    throw new Error(`Invalid matchId: ${matchId}`);
  }

  return {
    matchId: matchId as AnalysisMatchId,
    confidence: asConfidence(body.confidence),
    why: asString(body.why, 'why'),
    pattern: asString(body.pattern, 'pattern'),
    nextSteps: asStringArray(body.nextSteps, 'nextSteps'),
    cannotConclude: asStringArray(body.cannotConclude, 'cannotConclude'),
  };
}
