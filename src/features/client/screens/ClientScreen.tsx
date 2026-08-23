import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {MAX_RECONNECT_ATTEMPTS} from '../../../domain/connection/policy';
import {scanResultsForDisplay} from '../../../domain/connection/scanResults';
import {
  heldPpm,
  isSessionActive,
  shouldPromptPartialSave,
} from '../../../domain/session/recording';
import {nextMaxPpm, ppmLevelFraction} from '../../../domain/signals/ppm';
import {rssiToSignalStrength} from '../../../domain/signals/signalStrength';
import {ConnectionState, SessionCapture} from '../../../types';
import {LivePpmLevelBar} from '../components/LivePpmLevelBar';
import {useBleClient} from '../hooks/useBleClient';
import {useRecordingSession} from '../hooks/useRecordingSession';

interface Props {
  onBack: () => void;
  onCreateReport: (capture: SessionCapture) => void;
  onOpenSettings?: () => void;
}

function stateLabel(state: ConnectionState): string {
  switch (state) {
    case 'idle':
      return 'Idle';
    case 'scanning':
      return 'Scanning…';
    case 'connecting':
      return 'Connecting…';
    case 'connected':
      return 'Connected';
    case 'streaming':
      return 'Streaming';
    case 'reconnecting':
      return 'Reconnecting…';
    case 'disconnected':
      return 'Disconnected';
    case 'error':
      return 'Error';
    default:
      return state;
  }
}

function firmwareBadgeLabel(
  compatibility: 'compatible' | 'incompatible' | 'unknown',
  version: string | null,
): string {
  if (!version) {
    return 'Firmware: unknown';
  }
  const status =
    compatibility === 'compatible'
      ? 'Compatible'
      : compatibility === 'incompatible'
        ? 'Incompatible'
        : 'Unknown';
  return `Firmware ${version} — ${status}`;
}

