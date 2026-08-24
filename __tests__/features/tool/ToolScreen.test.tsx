import React from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import { useBleTool } from '../../../src/features/tool/hooks/useBleTool';
import ToolScreen from '../../../src/features/tool/screens/ToolScreen';

jest.mock('../../../src/features/tool/hooks/useBleTool');

const mockUseBleTool = jest.mocked(useBleTool);

function mockTool(overrides: Partial<ReturnType<typeof useBleTool>> = {}) {
  mockUseBleTool.mockReturnValue({
    toolState: 'idle',
    connectedCentrals: 0,
    lastTelemetry: null,
    errorMessage: null,
    scenarioId: 'pinpoint',
    startTool: jest.fn(),
    stopTool: jest.fn(),
    selectScenario: jest.fn(),
    ...overrides,
  });
}

describe('ToolScreen', () => {
  it('lets the operator pick a leak scenario', async () => {
    const selectScenario = jest.fn();
    mockTool({ selectScenario });
    await render(<ToolScreen onBack={jest.fn()} />);
    const user = userEvent.setup();

    expect(screen.getByText('Leak scenario')).toBeOnTheScreen();
    expect(screen.getByTestId('tool-scenario-pinpoint')).toBeOnTheScreen();
    expect(screen.getByTestId('tool-scenario-cloudHunt')).toBeOnTheScreen();
    expect(screen.getByTestId('tool-scenario-twoPeaks')).toBeOnTheScreen();
    expect(screen.getByTestId('tool-scenario-dirtyRoom')).toBeOnTheScreen();

    await user.press(screen.getByTestId('tool-scenario-cloudHunt'));
    expect(selectScenario).toHaveBeenCalledWith('cloudHunt');
  });

  it('tells the operator to record about 50 seconds on the client', async () => {
    mockTool();
    await render(<ToolScreen onBack={jest.fn()} />);

    expect(screen.getByTestId('tool-scenario-help')).toHaveTextContent(
      /record about 50 seconds/i,
    );
  });
});
