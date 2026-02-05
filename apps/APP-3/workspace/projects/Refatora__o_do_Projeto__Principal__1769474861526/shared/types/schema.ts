
/**
 * AEGIS-VII SHARED DATA PROTOCOLS
 * TACTICAL DATA MODELS - SYNCHRONIZED WITH PRISMA/SQLITE
 */

// User authentication and authorization
export interface User {
  id: string;
  username: string;
  role: 'OPERATOR' | 'ADMIN';
  created_at: string;
}

// DTOs for Auth Actions
export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  password: string;
}

// Resource metrics for the Command Center
export interface CommandCenter {
  id: string;
  cpu_cycles: number;     // The 'Food' equivalent
  bandwidth: number;      // The 'Leaf' equivalent
  crypto_tokens: number;  // Premium currency / Score
  defense_level: number;  // Tech level
  last_tick: string;      // ISO Date
}

// Digital Agents (Ants)
export interface TacticalUnit {
  id: string;
  designation: string;    // e.g., "ALPHA-01"
  type: 'MINER' | 'HUNTER' | 'GUARDIAN';
  level: number;
  status: 'IDLE' | 'DEPLOYED' | 'REPAIRING' | 'KIA';
  operation_id?: string | null;
  efficiency: number;
  created_at: string;
}

// Active Missions
export interface Operation {
  id: string;
  name: string;
  type: 'DATA_MINING' | 'FIREWALL_ASSAULT' | 'GRID_DEFENSE';
  difficulty: number;
  start_time: number;     // Timestamp (ms)
  end_time: number;       // Timestamp (ms)
  duration_ms: number;
  reward_cpu: number;
  reward_bw: number;
  reward_crypto: number;
  unit_id: string;
}

// System Logs
export interface CommsLog {
  id: number;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ALERT' | 'CRITICAL' | 'SUCCESS';
  message: string;
}

// The full State Packet sent by the backend
export interface SitRep {
  resources: CommandCenter;
  units: TacticalUnit[];
  operations: Operation[];
  logs: CommsLog[];
}

// DTOs (Data Transfer Objects) for Actions
export interface FabricatePayload {
  type: TacticalUnit['type'];
}

export interface DeployPayload {
  unitId: string;
  missionType: Operation['type'];
}
