import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  appendReport,
  listReports,
} from '../../../src/services/storage/reportStorage';
import {SavedReport} from '../../../src/types';

const older: SavedReport = {
  id: 'report-1',
  jobName: 'First',
  operatorName: 'Alex',
  startedAt: 1,
  endedAt: 2,
  ppmSamples: [{ppm: 100, timestamp: 1}],
  maxPpm: 100,
  partial: false,
  gaps: [],
};

const newer: SavedReport = {
  id: 'report-2',
  jobName: 'Second',
  operatorName: 'Sam',
  startedAt: 3,
  endedAt: 4,
  ppmSamples: [{ppm: 200, timestamp: 3}],
  maxPpm: 200,
  partial: true,
  gaps: [{at: 3, reason: 'disconnect'}],
};

describe('services/storage/reportStorage', () => {
  const memory = new Map<string, string>();

  beforeEach(() => {
    memory.clear();
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) =>
      Promise.resolve(memory.get(key) ?? null),
    );
    (AsyncStorage.setItem as jest.Mock).mockImplementation(
      (key: string, value: string) => {
        memory.set(key, value);
        return Promise.resolve();
      },
    );
  });

  it('returns an empty list when nothing is stored', async () => {
    await expect(listReports()).resolves.toEqual([]);
  });

  it('lists a report after append, newest first', async () => {
    await appendReport(older);

    await expect(listReports()).resolves.toEqual([older]);
  });

  it('keeps the earlier report and puts the newest first', async () => {
    await appendReport(older);
    await appendReport(newer);

    await expect(listReports()).resolves.toEqual([newer, older]);
  });
});
