import React, {useState} from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {nextMaxPpm} from '../../../domain/signals/ppm';
import {PpmSample, SavedReportFields} from '../../../types';
import {BackLink} from '../../shared/BackLink';

interface Props {
  samples: PpmSample[];
  partial?: boolean;
  onBack: () => void;
  onSave: (fields: SavedReportFields) => void;
}

export default function CreateReportScreen({
  samples,
  partial = false,
  onBack,
  onSave,
}: Props) {
  const isDark = useColorScheme() === 'dark';
  const [jobName, setJobName] = useState('');
  const [operatorName, setOperatorName] = useState('');
  const lastSample = samples[samples.length - 1];
  const maxPpm = samples.reduce((max, sample) => nextMaxPpm(max, sample.ppm), 0);

  return (
    <SafeAreaView
      testID="create-report-screen"
      style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.header}>
        <BackLink onPress={onBack} testID="create-report-back" />
        <Text style={[styles.title, isDark && styles.textLight]}>
          Create Report
        </Text>
      </View>

      <View style={[styles.card, isDark && styles.cardDark]}>
        <Text
          testID="create-report-sample-count"
          style={[styles.body, isDark && styles.textMuted]}>
          {samples.length} {samples.length === 1 ? 'sample' : 'samples'} captured
        </Text>
        {partial && (
          <Text
            testID="create-report-partial-note"
            style={[styles.body, isDark && styles.textMuted]}>
            Connection lost during session
          </Text>
        )}
        <Text
          testID="create-report-last-ppm"
          style={[styles.body, isDark && styles.textMuted]}>
          Last {lastSample?.ppm ?? 0} ppm
        </Text>
        <Text
          testID="create-report-max-ppm"
          style={[styles.body, isDark && styles.textMuted]}>
          MAX {maxPpm}
        </Text>
      </View>

      <View style={[styles.card, isDark && styles.cardDark]}>
        <TextInput
          testID="create-report-job-name"
          accessibilityLabel="Job name"
          placeholder="Job name"
          placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
          value={jobName}
          onChangeText={setJobName}
          style={[styles.input, isDark && styles.inputDark]}
        />
        <TextInput
          testID="create-report-operator"
          accessibilityLabel="Operator"
          placeholder="Operator"
          placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
          value={operatorName}
          onChangeText={setOperatorName}
          style={[styles.input, isDark && styles.inputDark]}
        />
      </View>

      <Pressable
        testID="create-report-save"
        accessibilityRole="button"
        accessibilityLabel="Save Report"
        onPress={() => onSave({jobName, operatorName})}
        style={styles.saveButton}>
        <Text style={styles.saveButtonText}>Save Report</Text>
      </Pressable>
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
  input: {
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputDark: {
    color: '#F9FAFB',
    borderColor: '#374151',
  },
  saveButton: {
    marginHorizontal: 20,
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  textLight: {
    color: '#F9FAFB',
  },
  textMuted: {
    color: '#9CA3AF',
  },
});
