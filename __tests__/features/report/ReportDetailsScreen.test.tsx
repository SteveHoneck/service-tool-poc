import React from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import { AnalysisResult } from '../../../src/domain/report/buildAnalysisRequest';
import ReportDetailsScreen from '../../../src/features/report/screens/ReportDetailsScreen';
import { SavedReport } from '../../../src/types';

const namedReport: SavedReport = {
  id: 'report-1',
  jobName: 'Leak check',
  operatorName: 'Alex',
  startedAt: 0,
  endedAt: 10_000,
  ppmSamples: [
    { ppm: 100, timestamp: 0 },
    { ppm: 180, timestamp: 10_000 },
  ],
  maxPpm: 180,
  partial: false,
  gaps: [],
};

describe('ReportDetailsScreen', () => {
  it('shows Report Details with labeled job, operator, notes, and readings', async () => {
    await render(
      <ReportDetailsScreen report={namedReport} onBack={jest.fn()} />,
    );

    expect(screen.getByTestId('report-details-screen')).toBeOnTheScreen();
    expect(screen.getByTestId('report-details-scroll')).toBeOnTheScreen();
    expect(screen.getByText('Report Details')).toBeOnTheScreen();
    expect(screen.getByText('Job name')).toBeOnTheScreen();
    expect(screen.getByTestId('report-details-job-name')).toHaveTextContent(
      'Leak check',
    );
    expect(screen.getByText('Operator')).toBeOnTheScreen();
    expect(screen.getByTestId('report-details-operator')).toHaveTextContent(
      'Alex',
    );
    expect(screen.getByText('Notes')).toBeOnTheScreen();
    expect(screen.getByTestId('report-details-notes')).toHaveTextContent('-');
    expect(screen.getByText('Last reading')).toBeOnTheScreen();
    expect(screen.getByTestId('report-details-last-ppm')).toHaveTextContent(
      '180 ppm',
    );
    expect(screen.getByText('Max. reading')).toBeOnTheScreen();
    expect(screen.getByTestId('report-details-max-ppm')).toHaveTextContent(
      '180 ppm',
    );
    expect(screen.getByTestId('report-details-chart')).toBeOnTheScreen();
    expect(screen.getByTestId('report-details-y-high')).toHaveTextContent(
      '180',
    );
    expect(screen.getByTestId('report-details-y-mid')).toHaveTextContent('90');
    expect(screen.getByTestId('report-details-y-low')).toHaveTextContent('0');
    expect(screen.getByTestId('report-details-x-start')).toHaveTextContent(
      '0 s',
    );
    expect(screen.getByTestId('report-details-x-mid')).toHaveTextContent('5 s');
    expect(screen.getByTestId('report-details-x-end')).toHaveTextContent(
      '10 s',
    );
    expect(screen.getByText('PPM')).toBeOnTheScreen();
    expect(screen.getByText('Time (s)')).toBeOnTheScreen();
    expect(screen.getByTestId('report-details-y-axis')).toBeOnTheScreen();
    expect(screen.getByTestId('report-details-x-axis')).toBeOnTheScreen();
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

  it('shows the connection-lost copy in Notes when the session is partial', async () => {
    await render(
      <ReportDetailsScreen
        report={{ ...namedReport, partial: true }}
        onBack={jest.fn()}
      />,
    );

    expect(screen.getByTestId('report-details-notes')).toHaveTextContent(
      'Connection lost during session',
    );
  });

  it('shows last and max readings as 0 ppm when there are no samples', async () => {
    await render(
      <ReportDetailsScreen
        report={{ ...namedReport, ppmSamples: [], maxPpm: 0 }}
        onBack={jest.fn()}
      />,
    );

    expect(screen.getByText('Last reading')).toBeOnTheScreen();
    expect(screen.getByTestId('report-details-last-ppm')).toHaveTextContent(
      '0 ppm',
    );
    expect(screen.getByText('Max. reading')).toBeOnTheScreen();
    expect(screen.getByTestId('report-details-max-ppm')).toHaveTextContent(
      '0 ppm',
    );
    expect(screen.getByTestId('report-details-chart')).toBeOnTheScreen();
    expect(screen.getByTestId('report-details-y-high')).toHaveTextContent('0');
    expect(screen.getByTestId('report-details-x-end')).toHaveTextContent('0 s');
    expect(screen.getByText('PPM')).toBeOnTheScreen();
    expect(screen.getByText('Time (s)')).toBeOnTheScreen();
    expect(screen.getByTestId('report-details-y-axis')).toBeOnTheScreen();
    expect(screen.getByTestId('report-details-x-axis')).toBeOnTheScreen();
  });

  it('calls onBack when Back is pressed', async () => {
    const onBack = jest.fn();
    await render(<ReportDetailsScreen report={namedReport} onBack={onBack} />);
    const user = userEvent.setup();

    await user.press(screen.getByTestId('report-details-back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('calls onSharePdf when Share PDF is pressed', async () => {
    const onSharePdf = jest.fn();
    await render(
      <ReportDetailsScreen
        report={namedReport}
        onBack={jest.fn()}
        onSharePdf={onSharePdf}
      />,
    );
    const user = userEvent.setup();

    await user.press(screen.getByTestId('report-details-share-pdf'));
    expect(onSharePdf).toHaveBeenCalledTimes(1);
  });

  it('disables Share PDF while sharing', async () => {
    const onSharePdf = jest.fn();
    await render(
      <ReportDetailsScreen
        report={namedReport}
        onBack={jest.fn()}
        onSharePdf={onSharePdf}
        sharing
      />,
    );
    const user = userEvent.setup();
    const button = screen.getByTestId('report-details-share-pdf');

    expect(button).toBeDisabled();
    await user.press(button);
    expect(onSharePdf).not.toHaveBeenCalled();
  });

  it('shows a share error when shareError is set', async () => {
    await render(
      <ReportDetailsScreen
        report={namedReport}
        onBack={jest.fn()}
        onSharePdf={jest.fn()}
        shareError="Could not create PDF"
      />,
    );

    expect(screen.getByTestId('report-details-share-error')).toHaveTextContent(
      'Could not create PDF',
    );
  });

  const longReport: SavedReport = {
    ...namedReport,
    ppmSamples: Array.from({ length: 20 }, (_, index) => ({
      ppm: 20 + index,
      timestamp: index * 1000,
    })),
    endedAt: 19_000,
    maxPpm: 39,
  };

  const analysis: AnalysisResult = {
    matchId: 'pinpoint',
    confidence: 'high',
    why: 'One peak at 18s.',
    pattern: 'Pinpoint-style peak then decay.',
    nextSteps: ['Re-sweep the peak', 'Soap-test the joint'],
    cannotConclude: ['True leak rate (lb/year)'],
  };

  it('disables Analyze Report when the session is too short', async () => {
    const onAnalyze = jest.fn();
    await render(
      <ReportDetailsScreen
        report={namedReport}
        onBack={jest.fn()}
        onAnalyze={onAnalyze}
      />,
    );
    const user = userEvent.setup();
    const button = screen.getByTestId('report-details-analyze');

    expect(button).toBeDisabled();
    expect(screen.getByTestId('report-details-analyze-hint')).toHaveTextContent(
      /20 samples/i,
    );
    await user.press(button);
    expect(onAnalyze).not.toHaveBeenCalled();
  });

  it('calls onAnalyze when Analyze Report is pressed', async () => {
    const onAnalyze = jest.fn();
    await render(
      <ReportDetailsScreen
        report={longReport}
        onBack={jest.fn()}
        onAnalyze={onAnalyze}
      />,
    );
    const user = userEvent.setup();

    await user.press(screen.getByTestId('report-details-analyze'));
    expect(onAnalyze).toHaveBeenCalledTimes(1);
  });

  it('disables Analyze Report while analyzing', async () => {
    const onAnalyze = jest.fn();
    await render(
      <ReportDetailsScreen
        report={longReport}
        onBack={jest.fn()}
        onAnalyze={onAnalyze}
        analyzing
      />,
    );
    const user = userEvent.setup();
    const button = screen.getByTestId('report-details-analyze');

    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Analyzing…');
    await user.press(button);
    expect(onAnalyze).not.toHaveBeenCalled();
  });

  it('shows prototype analysis cards when a result is set', async () => {
    await render(
      <ReportDetailsScreen
        report={longReport}
        onBack={jest.fn()}
        analysis={analysis}
      />,
    );

    expect(
      screen.getByTestId('report-details-analysis-prototype'),
    ).toHaveTextContent('Prototype');
    expect(
      screen.getByTestId('report-details-analysis-match'),
    ).toHaveTextContent(/Pinpoint/);
    expect(
      screen.getByTestId('report-details-analysis-match'),
    ).toHaveTextContent(/high/);
    expect(screen.getByTestId('report-details-analysis-why')).toHaveTextContent(
      'One peak at 18s.',
    );
    expect(
      screen.getByTestId('report-details-analysis-pattern'),
    ).toHaveTextContent('Pinpoint-style peak then decay.');
    expect(
      screen.getByTestId('report-details-analysis-next-steps'),
    ).toHaveTextContent(/1\. Re-sweep the peak/);
    expect(
      screen.getByTestId('report-details-analysis-cannot'),
    ).toHaveTextContent(/True leak rate \(lb\/year\)/);
  });

  it('shows an analysis error when analysisError is set', async () => {
    await render(
      <ReportDetailsScreen
        report={longReport}
        onBack={jest.fn()}
        analysisError="Add your key to src/config/anthropic.local.ts (see the example file) and reload."
      />,
    );

    expect(
      screen.getByTestId('report-details-analysis-error'),
    ).toHaveTextContent(/src\/config\/anthropic\.local\.ts/);
  });
});
