import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {BackLink} from '../../shared/BackLink';

interface Props {
  onBack: () => void;
  onOpenReports?: () => void;
}

export default function SettingsScreen({onBack, onOpenReports}: Props) {
  const isDark = useColorScheme() === 'dark';

  return (
    <SafeAreaView
      testID="settings-screen"
      style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.header}>
        <BackLink onPress={onBack} testID="settings-back" />
        <Text style={[styles.title, isDark && styles.textLight]}>Settings</Text>
      </View>

      <Pressable
        testID="settings-reports"
        accessibilityRole="button"
        accessibilityLabel="Reports"
        onPress={onOpenReports}
        style={[styles.row, isDark && styles.rowDark]}>
        <Text style={[styles.rowLabel, isDark && styles.textLight]}>
          Reports
        </Text>
        <Text style={styles.rowChevron}>›</Text>
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
  row: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowDark: {
    backgroundColor: '#1F2937',
    borderColor: '#374151',
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  rowChevron: {
    color: '#2563EB',
    fontSize: 22,
    fontWeight: '600',
  },
  textLight: {
    color: '#F9FAFB',
  },
});
