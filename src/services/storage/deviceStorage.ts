import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_DEVICE_KEY = '@servicetool/last_device_id';

export async function getLastDeviceId(): Promise<string | null> {
  return AsyncStorage.getItem(LAST_DEVICE_KEY);
}

export async function setLastDeviceId(deviceId: string): Promise<void> {
  await AsyncStorage.setItem(LAST_DEVICE_KEY, deviceId);
}
