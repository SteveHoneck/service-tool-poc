import React from 'react';
import {
  render,
  screen,
  userEvent,
  waitFor,
} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import App from '../../src/app/App';
import { analyzeReport } from '../../src/services/ai/anthropicAnalysis';
import { getAnthropicApiKey } from '../../src/config/anthropic';
import { SavedReport } from '../../src/types';

jest.mock('../../src/features/client/screens/ClientScreen', () => {
  const ReactNative = require('react-native');
  return {
    __esModule: true,
    default: ({ onOpenSettings }: { onOpenSettings: () => void }) => (
      <ReactNative.Pressable
        testID="fake-settings-gear"
        onPress={onOpenSettings}
      >
        <ReactNative.Text>Settings gear</ReactNative.Text>
      </ReactNative.Pressable>
    ),
  };
});

jest.mock('../../src/services/ai/anthropicAnalysis', () => ({
  analyzeReport: jest.fn(),
}));

jest.mock('../../src/config/anthropic', () => ({
  getAnthropicApiKey: jest.fn(),
}));

const analyzeReportMock = analyzeReport as jest.MockedFunction<
  typeof analyzeReport
>;
const getAnthropicApiKeyMock = getAnthropicApiKey as jest.MockedFunction<
  typeof getAnthropicApiKey
>;

function longReport(id: string, jobName: string): SavedReport {
  const ppmSamples = Array.from({ length: 20 }, (_, index) => ({
    ppm: 20 + index,
    timestamp: index * 1000,
  }));
  return {
    id,
    jobName,
    operatorName: 'Alex',
    startedAt: 0,
    endedAt: 19_000,
    ppmSamples,
    maxPpm: 39,
    partial: false,
    gaps: [],
  };
}

describe('App report analysis navigation', () => {
  const memory = new Map<string, string>();

  beforeEach(() => {
    memory.clear();
    memory.set(
      '@servicetool/saved_reports',
      JSON.stringify([
        longReport('report-a', 'Broken analysis'),
        longReport('report-b', 'Clean session'),
      ]),
    );
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) =>
      Promise.resolve(memory.get(key) ?? null),
    );
    (AsyncStorage.setItem as jest.Mock).mockImplementation(
      (key: string, value: string) => {
        memory.set(key, value);
        return Promise.resolve();
      },
    );
    analyzeReportMock.mockReset();
    getAnthropicApiKeyMock.mockReset();
    getAnthropicApiKeyMock.mockReturnValue('sk-ant-test');
    analyzeReportMock.mockResolvedValue({ ok: true, text: 'not json' });
  });

  it('does not show a previous analysis error on a different report', async () => {
    await render(<App />);
    const user = userEvent.setup();

    await user.press(screen.getByText('Client Mode'));
    await user.press(screen.getByTestId('fake-settings-gear'));
    await user.press(screen.getByTestId('settings-reports'));

    await waitFor(() => {
      expect(screen.getByTestId('reports-list-row-report-a')).toBeOnTheScreen();
    });

    await user.press(screen.getByTestId('reports-list-row-report-a'));
    await user.press(screen.getByTestId('report-details-analyze'));

    await waitFor(() => {
      expect(
        screen.getByTestId('report-details-analysis-error'),
      ).toHaveTextContent('Could not parse analysis JSON.');
    });

    await user.press(screen.getByTestId('report-details-back'));
    await user.press(screen.getByTestId('reports-list-row-report-b'));

    expect(screen.getByTestId('report-details-screen')).toBeOnTheScreen();
    expect(screen.getByTestId('report-details-job-name')).toHaveTextContent(
      'Clean session',
    );
    expect(screen.queryByTestId('report-details-analysis-error')).toBeNull();
  });
});
