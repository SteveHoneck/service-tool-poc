import AsyncStorage from '@react-native-async-storage/async-storage';
import {SavedReport} from '../../types';

const REPORTS_KEY = '@servicetool/saved_reports';

export async function listReports(): Promise<SavedReport[]> {
  const raw = await AsyncStorage.getItem(REPORTS_KEY);
  if (raw == null) {
    return [];
  }
  return JSON.parse(raw) as SavedReport[];
}

export async function appendReport(report: SavedReport): Promise<void> {
  const existing = await listReports();
  await AsyncStorage.setItem(
    REPORTS_KEY,
    JSON.stringify([report, ...existing]),
  );
}
