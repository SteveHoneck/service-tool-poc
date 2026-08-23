import React from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import ReportDetailsScreen from '../../../src/features/report/screens/ReportDetailsScreen';
import { SavedReport } from '../../../src/types';

const namedReport: SavedReport = {
  id: 'report-1',
  jobName: 'Leak check',
  operatorName: 'Alex',
  startedAt: 1,
  endedAt: 2,
  ppmSamples: [
    { ppm: 100, timestamp: 1 },
    { ppm: 180, timestamp: 2 },
  ],
  maxPpm: 180,
  partial: false,
  gaps: [],
};

describe('ReportDetailsScreen', () => {
  it('shows job, operator, last PPM, and MAX', async () => {
    await render(
      <ReportDetailsScreen report={namedReport} onBack={jest.fn()} />,
    );

    expect(screen.getByTestId('report-details-screen')).toBeOnTheScreen();
    expect(screen.getByTestId('report-details-job-name')).toHaveTextContent(
      'Leak check',
    );
    expect(screen.getByTestId('report-details-operator')).toHaveTextContent(
      'Alex',
    );
    expect(screen.getByTestId('report-details-last-ppm')).toHaveTextContent(
      'Last 180 ppm',
    );
    expect(screen.getByTestId('report-details-max-ppm')).toHaveTextContent(
      'MAX 180',
    );
    expect(screen.queryByTestId('report-details-partial-note')).toBeNull();
    expect(screen.getByTestId('report-details-chart')).toBeOnTheScreen();
  });

  it('uses Untitled report when the job name is blank', async () => {
    await render(
      <ReportDetailsScreen
        report={{ ...namedReport, jobName: '' }}
        onBack={jest.fn()}
      />,
    );

    expect(screen.getByTestId('report-details-job-name')).toHaveTextContent(
      'Untitled report',
    );
  });

  it('notes when the session ended after a connection loss', async () => {
    await render(
      <ReportDetailsScreen
        report={{ ...namedReport, partial: true }}
        onBack={jest.fn()}
      />,
    );

    expect(screen.getByTestId('report-details-partial-note')).toHaveTextContent(
      'Connection lost during session',
    );
  });

  it('shows last PPM as 0 when there are no samples', async () => {
    await render(
      <ReportDetailsScreen
        report={{ ...namedReport, ppmSamples: [], maxPpm: 0 }}
        onBack={jest.fn()}
      />,
    );

    expect(screen.getByTestId('report-details-last-ppm')).toHaveTextContent(
      'Last 0 ppm',
    );
    expect(screen.getByTestId('report-details-max-ppm')).toHaveTextContent(
      'MAX 0',
    );
    expect(screen.getByTestId('report-details-chart')).toBeOnTheScreen();
  });

  it('calls onBack when Back is pressed', async () => {
    const onBack = jest.fn();
    await render(<ReportDetailsScreen report={namedReport} onBack={onBack} />);
    const user = userEvent.setup();

    await user.press(screen.getByTestId('report-details-back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
