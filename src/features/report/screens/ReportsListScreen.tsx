import React from 'react';
import {StyleSheet, Text, View, useColorScheme} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {BackLink} from '../../shared/BackLink';

interface Props {
  onBack: () => void;
}

export default function ReportsListScreen({onBack}: Props) {
  const isDark = useColorScheme() === 'dark';

  return (
    <SafeAreaView
      testID="reports-list-screen"
      style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.header}>
        <BackLink onPress={onBack} testID="reports-list-back" />
        <Text style={[styles.title, isDark && styles.textLight]}>Reports</Text>
      </View>

      <View style={[styles.card, isDark && styles.cardDark]}>
        <Text style={[styles.body, isDark && styles.textMuted]}>
          No saved reports yet
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
