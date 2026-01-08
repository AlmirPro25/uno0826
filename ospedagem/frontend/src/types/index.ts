
export type AppType = 'FRONTEND' | 'BACKEND';

export type DeploymentStatus = 'QUEUED' | 'BUILDING' | 'DEPLOYING' | 'HEALTHY' | 'FAILED' | 'STOPPED';

export interface EnvVar {
  id: string;
  key: string;
  value: string;
  projectId: string;
}

export interface Deployment {
  id: string;
  projectId: string;
  status: DeploymentStatus;
  imageTag: string;
  logs?: string;
  cpuUsage: number;
  memUsage: number;
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

export interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'USER';
}