export default function ClientScreen({
  onBack,
  onCreateReport,
  onOpenSettings,
}: Props) {
  const isDark = useColorScheme() === 'dark';
  const {
    connectionState,
    devices,
    connectedDevice,
    telemetry,
    firmwareVersion,
    firmwareCompatibility,
    errorMessage,
    reconnectAttempt,
    startScan,
    stopScan,
    connect,
    disconnect,
    reconnectLastDevice,
  } = useBleClient();

  const isBusy = ['connecting', 'reconnecting'].includes(connectionState);
  const isConnected = ['connected', 'streaming', 'reconnecting'].includes(
    connectionState,
  );
  const signalStrength = rssiToSignalStrength(connectedDevice?.rssi ?? null);
  const canStartRecording =
    connectionState === 'streaming' && telemetry !== null;
  const {
    state: {status, isRecording, samples, isRecordDisabled},
    actions: {startRecording, endCapture},
  } = useRecordingSession({
    telemetry,
    connectionState,
    hasDevice: connectedDevice != null,
    canStartRecording,
  });
  const livePpm = telemetry?.ppm ?? null;
  const ppm = heldPpm(livePpm, samples[samples.length - 1], status);
  const [maxPpm, setMaxPpm] = useState(0);
  if (livePpm === null && !isSessionActive(status) && maxPpm !== 0) {
    setMaxPpm(0);
  } else if (livePpm !== null && livePpm > maxPpm) {
    setMaxPpm(nextMaxPpm(maxPpm, livePpm));
  }
  const levelFraction = ppm === null ? 0 : ppmLevelFraction(ppm);
  const showSessionChrome = isConnected || isRecording;
  const ppmHeld = livePpm === null && ppm !== null;
  const scannedDevices = scanResultsForDisplay(connectionState, devices);
  const promptedRef = useRef(false);

  useEffect(() => {
    if (!shouldPromptPartialSave(status, connectionState)) {
      promptedRef.current = false;
      return;
    }
    if (promptedRef.current) {
      return;
    }
    promptedRef.current = true;
    Alert.alert(
      'Could not reconnect',
      'Save partial report or keep trying?',
      [
        {text: 'Keep trying', style: 'cancel'},
        {
          text: 'Save partial report',
          onPress: () => onCreateReport(endCapture()),
        },
      ],
    );
  }, [connectionState, endCapture, onCreateReport, status]);

  return (
    <SafeAreaView
      style={[styles.container, isDark && styles.containerDark]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable onPress={onBack} style={styles.headerControl}>
            <View style={styles.backRow}>
              <Text style={styles.backArrow}>←</Text>
              <Text style={styles.backLink}>Back</Text>
            </View>
          </Pressable>
          <Pressable
            testID="settings-gear"
            accessibilityRole="button"
            accessibilityLabel="Settings"
            style={styles.headerControl}
            onPress={onOpenSettings}>
            <Text style={[styles.gear, isDark && styles.textLight]}>⚙</Text>
          </Pressable>
        </View>
        <Text style={[styles.title, isDark && styles.textLight]}>
          Client Mode
        </Text>
      </View>

      <View style={[styles.statusCard, isDark && styles.cardDark]}>
        <Text style={[styles.statusLabel, isDark && styles.textMuted]}>
          Connection
        </Text>
        <View style={styles.statusRow}>
          <Text style={[styles.statusValue, isDark && styles.textLight]}>
            {stateLabel(connectionState)}
          </Text>
          {isBusy && <ActivityIndicator size="small" color="#2563EB" />}
        </View>
        {connectionState === 'reconnecting' && reconnectAttempt > 0 && (
          <Text style={[styles.hint, isDark && styles.textMuted]}>
            Attempt {reconnectAttempt} of {MAX_RECONNECT_ATTEMPTS}
          </Text>
        )}
        {connectedDevice && (
          <Text style={[styles.hint, isDark && styles.textMuted]}>
            {connectedDevice.name ?? connectedDevice.id}
          </Text>
        )}
        {errorMessage && (
          <Text style={styles.errorText}>{errorMessage}</Text>
        )}
      </View>

      {showSessionChrome && (
        <>
          <View style={[styles.statusCard, isDark && styles.cardDark]}>
            <Text style={[styles.statusLabel, isDark && styles.textMuted]}>
              {firmwareBadgeLabel(firmwareCompatibility, firmwareVersion)}
            </Text>
          </View>

          <View
            style={[
              styles.telemetryCard,
              isDark && styles.cardDark,
              ppmHeld && styles.telemetryCardHeld,
              ppmHeld && isDark && styles.telemetryCardHeldDark,
            ]}>
            <Text style={[styles.statusLabel, isDark && styles.textMuted]}>
              Live PPM
            </Text>
            {ppm !== null ? (
              <>
                <View style={styles.ppmValueRow}>
                  <Text
                    testID="live-ppm-value"
                    accessibilityLabel={`${ppm} ppm`}
                    style={[styles.telemetryValue, isDark && styles.textLight]}>
                    {ppm}
                  </Text>
                  <Text style={[styles.ppmUnit, isDark && styles.textMuted]}>
                    ppm
                  </Text>
                </View>
                <Text
                  testID="live-ppm-max"
                  style={[styles.telemetryDetail, isDark && styles.textMuted]}>
                  MAX {maxPpm}
                </Text>
                <LivePpmLevelBar fraction={levelFraction} isDark={isDark} />
              </>
            ) : (
              <Text style={[styles.hint, isDark && styles.textMuted]}>
                Waiting for notify stream…
              </Text>
            )}
          </View>
        </>
      )}

      {connectionState === 'streaming' && (
        <View
          style={[
            styles.statusCard,
            isDark && styles.cardDark,
            signalStrength === 'Weak' &&
              (isDark ? styles.signalCardWeakDark : styles.signalCardWeak),
            signalStrength === 'Very weak' &&
              (isDark
                ? styles.signalCardVeryWeakDark
                : styles.signalCardVeryWeak),
          ]}>
          <Text style={[styles.statusLabel, isDark && styles.textMuted]}>
            Signal Strength
          </Text>
          <Text style={[styles.statusValue, isDark && styles.textLight]}>
            {signalStrength ?? '—'}
          </Text>
        </View>
      )}

      <View style={styles.actions}>
        {!isConnected && (
          <>
            <Pressable
              style={styles.primaryButton}
              onPress={
                connectionState === 'scanning' ? stopScan : startScan
              }>
              <Text style={styles.primaryButtonText}>
                {connectionState === 'scanning' ? 'Stop Scan' : 'Scan for Tools'}
              </Text>
            </Pressable>
            <Pressable
              style={styles.secondaryButton}
              onPress={reconnectLastDevice}>
              <Text style={styles.secondaryButtonText}>
                Reconnect Last Device
              </Text>
            </Pressable>
          </>
        )}
        {showSessionChrome && (
          <>
            {samples.length > 0 && (
              <Text
                testID="recording-sample-count"
                style={[styles.hint, isDark && styles.textMuted]}>
                {samples.length} {samples.length === 1 ? 'sample' : 'samples'}
              </Text>
            )}
            <Pressable
              testID="record-session-button"
              accessibilityRole="button"
              accessibilityLabel={isRecording ? 'Stop Recording' : 'Record'}
              accessibilityState={{disabled: isRecordDisabled}}
              disabled={isRecordDisabled}
              onPress={() => {
                if (isRecording) {
                  onCreateReport(endCapture());
                  return;
                }
                startRecording();
              }}
              style={[
                isRecording ? styles.dangerButton : styles.primaryButton,
                isRecordDisabled && styles.disabledButton,
              ]}>
              <Text style={styles.primaryButtonText}>
                {isRecording ? 'Stop Recording' : 'Record'}
              </Text>
            </Pressable>
            {isConnected && (
              <Pressable style={styles.dangerButton} onPress={disconnect}>
                <Text style={styles.primaryButtonText}>Disconnect</Text>
              </Pressable>
            )}
          </>
        )}
      </View>

      {scannedDevices.map(item => (
          <Pressable
            key={item.id}
            style={[styles.deviceRow, isDark && styles.cardDark]}
            onPress={() => connect(item.id)}>
            <View>
              <Text style={[styles.deviceName, isDark && styles.textLight]}>
                {item.name ?? 'Unknown'}
              </Text>
              <Text style={[styles.hint, isDark && styles.textMuted]}>
                Signal Strength:{' '}
                {rssiToSignalStrength(item.rssi) ?? '—'}
              </Text>
            </View>
            <Text style={styles.connectLink}>Connect</Text>
          </Pressable>
        ))}
      {connectionState === 'scanning' && devices.length === 0 && (
          <Text style={[styles.hint, styles.scanHint, isDark && styles.textMuted]}>
            Looking for ServiceTool-* devices…
          </Text>
        )}
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
    flexGrow: 1,
    paddingBottom: 24,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 40,
    marginBottom: 8,
  },
  headerControl: {
    height: 40,
    justifyContent: 'center',
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
  gear: {
    color: '#111827',
    fontSize: 34,
    lineHeight: 40,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  statusCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  telemetryCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  telemetryCardHeld: {
    backgroundColor: '#E5E7EB',
    opacity: 0.55,
  },
  telemetryCardHeldDark: {
    backgroundColor: '#374151',
  },
  cardDark: {
    backgroundColor: '#1F2937',
    borderColor: '#374151',
  },
  signalCardWeak: {
    backgroundColor: '#FEF9C3',
    borderColor: '#FDE047',
  },
  signalCardWeakDark: {
    backgroundColor: '#422006',
    borderColor: '#854D0E',
  },
  signalCardVeryWeak: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  signalCardVeryWeakDark: {
    backgroundColor: '#450A0A',
    borderColor: '#991B1B',
  },
  statusLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  telemetryValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
  },
  ppmValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
    gap: 8,
  },
  ppmUnit: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
  },
  telemetryDetail: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 4,
  },
  hint: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  errorText: {
    color: '#DC2626',
    marginTop: 8,
    fontSize: 14,
  },
  actions: {
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 12,
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
  secondaryButton: {
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: '#DC2626',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  scanHint: {
    paddingHorizontal: 20,
  },
  deviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginHorizontal: 20,
    marginBottom: 8,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  connectLink: {
    color: '#2563EB',
    fontWeight: '600',
  },
  textLight: {
    color: '#F9FAFB',
  },
  textMuted: {
    color: '#9CA3AF',
  },
});
