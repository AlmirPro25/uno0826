/**
 * 🧠 AETHER PRIME - Agent Memory System
 * Provides persistent memory and context management for the AI agent
 */

// In-memory storage for session (could be extended to localStorage)
const sessionMemory: Map<string, string> = new Map();
const changeLog: Array<{
  timestamp: number;
  action: string;
  file?: string;
  description: string;
}> = [];

// ============================================================================
// 💾 MEMORY OPERATIONS
// ============================================================================

export const remember = (key: string, value: string): string => {
  sessionMemory.set(key, value);
  return `Remembered "${key}": ${value.substring(0, 100)}${value.length > 100 ? '...' : ''}`;
};

export const recall = (key: string): string => {
  const value = sessionMemory.get(key);
  if (value) {
    return `Memory "${key}": ${value}`;
  }
  return `No memory found for key "${key}"`;
};

export const getAllMemories = (): Record<string, string> => {
  return Object.fromEntries(sessionMemory);
};

export const clearMemory = (): void => {
  sessionMemory.clear();
};

// ============================================================================
// 📝 CHANGE TRACKING
// ============================================================================

export const logChange = (
  action: string,
  description: string,
  file?: string
): void => {
  changeLog.push({
    timestamp: Date.now(),
    action,
    file,
    description
  });
};

export const summarizeChanges = (): string => {
  if (changeLog.length === 0) {
    return "No changes recorded in this session.";
  }

  const summary: string[] = ["## Session Changes Summary\n"];
  
  // Group by action type
  const grouped = changeLog.reduce((acc, change) => {
    if (!acc[change.action]) acc[change.action] = [];
    acc[change.action].push(change);
    return acc;
  }, {} as Record<string, typeof changeLog>);

  Object.entries(grouped).forEach(([action, changes]) => {
    summary.push(`### ${action} (${changes.length})`);
    changes.forEach(c => {
      const time = new Date(c.timestamp).toLocaleTimeString();
      summary.push(`- [${time}] ${c.file ? `\`${c.file}\`: ` : ''}${c.description}`);
    });
    summary.push('');
  });

  return summary.join('\n');
};

export const getChangeLog = () => changeLog;

export const clearChangeLog = (): void => {
  changeLog.length = 0;
};

// ============================================================================
// 🐛 ERROR TRACKING & AUTO-FIX
// ============================================================================

interface TrackedError {
  timestamp: number;
  error: string;
  context: string;
  file?: string;
  fixed: boolean;
  fixAttempts: number;
  fixApplied?: string;
}

const errorLog: TrackedError[] = [];

export const trackError = (
  error: string,
  context: string,
  file?: string
): void => {
  // Evitar duplicatas
  const existing = errorLog.find(e => 
    e.error === error && e.file === file && !e.fixed
  );
  
  if (existing) {
    existing.fixAttempts++;
    return;
  }
  
  errorLog.push({
    timestamp: Date.now(),
    error,
    context,
    file,
    fixed: false,
    fixAttempts: 0
  });
};

export const markErrorFixed = (error: string, fixApplied: string): void => {
  const tracked = errorLog.find(e => e.error === error && !e.fixed);
  if (tracked) {
    tracked.fixed = true;
    tracked.fixApplied = fixApplied;
  }
};

export const getUnfixedErrors = (): TrackedError[] => {
  return errorLog.filter(e => !e.fixed && e.fixAttempts < 3);
};

export const getErrorSummary = (): string => {
  const unfixed = getUnfixedErrors();
  if (unfixed.length === 0) {
    return "No pending errors.";
  }
  
  return unfixed.map(e => 
    `- ${e.file ? `[${e.file}] ` : ''}${e.error.substring(0, 200)}`
  ).join('\n');
};

export const clearErrors = (): void => {
  errorLog.length = 0;
};

// ============================================================================
// 📊 EXECUTION PROGRESS TRACKING
// ============================================================================

interface ExecutionStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  startTime?: number;
  endTime?: number;
  error?: string;
}

let currentExecution: {
  taskId: string;
  taskName: string;
  steps: ExecutionStep[];
  startTime: number;
} | null = null;

export const startExecution = (taskName: string): string => {
  const taskId = `task_${Date.now()}`;
  currentExecution = {
    taskId,
    taskName,
    steps: [],
    startTime: Date.now()
  };
  return taskId;
};

export const addExecutionStep = (name: string): string => {
  if (!currentExecution) return '';
  
  const stepId = `step_${currentExecution.steps.length}`;
  currentExecution.steps.push({
    id: stepId,
    name,
    status: 'pending'
  });
  return stepId;
};

export const updateStepStatus = (
  stepId: string, 
  status: ExecutionStep['status'],
  error?: string
): void => {
  if (!currentExecution) return;
  
  const step = currentExecution.steps.find(s => s.id === stepId);
  if (step) {
    step.status = status;
    if (status === 'running') step.startTime = Date.now();
    if (status === 'success' || status === 'error') step.endTime = Date.now();
    if (error) step.error = error;
  }
};

export const getExecutionProgress = (): {
  taskName: string;
  progress: number;
  currentStep: string;
  steps: ExecutionStep[];
} | null => {
  if (!currentExecution) return null;
  
  const completed = currentExecution.steps.filter(s => 
    s.status === 'success' || s.status === 'error'
  ).length;
  
  const running = currentExecution.steps.find(s => s.status === 'running');
  
  return {
    taskName: currentExecution.taskName,
    progress: currentExecution.steps.length > 0 
      ? (completed / currentExecution.steps.length) * 100 
      : 0,
    currentStep: running?.name || 'Waiting...',
    steps: currentExecution.steps
  };
};

export const endExecution = (): void => {
  currentExecution = null;
};
