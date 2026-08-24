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
  onSelectClient: () => void;
  onSelectTool: () => void;
}

export default function ModeSelectScreen({
  onSelectClient,
  onSelectTool,
}: Props) {
  const isDark = useColorScheme() === 'dark';

  return (
    <SafeAreaView
      style={[styles.container, isDark && styles.containerDark]}>
      <Text style={[styles.title, isDark && styles.textLight]}>
        Leak Detection PoC
      </Text>
      <Text style={[styles.subtitle, isDark && styles.textMuted]}>
        Choose how this phone participates in the leak-detection BLE demo.
      </Text>

      <View style={styles.cardGroup}>
        <Pressable
          style={[styles.card, isDark && styles.cardDark]}
          onPress={onSelectClient}>
          <Text style={[styles.cardTitle, isDark && styles.textLight]}>
            Client Mode
          </Text>
          <Text style={[styles.cardBody, isDark && styles.textMuted]}>
            Scan for leak detectors, connect, and receive live PPM telemetry.
          </Text>
        </Pressable>

        <Pressable
          style={[styles.card, isDark && styles.cardDark]}
          onPress={onSelectTool}>
          <Text style={[styles.cardTitle, isDark && styles.textLight]}>
            Tool Mode
          </Text>
          <Text style={[styles.cardBody, isDark && styles.textMuted]}>
            Advertise as a mock leak detector (GATT peripheral).
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#F4F6F8',
  },
  containerDark: {
    backgroundColor: '#121417',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
  },
  cardGroup: {
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardDark: {
    backgroundColor: '#1F2937',
    borderColor: '#374151',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  cardBody: {
    fontSize: 15,
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
