import React from 'react';
import {render, screen, userEvent} from '@testing-library/react-native';
import {BackLink} from '../../../src/features/shared/BackLink';

describe('BackLink', () => {
  it('shows the arrow and Back label', async () => {
    await render(<BackLink onPress={jest.fn()} />);

    expect(screen.getByText('←')).toBeOnTheScreen();
    expect(screen.getByText('Back')).toBeOnTheScreen();
    expect(screen.getByLabelText('Back')).toBeOnTheScreen();
  });

  it('calls onPress when pressed', async () => {
    const onPress = jest.fn();
    await render(<BackLink onPress={onPress} testID="nav-back" />);
    const user = userEvent.setup();

    await user.press(screen.getByTestId('nav-back'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
