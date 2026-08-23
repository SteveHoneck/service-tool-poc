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
});
