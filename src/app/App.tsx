import React, {useState} from 'react';
import {StatusBar, StyleSheet, View, useColorScheme} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import ClientScreen from '../features/client/screens/ClientScreen';
import ModeSelectScreen from '../features/mode-select/screens/ModeSelectScreen';
import CreateReportScreen from '../features/report/screens/CreateReportScreen';
import ToolScreen from '../features/tool/screens/ToolScreen';
import {PpmSample} from '../types';

type Screen = 'mode-select' | 'client' | 'tool' | 'create-report';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [screen, setScreen] = useState<Screen>('mode-select');
  const [reportSamples, setReportSamples] = useState<PpmSample[]>([]);
  const clientMounted = screen === 'client' || screen === 'create-report';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      {screen === 'mode-select' && (
        <ModeSelectScreen
          onSelectClient={() => setScreen('client')}
          onSelectTool={() => setScreen('tool')}
        />
      )}
      {clientMounted && (
        <View
          style={
            screen === 'create-report' ? styles.hiddenClient : styles.fill
          }
          pointerEvents={screen === 'create-report' ? 'none' : 'auto'}
          accessibilityElementsHidden={screen === 'create-report'}
          importantForAccessibility={
            screen === 'create-report' ? 'no-hide-descendants' : 'auto'
          }>
          <ClientScreen
            onBack={() => setScreen('mode-select')}
            onCreateReport={samples => {
              setReportSamples(samples);
              setScreen('create-report');
            }}
          />
        </View>
      )}
      {screen === 'create-report' && (
        <CreateReportScreen
          samples={reportSamples}
          onBack={() => setScreen('client')}
        />
      )}
      {screen === 'tool' && (
        <ToolScreen onBack={() => setScreen('mode-select')} />
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  hiddenClient: {
    display: 'none',
  },
});

export default App;
