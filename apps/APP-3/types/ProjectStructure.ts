// types/ProjectStructure.ts - Tipos para estrutura de projetos

export type TechStack = 
  | 'html5-vanilla'
  | 'react-typescript'
  | 'vue-composition'
  | 'angular-standalone'
  | 'nodejs-express'
  | 'python-flask'
  | 'python-fastapi'
  | 'php-laravel'
  | 'java-spring'
  | 'csharp-dotnet';

export interface StackFile {
  name: string;
  content: string;
  language: string;
}

export interface StackTemplate {
  id: TechStack;
  name: string;
  description: string;
  category: 'frontend' | 'backend';
  icon: string;
  defaultFiles: StackFile[];
  aiInstructions: string;
  dependencies: string[];
  devDependencies: string[];
}

export interface EditorTab {
  id: string;
  name: string;
  stack: TechStack;
  content: string;
  isActive: boolean;
  isDirty: boolean;
  createdAt: Date;
  lastModified: Date;
  language: string;
}

export interface DetailedStatus {
  category: string;
  phase: string;
  message: string;
  progress: number;
  estimatedDuration: number;
  startTime?: number;
}

export interface EditorInteractionState {
  canEdit: boolean;
  isStreaming: boolean;
  streamingProgress?: number;
}