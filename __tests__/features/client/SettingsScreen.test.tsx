import React from 'react';
import {render, screen, userEvent} from '@testing-library/react-native';
import SettingsScreen from '../../../src/features/client/screens/SettingsScreen';

describe('SettingsScreen', () => {
  it('shows the Settings title', async () => {
    await render(<SettingsScreen onBack={jest.fn()} />);

    expect(screen.getByTestId('settings-screen')).toBeOnTheScreen();
    expect(screen.getByText('Settings')).toBeOnTheScreen();
  });

  it('calls onBack when Back is pressed', async () => {
    const onBack = jest.fn();
    await render(<SettingsScreen onBack={onBack} />);
    const user = userEvent.setup();

    await user.press(screen.getByTestId('settings-back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('opens Reports when the Reports row is pressed', async () => {
    const onOpenReports = jest.fn();
    await render(
      <SettingsScreen onBack={jest.fn()} onOpenReports={onOpenReports} />,
    );
    const user = userEvent.setup();

    await user.press(screen.getByTestId('settings-reports'));
    expect(onOpenReports).toHaveBeenCalledTimes(1);
  });
});
