
import { Model } from "./types";
import { getCapabilities, isLocalMode, getCapabilityInstructions } from "./services/capabilityGate";

// Re-export for backward compatibility
export { getCapabilities, isLocalMode } from "./services/capabilityGate";

// ============================================================================
// 🖥️ LOCAL MODE INSTRUCTIONS (controle MEDIADO, não total)
// ============================================================================
const getLocalModeInstructions = (): string => {
  const caps = getCapabilities();
  return `
## 🖥️ LOCAL MODE - POWERSHELL

**RUNTIME CAPABILITIES:**
- fs: ${caps.fs} | shell: ${caps.shell} | network: ${caps.network}
- Reserved ports: ${caps.ports.reserved.join(', ')} | Workspace: ${caps.ports.workspace}

**IMPORTANTE:** Você opera através de uma camada de controle. Todas as ações são validadas pelo sistema.

### 🔧 SINTAXE
- Separador de comandos: \`;\` (não \`&&\`)
- Exemplo: \`npm install; npm run dev\`

### 📊 FERRAMENTAS DE DIAGNÓSTICO
Antes de agir, entenda o ambiente:
- \`list_processes()\` - Ver processos rodando
- \`get_system_state()\` - Estado completo
- \`check_app_health()\` - Diagnóstico de problemas

### 🔧 GERENCIAMENTO (use com critério)
- \`kill_port(port)\` - Liberar porta travada
- \`restart_server()\` - Reiniciar servidor
- \`system_reset(confirm: true)\` - Reset completo (último recurso)
`;
};

// ============================================================================
// 🧠 SYSTEM INSTRUCTION (gerado dinamicamente com capabilities fresh)
// ============================================================================

// Core contract (imutável)
const CORE_CONTRACT = `
You are **Aether Prime**, a skilled full-stack developer operating as an autonomous coding agent.

## 🧬 KNOWLEDGE INTEGRATION
127+ specialized knowledge manifestos available (Security, Game Dev, Mobile, Web3, AI/ML, Cloud).
The system injects relevant expertise automatically based on context.

## 🎯 OPERATIONAL MODEL

You are an **engineer with a checklist**, not an omnipotent system.
Your actions are validated by the runtime layer.

**Response Pattern:**
1. **PLAN** (1-3 lines max) - What you will do
2. **EXECUTE** - Call tools immediately
3. **VERIFY** - Check result, fix if needed

**Example:**
\`\`\`
PLAN: Creating todo app with React + Vite. Files: package.json, vite.config.js, src/main.jsx, src/App.jsx
[calls clear_workspace, write_multiple_files, install_package, run_command]
\`\`\`

## 🎭 INTENT CLASSIFICATION

Before acting, classify the user's intent:

| Intent | Action |
|--------|--------|
| **CREATE** (app, project, feature) | Full workflow: clear → write → install → run |
| **MODIFY** (edit, fix, change) | Read → Understand → Patch with replace_string |
| **EXPLAIN** (how, why, what) | Text response, NO tools unless demo needed |
| **DEBUG** (error, broken, not working) | Diagnose → Fix → Verify |
| **EXPLORE** (show, list, find) | Navigation tools only |

**CRITICAL:** Don't apply CREATE workflow to EXPLAIN requests.
`;

// Tool tiers (imutável)
const TOOL_TIERS = `
## 🛠️ TOOL TIERS (use appropriate tier)

### Tier 1: Navigation (FREE - use liberally)
**File Discovery (choose ONE):**
- \`list_directory\` ← FIRST CHOICE for browsing structure
- \`file_search\` ← When you know partial filename
- \`search_files\` ← Simple text search in content
- \`grep_search\` ← Complex regex patterns only

**Reading:**
- \`read_multiple_files\` ← ALWAYS prefer over single reads
- \`read_file\` ← Only for single file
- \`get_file_info\` ← Metadata only (size, lines)

### Tier 2: Modification (FREE - batch preferred)
- \`write_multiple_files\` ← **ALWAYS USE for projects**
- \`write_file\`, \`replace_string\`, \`delete_file\`, \`append_file\`
- \`insert_code\`, \`wrap_code\`, \`rename_symbol\`

### Tier 3: Execution (FREE - validated by runtime)
- \`run_command\`, \`install_package\`, \`run_script\`
- \`restart_server\`, \`kill_port\`

### Tier 4: AI-Powered (⚠️ COSTS API CALL - use sparingly)
- \`smart_edit\`, \`analyze_code\`, \`debug_error\`, \`generate_tests\`
- **PREFER:** Your own reasoning + Tier 1-3 tools
`;

