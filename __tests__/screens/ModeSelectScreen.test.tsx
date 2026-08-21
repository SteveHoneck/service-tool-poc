import React from 'react';
import {render, screen} from '@testing-library/react-native';
import ModeSelectScreen from '../../src/screens/ModeSelectScreen';

test('renders the mode selection screen', async () => {
  await render(
    <ModeSelectScreen onSelectClient={jest.fn()} onSelectTool={jest.fn()} />,
  );

  expect(screen.getByText('Service Tool PoC')).toBeOnTheScreen();
  expect(screen.getByText('Client Mode')).toBeOnTheScreen();
  expect(screen.getByText('Tool Mode')).toBeOnTheScreen();
});
