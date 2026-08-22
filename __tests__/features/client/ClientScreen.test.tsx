import React from 'react';
import {render, screen, userEvent} from '@testing-library/react-native';
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
  it('should display the current reconnect attempt out of the total retry limit', async () => {
    mockClient({
      connectionState: 'reconnecting',
      reconnectAttempt: 5,
    });

    await render(<ClientScreen onBack={jest.fn()} />);

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

      await render(<ClientScreen onBack={jest.fn()} />);

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

      await render(<ClientScreen onBack={jest.fn()} />);

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

      const {rerender} = await render(<ClientScreen onBack={jest.fn()} />);

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
      await rerender(<ClientScreen onBack={jest.fn()} />);

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
      await rerender(<ClientScreen onBack={jest.fn()} />);

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

      const {rerender} = await render(<ClientScreen onBack={jest.fn()} />);
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
      await rerender(<ClientScreen onBack={jest.fn()} />);
      expect(screen.queryByTestId('live-ppm-max')).toBeNull();

      streamingClient({
        ppm: 100,
        status: 'running',
        timestamp: 2,
      });
      await rerender(<ClientScreen onBack={jest.fn()} />);
      expect(screen.getByTestId('live-ppm-max')).toHaveTextContent('MAX 100');
    });
  });

  describe('record toggle', () => {
    it('does not show Record when disconnected', async () => {
      mockClient({connectionState: 'idle'});

      await render(<ClientScreen onBack={jest.fn()} />);

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

      await render(<ClientScreen onBack={jest.fn()} />);

      expect(screen.getByTestId('record-session-button')).toHaveTextContent(
        'Record',
      );
      expect(screen.getByTestId('record-session-button')).toBeDisabled();
    });

    it('toggles Record to Stop Recording and back when streaming', async () => {
      streamingClient({
        ppm: 250,
        status: 'running',
        timestamp: 1,
      });

      await render(<ClientScreen onBack={jest.fn()} />);
      const user = userEvent.setup();

      const button = screen.getByTestId('record-session-button');
      expect(button).toHaveTextContent('Record');
      expect(button).toBeEnabled();

      await user.press(button);
      expect(screen.getByTestId('record-session-button')).toHaveTextContent(
        'Stop Recording',
      );

      await user.press(screen.getByTestId('record-session-button'));
      expect(screen.getByTestId('record-session-button')).toHaveTextContent(
        'Record',
      );
    });

    it('resets to Record after disconnect', async () => {
      streamingClient({
        ppm: 250,
        status: 'running',
        timestamp: 1,
      });

      const {rerender} = await render(<ClientScreen onBack={jest.fn()} />);
      const user = userEvent.setup();
      await user.press(screen.getByTestId('record-session-button'));
      expect(screen.getByTestId('record-session-button')).toHaveTextContent(
        'Stop Recording',
      );

      mockClient({connectionState: 'idle'});
      await rerender(<ClientScreen onBack={jest.fn()} />);
      expect(screen.queryByTestId('record-session-button')).toBeNull();

      streamingClient({
        ppm: 250,
        status: 'running',
        timestamp: 2,
      });
      await rerender(<ClientScreen onBack={jest.fn()} />);
      expect(screen.getByTestId('record-session-button')).toHaveTextContent(
        'Record',
      );
    });
  });
});
