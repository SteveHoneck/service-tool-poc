import React from 'react';
import {render, screen, userEvent} from '@testing-library/react-native';
import CreateReportScreen from '../../../src/features/report/screens/CreateReportScreen';

describe('CreateReportScreen', () => {
  it('shows the stub title and captured sample count', async () => {
    await render(
      <CreateReportScreen
        samples={[
          {ppm: 100, timestamp: 1},
          {ppm: 180, timestamp: 2},
        ]}
        onBack={jest.fn()}
      />,
    );

    expect(screen.getByTestId('create-report-screen')).toBeOnTheScreen();
    expect(screen.getByText('Create Report')).toBeOnTheScreen();
    expect(screen.getByTestId('create-report-sample-count')).toHaveTextContent(
      '2 samples captured',
    );
    expect(
      screen.getByText('Report details are not implemented yet.'),
    ).toBeOnTheScreen();
  });

  it('uses singular copy for one sample', async () => {
    await render(
      <CreateReportScreen
        samples={[{ppm: 100, timestamp: 1}]}
        onBack={jest.fn()}
      />,
    );

    expect(screen.getByTestId('create-report-sample-count')).toHaveTextContent(
      '1 sample captured',
    );
  });

  it('calls onBack when Back is pressed', async () => {
    const onBack = jest.fn();
    await render(
      <CreateReportScreen samples={[]} onBack={onBack} />,
    );
    const user = userEvent.setup();

    await user.press(screen.getByTestId('create-report-back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
