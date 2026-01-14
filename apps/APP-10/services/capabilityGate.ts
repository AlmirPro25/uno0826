// ============================================================================
// 🔐 CAPABILITY-AWARE TOOL GATING
// ============================================================================
// Ferramentas são filtradas baseado nas capabilities do runtime.
// O agente nem vê ferramentas que não pode usar.
// Zero hallucination operacional. Zero tentativa inválida.

export interface RuntimeCapabilities {
  fs: 'real' | 'virtual';
  shell: 'powershell' | 'webcontainer' | 'none';
  network: 'full' | 'limited' | 'none';
  processes: boolean;
  ports: { reserved: number[]; workspace: string };
}

// ============================================================================
// DYNAMIC CAPABILITIES (sempre fresh, nunca cached)
// ============================================================================

export const getCapabilities = (): RuntimeCapabilities => {
  if (typeof window !== 'undefined' && (window as any).__AETHER_LOCAL_MODE__ === true) {
    return {
      fs: 'real',
      shell: 'powershell',
      network: 'full',
      processes: true,
      ports: { reserved: [3001, 5174], workspace: '5175-5199' }
    };
  }
  return {
    fs: 'virtual',
    shell: 'webcontainer',
    network: 'limited',
    processes: false,
    ports: { reserved: [3001, 5174], workspace: '5175-5199' }
  };
};

// Helper functions (always call getCapabilities() fresh)
export const isLocalMode = (): boolean => getCapabilities().shell === 'powershell';
export const hasRealFs = (): boolean => getCapabilities().fs === 'real';
export const hasProcessControl = (): boolean => getCapabilities().processes;
export const hasFullNetwork = (): boolean => getCapabilities().network === 'full';

// ============================================================================
// TOOL REQUIREMENTS MAPPING
// ============================================================================

interface ToolRequirement {
  shell?: ('powershell' | 'webcontainer' | 'none')[];
  fs?: ('real' | 'virtual')[];
  network?: ('full' | 'limited' | 'none')[];
  processes?: boolean;
}

const TOOL_REQUIREMENTS: Record<string, ToolRequirement> = {
  // Shell-dependent tools
  'run_command': { shell: ['powershell', 'webcontainer'] },
  'run_script': { shell: ['powershell', 'webcontainer'] },
  'install_package': { shell: ['powershell', 'webcontainer'] },
  'uninstall_package': { shell: ['powershell', 'webcontainer'] },
  'git': { shell: ['powershell'] }, // Git needs real shell
  
  // Process management (Local Mode only)
  'list_processes': { processes: true },
  'start_process': { processes: true },
  'stop_process': { processes: true },
  'stop_all_processes': { processes: true },
  'kill_port': { processes: true },
  'get_process_output': { processes: true },
  'create_terminal': { processes: true },
  'close_terminal': { processes: true },
  'close_all_terminals': { processes: true },
  'get_system_state': { processes: true },
  'system_reset': { processes: true },
  
  // Network-dependent tools
  'web_search': { network: ['full', 'limited'] },
  'web_fetch': { network: ['full'] },
  
  // File operations (work in both modes)
  'read_file': {},
  'read_multiple_files': {},
  'write_file': {},
  'write_multiple_files': {},
  'delete_file': {},
  'move_file': {},
  'replace_string': {},
  'search_files': {},
  'file_search': {},
  'list_directory': {},
  'grep_search': {},
  'append_file': {},
  'get_file_info': {},
  'diff_files': {},
  
  // Code editing (local operations)
  'insert_code': {},
  'wrap_code': {},
  'rename_symbol': {},
  'format_file': {},
  
  // Testing (needs shell)
  'run_tests': { shell: ['powershell', 'webcontainer'] },
  'check_types': { shell: ['powershell', 'webcontainer'] },
  'lint_fix': { shell: ['powershell', 'webcontainer'] },
  'get_diagnostics': {},
  
  // AI-powered (always available)
  'smart_edit': {},
  'analyze_code': {},
  'debug_error': {},
  'generate_tests': {},
  
  // Memory & project management
  'remember': {},
  'recall': {},
  'summarize_changes': {},
  'add_task': {},
  'complete_task': {},
  'analyze_project': {},
  
  // System control
  'clear_workspace': {},
  'reset_project': {},
  'restart_server': { shell: ['powershell', 'webcontainer'] },
  'clear_terminal': {},
  'check_app_health': {},
  'get_error_log': {},
  'get_logs': {},
  
  // Snapshots
  'create_snapshot': {},
  'restore_snapshot': {},
  'list_snapshots': {},
};

