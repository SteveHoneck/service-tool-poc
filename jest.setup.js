import { Buffer } from 'buffer';

global.Buffer = Buffer;

jest.mock('react-native-ble-plx', () => ({
  BleManager: jest.fn().mockImplementation(() => ({
    destroy: jest.fn(),
    stopDeviceScan: jest.fn().mockResolvedValue(undefined),
    startDeviceScan: jest.fn().mockResolvedValue(undefined),
    connectToDevice: jest.fn(),
  })),
}));

jest.mock('react-native-ble-peripheral-manager', () => ({
  ManagerState: { PoweredOn: 5 },
  CharacteristicProperties: { Read: 2, Notify: 16, Write: 8 },
  CharacteristicPermissions: { Readable: 1, Writeable: 16 },
  ATTError: { Success: 0 },
  getState: jest.fn().mockResolvedValue(5),
  addService: jest.fn(),
  addCharacteristicToService: jest.fn(),
  addCharacteristicToServiceBase64: jest.fn(),
  removeAllServices: jest.fn(),
  setName: jest.fn(),
  startAdvertising: jest.fn().mockResolvedValue(undefined),
  stopAdvertising: jest.fn(),
  updateValueBase64: jest.fn().mockResolvedValue(true),
  decodeBase64: jest.fn(value => value),
  respondToRequest: jest.fn(),
  onDidReceiveReadRequest: jest.fn(() => ({ remove: jest.fn() })),
  onDidReceiveWriteRequests: jest.fn(() => ({ remove: jest.fn() })),
  onDidSubscribeToCharacteristic: jest.fn(() => ({ remove: jest.fn() })),
  onDidUnsubscribeFromCharacteristic: jest.fn(() => ({ remove: jest.fn() })),
  onDidStartAdvertising: jest.fn(() => ({ remove: jest.fn() })),
}));

jest.mock('react-native-permissions', () => ({
  PERMISSIONS: {
    ANDROID: {
      BLUETOOTH_SCAN: 'android.permission.BLUETOOTH_SCAN',
      BLUETOOTH_CONNECT: 'android.permission.BLUETOOTH_CONNECT',
      BLUETOOTH_ADVERTISE: 'android.permission.BLUETOOTH_ADVERTISE',
      ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION',
    },
  },
  RESULTS: {
    GRANTED: 'granted',
    DENIED: 'denied',
  },
  checkMultiple: jest.fn().mockResolvedValue({}),
  requestMultiple: jest.fn().mockResolvedValue({}),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };

  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: View,
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
  };
});

jest.mock('react-native-svg', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Mock = props => React.createElement(View, props);

  return {
    __esModule: true,
    default: Mock,
    Svg: Mock,
    Polyline: Mock,
    Line: Mock,
  };
});
