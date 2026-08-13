import {Platform} from 'react-native';
import {
  PERMISSIONS,
  RESULTS,
  checkMultiple,
  requestMultiple,
} from 'react-native-permissions';

const ANDROID_BLE_PERMISSIONS = [
  PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
  PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
  PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
];

const ANDROID_TOOL_PERMISSIONS = [
  ...ANDROID_BLE_PERMISSIONS,
  PERMISSIONS.ANDROID.BLUETOOTH_ADVERTISE,
];

export async function requestClientPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }

  const statuses = await checkMultiple(ANDROID_BLE_PERMISSIONS);
  const missing = ANDROID_BLE_PERMISSIONS.filter(
    permission => statuses[permission] !== RESULTS.GRANTED,
  );

  if (missing.length === 0) {
    return true;
  }

  const requested = await requestMultiple(missing);
  return missing.every(
    permission => requested[permission] === RESULTS.GRANTED,
  );
}

export async function requestToolPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }

  const statuses = await checkMultiple(ANDROID_TOOL_PERMISSIONS);
  const missing = ANDROID_TOOL_PERMISSIONS.filter(
    permission => statuses[permission] !== RESULTS.GRANTED,
  );

  if (missing.length === 0) {
    return true;
  }

  const requested = await requestMultiple(missing);
  return missing.every(
    permission => requested[permission] === RESULTS.GRANTED,
  );
}
