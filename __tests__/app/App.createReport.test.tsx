import React from 'react';
import {render, screen, userEvent} from '@testing-library/react-native';
import App from '../../src/app/App';
import {SessionCapture} from '../../src/types';

jest.mock('../../src/features/client/screens/ClientScreen', () => {
  const ReactNative = require('react-native');
  return {
    __esModule: true,
    default: ({
      onCreateReport,
    }: {
      onCreateReport: (capture: SessionCapture) => void;
    }) => (
      <ReactNative.Pressable
        testID="fake-stop-recording"
        onPress={() =>
          onCreateReport({
            samples: [{ppm: 100, timestamp: 1}],
            gaps: [{at: 1, reason: 'disconnect'}],
            partial: true,
          })
        }>
        <ReactNative.Text>Stop Recording</ReactNative.Text>
      </ReactNative.Pressable>
    ),
  };
});

describe('App create report navigation', () => {
  it('opens Create Report with the partial-session note', async () => {
    await render(<App />);
    const user = userEvent.setup();

    await user.press(screen.getByText('Client Mode'));
    await user.press(screen.getByTestId('fake-stop-recording'));

    expect(screen.getByTestId('create-report-screen')).toBeOnTheScreen();
    expect(screen.getByTestId('create-report-partial-note')).toHaveTextContent(
      'Connection lost during session',
    );
    expect(screen.getByTestId('create-report-sample-count')).toHaveTextContent(
      '1 sample captured',
    );
  });
});
