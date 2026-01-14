// Standard UUIDs
const HEART_RATE_SERVICE = 0x180d;
const HEART_RATE_MEASUREMENT_CHARACTERISTIC = 0x2a37;

const RUNNING_SPEED_CADENCE_SERVICE = 0x1814;
const RSC_MEASUREMENT_CHARACTERISTIC = 0x2a53;

// --- Heart Rate ---

export const connectHeartRateMonitor = async (
  onHeartRateUpdate: (bpm: number) => void,
  onDisconnect: () => void
): Promise<BluetoothDevice> => {
  try {
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ services: [HEART_RATE_SERVICE] }]
    });

    if (!device.gatt) throw new Error('Bluetooth GATT not available');

    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(HEART_RATE_SERVICE);
    const characteristic = await service.getCharacteristic(HEART_RATE_MEASUREMENT_CHARACTERISTIC);

    await characteristic.startNotifications();

    characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
      const value = event.target.value as DataView;
      const bpm = parseHeartRate(value);
      onHeartRateUpdate(bpm);
    });

    device.addEventListener('gattserverdisconnected', onDisconnect);
    return device;

  } catch (error) {
    console.error('Bluetooth Error (HR):', error);
    throw error;
  }
};

const parseHeartRate = (value: DataView): number => {
  const flags = value.getUint8(0);
  const rate16Bits = flags & 0x1;
  if (rate16Bits) {
    return value.getUint16(1, true);
  } else {
    return value.getUint8(1);
  }
};

// --- Running Speed & Cadence (RSC) ---

export interface RunningMetrics {
  speed: number; // m/s
  cadence: number; // RPM
}

export const connectRunningSensor = async (
  onMetricsUpdate: (metrics: RunningMetrics) => void,
  onDisconnect: () => void
): Promise<BluetoothDevice> => {
  try {
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ services: [RUNNING_SPEED_CADENCE_SERVICE] }]
    });

    if (!device.gatt) throw new Error('Bluetooth GATT not available');

    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(RUNNING_SPEED_CADENCE_SERVICE);
    const characteristic = await service.getCharacteristic(RSC_MEASUREMENT_CHARACTERISTIC);

    await characteristic.startNotifications();

    characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
      const value = event.target.value as DataView;
      const metrics = parseRSC(value);
      onMetricsUpdate(metrics);
    });

    device.addEventListener('gattserverdisconnected', onDisconnect);
    return device;

  } catch (error) {
    console.error('Bluetooth Error (RSC):', error);
    throw error;
  }
};

const parseRSC = (value: DataView): RunningMetrics => {
  const flags = value.getUint8(0);
  // Flag 0: Inst. Stride Length Present
  // Flag 1: Total Distance Present
  // Flag 2: Walking/Running status
  
  // Data starts at byte 1
  // Speed is Uint16, Unit is m/s * 256
  const speedRaw = value.getUint16(1, true);
  const speed = speedRaw / 256.0; // Convert to m/s

  // Cadence is Uint8 at byte 3
  const cadence = value.getUint8(3);

  return { speed, cadence };
};
