module.exports = {
  preset: '@react-native/jest-preset',
  watchman: false,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-native-async-storage/async-storage|react-native-ble-plx|react-native-ble-peripheral-manager|react-native-permissions|react-native-safe-area-context|react-native-html-to-pdf|react-native-share)/)',
  ],
};
