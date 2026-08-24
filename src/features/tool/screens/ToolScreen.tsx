import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LEAK_SCENARIOS } from '../../../domain/telemetry/leakScenarios';
import { TOOL_DEVICE_NAME } from '../../../services/ble/constants';
import { BackLink } from '../../shared/BackLink';
import { useBleTool } from '../hooks/useBleTool';

interface Props {
  onBack: () => void;
}

export default function ToolScreen({ onBack }: Props) {
  const isDark = useColorScheme() === 'dark';
  const {
    toolState,
    connectedCentrals,
    lastTelemetry,
    errorMessage,
    scenarioId,
    startTool,
    stopTool,
    selectScenario,
  } = useBleTool();

  const isAdvertising =
    toolState === 'advertising' || toolState === 'connected';
  const isStarting = toolState === 'starting';

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <BackLink onPress={onBack} />
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

          <Text style={[styles.label, isDark && styles.textMuted]}>Status</Text>
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
                {lastTelemetry.ppm} ppm
              </Text>
            </>
          )}

          {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
        </View>

        <View
          style={[styles.card, styles.scenarioCard, isDark && styles.cardDark]}
        >
          <Text
            style={[
              styles.label,
              styles.firstLabel,
              isDark && styles.textMuted,
            ]}
          >
            Leak scenario
          </Text>
          {LEAK_SCENARIOS.map(scenario => {
            const selected = scenario.id === scenarioId;
            return (
              <Pressable
                key={scenario.id}
                testID={`tool-scenario-${scenario.id}`}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={scenario.name}
                onPress={() => selectScenario(scenario.id)}
                style={[
                  styles.scenarioRow,
                  isDark && styles.scenarioRowDark,
                  selected && styles.scenarioRowSelected,
                ]}
              >
                <Text
                  style={[
                    styles.scenarioName,
                    isDark && styles.textLight,
                    selected && styles.scenarioNameSelected,
                  ]}
                >
                  {scenario.name}
                </Text>
                <Text style={[styles.scenarioHint, isDark && styles.textMuted]}>
                  {scenario.signature}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.actions}>
          {!isAdvertising ? (
            <Pressable
              style={styles.primaryButton}
              onPress={startTool}
              disabled={isStarting}
            >
              <Text style={styles.primaryButtonText}>Start Advertising</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.dangerButton} onPress={stopTool}>
              <Text style={styles.primaryButtonText}>Stop Advertising</Text>
            </Pressable>
          )}
        </View>

        <Text
          testID="tool-scenario-help"
          style={[styles.helpText, isDark && styles.textMuted]}
        >
          Pick a leak scenario, start advertising, then record about 50 seconds
          on the Client. The live PPM shape changes with the scenario; the
          scenario name is not sent over BLE.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },
  scrollContent: {
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
    gap: 4,
  },
  scenarioCard: {
    marginTop: 12,
    gap: 8,
  },
  firstLabel: {
    marginTop: 0,
  },
  scenarioRow: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  scenarioRowDark: {
    borderColor: '#374151',
  },
  scenarioRowSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  scenarioName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  scenarioNameSelected: {
    color: '#1D4ED8',
  },
  scenarioHint: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
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