// Defaults (overrideáveis)
const DEFAULTS = `
## 🎯 DEFAULTS

- Stack: React + Vite + Tailwind (CDN)
- Port: 5175+ (auto-assigned, 5174 reserved for IDE)
- Style: Dark mode, production-ready

**Tailwind via CDN (no PostCSS needed):**
\`\`\`html
<script src="https://cdn.tailwindcss.com"></script>
\`\`\`

**vite.config.js:**
\`\`\`js
server: { host: '0.0.0.0', port: 5175, strictPort: false }
\`\`\`
`;

// Anti-patterns (enforcement)
const ANTI_PATTERNS = `
## 🚫 ANTI-PATTERNS

- ❌ Text-only responses without tool calls (for CREATE/MODIFY/DEBUG)
- ❌ "Should I proceed?" - Just execute
- ❌ Stopping after file creation - Complete the workflow
- ❌ Single file writes when batch is better
- ❌ Assuming capabilities not in your token
- ❌ Repeating the same fix more than 3 times
`;

// Error recovery (defensive)
const ERROR_RECOVERY = `
## 🔄 ERROR RECOVERY

When something fails:
1. **READ** the error message completely
2. **CLASSIFY** the error type:
   - Missing module → install_package
   - Syntax error → read_file, fix with replace_string
   - Port in use → kill_port or use different port
   - Permission denied → report to user
3. **APPLY** minimal fix (don't rewrite entire file)
4. **VERIFY** the fix worked
5. **ESCALATE** if stuck after 3 attempts:
   - Report what you tried
   - Suggest alternatives
   - Ask user for guidance

**NEVER:** Loop infinitely trying the same fix.
**ALWAYS:** Track what you've tried.
`;

// Execution contract (para CREATE)
const EXECUTION_CONTRACT = `
## ⚡ EXECUTION CONTRACT

**For project creation requests:**
\`\`\`
1. clear_workspace(confirm: true)
2. write_multiple_files([...all files...])
3. install_package("react react-dom lucide-react")
4. run_command("npm run dev")
\`\`\`

**CRITICAL:** Complete ALL steps. User expects a RUNNING app.
`;

// Função que gera o system instruction com capabilities dinâmicas
export const getSystemInstruction = (): string => {
  const parts = [
    CORE_CONTRACT,
    getCapabilityInstructions(), // Capabilities dinâmicas
    isLocalMode() ? getLocalModeInstructions() : '',
    EXECUTION_CONTRACT,
    TOOL_TIERS,
    ANTI_PATTERNS,
    ERROR_RECOVERY,
    DEFAULTS,
  ];
  
  return parts.filter(Boolean).join('\n');
};

// Para backward compatibility (mas agora é dinâmico)
export const INITIAL_SYSTEM_INSTRUCTION = getSystemInstruction();

// Adicionar instruções específicas para quando o runtime não está bootado
export const RUNTIME_NOT_BOOTED_HINT = `
⚠️ RUNTIME STATUS: NOT BOOTED
The runtime will auto-boot when you execute terminal commands.
Proceed normally - the system handles boot automatically.
`;

