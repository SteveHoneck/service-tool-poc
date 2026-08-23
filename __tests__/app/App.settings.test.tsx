import React from 'react';
import {render, screen, userEvent} from '@testing-library/react-native';
import App from '../../src/app/App';

jest.mock('../../src/features/client/screens/ClientScreen', () => {
  const ReactNative = require('react-native');
  return {
    __esModule: true,
    default: ({onOpenSettings}: {onOpenSettings: () => void}) => (
      <ReactNative.Pressable
        testID="fake-settings-gear"
        onPress={onOpenSettings}>
        <ReactNative.Text>Settings gear</ReactNative.Text>
      </ReactNative.Pressable>
    ),
  };
});

describe('App settings navigation', () => {
  it('opens Settings from the gear and Back returns to Client', async () => {
    await render(<App />);
    const user = userEvent.setup();

    await user.press(screen.getByText('Client Mode'));
    await user.press(screen.getByTestId('fake-settings-gear'));

    expect(screen.getByTestId('settings-screen')).toBeOnTheScreen();
    expect(screen.getByText('Settings')).toBeOnTheScreen();

    await user.press(screen.getByTestId('settings-back'));

    expect(screen.queryByTestId('settings-screen')).toBeNull();
    expect(screen.getByTestId('fake-settings-gear')).toBeOnTheScreen();
  });

  it('opens Reports from Settings and Back returns to Settings', async () => {
    await render(<App />);
    const user = userEvent.setup();

    await user.press(screen.getByText('Client Mode'));
    await user.press(screen.getByTestId('fake-settings-gear'));
    await user.press(screen.getByTestId('settings-reports'));

    expect(screen.getByTestId('reports-list-screen')).toBeOnTheScreen();
    expect(screen.queryByTestId('settings-screen')).toBeNull();

    await user.press(screen.getByTestId('reports-list-back'));

    expect(screen.queryByTestId('reports-list-screen')).toBeNull();
    expect(screen.getByTestId('settings-screen')).toBeOnTheScreen();
    expect(screen.queryByTestId('fake-settings-gear')).toBeNull();
  });

  it('opens the report stub from the list and Back returns to Reports', async () => {
    await render(<App />);
    const user = userEvent.setup();

    await user.press(screen.getByText('Client Mode'));
    await user.press(screen.getByTestId('fake-settings-gear'));
    await user.press(screen.getByTestId('settings-reports'));
    await user.press(screen.getByTestId('reports-list-placeholder'));

    expect(screen.getByTestId('report-stub-screen')).toBeOnTheScreen();
    expect(screen.queryByTestId('reports-list-screen')).toBeNull();

    await user.press(screen.getByTestId('report-stub-back'));

    expect(screen.queryByTestId('report-stub-screen')).toBeNull();
    expect(screen.getByTestId('reports-list-screen')).toBeOnTheScreen();
    expect(screen.queryByTestId('settings-screen')).toBeNull();
  });
});
