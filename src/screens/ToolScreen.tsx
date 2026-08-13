import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {TOOL_DEVICE_NAME} from '../ble/constants';
import {useBleTool} from '../peripheral/useBleTool';

interface Props {
  onBack: () => void;
}

export default function ToolScreen({onBack}: Props) {
  const isDark = useColorScheme() === 'dark';
  const {
    toolState,
    connectedCentrals,
    lastTelemetry,
    errorMessage,
    startTool,
    stopTool,
  } = useBleTool();

  const isAdvertising = toolState === 'advertising' || toolState === 'connected';
  const isStarting = toolState === 'starting';

  return (
    <SafeAreaView
      style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.header}>
        <Pressable onPress={onBack}>
          <Text style={styles.backLink}>← Back</Text>
        </Pressable>
        <Text style={[styles.title, isDark && styles.textLight]}>
          Tool Mode
        </Text>
      </View>

      <View style={[styles.card, isDark && styles.cardDark]}>
        <Text style={[styles.label, isDark && styles.textMuted]}>
          Device Name
        </Text>
        <Text style={[styles.value, isDark && styles.textLight]}>
          {TOOL_DEVICE_NAME}
        </Text>

        <Text style={[styles.label, isDark && styles.textMuted]}>
          Status
        </Text>
        <View style={styles.statusRow}>
          <Text style={[styles.value, isDark && styles.textLight]}>
            {toolState === 'idle' && 'Idle'}
            {toolState === 'starting' && 'Starting…'}
            {toolState === 'advertising' && 'Advertising'}
            {toolState === 'connected' && 'Connected — streaming'}
            {toolState === 'error' && 'Error'}
          </Text>
          {isStarting && <ActivityIndicator size="small" color="#2563EB" />}
        </View>

        {isAdvertising && (
          <>
            <Text style={[styles.label, isDark && styles.textMuted]}>
              Connected Centrals
            </Text>
            <Text style={[styles.value, isDark && styles.textLight]}>
              {connectedCentrals}
            </Text>
          </>
        )}

        {lastTelemetry && (
          <>
            <Text style={[styles.label, isDark && styles.textMuted]}>
              Last Telemetry Sent
            </Text>
            <Text style={[styles.value, isDark && styles.textLight]}>
              {lastTelemetry.temp.toFixed(1)} °C · {lastTelemetry.rpm} RPM
            </Text>
          </>
        )}

        {errorMessage && (
          <Text style={styles.errorText}>{errorMessage}</Text>
        )}
      </View>

      <View style={styles.actions}>
        {!isAdvertising ? (
          <Pressable
            style={styles.primaryButton}
            onPress={startTool}
            disabled={isStarting}>
            <Text style={styles.primaryButtonText}>Start Advertising</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.dangerButton} onPress={stopTool}>
            <Text style={styles.primaryButtonText}>Stop Advertising</Text>
          </Pressable>
        )}
      </View>

      <Text style={[styles.helpText, isDark && styles.textMuted]}>
        Install this app on a second phone, select Tool Mode, and start
        advertising. Then use Client Mode on another phone to scan and connect.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F8',
    paddingBottom: 24,
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
    gap: 4,
  },
  cardDark: {
    backgroundColor: '#1F2937',
    borderColor: '#374151',
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
  },
  value: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    color: '#DC2626',
    marginTop: 12,
    fontSize: 14,
  },
  actions: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: '#DC2626',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  helpText: {
    marginHorizontal: 20,
    marginTop: 16,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  textLight: {
    color: '#F9FAFB',
  },
  textMuted: {
    color: '#9CA3AF',
  },
});
