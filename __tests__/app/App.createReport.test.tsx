import React from 'react';
import {
  render,
  screen,
  userEvent,
  waitFor,
} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generatePDF } from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import App from '../../src/app/App';
import { SessionCapture } from '../../src/types';

jest.mock('../../src/features/client/screens/ClientScreen', () => {
  const ReactNative = require('react-native');
  return {
    __esModule: true,
    default: ({
      onCreateReport,
      onOpenSettings,
    }: {
      onCreateReport: (capture: SessionCapture) => void;
      onOpenSettings: () => void;
    }) => (
      <>
        <ReactNative.Pressable
          testID="fake-stop-recording"
          onPress={() =>
            onCreateReport({
              samples: [{ ppm: 100, timestamp: 1 }],
              gaps: [{ at: 1, reason: 'disconnect' }],
              partial: true,
            })
          }
        >
          <ReactNative.Text>Stop Recording</ReactNative.Text>
        </ReactNative.Pressable>
        <ReactNative.Pressable
          testID="fake-settings-gear"
          onPress={onOpenSettings}
        >
          <ReactNative.Text>Settings gear</ReactNative.Text>
        </ReactNative.Pressable>
      </>
    ),
  };
});

describe('App create report navigation', () => {
  const memory = new Map<string, string>();

  beforeEach(() => {
    memory.clear();
    (generatePDF as jest.Mock).mockClear();
    (Share.open as jest.Mock).mockClear();
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) =>
      Promise.resolve(memory.get(key) ?? null),
    );
    (AsyncStorage.setItem as jest.Mock).mockImplementation(
      (key: string, value: string) => {
        memory.set(key, value);
        return Promise.resolve();
      },
    );
  });

  afterEach(() => {
    (AsyncStorage.getItem as jest.Mock).mockReset();
    (AsyncStorage.setItem as jest.Mock).mockReset();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  async function openCreateReport() {
    const user = userEvent.setup();
    await render(<App />);
    await user.press(screen.getByText('Client Mode'));
    await user.press(screen.getByTestId('fake-stop-recording'));
    return user;
  }

  it('opens Create Report with the partial-session note', async () => {
    await openCreateReport();

    expect(screen.getByTestId('create-report-screen')).toBeOnTheScreen();
    expect(screen.getByTestId('create-report-partial-note')).toHaveTextContent(
      'Connection lost during session',
    );
    expect(screen.getByTestId('create-report-sample-count')).toHaveTextContent(
      '1 sample captured',
    );
  });

  it('saves a report and shows it on the Reports list', async () => {
    const user = await openCreateReport();

    await user.type(screen.getByTestId('create-report-job-name'), 'Leak check');
    await user.press(screen.getByTestId('create-report-save'));

    await waitFor(() => {
      expect(screen.getByTestId('reports-list-screen')).toBeOnTheScreen();
    });
    expect(screen.getByText('Leak check')).toBeOnTheScreen();
    expect(screen.queryByText('No saved reports yet')).toBeNull();
    expect(screen.queryByTestId('create-report-screen')).toBeNull();
  });

  it('does not persist a report when Back is pressed without Save', async () => {
    const user = await openCreateReport();

    await user.type(screen.getByTestId('create-report-job-name'), 'Leak check');
    await user.press(screen.getByTestId('create-report-back'));
    await user.press(screen.getByTestId('fake-settings-gear'));
    await user.press(screen.getByTestId('settings-reports'));

    expect(screen.getByText('No saved reports yet')).toBeOnTheScreen();
    expect(screen.queryByText('Leak check')).toBeNull();
  });

  it('keeps the saved row through Settings and opens details from it', async () => {
    const user = await openCreateReport();

    await user.type(screen.getByTestId('create-report-job-name'), 'Leak check');
    await user.press(screen.getByTestId('create-report-save'));

    await waitFor(() => {
      expect(screen.getByText('Leak check')).toBeOnTheScreen();
    });

    await user.press(screen.getByTestId('reports-list-back'));
    expect(screen.getByTestId('settings-screen')).toBeOnTheScreen();

    await user.press(screen.getByTestId('settings-reports'));
    expect(screen.getByText('Leak check')).toBeOnTheScreen();

    await user.press(screen.getByText('Leak check'));
    expect(screen.getByTestId('report-details-screen')).toBeOnTheScreen();
    expect(screen.getByTestId('report-details-job-name')).toHaveTextContent(
      'Leak check',
    );
    expect(screen.getByText('Last reading')).toBeOnTheScreen();
    expect(screen.getByTestId('report-details-last-ppm')).toHaveTextContent(
      '100 ppm',
    );

    await user.press(screen.getByTestId('report-details-back'));
    expect(screen.getByTestId('reports-list-screen')).toBeOnTheScreen();
    expect(screen.getByText('Leak check')).toBeOnTheScreen();
  });

  it('shares a PDF from report details', async () => {
    const user = await openCreateReport();

    await user.type(screen.getByTestId('create-report-job-name'), 'Leak check');
    await user.press(screen.getByTestId('create-report-save'));

    await waitFor(() => {
      expect(screen.getByText('Leak check')).toBeOnTheScreen();
    });

    await user.press(screen.getByText('Leak check'));
    await user.press(screen.getByTestId('report-details-share-pdf'));

    await waitFor(() => {
      expect(generatePDF).toHaveBeenCalled();
    });
    const options = (generatePDF as jest.Mock).mock.calls[0][0];
    expect(options.html).toContain('Leak check');
    expect(options.fileName).toBe('Leak-check');
    expect(Share.open).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'application/pdf',
        failOnCancel: false,
      }),
    );
  });
});
