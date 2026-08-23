import React from 'react';
import {render, screen, userEvent} from '@testing-library/react-native';
import ReportsListScreen from '../../../src/features/report/screens/ReportsListScreen';
import {SavedReport} from '../../../src/types';

const namedReport: SavedReport = {
  id: 'report-1',
  jobName: 'Leak check',
  operatorName: 'Alex',
  startedAt: 1,
  endedAt: 2,
  ppmSamples: [{ppm: 100, timestamp: 1}],
  maxPpm: 100,
  partial: false,
  gaps: [],
};

const untitledReport: SavedReport = {
  ...namedReport,
  id: 'report-2',
  jobName: '',
  operatorName: '',
};

describe('ReportsListScreen', () => {
  it('shows the Reports title and empty-list copy without a placeholder row', async () => {
    await render(<ReportsListScreen reports={[]} onBack={jest.fn()} />);

    expect(screen.getByTestId('reports-list-screen')).toBeOnTheScreen();
    expect(screen.getByText('Reports')).toBeOnTheScreen();
    expect(screen.getByText('No saved reports yet')).toBeOnTheScreen();
    expect(screen.queryByTestId('reports-list-placeholder')).toBeNull();
  });

  it('calls onBack when Back is pressed', async () => {
    const onBack = jest.fn();
    await render(<ReportsListScreen reports={[]} onBack={onBack} />);
    const user = userEvent.setup();

    await user.press(screen.getByTestId('reports-list-back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('renders saved rows by list label and hides empty copy', async () => {
    await render(
      <ReportsListScreen
        reports={[namedReport, untitledReport]}
        onBack={jest.fn()}
        onOpenReport={jest.fn()}
      />,
    );

    expect(screen.queryByText('No saved reports yet')).toBeNull();
    expect(screen.queryByTestId('reports-list-placeholder')).toBeNull();
    expect(screen.getByTestId('reports-list-row-report-1')).toBeOnTheScreen();
    expect(screen.getByText('Leak check')).toBeOnTheScreen();
    expect(screen.getByTestId('reports-list-row-report-2')).toBeOnTheScreen();
    expect(screen.getByText('Untitled report')).toBeOnTheScreen();
  });

  it('calls onOpenReport with the row id when a saved report is pressed', async () => {
    const onOpenReport = jest.fn();
    await render(
      <ReportsListScreen
        reports={[namedReport]}
        onBack={jest.fn()}
        onOpenReport={onOpenReport}
      />,
    );
    const user = userEvent.setup();

    await user.press(screen.getByTestId('reports-list-row-report-1'));
    expect(onOpenReport).toHaveBeenCalledTimes(1);
    expect(onOpenReport).toHaveBeenCalledWith('report-1');
  });
});
