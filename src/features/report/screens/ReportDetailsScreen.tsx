import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  lastPpm,
  reportListLabel,
} from '../../../domain/report/buildSavedReport';
import {
  AnalysisResult,
  MIN_ANALYZE_SAMPLES,
  canAnalyzeReport,
} from '../../../domain/report/buildAnalysisRequest';
import { LEAK_SCENARIOS } from '../../../domain/telemetry/leakScenarios';
import { SavedReport } from '../../../types';
import { BackLink } from '../../shared/BackLink';
import { SessionPpmChart } from '../components/SessionPpmChart';

interface Props {
  report: SavedReport;
  onBack: () => void;
  onSharePdf?: () => void;
  sharing?: boolean;
  shareError?: string | null;
  onAnalyze?: () => void;
  analyzing?: boolean;
  analysis?: AnalysisResult | null;
  analysisError?: string | null;
}

function analysisMatchLabel(result: AnalysisResult): string {
  if (result.matchId === 'none') {
    return 'No match';
  }
  return (
    LEAK_SCENARIOS.find(scenario => scenario.id === result.matchId)?.name ??
    result.matchId
  );
}

function analysisMatchLine(result: AnalysisResult): string {
  const type = analysisMatchLabel(result);
  const value = Number(result.confidence);
  if (!Number.isFinite(value)) {
    return `${type} (${result.confidence})`;
  }
  const percent = value <= 1 ? value * 100 : value;
  return `${type} (${Math.round(percent)}% confident)`;
}

