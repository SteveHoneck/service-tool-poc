import React from 'react';
import { StyleSheet, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  lastPpm,
  reportListLabel,
} from '../../../domain/report/buildSavedReport';
import { SavedReport } from '../../../types';
import { BackLink } from '../../shared/BackLink';

interface Props {
  report: SavedReport;
  onBack: () => void;
}

export default function ReportDetailsScreen({ report, onBack }: Props) {
  const isDark = useColorScheme() === 'dark';

  return (
    <SafeAreaView
      testID="report-details-screen"
      style={[styles.container, isDark && styles.containerDark]}
    >
      <View style={styles.header}>
        <BackLink onPress={onBack} testID="report-details-back" />
        <Text
          testID="report-details-job-name"
          style={[styles.title, isDark && styles.textLight]}
        >
          {reportListLabel(report)}
        </Text>
      </View>

      <View style={[styles.card, isDark && styles.cardDark]}>
        <Text
          testID="report-details-operator"
          style={[styles.body, isDark && styles.textMuted]}
        >
          {report.operatorName}
        </Text>
        {report.partial && (
          <Text
            testID="report-details-partial-note"
            style={[styles.body, isDark && styles.textMuted]}
          >
            Connection lost during session
          </Text>
        )}
        <Text
          testID="report-details-last-ppm"
          style={[styles.body, isDark && styles.textMuted]}
        >
          Last {lastPpm(report.ppmSamples)} ppm
        </Text>
        <Text
          testID="report-details-max-ppm"
          style={[styles.body, isDark && styles.textMuted]}
        >
          MAX {report.maxPpm}
        </Text>
      </View>
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
    gap: 8,
  },
  cardDark: {
    backgroundColor: '#1F2937',
    borderColor: '#374151',
  },
  body: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 22,
  },
  textLight: {
    color: '#F9FAFB',
  },
  textMuted: {
    color: '#9CA3AF',
  },
});
