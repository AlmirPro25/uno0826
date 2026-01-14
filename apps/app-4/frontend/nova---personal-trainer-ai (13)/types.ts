export interface UserProfile {
  name: string;
  goal: 'weight_loss' | 'muscle_gain' | 'maintenance';
  height: number; // cm
  weight: number; // kg
  age: number;
  level: number; // Gamification
}

export interface DailyStats {
  date: string;
  caloriesBurned: number;
  caloriesConsumed: number;
  workoutDurationMinutes: number;
  mood: 'energetic' | 'tired' | 'neutral';
}

export interface AnalysisResult {
  id: string; // Unique ID
  type: 'food' | 'body';
  timestamp: string;
  summary: string;
  metrics: {
    label: string;
    value: string | number;
    unit?: string;
  }[];
  estimatedCalories?: number; 
  recommendation: string;
  disclaimer: string;
}

export interface DailyPlan {
  day: string;
  focus: string; // e.g., "Legs & Core"
  workout: string; // Description
  nutritionFocus: string; // e.g., "High Carb"
  duration: number; // minutes
}

export interface WeeklyPlan {
  id: string;
  createdAt: string;
  title: string; // e.g., "Protocolo Hipertrofia Alfa"
  days: DailyPlan[];
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  LIVE_SESSION = 'LIVE_SESSION',
  ANALYSIS = 'ANALYSIS',
  HISTORY = 'HISTORY',
  PROFILE = 'PROFILE',
  PLANNER = 'PLANNER',
  CHAT = 'CHAT',
  DEVICES = 'DEVICES' // Nova View
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

// Global Web Bluetooth API Types
declare global {
  interface Navigator {
    bluetooth: Bluetooth;
  }

  interface Bluetooth {
    requestDevice(options?: RequestDeviceOptions): Promise<BluetoothDevice>;
  }

  interface BluetoothDevice extends EventTarget {
    id: string;
    name?: string;
    gatt?: BluetoothRemoteGATTServer;
  }

  interface BluetoothRemoteGATTServer {
    connected: boolean;
    device: BluetoothDevice;
    connect(): Promise<BluetoothRemoteGATTServer>;
    disconnect(): void;
    getPrimaryService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>;
  }

  interface BluetoothRemoteGATTService {
    getCharacteristic(characteristic: BluetoothCharacteristicUUID): Promise<BluetoothRemoteGATTCharacteristic>;
  }

  interface BluetoothRemoteGATTCharacteristic extends EventTarget {
    value?: DataView;
    startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
  }

  type BluetoothServiceUUID = number | string;
  type BluetoothCharacteristicUUID = number | string;

  interface RequestDeviceOptions {
    filters: Array<{ services: BluetoothServiceUUID[] }>;
    optionalServices?: BluetoothServiceUUID[];
    acceptAllDevices?: boolean;
  }
}