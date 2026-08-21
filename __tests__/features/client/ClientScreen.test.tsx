import React from 'react';
import {render, screen} from '@testing-library/react-native';
import {MAX_RECONNECT_ATTEMPTS} from '../../../src/domain/connection/policy';
import {useBleClient} from '../../../src/features/client/hooks/useBleClient';
import ClientScreen from '../../../src/features/client/screens/ClientScreen';

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
});
