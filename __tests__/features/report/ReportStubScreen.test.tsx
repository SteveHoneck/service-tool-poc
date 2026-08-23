import React from 'react';
import {render, screen, userEvent} from '@testing-library/react-native';
import ReportStubScreen from '../../../src/features/report/screens/ReportStubScreen';

describe('ReportStubScreen', () => {
  it('shows the stub placeholder copy without a title', async () => {
    await render(<ReportStubScreen onBack={jest.fn()} />);

    expect(screen.getByTestId('report-stub-screen')).toBeOnTheScreen();
    expect(screen.queryByText('Report')).toBeNull();
    expect(
      screen.getByText('Report details are not implemented yet.'),
    ).toBeOnTheScreen();
  });

  it('calls onBack when Back is pressed', async () => {
    const onBack = jest.fn();
    await render(<ReportStubScreen onBack={onBack} />);
    const user = userEvent.setup();

    await user.press(screen.getByTestId('report-stub-back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
