
/**
 * @description Definições de tipo sincronizadas com o Schema Prisma da SCE.
 * @author MANIFEST ARCHITECT
 */

export enum AppType {
  FRONTEND = "FRONTEND",
  BACKEND = "BACKEND"
}

export enum DeploymentStatus {
  QUEUED = "QUEUED",
  BUILDING = "BUILDING",
  DEPLOYING = "DEPLOYING",
  HEALTHY = "HEALTHY",
  FAILED = "FAILED",
  STOPPED = "STOPPED"
}

export interface User {
  id: string;
  email: string;
  role: "ADMIN" | "USER";
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  type: AppType;
  repoUrl: string;
  branch: string;
  buildCmd?: string;
  startCmd?: string;
  port: number;
  subdomain: string;
  envVars?: EnvVar[];
  deployments?: Deployment[];
  createdAt: string;
  updatedAt: string;
}

export interface Deployment {
  id: string;
  projectId: string;
  project?: Project;
  status: DeploymentStatus;
  imageTag: string;
  logs?: string;
  cpuUsage: number;
  memUsage: number;
  createdAt: string;
}

export interface EnvVar {
  id: string;
  key: string;
  value: string; // Nota: O backend descriptografa apenas para uso interno, o front recebe máscaras ou valores encriptados se necessário
  projectId: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}
