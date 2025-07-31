// Safe wrapper for expo-device to handle missing module errors
let DeviceModule: any = null;
let isDeviceAvailable = false;

try {
  DeviceModule = require('expo-device');
  isDeviceAvailable = true;
} catch (error) {
  console.log('expo-device not available in this environment');
}

export const Device = DeviceModule || {
  isDevice: true,
  brand: 'Unknown',
  manufacturer: 'Unknown',
  modelName: 'Unknown',
  deviceYearClass: null,
  totalMemory: null,
  supportedCpuArchitectures: null,
  osName: 'Unknown',
  osVersion: 'Unknown',
  osBuildId: 'Unknown',
  osInternalBuildId: 'Unknown',
  deviceName: 'Unknown',
  DeviceType: {
    UNKNOWN: 0,
    PHONE: 1,
    TABLET: 2,
    DESKTOP: 3,
    TV: 4,
  },
  deviceType: 1,
};

export { isDeviceAvailable };