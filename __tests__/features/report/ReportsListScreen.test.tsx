import React from 'react';
import {render, screen, userEvent} from '@testing-library/react-native';
import ReportsListScreen from '../../../src/features/report/screens/ReportsListScreen';

describe('ReportsListScreen', () => {
  it('shows the Reports title and empty-list copy', async () => {
    await render(<ReportsListScreen onBack={jest.fn()} />);

    expect(screen.getByTestId('reports-list-screen')).toBeOnTheScreen();
    expect(screen.getByText('Reports')).toBeOnTheScreen();
    expect(screen.getByText('No saved reports yet')).toBeOnTheScreen();
  });

  it('calls onBack when Back is pressed', async () => {
    const onBack = jest.fn();
    await render(<ReportsListScreen onBack={onBack} />);
    const user = userEvent.setup();

    await user.press(screen.getByTestId('reports-list-back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('opens the report stub when the placeholder row is pressed', async () => {
    const onOpenReport = jest.fn();
    await render(
      <ReportsListScreen onBack={jest.fn()} onOpenReport={onOpenReport} />,
    );
    const user = userEvent.setup();

    await user.press(screen.getByTestId('reports-list-placeholder'));
    expect(onOpenReport).toHaveBeenCalledTimes(1);
  });
});
