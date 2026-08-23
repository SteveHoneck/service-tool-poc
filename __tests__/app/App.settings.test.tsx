import React from 'react';
import {render, screen, userEvent} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  const memory = new Map<string, string>();

  beforeEach(() => {
    memory.clear();
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
    expect(screen.getByText('No saved reports yet')).toBeOnTheScreen();
    expect(screen.queryByTestId('reports-list-placeholder')).toBeNull();
    expect(screen.queryByTestId('settings-screen')).toBeNull();

    await user.press(screen.getByTestId('reports-list-back'));

    expect(screen.queryByTestId('reports-list-screen')).toBeNull();
    expect(screen.getByTestId('settings-screen')).toBeOnTheScreen();
    expect(screen.queryByTestId('fake-settings-gear')).toBeNull();
  });

  it('does not open a report stub from an empty list', async () => {
    await render(<App />);
    const user = userEvent.setup();

    await user.press(screen.getByText('Client Mode'));
    await user.press(screen.getByTestId('fake-settings-gear'));
    await user.press(screen.getByTestId('settings-reports'));

    expect(screen.queryByTestId('reports-list-placeholder')).toBeNull();
    expect(screen.queryByTestId('report-stub-screen')).toBeNull();
  });
});
