
// DATA CONTRACTS - MUST MATCH BACKEND PRISMA MODELS

export interface TelemetryFrame {
  timestamp: string;
  atmosphere: {
    oxygen_ppm: number;
    pressure_kpa: number;
    radiation_sieverts: number;
  };
  resources: {
    water_reserves_liters: number;
    energy_output_mw: number;
    biomass_index: number;
  };
  sector_status: {
    dome_integrity: number;
    active_alerts: number;
  };
}

export interface SystemLog {
  id: number;
  timestamp: string;
  severity: 'INFO' | 'WARNING' | 'ALERT' | 'CRITICAL' | 'FATAL';
  origin: string;
  message: string;
}

export interface AuthResponse {
  token: string;
  type: string;
}
