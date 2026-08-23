import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

interface Props {
  onBack: () => void;
}

export default function SettingsScreen({onBack}: Props) {
  const isDark = useColorScheme() === 'dark';

  return (
    <SafeAreaView
      testID="settings-screen"
      style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          testID="settings-back"
          style={styles.headerControl}>
          <View style={styles.backRow}>
            <Text style={styles.backArrow}>←</Text>
            <Text style={styles.backLink}>Back</Text>
          </View>
        </Pressable>
        <Text style={[styles.title, isDark && styles.textLight]}>Settings</Text>
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
  headerControl: {
    height: 40,
    justifyContent: 'center',
    marginBottom: 8,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backArrow: {
    color: '#2563EB',
    fontSize: 26,
    lineHeight: 26,
    fontWeight: '700',
    includeFontPadding: false,
    textAlignVertical: 'center',
    transform: [{translateY: -5}],
    marginRight: 4,
  },
  backLink: {
    color: '#2563EB',
    fontSize: 18,
    lineHeight: 22,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
});
