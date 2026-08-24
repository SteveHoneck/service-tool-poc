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
import { SavedReport } from '../../../types';
import { BackLink } from '../../shared/BackLink';
import { SessionPpmChart } from '../components/SessionPpmChart';

interface Props {
  report: SavedReport;
  onBack: () => void;
  onSharePdf?: () => void;
  sharing?: boolean;
  shareError?: string | null;
}

export default function ReportDetailsScreen({
  report,
  onBack,
  onSharePdf,
  sharing = false,
  shareError,
}: Props) {
  const isDark = useColorScheme() === 'dark';

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
});
