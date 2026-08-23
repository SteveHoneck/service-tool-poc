import React from 'react';
import {Alert} from 'react-native';
import {act, render, screen, userEvent} from '@testing-library/react-native';
import {MAX_RECONNECT_ATTEMPTS} from '../../../src/domain/connection/policy';
import {useBleClient} from '../../../src/features/client/hooks/useBleClient';
import ClientScreen from '../../../src/features/client/screens/ClientScreen';
import {TelemetryPayload} from '../../../src/types';

jest.mock('../../../src/features/client/hooks/useBleClient');
jest.mock('../../../src/domain/connection/policy', () => ({
  ...jest.requireActual('../../../src/domain/connection/policy'),
  MAX_RECONNECT_ATTEMPTS: 9,
}));

const mockUseBleClient = jest.mocked(useBleClient);

function mockClient(
  overrides: Partial<ReturnType<typeof useBleClient>> = {},
) {
  mockUseBleClient.mockReturnValue({
    connectionState: 'idle',
    devices: [],
    connectedDevice: null,
    telemetry: null,
    firmwareVersion: null,
    firmwareCompatibility: 'unknown',
    errorMessage: null,
    reconnectAttempt: 0,
    startScan: jest.fn(),
    stopScan: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    reconnectLastDevice: jest.fn(),
    ...overrides,
  });
}

function streamingClient(
  telemetry: TelemetryPayload,
  overrides: Partial<ReturnType<typeof useBleClient>> = {},
) {
  mockClient({
    connectionState: 'streaming',
    connectedDevice: {
      id: 'tool-1',
      name: 'ServiceTool-001',
      rssi: -40,
    },
    firmwareVersion: '1.2.0',
    firmwareCompatibility: 'compatible',
    telemetry,
    ...overrides,
  });
}

