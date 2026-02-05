
/**
 * SENTINEL NEXUS - SHARED PROTOCOLS
 * Definições de Tipagem Transfronteiriça (Frontend <-> Backend)
 * 
 * ATENÇÃO: Alterações neste arquivo requerem revalidação de todo o perímetro.
 */

export type AssetType = 'AIR' | 'LAND' | 'SEA';
export type AssetStatus = 'CLEARED' | 'FLAGGED' | 'LOCKED_DOWN' | 'IN_TRANSIT';
export type ThreatLevel = 'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
export type LogLevel = 'INFO' | 'WARNING' | 'CRITICAL';
export type ClearanceLevel = 'DIPLOMATIC' | 'HAZMAT' | 'COMMERCIAL';

export interface Asset {
  id: string;
  codename: string;
  type: AssetType;
  origin: string;
  destination: string;
  status: AssetStatus;
  threatLevel: ThreatLevel;
  
  // Geolocation Vector
  latitude: number;
  longitude: number;
  
  // Telemetry Data
  temperature: number;
  battery: number;
  isLocked: boolean;
  
  // Audit & Relations
  createdAt: string; // Serialized Date
  updatedAt: string; // Serialized Date
  manifests?: Manifest[];
  logs?: SecurityLog[];
}

export interface Manifest {
  id: string;
  assetId: string;
  title: string;
  content: string; // Encrypted Content
  clearance: ClearanceLevel;
  issuedAt: string; // Serialized Date
}

export interface SecurityLog {
  id: string;
  assetId: string;
  level: LogLevel;
  message: string;
  timestamp: string; // Serialized Date
}

// Auth Protocols
export interface LoginCredentials {
  username: string;
  password: string; // Hashed on transmission ideally, but sent raw in this simulated env
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    username: string;
    role: string;
  };
}

// System Status
export interface SystemStatus {
  threat_level: ThreatLevel;
  active_assets: number;
  system_integrity: number; // 0-100
  server_time: string;
  uptime: number;
}

// WebSocket Payloads
export interface WSPayload {
  type: 'TELEMETRY_UPDATE' | 'ALERT' | 'SYSTEM_STATUS';
  payload: any;
  timestamp: number;
}
