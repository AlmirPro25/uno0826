
export interface Asset {
  id: string;
  codename: string;
  type: 'AIR' | 'LAND' | 'SEA';
  origin: string;
  destination: string;
  status: 'CLEARED' | 'FLAGGED' | 'LOCKED_DOWN' | 'IN_TRANSIT';
  threatLevel: 'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
  latitude: number;
  longitude: number;
  temperature: number;
  battery: number;
  isLocked: boolean;
  updatedAt: string;
  logs?: SecurityLog[];
  manifests?: Manifest[];
}

export interface SecurityLog {
  id: string;
  level: string;
  message: string;
  timestamp: string;
}

export interface Manifest {
  id: string;
  title: string;
  content: string;
  clearance: string;
  issuedAt: string;
}

export interface SystemStatus {
  threat_level: string;
  active_assets: number;
  system_integrity: number;
  server_time: string;
}