export const MODELS: Model[] = [
  { id: 'gemini-2.5-flash', name: 'Aether Flash (v2.5)', description: 'High Speed Reasoning' },
  { id: 'gemini-3-pro-preview', name: 'Aether Architect (v3 Pro)', description: 'Deep Thought Architecture' },
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash Preview', description: 'Next-Gen Flash Model' },
  { id: 'gemini-robotics-er-1.5-preview', name: 'Gemini Robotics ER 1.5', description: 'Embodied Reasoning Model' },
  { id: 'models/gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'Advanced Pro Model' },
  { id: 'models/gemini-flash-latest', name: 'Gemini Flash Latest', description: 'Latest Flash Model' },
];

export const DEFAULT_MODEL = MODELS[0].id;

export const TOOLS_DECLARATION = [
  // === FILE OPERATIONS ===
  {
    name: "read_file",
    description: "Read a single file. Only use when you need existing content.",
    parameters: {
      type: "OBJECT",
      properties: {
        path: { type: "STRING", description: "File path (e.g., 'src/App.jsx')" }
      },
      required: ["path"]
    }
  },
  {
    name: "read_multiple_files",
    description: "Read multiple files at once. ALWAYS prefer this over multiple read_file calls.",
    parameters: {
      type: "OBJECT",
      properties: {
        paths: { 
          type: "ARRAY", 
          items: { type: "STRING" },
          description: "Array of file paths" 
        }
      },
      required: ["paths"]
    }
  },
  {
    name: "write_file",
    description: "Create or overwrite a file. Auto-creates parent directories.",
    parameters: {
      type: "OBJECT",
      properties: {
        path: { type: "STRING", description: "File path" },
        content: { type: "STRING", description: "Complete file content" }
      },
      required: ["path", "content"]
    }
  },
  {
    name: "write_multiple_files",
    description: "Write multiple files at once. MUCH more efficient than multiple write_file calls.",
    parameters: {
      type: "OBJECT",
      properties: {
        files: { 
          type: "ARRAY", 
          items: { 
            type: "OBJECT",
            properties: {
              path: { type: "STRING", description: "File path" },
              content: { type: "STRING", description: "File content" }
            },
            required: ["path", "content"]
          },
          description: "Array of {path, content} objects" 
        }
      },
      required: ["files"]
    }
  },
  {
    name: "delete_file",
    description: "Delete a file or folder.",
    parameters: {
      type: "OBJECT",
      properties: {
        path: { type: "STRING", description: "Path to delete" }
      },
      required: ["path"]
    }
  },
  {
    name: "move_file",
    description: "Move or rename a file/directory.",
    parameters: {
      type: "OBJECT",
      properties: {
        source: { type: "STRING", description: "Current path" },
        destination: { type: "STRING", description: "New path" }
      },
      required: ["source", "destination"]
    }
  },
  {
    name: "replace_string",
    description: "Replace a string in a file. Use for small, surgical edits only.",
    parameters: {
      type: "OBJECT",
      properties: {
        path: { type: "STRING", description: "File path" },
        search: { type: "STRING", description: "Exact string to find" },
        replace: { type: "STRING", description: "Replacement string" }
      },
      required: ["path", "search", "replace"]
    }
  },
  {
    name: "search_files",
    description: "Search for text/regex across all files. Returns matches with context.",
    parameters: {
      type: "OBJECT",
      properties: {
        query: { type: "STRING", description: "Search string or regex" },
        path: { type: "STRING", description: "Optional: limit to directory" }
      },
      required: ["query"]
    }
  },

  // === CODE EDITING (LOCAL - NO API COST) ===
  {
    name: "insert_code",
    description: "Insert code at a specific line number. NO API COST.",
    parameters: {
      type: "OBJECT",
      properties: {
        path: { type: "STRING", description: "File path" },
        line: { type: "NUMBER", description: "Line number to insert at" },
        code: { type: "STRING", description: "Code to insert" }
      },
      required: ["path", "line", "code"]
    }
  },
  {
    name: "wrap_code",
    description: "Wrap a code block with try-catch, useEffect, etc. NO API COST.",
    parameters: {
      type: "OBJECT",
      properties: {
        path: { type: "STRING", description: "File path" },
        startLine: { type: "NUMBER", description: "Start line of code to wrap" },
        endLine: { type: "NUMBER", description: "End line of code to wrap" },
        wrapper: { type: "STRING", description: "Wrapper type: 'try-catch', 'if', 'async', 'function', 'useEffect', 'useMemo'" }
      },
      required: ["path", "startLine", "endLine", "wrapper"]
    }
  },
  {
    name: "rename_symbol",
    description: "Rename a variable/function throughout a file. NO API COST.",
    parameters: {
      type: "OBJECT",
      properties: {
        path: { type: "STRING", description: "File path" },
        oldName: { type: "STRING", description: "Current name" },
        newName: { type: "STRING", description: "New name" }
      },
      required: ["path", "oldName", "newName"]
    }
  },

  // === AI-POWERED TOOLS (COST 1 API CALL EACH - USE SPARINGLY) ===
  {
    name: "smart_edit",
    description: "⚠️ COSTS 1 API CALL. AI-powered edit. PREFER replace_string or write_file instead.",
    parameters: {
      type: "OBJECT",
      properties: {
        path: { type: "STRING", description: "File to edit" },
        instruction: { type: "STRING", description: "Natural language instruction" }
      },
      required: ["path", "instruction"]
    }
  },
  {
    name: "analyze_code",
    description: "⚠️ COSTS 1 API CALL. Deep code analysis. PREFER using your own reasoning instead.",
    parameters: {
      type: "OBJECT",
      properties: {
        path: { type: "STRING", description: "File to analyze" },
        depth: { type: "STRING", description: "Analysis depth: 'quick', 'normal', 'deep'" }
      },
      required: ["path"]
    }
  },

  // === TERMINAL & PACKAGES ===
  {
    name: "run_command",
    description: "Execute a shell command. Returns output.",
    parameters: {
      type: "OBJECT",
      properties: {
        command: { type: "STRING", description: "Shell command to execute" },
        timeout: { type: "NUMBER", description: "Optional timeout in ms (default: 60000)" }
      },
      required: ["command"]
    }
  },
  {
    name: "run_script",
    description: "Run an npm script from package.json.",
    parameters: {
      type: "OBJECT",
      properties: {
        script: { type: "STRING", description: "Script name from package.json" }
      },
      required: ["script"]
    }
  },
  {
    name: "install_package",
    description: "Install npm package(s). Can install multiple at once.",
    parameters: {
      type: "OBJECT",
      properties: {
        packages: { type: "STRING", description: "Package name(s), space-separated" },
        dev: { type: "BOOLEAN", description: "Install as devDependency" }
      },
      required: ["packages"]
    }
  },
  {
    name: "uninstall_package",
    description: "Remove npm package(s).",
    parameters: {
      type: "OBJECT",
      properties: {
        packages: { type: "STRING", description: "Package name(s) to remove" }
      },
      required: ["packages"]
    }
  },

  // === GIT OPERATIONS ===
  {
    name: "git",
    description: "Execute git commands.",
    parameters: {
      type: "OBJECT",
      properties: {
        args: { type: "STRING", description: "Git arguments" }
      },
      required: ["args"]
    }
  },

  // === TESTING (TERMINAL COMMANDS - NO API COST) ===
  {
    name: "run_tests",
    description: "Run tests. NO API COST - just runs npm test.",
    parameters: {
      type: "OBJECT",
      properties: {
        pattern: { type: "STRING", description: "Test file pattern or test name filter" }
      },
      required: []
    }
  },
  {
    name: "check_types",
    description: "Run TypeScript type checking. NO API COST.",
    parameters: {
      type: "OBJECT",
      properties: {},
      required: []
    }
  },
  {
    name: "lint_fix",
    description: "Run ESLint with auto-fix. NO API COST.",
    parameters: {
      type: "OBJECT",
      properties: {
        path: { type: "STRING", description: "File or directory to lint (optional)" }
      },
      required: []
    }
  },

  // === AI-POWERED TOOLS (EXPENSIVE - USE ONLY WHEN NECESSARY) ===
  {
    name: "debug_error",
    description: "⚠️ COSTS 1 API CALL. Analyze error. TRY TO DEBUG YOURSELF FIRST.",
    parameters: {
      type: "OBJECT",
      properties: {
        error: { type: "STRING", description: "Error message or stack trace" },
        context: { type: "STRING", description: "Additional context" }
      },
      required: ["error"]
    }
  },
  {
    name: "generate_tests",
    description: "⚠️ COSTS 1 API CALL. Auto-generate tests. Consider writing tests yourself.",
    parameters: {
      type: "OBJECT",
      properties: {
        path: { type: "STRING", description: "File to generate tests for" },
        framework: { type: "STRING", description: "Test framework: 'jest', 'vitest', 'mocha'" }
      },
      required: ["path"]
    }
  },

  // === PROJECT MANAGEMENT (NO API COST) ===
  {
    name: "add_task",
    description: "Add a task to the task list.",
    parameters: {
      type: "OBJECT",
      properties: {
        text: { type: "STRING", description: "Task description" }
      },
      required: ["text"]
    }
  },
  {
    name: "complete_task",
    description: "Mark a task as completed.",
    parameters: {
      type: "OBJECT",
      properties: {
        id: { type: "STRING", description: "Task ID" }
      },
      required: ["id"]
    }
  },
  {
    name: "analyze_project",
    description: "Run Excellence Engine to score code quality.",
    parameters: {
      type: "OBJECT",
      properties: {}
    }
  },
  {
    name: "format_file",
    description: "Format a file with Prettier. NO API COST.",
    parameters: {
      type: "OBJECT",
      properties: {
        path: { type: "STRING", description: "File path" }
      },
      required: ["path"]
    }
  },

  // === MEMORY (NO API COST) ===
  {
    name: "remember",
    description: "Store information for later. NO API COST.",
    parameters: {
      type: "OBJECT",
      properties: {
        key: { type: "STRING", description: "Memory key" },
        value: { type: "STRING", description: "Information to remember" }
      },
      required: ["key", "value"]
    }
  },
  {
    name: "recall",
    description: "Retrieve stored information. NO API COST.",
    parameters: {
      type: "OBJECT",
      properties: {
        key: { type: "STRING", description: "Memory key to recall" }
      },
      required: ["key"]
    }
  },
  {
    name: "summarize_changes",
    description: "Summary of session changes. NO API COST.",
    parameters: {
      type: "OBJECT",
      properties: {}
    }
  },

  // === SYSTEM CONTROL ===
  {
    name: "clear_workspace",
    description: "🧹 Clear the workspace before creating a new project. ALWAYS call this FIRST when creating a new app to avoid conflicts with old files.",
    parameters: {
      type: "OBJECT",
      properties: {
        confirm: { type: "BOOLEAN", description: "Must be true to confirm clear" }
      },
      required: ["confirm"]
    }
  },
  {
    name: "reset_project",
    description: "🔄 Reset the entire project. Clears all files, restarts container, and starts fresh. Use when project is broken beyond repair or user wants to start over.",
    parameters: {
      type: "OBJECT",
      properties: {
        confirm: { type: "BOOLEAN", description: "Must be true to confirm reset" }
      },
      required: ["confirm"]
    }
  },
  {
    name: "restart_server",
    description: "🔄 Restart the dev server. Useful when server is stuck or after major changes.",
    parameters: {
      type: "OBJECT",
      properties: {}
    }
  },
  {
    name: "clear_terminal",
    description: "Clear the terminal output.",
    parameters: {
      type: "OBJECT",
      properties: {}
    }
  },
  
  // === HEALTH CHECK & TESTING ===
  {
    name: "check_app_health",
    description: "Check if the app is running correctly. Returns server status, any errors, and suggestions.",
    parameters: {
      type: "OBJECT",
      properties: {}
    }
  },
  {
    name: "get_error_log",
    description: "Get the log of errors that occurred during this session with their status (fixed/unfixed).",
    parameters: {
      type: "OBJECT",
      properties: {}
    }
  },
  
  // === 🖥️ POWERSHELL PROCESS MANAGEMENT ===
  {
    name: "list_processes",
    description: "📊 List all running processes/terminals. Shows PIDs, ports, status. Use to understand what's running.",
    parameters: {
      type: "OBJECT",
      properties: {}
    }
  },
  {
    name: "get_system_state",
    description: "🧠 Get complete system state: processes, terminals, ports, logs. Essential for understanding the environment.",
    parameters: {
      type: "OBJECT",
      properties: {}
    }
  },
  {
    name: "create_terminal",
    description: "🖥️ Create a new PowerShell terminal tab. Use for running separate processes.",
    parameters: {
      type: "OBJECT",
      properties: {
        name: { type: "STRING", description: "Tab name (e.g., 'Dev Server', 'Build')" },
        cwd: { type: "STRING", description: "Working directory (optional)" }
      },
      required: []
    }
  },
  {
    name: "close_terminal",
    description: "❌ Close a terminal tab by ID. Also kills any process running in it.",
    parameters: {
      type: "OBJECT",
      properties: {
        tabId: { type: "STRING", description: "Terminal tab ID to close" }
      },
      required: ["tabId"]
    }
  },
  {
    name: "close_all_terminals",
    description: "🧹 Close ALL terminal tabs. Use when cleaning up or resetting.",
    parameters: {
      type: "OBJECT",
      properties: {
        confirm: { type: "BOOLEAN", description: "Must be true to confirm" }
      },
      required: ["confirm"]
    }
  },
  {
    name: "start_process",
    description: "🚀 Start a managed process (dev server, build, etc). Auto-assigns safe port.",
    parameters: {
      type: "OBJECT",
      properties: {
        command: { type: "STRING", description: "Command to run (e.g., 'npm run dev')" },
        name: { type: "STRING", description: "Process name for identification" },
        port: { type: "NUMBER", description: "Preferred port (optional, auto-assigned if not specified)" }
      },
      required: ["command"]
    }
  },
  {
    name: "stop_process",
    description: "⏹️ Stop a running process by ID.",
    parameters: {
      type: "OBJECT",
      properties: {
        processId: { type: "STRING", description: "Process ID to stop" }
      },
      required: ["processId"]
    }
  },
  {
    name: "stop_all_processes",
    description: "⏹️ Stop ALL running processes. Use when cleaning up.",
    parameters: {
      type: "OBJECT",
      properties: {
        confirm: { type: "BOOLEAN", description: "Must be true to confirm" }
      },
      required: ["confirm"]
    }
  },
  {
    name: "kill_port",
    description: "💀 Kill any process using a specific port. Use when port is stuck.",
    parameters: {
      type: "OBJECT",
      properties: {
        port: { type: "NUMBER", description: "Port number to free" }
      },
      required: ["port"]
    }
  },
  {
    name: "get_process_output",
    description: "📜 Get output/logs from a specific process.",
    parameters: {
      type: "OBJECT",
      properties: {
        processId: { type: "STRING", description: "Process ID" },
        lines: { type: "NUMBER", description: "Number of lines (default: 100)" }
      },
      required: ["processId"]
    }
  },
  {
    name: "get_logs",
    description: "📋 Get system logs. Filter by level (info/warn/error) or source.",
    parameters: {
      type: "OBJECT",
      properties: {
        lines: { type: "NUMBER", description: "Number of lines (default: 100)" },
        level: { type: "STRING", description: "Filter by level: info, warn, error, command" },
        source: { type: "STRING", description: "Filter by source: shell, process, system, agent" }
      },
      required: []
    }
  },
  {
    name: "system_reset",
    description: "🔄 Full system reset: kills all processes, closes all terminals, clears state.",
    parameters: {
      type: "OBJECT",
      properties: {
        confirm: { type: "BOOLEAN", description: "Must be true to confirm" }
      },
      required: ["confirm"]
    }
  },
  
  // === 🔍 ADVANCED DISCOVERY TOOLS (KIRO-INSPIRED) ===
  {
    name: "get_diagnostics",
    description: "🔬 Get TypeScript/ESLint errors in real-time. CRITICAL for catching bugs BEFORE running. Returns line numbers and error messages.",
    parameters: {
      type: "OBJECT",
      properties: {
        paths: { 
          type: "ARRAY", 
          items: { type: "STRING" },
          description: "Array of file paths to check (e.g., ['src/App.tsx', 'src/utils.ts'])" 
        }
      },
      required: ["paths"]
    }
  },
  {
    name: "file_search",
    description: "🔎 Fuzzy search for files by name. Find files when you only know part of the name. Returns up to 10 matches.",
    parameters: {
      type: "OBJECT",
      properties: {
        query: { type: "STRING", description: "Partial file name to search (e.g., 'config', 'App', 'util')" },
        exclude: { type: "STRING", description: "Glob pattern to exclude (e.g., 'node_modules/**')" }
      },
      required: ["query"]
    }
  },
  {
    name: "list_directory",
    description: "📂 List directory contents with depth. Better than search_files for navigation. Shows files and folders.",
    parameters: {
      type: "OBJECT",
      properties: {
        path: { type: "STRING", description: "Directory path (e.g., 'src', 'src/components')" },
        depth: { type: "NUMBER", description: "How deep to recurse (1-5, default: 1)" }
      },
      required: ["path"]
    }
  },
  {
    name: "append_file",
    description: "➕ Append content to end of file WITHOUT overwriting. Efficient for adding to large files.",
    parameters: {
      type: "OBJECT",
      properties: {
        path: { type: "STRING", description: "File path" },
        content: { type: "STRING", description: "Content to append" }
      },
      required: ["path", "content"]
    }
  },
  {
    name: "web_search",
    description: "🌐 Search the web for documentation, solutions, or current information. Use for npm packages, error solutions, etc.",
    parameters: {
      type: "OBJECT",
      properties: {
        query: { type: "STRING", description: "Search query (e.g., 'react useEffect cleanup', 'vite proxy config')" }
      },
      required: ["query"]
    }
  },
  {
    name: "web_fetch",
    description: "📥 Fetch content from a URL. Use after web_search to get full documentation or code examples.",
    parameters: {
      type: "OBJECT",
      properties: {
        url: { type: "STRING", description: "URL to fetch (must be HTTPS)" },
        selector: { type: "STRING", description: "Optional CSS selector to extract specific content" }
      },
      required: ["url"]
    }
  },
  {
    name: "grep_search",
    description: "🔍 Advanced regex search across files. More powerful than search_files. Returns matches with context.",
    parameters: {
      type: "OBJECT",
      properties: {
        pattern: { type: "STRING", description: "Regex pattern to search" },
        include: { type: "STRING", description: "Glob pattern for files to include (e.g., '**/*.ts')" },
        exclude: { type: "STRING", description: "Glob pattern to exclude" },
        caseSensitive: { type: "BOOLEAN", description: "Case sensitive search (default: false)" }
      },
      required: ["pattern"]
    }
  },
  {
    name: "get_file_info",
    description: "📊 Get file metadata: size, modified date, line count, language. Useful for understanding large files.",
    parameters: {
      type: "OBJECT",
      properties: {
        path: { type: "STRING", description: "File path" }
      },
      required: ["path"]
    }
  },
  {
    name: "diff_files",
    description: "📝 Compare two files and show differences. Useful for understanding changes.",
    parameters: {
      type: "OBJECT",
      properties: {
        file1: { type: "STRING", description: "First file path" },
        file2: { type: "STRING", description: "Second file path" }
      },
      required: ["file1", "file2"]
    }
  },
  {
    name: "create_snapshot",
    description: "📸 Create a snapshot of current project state. Can restore later if something breaks.",
    parameters: {
      type: "OBJECT",
      properties: {
        name: { type: "STRING", description: "Snapshot name (e.g., 'before-refactor')" }
      },
      required: ["name"]
    }
  },
  {
    name: "restore_snapshot",
    description: "⏪ Restore project to a previous snapshot. Undo all changes since snapshot.",
    parameters: {
      type: "OBJECT",
      properties: {
        name: { type: "STRING", description: "Snapshot name to restore" }
      },
      required: ["name"]
    }
  },
  {
    name: "list_snapshots",
    description: "📋 List all available snapshots.",
    parameters: {
      type: "OBJECT",
      properties: {}
    }
  }
];

export const DEFAULT_PLACEHOLDER_HTML = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Aether App</title>
    <script type="module" src="/src/main.jsx"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      html, body { background: #0f172a; color: #f8fafc; font-family: system-ui, sans-serif; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    
    <!-- 
      ⚠️ READ-ONLY BOOTSTRAP SNAPSHOT
      These virtual files are templates for the agent.
      DO NOT edit these script blocks directly.
      Use write_file or write_multiple_files to create real files.
    -->
    <script type="text/plain" data-path="package.json" data-readonly="true">{
  "name": "aether-app",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --host",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "lucide-react": "^0.344.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.2.0"
  }
}</script>
    <script type="text/plain" data-path="vite.config.js" data-readonly="true">import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { 
    host: '0.0.0.0',
    port: 5175,
    strictPort: false
  }
})</script>
    <script type="text/plain" data-path="src/main.jsx" data-readonly="true">import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)</script>
    <script type="text/plain" data-path="src/App.jsx" data-readonly="true">import React from 'react'
import { Sparkles, Zap, Code2 } from 'lucide-react'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="text-center space-y-6 max-w-2xl">
        <div className="flex justify-center">
          <div className="p-4 bg-indigo-500/20 rounded-2xl">
            <Sparkles className="w-12 h-12 text-indigo-400" />
          </div>
        </div>
        
        <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
          Welcome to Aether
        </h1>
        
        <p className="text-xl text-slate-400">
          Your AI-powered development environment. Start building something amazing!
        </p>
        
        <div className="flex justify-center gap-4 pt-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-slate-300">Fast</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700">
            <Code2 className="w-4 h-4 text-green-400" />
            <span className="text-slate-300">Smart</span>
          </div>
        </div>
        
        <p className="text-sm text-slate-500 pt-8">
          Ask the AI to create components, pages, or entire applications.
        </p>
      </div>
    </div>
  )
}</script>
  </body>
</html>`;
