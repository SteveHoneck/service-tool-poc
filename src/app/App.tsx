import React, {useState} from 'react';
import {StatusBar, useColorScheme} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import ClientScreen from '../features/client/screens/ClientScreen';
import ModeSelectScreen from '../features/mode-select/screens/ModeSelectScreen';
import ToolScreen from '../features/tool/screens/ToolScreen';

type Screen = 'mode-select' | 'client' | 'tool';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [screen, setScreen] = useState<Screen>('mode-select');

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      {screen === 'mode-select' && (
        <ModeSelectScreen
          onSelectClient={() => setScreen('client')}
          onSelectTool={() => setScreen('tool')}
        />
      )}
      {screen === 'client' && (
        <ClientScreen onBack={() => setScreen('mode-select')} />
      )}
      {screen === 'tool' && (
        <ToolScreen onBack={() => setScreen('mode-select')} />
      )}
    </SafeAreaProvider>
  );
}

export default App;
