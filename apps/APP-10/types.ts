
export interface Attachment {
  type: 'image';
  mimeType: string;
  data: string; // Base64 string (without data: prefix for API, with prefix for UI if needed, handled in components)
  previewUrl: string; // Full data URL for display
}

export interface Message {
  role: 'user' | 'model' | 'system';
  content: string;
  attachments?: Attachment[];
  timestamp: number;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export interface ExcellenceReport {
  score: number;
  critique: string;
  improvements: string[];
  securityLevel: 'low' | 'medium' | 'high';
}

export interface ActiveFileAction {
  type: 'read' | 'write' | 'delete' | 'exec' | 'list';
  path: string;
}

export interface AppState {
  currentCode: string | null;
  history: Message[];
  isLoading: boolean;
  error: string | null;
  viewMode: ViewMode;
  
  // Agent Real-time State
  agentStatus: string | null;
  activeFileAction: ActiveFileAction | null;

  // Actions
  renameFile: (oldPath: string, newPath: string) => void;
}

export enum ViewMode {
  PREVIEW = 'PREVIEW',
  CODE = 'CODE',
  SPLIT = 'SPLIT'
}

export interface GenerationRequest {
  prompt: string;
  currentCode?: string;
}

export interface Model {
  id: string;
  name: string;
  description: string;
}

export interface ProjectFile {
  path: string;
  content: string;
}

export interface RefinedProject {
  analysis: string;
  securityAudit: string;
  files: ProjectFile[];
}

export interface VirtualFile {
  name: string;
  path: string; // full path
  content: string;
  language: string;
  isFolder: boolean;
  children?: VirtualFile[];
  isOpen?: boolean;
}

// ============================================================================
// 🔬 ADVANCED ANALYSIS TYPES
// ============================================================================

export interface CodeAnalysis {
  complexity: {
    cyclomatic: number;
    cognitive: number;
    linesOfCode: number;
    functions: number;
  };
  codeSmells: Array<{
    type: string;
    location: string;
    severity: 'low' | 'medium' | 'high';
    suggestion: string;
  }>;
  structure: {
    imports: string[];
    exports: string[];
    components: string[];
    hooks: string[];
  };
  quality: {
    score: number;
    maintainability: string;
    testability: string;
  };
  suggestions: string[];
}

export interface DetectedIssue {
  type: 'bug' | 'security' | 'performance' | 'accessibility' | 'style';
  severity: 'low' | 'medium' | 'high' | 'critical';
  file: string;
  line?: number;
  message: string;
  suggestion: string;
  code?: string;
}

export interface SecurityIssue {
  type: 'xss' | 'injection' | 'secret' | 'unsafe' | 'dependency';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  description: string;
  fix: string;
}

export interface DebugResult {
  errorType: string;
  rootCause: string;
  explanation: string;
  fixes: Array<{
    description: string;
    code?: string;
    file?: string;
  }>;
  prevention: string;
}

export interface ImplementationPlan {
  goal: string;
  steps: Array<{
    order: number;
    description: string;
    files: string[];
    commands?: string[];
  }>;
  estimatedTime: string;
  risks: string[];
}

export interface A11yIssue {
  type: string;
  element: string;
  issue: string;
  fix: string;
  wcag: string;
}