// ============================================================================
// TOOL GATING LOGIC
// ============================================================================

export const isToolAvailable = (toolName: string): boolean => {
  const requirements = TOOL_REQUIREMENTS[toolName];
  if (!requirements) return true; // Unknown tools are allowed (fail at runtime)
  
  const caps = getCapabilities();
  
  // Check shell requirement
  if (requirements.shell && !requirements.shell.includes(caps.shell)) {
    return false;
  }
  
  // Check fs requirement
  if (requirements.fs && !requirements.fs.includes(caps.fs)) {
    return false;
  }
  
  // Check network requirement
  if (requirements.network && !requirements.network.includes(caps.network)) {
    return false;
  }
  
  // Check processes requirement
  if (requirements.processes && !caps.processes) {
    return false;
  }
  
  return true;
};

export const getAvailableTools = (allTools: any[]): any[] => {
  return allTools.filter(tool => isToolAvailable(tool.name));
};

export const getDisabledTools = (allTools: any[]): string[] => {
  return allTools
    .filter(tool => !isToolAvailable(tool.name))
    .map(tool => tool.name);
};

// ============================================================================
// CAPABILITY-AWARE INSTRUCTIONS
// ============================================================================

export const getCapabilityInstructions = (): string => {
  const caps = getCapabilities();
  
  const lines: string[] = [
    '## 🔐 RUNTIME CAPABILITIES (live)',
    '',
    `| Capability | Status |`,
    `|------------|--------|`,
    `| Filesystem | ${caps.fs} |`,
    `| Shell | ${caps.shell} |`,
    `| Network | ${caps.network} |`,
    `| Processes | ${caps.processes ? 'yes' : 'no'} |`,
    `| Reserved Ports | ${caps.ports.reserved.join(', ')} |`,
    `| Workspace Ports | ${caps.ports.workspace} |`,
    '',
  ];
  
  // Add mode-specific instructions
  if (caps.shell === 'powershell') {
    lines.push(
      '### 🖥️ LOCAL MODE ACTIVE',
      '- Real PowerShell available',
      '- Use `;` as command separator (not `&&`)',
      '- Process management tools enabled',
      '- Full network access',
      ''
    );
  } else if (caps.shell === 'webcontainer') {
    lines.push(
      '### 🌐 WEBCONTAINER MODE',
      '- Browser-based shell',
      '- Limited process control',
      '- Some network restrictions',
      ''
    );
  } else {
    lines.push(
      '### ⚠️ NO SHELL AVAILABLE',
      '- File operations only',
      '- Cannot run commands',
      '- Cannot install packages',
      ''
    );
  }
  
  // List disabled tools
  const disabledTools = Object.keys(TOOL_REQUIREMENTS).filter(t => !isToolAvailable(t));
  if (disabledTools.length > 0) {
    lines.push(
      '### 🚫 DISABLED TOOLS (not available in current mode)',
      disabledTools.map(t => `- ~~${t}~~`).join('\n'),
      ''
    );
  }
  
  return lines.join('\n');
};

// ============================================================================
// DESTRUCTIVE OPS ESCALATION
// ============================================================================

type DestructiveLevel = 'safe' | 'caution' | 'dangerous' | 'critical';

const DESTRUCTIVE_LEVELS: Record<string, DestructiveLevel> = {
  'kill_port': 'caution',
  'stop_process': 'caution',
  'stop_all_processes': 'dangerous',
  'close_terminal': 'caution',
  'close_all_terminals': 'dangerous',
  'delete_file': 'caution',
  'clear_workspace': 'dangerous',
  'reset_project': 'critical',
  'system_reset': 'critical',
};

export const getDestructiveLevel = (toolName: string): DestructiveLevel => {
  return DESTRUCTIVE_LEVELS[toolName] || 'safe';
};

export const requiresConfirmation = (toolName: string): boolean => {
  const level = getDestructiveLevel(toolName);
  return level === 'dangerous' || level === 'critical';
};

export const requiresRationale = (toolName: string): boolean => {
  return getDestructiveLevel(toolName) === 'critical';
};

export const getDestructiveWarning = (toolName: string): string | null => {
  const level = getDestructiveLevel(toolName);
  
  switch (level) {
    case 'caution':
      return `⚠️ ${toolName} may affect running processes`;
    case 'dangerous':
      return `🔶 ${toolName} will stop multiple processes/clear data`;
    case 'critical':
      return `🔴 ${toolName} is a CRITICAL operation. Requires confirmation AND rationale.`;
    default:
      return null;
  }
};
