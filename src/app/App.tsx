import React, { useState } from 'react';
import { StatusBar, StyleSheet, View, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ClientScreen from '../features/client/screens/ClientScreen';
import SettingsScreen from '../features/client/screens/SettingsScreen';
import ModeSelectScreen from '../features/mode-select/screens/ModeSelectScreen';
import { useSavedReports } from '../features/report/hooks/useSavedReports';
import { useShareReportPdf } from '../features/report/hooks/useShareReportPdf';
import CreateReportScreen from '../features/report/screens/CreateReportScreen';
import ReportDetailsScreen from '../features/report/screens/ReportDetailsScreen';
import ReportsListScreen from '../features/report/screens/ReportsListScreen';
import ToolScreen from '../features/tool/screens/ToolScreen';
import { SessionCapture } from '../types';

type Screen =
  | 'mode-select'
  | 'client'
  | 'tool'
  | 'create-report'
  | 'settings'
  | 'reports'
  | 'report-details';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [screen, setScreen] = useState<Screen>('mode-select');
  const [reportCapture, setReportCapture] = useState<SessionCapture | null>(
    null,
  );
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const { state: savedReports, actions: savedReportActions } =
    useSavedReports();
  const { state: sharePdf, actions: sharePdfActions } = useShareReportPdf();
  const selectedReport = savedReports.reports.find(
    report => report.id === selectedReportId,
  );
  const overlayOpen =
    screen === 'create-report' ||
    screen === 'settings' ||
    screen === 'reports' ||
    screen === 'report-details';
  const clientMounted = screen === 'client' || overlayOpen;

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
          style={overlayOpen ? styles.hiddenClient : styles.fill}
          pointerEvents={overlayOpen ? 'none' : 'auto'}
          accessibilityElementsHidden={overlayOpen}
          importantForAccessibility={
            overlayOpen ? 'no-hide-descendants' : 'auto'
          }
        >
          <ClientScreen
            onBack={() => setScreen('mode-select')}
            onOpenSettings={() => setScreen('settings')}
            onCreateReport={capture => {
              setReportCapture(capture);
              setScreen('create-report');
            }}
          />
        </View>
      )}
      {screen === 'settings' && (
        <SettingsScreen
          onBack={() => setScreen('client')}
          onOpenReports={() => setScreen('reports')}
        />
      )}
      {screen === 'reports' && (
        <ReportsListScreen
          reports={savedReports.reports}
          onBack={() => setScreen('settings')}
          onOpenReport={reportId => {
            const exists = savedReports.reports.some(
              report => report.id === reportId,
            );
            if (!exists) {
              return;
            }
            setSelectedReportId(reportId);
            setScreen('report-details');
          }}
        />
      )}
      {screen === 'report-details' && selectedReport && (
        <ReportDetailsScreen
          report={selectedReport}
          onBack={() => setScreen('reports')}
          onSharePdf={() => {
            void sharePdfActions.share(selectedReport);
          }}
          sharing={sharePdf.sharing}
          shareError={sharePdf.error}
        />
      )}
      {screen === 'create-report' && reportCapture && (
        <CreateReportScreen
          samples={reportCapture.samples}
          partial={reportCapture.partial}
          onBack={() => setScreen('client')}
          onSave={fields => {
            void savedReportActions.save(reportCapture, fields).then(() => {
              setScreen('reports');
            });
          }}
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