export default function ReportDetailsScreen({
  report,
  onBack,
  onSharePdf,
  sharing = false,
  shareError,
  onAnalyze,
  analyzing = false,
  analysis,
  analysisError,
}: Props) {
  const isDark = useColorScheme() === 'dark';
  const canAnalyze = canAnalyzeReport(report);
  const analyzeDisabled = !canAnalyze || analyzing || Boolean(analysis);

  return (
    <SafeAreaView
      testID="report-details-screen"
      style={[styles.container, isDark && styles.containerDark]}
    >
      <ScrollView
        testID="report-details-scroll"
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <BackLink onPress={onBack} testID="report-details-back" />
          <Text style={[styles.title, isDark && styles.textLight]}>
            Report Details
          </Text>
        </View>

        <View style={[styles.card, isDark && styles.cardDark]}>
          <Text
            style={[
              styles.label,
              styles.firstLabel,
              isDark && styles.textMuted,
            ]}
          >
            Job name
          </Text>
          <Text
            testID="report-details-job-name"
            style={[styles.body, isDark && styles.textLight]}
          >
            {reportListLabel(report)}
          </Text>
          <Text style={[styles.label, isDark && styles.textMuted]}>
            Operator
          </Text>
          <Text
            testID="report-details-operator"
            style={[styles.body, isDark && styles.textLight]}
          >
            {report.operatorName}
          </Text>
          <Text style={[styles.label, isDark && styles.textMuted]}>Notes</Text>
          <Text
            testID="report-details-notes"
            style={[styles.body, isDark && styles.textLight]}
          >
            {report.partial ? 'Connection lost during session' : '-'}
          </Text>
          <Text style={[styles.label, isDark && styles.textMuted]}>
            Last reading
          </Text>
          <Text
            testID="report-details-last-ppm"
            style={[styles.body, isDark && styles.textLight]}
          >
            {lastPpm(report.ppmSamples)} ppm
          </Text>
          <Text style={[styles.label, isDark && styles.textMuted]}>
            Max. reading
          </Text>
          <Text
            testID="report-details-max-ppm"
            style={[styles.body, isDark && styles.textLight]}
          >
            {report.maxPpm} ppm
          </Text>
        </View>

        <View style={[styles.card, isDark && styles.cardDark]}>
          <SessionPpmChart samples={report.ppmSamples} isDark={isDark} />
        </View>

        <Pressable
          testID="report-details-analyze"
          accessibilityRole="button"
          accessibilityLabel="Analyze Report"
          disabled={analyzeDisabled}
          onPress={onAnalyze}
          style={[
            styles.shareButton,
            analyzeDisabled && styles.shareButtonDisabled,
          ]}
        >
          <Text style={styles.shareButtonText}>
            {analyzing ? 'Analyzing…' : 'Analyze Report'}
          </Text>
        </Pressable>
        {!canAnalyze ? (
          <Text
            testID="report-details-analyze-hint"
            style={[styles.shareError, isDark && styles.textMuted]}
          >
            Need at least {MIN_ANALYZE_SAMPLES} samples to analyze.
          </Text>
        ) : null}
        {analysisError ? (
          <Text
            testID="report-details-analysis-error"
            style={[styles.shareError, isDark && styles.textMuted]}
          >
            {analysisError}
          </Text>
        ) : null}
        {analysis ? (
          <View
            testID="report-details-analysis"
            style={[styles.card, styles.analysisCard, isDark && styles.cardDark]}
          >
            <Text
              testID="report-details-analysis-prototype"
              style={[
                styles.prototypeBadge,
                isDark && styles.prototypeBadgeDark,
              ]}
            >
              Prototype
            </Text>
            <Text
              style={[
                styles.label,
                styles.firstLabel,
                isDark && styles.textMuted,
              ]}
            >
              Match
            </Text>
            <Text
              testID="report-details-analysis-match"
              style={[styles.body, isDark && styles.textLight]}
            >
              {analysisMatchLine(analysis)}
            </Text>
            <Text style={[styles.label, isDark && styles.textMuted]}>Why</Text>
            <Text
              testID="report-details-analysis-why"
              style={[styles.body, isDark && styles.textLight]}
            >
              {analysis.why}
            </Text>
            <Text style={[styles.label, isDark && styles.textMuted]}>
              Pattern
            </Text>
            <Text
              testID="report-details-analysis-pattern"
              style={[styles.body, isDark && styles.textLight]}
            >
              {analysis.pattern}
            </Text>
            <Text style={[styles.label, isDark && styles.textMuted]}>
              Next steps
            </Text>
            <Text
              testID="report-details-analysis-next-steps"
              style={[styles.body, isDark && styles.textLight]}
            >
              {analysis.nextSteps
                .map((step, index) => `${index + 1}. ${step}`)
                .join('\n')}
            </Text>
            <Text style={[styles.label, isDark && styles.textMuted]}>
              Cannot conclude
            </Text>
            <Text
              testID="report-details-analysis-cannot"
              style={[styles.body, isDark && styles.textLight]}
            >
              {analysis.cannotConclude.map(item => `• ${item}`).join('\n')}
            </Text>
          </View>
        ) : null}

        <Pressable
          testID="report-details-share-pdf"
          accessibilityRole="button"
          accessibilityLabel="Share PDF"
          disabled={sharing}
          onPress={onSharePdf}
          style={[styles.shareButton, sharing && styles.shareButtonDisabled]}
        >
          <Text style={styles.shareButtonText}>
            {sharing ? 'Sharing…' : 'Share PDF'}
          </Text>
        </Pressable>
        {shareError ? (
          <Text
            testID="report-details-share-error"
            style={[styles.shareError, isDark && styles.textMuted]}
          >
            {shareError}
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },
  containerDark: {
    backgroundColor: '#121417',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 4,
  },
  cardDark: {
    backgroundColor: '#1F2937',
    borderColor: '#374151',
  },
  analysisCard: {
    marginTop: 12,
  },
  label: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 8,
  },
  firstLabel: {
    marginTop: 0,
  },
  body: {
    fontSize: 16,
    color: '#111827',
    lineHeight: 22,
  },
  textLight: {
    color: '#F9FAFB',
  },
  textMuted: {
    color: '#9CA3AF',
  },
  shareButton: {
    marginHorizontal: 20,
    marginTop: 4,
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  shareButtonDisabled: {
    opacity: 0.5,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  shareError: {
    marginHorizontal: 20,
    marginTop: 8,
    fontSize: 14,
    color: '#B91C1C',
  },
  prototypeBadge: {
    alignSelf: 'flex-start',
    overflow: 'hidden',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: '#1D4ED8',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  prototypeBadgeDark: {
    color: '#93C5FD',
    backgroundColor: '#1E3A8A',
  },
});
