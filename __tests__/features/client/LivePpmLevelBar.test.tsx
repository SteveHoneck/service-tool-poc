import React from 'react';
import {act, render, screen} from '@testing-library/react-native';
import {
  LivePpmLevelBar,
  PPM_BAR_DROP_DURATION_MS,
  PPM_BAR_RISE_DURATION_MS,
} from '../../../src/features/client/components/LivePpmLevelBar';

describe('LivePpmLevelBar', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('animates a rise toward the target fill percent', async () => {
    await render(<LivePpmLevelBar fraction={0.2} isDark={false} />);
    await act(() => {
      jest.advanceTimersByTime(PPM_BAR_RISE_DURATION_MS);
    });

    expect(screen.getByTestId('ppm-level-bar')).toHaveProp(
      'accessibilityValue',
      {min: 0, max: 100, now: 20},
    );
  });

  it('uses the shorter drop animation when ppm falls', async () => {
    const {rerender} = await render(
      <LivePpmLevelBar fraction={0.6} isDark={false} />,
    );
    await act(() => {
      jest.advanceTimersByTime(PPM_BAR_RISE_DURATION_MS);
    });

    await rerender(<LivePpmLevelBar fraction={0.1} isDark={false} />);
    await act(() => {
      jest.advanceTimersByTime(PPM_BAR_DROP_DURATION_MS);
    });

    expect(screen.getByTestId('ppm-level-bar')).toHaveProp(
      'accessibilityValue',
      {min: 0, max: 100, now: 10},
    );
  });

  it('stops the in-flight animation on unmount', async () => {
    const {unmount} = await render(
      <LivePpmLevelBar fraction={0.5} isDark />,
    );
    unmount();
  });
});
