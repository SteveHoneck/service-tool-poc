import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useBleClient} from '../ble/useBleClient';
import {ConnectionState} from '../types';

interface Props {
  onBack: () => void;
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

export default function ClientScreen({onBack}: Props) {
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

  return (
    <SafeAreaView
      style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.header}>
        <Pressable onPress={onBack}>
          <Text style={styles.backLink}>← Back</Text>
        </Pressable>
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
            Attempt {reconnectAttempt} of 4
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

      {isConnected && (
        <>
          <View style={[styles.statusCard, isDark && styles.cardDark]}>
            <Text style={[styles.statusLabel, isDark && styles.textMuted]}>
              {firmwareBadgeLabel(firmwareCompatibility, firmwareVersion)}
            </Text>
          </View>

          <View style={[styles.telemetryCard, isDark && styles.cardDark]}>
            <Text style={[styles.statusLabel, isDark && styles.textMuted]}>
              Live Telemetry
            </Text>
            {telemetry ? (
              <>
                <Text style={[styles.telemetryValue, isDark && styles.textLight]}>
                  {telemetry.temp.toFixed(1)} °C
                </Text>
                <Text style={[styles.telemetryDetail, isDark && styles.textMuted]}>
                  RPM: {telemetry.rpm} · Status: {telemetry.status}
                </Text>
              </>
            ) : (
              <Text style={[styles.hint, isDark && styles.textMuted]}>
                Waiting for notify stream…
              </Text>
            )}
          </View>
        </>
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
        {isConnected && (
          <Pressable style={styles.dangerButton} onPress={disconnect}>
            <Text style={styles.primaryButtonText}>Disconnect</Text>
          </Pressable>
        )}
      </View>

      {!isConnected && (
        <FlatList
          data={devices}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            connectionState === 'scanning' ? (
              <Text style={[styles.hint, isDark && styles.textMuted]}>
                Looking for ServiceTool-* devices…
              </Text>
            ) : undefined
          }
          renderItem={({item}) => (
            <Pressable
              style={[styles.deviceRow, isDark && styles.cardDark]}
              onPress={() => connect(item.id)}>
              <View>
                <Text style={[styles.deviceName, isDark && styles.textLight]}>
                  {item.name ?? 'Unknown'}
                </Text>
                <Text style={[styles.hint, isDark && styles.textMuted]}>
                  RSSI: {item.rssi ?? '—'}
                </Text>
              </View>
              <Text style={styles.connectLink}>Connect</Text>
            </Pressable>
          )}
        />
      )}
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
  cardDark: {
    backgroundColor: '#1F2937',
    borderColor: '#374151',
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
    marginTop: 4,
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
  list: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 8,
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