describe('ClientScreen', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows a settings gear on the main screen', async () => {
    mockClient();

    await render(<ClientScreen onBack={jest.fn()} onCreateReport={jest.fn()} />);

    expect(screen.getByTestId('settings-gear')).toBeOnTheScreen();
    expect(screen.getByLabelText('Settings')).toBeOnTheScreen();
  });

  it('should display the current reconnect attempt out of the total retry limit', async () => {
    mockClient({
      connectionState: 'reconnecting',
      reconnectAttempt: 5,
    });

    await render(<ClientScreen onBack={jest.fn()} onCreateReport={jest.fn()} />);

    expect(
      screen.getByText(`Attempt 5 of ${MAX_RECONNECT_ATTEMPTS}`),
    ).toBeOnTheScreen();
  });

  describe('live PPM', () => {
    it('displays ppm from mock BLE telemetry', async () => {
      streamingClient({
        ppm: 250,
        status: 'running',
        timestamp: 1,
      });

      await render(<ClientScreen onBack={jest.fn()} onCreateReport={jest.fn()} />);

      expect(screen.getByText('Live PPM')).toBeOnTheScreen();
      expect(screen.getByTestId('live-ppm-value')).toHaveTextContent('250');
      expect(screen.getByText('ppm')).toBeOnTheScreen();
      expect(screen.queryByText('Live Telemetry')).toBeNull();
      expect(screen.queryByText(/°C/)).toBeNull();
      expect(screen.queryByText(/RPM/)).toBeNull();
    });

    it('shows waiting copy when connected without telemetry', async () => {
      mockClient({
        connectionState: 'connected',
        connectedDevice: {
          id: 'tool-1',
          name: 'ServiceTool-001',
          rssi: -40,
        },
        telemetry: null,
      });

      await render(<ClientScreen onBack={jest.fn()} onCreateReport={jest.fn()} />);

      expect(screen.getByText('Live PPM')).toBeOnTheScreen();
      expect(screen.getByText('Waiting for notify stream…')).toBeOnTheScreen();
      expect(screen.queryByTestId('live-ppm-value')).toBeNull();
      expect(screen.queryByTestId('ppm-level-bar')).toBeNull();
    });

    it('tracks MAX across telemetry updates and fills the level bar', async () => {
      streamingClient({
        ppm: 100,
        status: 'running',
        timestamp: 1,
      });

      const {rerender} = await render(<ClientScreen onBack={jest.fn()} onCreateReport={jest.fn()} />);

      expect(screen.getByTestId('live-ppm-value')).toHaveTextContent('100');
      expect(screen.getByTestId('live-ppm-max')).toHaveTextContent('MAX 100');
      expect(screen.getByTestId('ppm-level-bar')).toHaveProp(
        'accessibilityValue',
        {min: 0, max: 100, now: 20},
      );

      streamingClient({
        ppm: 300,
        status: 'running',
        timestamp: 2,
      });
      await rerender(<ClientScreen onBack={jest.fn()} onCreateReport={jest.fn()} />);

      expect(screen.getByTestId('live-ppm-value')).toHaveTextContent('300');
      expect(screen.getByTestId('live-ppm-max')).toHaveTextContent('MAX 300');
      expect(screen.getByTestId('ppm-level-bar')).toHaveProp(
        'accessibilityValue',
        {min: 0, max: 100, now: 60},
      );

      streamingClient({
        ppm: 50,
        status: 'running',
        timestamp: 3,
      });
      await rerender(<ClientScreen onBack={jest.fn()} onCreateReport={jest.fn()} />);

      expect(screen.getByTestId('live-ppm-value')).toHaveTextContent('50');
      expect(screen.getByTestId('live-ppm-max')).toHaveTextContent('MAX 300');
      expect(screen.getByTestId('ppm-level-bar')).toHaveProp(
        'accessibilityValue',
        {min: 0, max: 100, now: 10},
      );
    });

    it('resets MAX when telemetry drops', async () => {
      streamingClient({
        ppm: 200,
        status: 'running',
        timestamp: 1,
      });

      const {rerender} = await render(<ClientScreen onBack={jest.fn()} onCreateReport={jest.fn()} />);
      expect(screen.getByTestId('live-ppm-max')).toHaveTextContent('MAX 200');

      mockClient({
        connectionState: 'reconnecting',
        connectedDevice: {
          id: 'tool-1',
          name: 'ServiceTool-001',
          rssi: -40,
        },
        telemetry: null,
      });
      await rerender(<ClientScreen onBack={jest.fn()} onCreateReport={jest.fn()} />);
      expect(screen.queryByTestId('live-ppm-max')).toBeNull();

      streamingClient({
        ppm: 100,
        status: 'running',
        timestamp: 2,
      });
      await rerender(<ClientScreen onBack={jest.fn()} onCreateReport={jest.fn()} />);
      expect(screen.getByTestId('live-ppm-max')).toHaveTextContent('MAX 100');
    });
  });

  describe('record toggle', () => {
    it('does not show Record when disconnected', async () => {
      mockClient({connectionState: 'idle'});

      await render(<ClientScreen onBack={jest.fn()} onCreateReport={jest.fn()} />);

      expect(screen.queryByTestId('record-session-button')).toBeNull();
    });

    it('shows a disabled Record button when connected without a live stream', async () => {
      mockClient({
        connectionState: 'connected',
        connectedDevice: {
          id: 'tool-1',
          name: 'ServiceTool-001',
          rssi: -40,
        },
        telemetry: null,
      });

      await render(<ClientScreen onBack={jest.fn()} onCreateReport={jest.fn()} />);

      expect(screen.getByTestId('record-session-button')).toHaveTextContent(
        'Record',
      );
      expect(screen.getByTestId('record-session-button')).toBeDisabled();
    });

    it('switches Record to Stop Recording when streaming', async () => {
      streamingClient({
        ppm: 250,
        status: 'running',
        timestamp: 1,
      });

      await render(<ClientScreen onBack={jest.fn()} onCreateReport={jest.fn()} />);
      const user = userEvent.setup();

      const button = screen.getByTestId('record-session-button');
      expect(button).toHaveTextContent('Record');
      expect(button).toBeEnabled();

      await user.press(button);
      expect(screen.getByTestId('record-session-button')).toHaveTextContent(
        'Stop Recording',
      );
    });

    it('resets to Record after disconnect', async () => {
      streamingClient({
        ppm: 250,
        status: 'running',
        timestamp: 1,
      });

      const {rerender} = await render(<ClientScreen onBack={jest.fn()} onCreateReport={jest.fn()} />);
      const user = userEvent.setup();
      await user.press(screen.getByTestId('record-session-button'));
      expect(screen.getByTestId('record-session-button')).toHaveTextContent(
        'Stop Recording',
      );

      mockClient({connectionState: 'idle'});
      await rerender(<ClientScreen onBack={jest.fn()} onCreateReport={jest.fn()} />);
      expect(screen.queryByTestId('record-session-button')).toBeNull();

      streamingClient({
        ppm: 250,
        status: 'running',
        timestamp: 2,
      });
      await rerender(<ClientScreen onBack={jest.fn()} onCreateReport={jest.fn()} />);
      expect(screen.getByTestId('record-session-button')).toHaveTextContent(
        'Record',
      );
    });

    it('hands the captured log to Create Report on Stop', async () => {
      const onCreateReport = jest.fn();
      streamingClient({
        ppm: 100,
        status: 'running',
        timestamp: 1,
      });

      const {rerender} = await render(
        <ClientScreen onBack={jest.fn()} onCreateReport={onCreateReport} />,
      );
      const user = userEvent.setup();

      expect(screen.queryByTestId('recording-sample-count')).toBeNull();

      await user.press(screen.getByTestId('record-session-button'));
      expect(screen.getByTestId('recording-sample-count')).toHaveTextContent(
        '1 sample',
      );

      streamingClient({
        ppm: 180,
        status: 'running',
        timestamp: 2,
      });
      await rerender(
        <ClientScreen onBack={jest.fn()} onCreateReport={onCreateReport} />,
      );
      expect(screen.getByTestId('recording-sample-count')).toHaveTextContent(
        '2 samples',
      );

      await user.press(screen.getByTestId('record-session-button'));
      expect(onCreateReport).toHaveBeenCalledTimes(1);
      expect(onCreateReport).toHaveBeenCalledWith({
        samples: [
          {ppm: 100, timestamp: 1},
          {ppm: 180, timestamp: 2},
        ],
        gaps: [],
        partial: false,
      });
      expect(screen.getByTestId('record-session-button')).toHaveTextContent(
        'Record',
      );
      expect(screen.queryByTestId('recording-sample-count')).toBeNull();
    });

    it('does not log while reconnecting and resumes the same log after stream returns', async () => {
      streamingClient({
        ppm: 100,
        status: 'running',
        timestamp: 1,
      });

      const {rerender} = await render(<ClientScreen onBack={jest.fn()} onCreateReport={jest.fn()} />);
      const user = userEvent.setup();
      await user.press(screen.getByTestId('record-session-button'));

      mockClient({
        connectionState: 'reconnecting',
        connectedDevice: {
          id: 'tool-1',
          name: 'ServiceTool-001',
          rssi: -40,
        },
        telemetry: null,
      });
      await rerender(<ClientScreen onBack={jest.fn()} onCreateReport={jest.fn()} />);
      expect(screen.getByTestId('record-session-button')).toHaveTextContent(
        'Stop Recording',
      );
      expect(screen.getByTestId('recording-sample-count')).toHaveTextContent(
        '1 sample',
      );

      streamingClient({
        ppm: 80,
        status: 'running',
        timestamp: 2,
      });
      await rerender(<ClientScreen onBack={jest.fn()} onCreateReport={jest.fn()} />);
      expect(screen.getByTestId('recording-sample-count')).toHaveTextContent(
        '2 samples',
      );
    });

    it('freezes last PPM and MAX while recording across a drop', async () => {
      streamingClient({
        ppm: 200,
        status: 'running',
        timestamp: 1,
      });

      const {rerender} = await render(
        <ClientScreen onBack={jest.fn()} onCreateReport={jest.fn()} />,
      );
      const user = userEvent.setup();
      await user.press(screen.getByTestId('record-session-button'));

      mockClient({
        connectionState: 'reconnecting',
        connectedDevice: {
          id: 'tool-1',
          name: 'ServiceTool-001',
          rssi: -40,
        },
        telemetry: null,
      });
      await rerender(
        <ClientScreen onBack={jest.fn()} onCreateReport={jest.fn()} />,
      );

      expect(screen.getByTestId('live-ppm-value')).toHaveTextContent('200');
      expect(screen.getByTestId('live-ppm-max')).toHaveTextContent('MAX 200');
      expect(screen.queryByText('Waiting for notify stream…')).toBeNull();
    });

    it('keeps the log after reconnect is exhausted and Stop is partial', async () => {
      const onCreateReport = jest.fn();
      const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
      streamingClient({
        ppm: 100,
        status: 'running',
        timestamp: 1,
      });

      const {rerender} = await render(
        <ClientScreen onBack={jest.fn()} onCreateReport={onCreateReport} />,
      );
      const user = userEvent.setup();
      await user.press(screen.getByTestId('record-session-button'));

      mockClient({
        connectionState: 'reconnecting',
        connectedDevice: {
          id: 'tool-1',
          name: 'ServiceTool-001',
          rssi: -40,
        },
        telemetry: null,
      });
      await rerender(
        <ClientScreen onBack={jest.fn()} onCreateReport={onCreateReport} />,
      );
      expect(alertSpy).not.toHaveBeenCalled();

      mockClient({
        connectionState: 'disconnected',
        connectedDevice: {
          id: 'tool-1',
          name: 'ServiceTool-001',
          rssi: -40,
        },
        telemetry: null,
      });
      await rerender(
        <ClientScreen onBack={jest.fn()} onCreateReport={onCreateReport} />,
      );

      expect(screen.getByTestId('recording-sample-count')).toHaveTextContent(
        '1 sample',
      );
      expect(screen.getByTestId('record-session-button')).toHaveTextContent(
        'Stop Recording',
      );
      expect(alertSpy).toHaveBeenCalledTimes(1);
      expect(alertSpy).toHaveBeenCalledWith(
        'Could not reconnect',
        'Save partial report or keep trying?',
        expect.arrayContaining([
          expect.objectContaining({text: 'Keep trying'}),
          expect.objectContaining({text: 'Save partial report'}),
        ]),
      );

      await rerender(
        <ClientScreen
          onBack={jest.fn()}
          onCreateReport={capture => onCreateReport(capture)}
        />,
      );
      expect(alertSpy).toHaveBeenCalledTimes(1);

      await user.press(screen.getByTestId('record-session-button'));
      expect(onCreateReport).toHaveBeenCalledWith({
        samples: [{ppm: 100, timestamp: 1}],
        gaps: [{at: 1, reason: 'disconnect'}],
        partial: true,
      });
    });

    it('does not show leftover scan results after the connection drops', async () => {
      mockClient({
        connectionState: 'disconnected',
        devices: [
          {
            id: 'tool-1',
            name: 'ServiceTool-001',
            rssi: -40,
          },
        ],
      });

      await render(
        <ClientScreen onBack={jest.fn()} onCreateReport={jest.fn()} />,
      );

      expect(screen.getByText('Scan for Tools')).toBeOnTheScreen();
      expect(screen.getByText('Reconnect Last Device')).toBeOnTheScreen();
      expect(screen.queryByText('Connect')).toBeNull();
    });

    it('shows scan hits only while scanning', async () => {
      mockClient({
        connectionState: 'scanning',
        devices: [
          {
            id: 'tool-1',
            name: 'ServiceTool-001',
            rssi: -40,
          },
        ],
      });

      await render(
        <ClientScreen onBack={jest.fn()} onCreateReport={jest.fn()} />,
      );

      expect(screen.getByText('ServiceTool-001')).toBeOnTheScreen();
      expect(screen.getByText('Connect')).toBeOnTheScreen();
    });

    it('saves a partial report from the reconnect-failed prompt', async () => {
      const onCreateReport = jest.fn();
      const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
      streamingClient({
        ppm: 100,
        status: 'running',
        timestamp: 1,
      });

      const {rerender} = await render(
        <ClientScreen onBack={jest.fn()} onCreateReport={onCreateReport} />,
      );
      const user = userEvent.setup();
      await user.press(screen.getByTestId('record-session-button'));

      mockClient({
        connectionState: 'disconnected',
        connectedDevice: {
          id: 'tool-1',
          name: 'ServiceTool-001',
          rssi: -40,
        },
        telemetry: null,
      });
      await rerender(
        <ClientScreen onBack={jest.fn()} onCreateReport={onCreateReport} />,
      );

      const buttons = alertSpy.mock.calls[0][2] as Array<{
        text: string;
        onPress?: () => void;
      }>;
      const save = buttons.find(button => button.text === 'Save partial report');
      await act(() => {
        save?.onPress?.();
      });

      expect(onCreateReport).toHaveBeenCalledWith({
        samples: [{ppm: 100, timestamp: 1}],
        gaps: [{at: 1, reason: 'disconnect'}],
        partial: true,
      });
    });

    it('prompts again if reconnect succeeds then fails a second time', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
      streamingClient({
        ppm: 100,
        status: 'running',
        timestamp: 1,
      });

      const {rerender} = await render(
        <ClientScreen onBack={jest.fn()} onCreateReport={jest.fn()} />,
      );
      const user = userEvent.setup();
      await user.press(screen.getByTestId('record-session-button'));

      const dropped = {
        connectionState: 'disconnected' as const,
        connectedDevice: {
          id: 'tool-1',
          name: 'ServiceTool-001',
          rssi: -40,
        },
        telemetry: null,
      };
      mockClient(dropped);
      await rerender(
        <ClientScreen onBack={jest.fn()} onCreateReport={jest.fn()} />,
      );
      expect(alertSpy).toHaveBeenCalledTimes(1);

      streamingClient({
        ppm: 80,
        status: 'running',
        timestamp: 2,
      });
      await rerender(
        <ClientScreen onBack={jest.fn()} onCreateReport={jest.fn()} />,
      );
      mockClient(dropped);
      await rerender(
        <ClientScreen onBack={jest.fn()} onCreateReport={jest.fn()} />,
      );
      expect(alertSpy).toHaveBeenCalledTimes(2);
    });
  });
});
