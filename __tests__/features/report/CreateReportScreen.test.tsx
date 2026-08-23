import React from 'react';
import {render, screen, userEvent} from '@testing-library/react-native';
import CreateReportScreen from '../../../src/features/report/screens/CreateReportScreen';

describe('CreateReportScreen', () => {
  it('shows the title, captured sample count, last PPM, and MAX', async () => {
    await render(
      <CreateReportScreen
        samples={[
          {ppm: 100, timestamp: 1},
          {ppm: 250, timestamp: 2},
          {ppm: 180, timestamp: 3},
        ]}
        onBack={jest.fn()}
        onSave={jest.fn()}
      />,
    );

    expect(screen.getByTestId('create-report-screen')).toBeOnTheScreen();
    expect(screen.getByText('Create Report')).toBeOnTheScreen();
    expect(screen.getByTestId('create-report-sample-count')).toHaveTextContent(
      '3 samples captured',
    );
    expect(screen.queryByText('Report details are not implemented yet.')).toBeNull();
    expect(screen.getByTestId('create-report-last-ppm')).toHaveTextContent(
      'Last 180 ppm',
    );
    expect(screen.getByTestId('create-report-max-ppm')).toHaveTextContent(
      'MAX 250',
    );
  });

  it('uses singular copy for one sample', async () => {
    await render(
      <CreateReportScreen
        samples={[{ppm: 100, timestamp: 1}]}
        onBack={jest.fn()}
        onSave={jest.fn()}
      />,
    );

    expect(screen.getByTestId('create-report-sample-count')).toHaveTextContent(
      '1 sample captured',
    );
  });

  it('calls onBack when Back is pressed', async () => {
    const onBack = jest.fn();
    await render(
      <CreateReportScreen samples={[]} onBack={onBack} onSave={jest.fn()} />,
    );
    const user = userEvent.setup();

    await user.press(screen.getByTestId('create-report-back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('hides the connection-lost note for a complete capture', async () => {
    await render(
      <CreateReportScreen
        samples={[{ppm: 100, timestamp: 1}]}
        onBack={jest.fn()}
        onSave={jest.fn()}
      />,
    );

    expect(screen.queryByTestId('create-report-partial-note')).toBeNull();
  });

  it('notes when the session ended after a connection loss', async () => {
    await render(
      <CreateReportScreen
        samples={[{ppm: 100, timestamp: 1}]}
        partial
        onBack={jest.fn()}
        onSave={jest.fn()}
      />,
    );

    expect(screen.getByTestId('create-report-partial-note')).toHaveTextContent(
      'Connection lost during session',
    );
  });

  it('calls onSave with job name and operator when Save Report is pressed', async () => {
    const onSave = jest.fn();
    await render(
      <CreateReportScreen
        samples={[{ppm: 100, timestamp: 1}]}
        onBack={jest.fn()}
        onSave={onSave}
      />,
    );
    const user = userEvent.setup();

    await user.type(screen.getByTestId('create-report-job-name'), 'Leak check');
    await user.type(screen.getByTestId('create-report-operator'), 'Alex');
    await user.press(screen.getByTestId('create-report-save'));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({
      jobName: 'Leak check',
      operatorName: 'Alex',
    });
  });

  it('saves empty job and operator names when the fields are left blank', async () => {
    const onSave = jest.fn();
    await render(
      <CreateReportScreen samples={[]} onBack={jest.fn()} onSave={onSave} />,
    );
    const user = userEvent.setup();

    await user.press(screen.getByTestId('create-report-save'));

    expect(onSave).toHaveBeenCalledWith({
      jobName: '',
      operatorName: '',
    });
  });
});
