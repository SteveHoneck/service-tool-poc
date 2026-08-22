import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {PpmSample} from '../../../types';

interface Props {
  samples: PpmSample[];
  partial?: boolean;
  onBack: () => void;
}

export default function CreateReportScreen({
  samples,
  partial = false,
  onBack,
}: Props) {
  const isDark = useColorScheme() === 'dark';

  return (
    <SafeAreaView
      testID="create-report-screen"
      style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.header}>
        <Pressable onPress={onBack} testID="create-report-back">
          <Text style={styles.backLink}>← Back</Text>
        </Pressable>
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
        <Text style={[styles.body, isDark && styles.textMuted]}>
          Report details are not implemented yet.
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
  backLink: {
    color: '#2563EB',
    fontSize: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  card: {
    marginHorizontal: 20,
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
