/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║     🔨 COMPILER & INTERPRETER MANIFEST - MESTRE DA TRADUÇÃO 🔨              ║
 * ║                                                                              ║
 * ║     "DO CÓDIGO FONTE AO CÓDIGO MÁQUINA,                                     ║
 * ║      CADA TRANSFORMAÇÃO É UMA ARTE."                                        ║
 * ║                                                                              ║
 * ║     NÍVEL: 95 (GOD MODE - LANGUAGE CREATION)                                ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Especialidades:
 * - Lexical Analysis (Tokenização)
 * - Parsing (AST Generation)
 * - Semantic Analysis
 * - Intermediate Representation (IR)
 * - Code Generation
 * - Optimization Passes
 * - JIT Compilation
 * - Interpreters & Virtual Machines
 */

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export type CompilerPhase = 
  | 'lexing'
  | 'parsing'
  | 'semantic'
  | 'ir_generation'
  | 'optimization'
  | 'code_generation';

export type TargetPlatform = 
  | 'native_x86_64'
  | 'native_arm64'
  | 'llvm_ir'
  | 'wasm'
  | 'jvm_bytecode'
  | 'clr_il'
  | 'javascript';

export interface TokenDefinition {
  name: string;
  pattern: RegExp | string;
  type: 'keyword' | 'operator' | 'literal' | 'identifier' | 'whitespace' | 'comment';
  priority?: number;
}

export interface ASTNode {
  type: string;
  children?: ASTNode[];
  value?: unknown;
  location?: { line: number; column: number };
  metadata?: Record<string, unknown>;
}

export interface GrammarRule {
  name: string;
  production: string[];
  action?: (nodes: ASTNode[]) => ASTNode;
}

// ============================================================================
// LEXER GENERATOR
// ============================================================================

export class LexerGenerator {
  private tokenDefs: TokenDefinition[] = [];
  
  addToken(def: TokenDefinition): this {
    this.tokenDefs.push(def);
    return this;
  }
  
  addKeywords(keywords: string[]): this {
    for (const kw of keywords) {
      this.tokenDefs.push({
        name: `KW_${kw.toUpperCase()}`,
        pattern: new RegExp(`\\b${kw}\\b`),
        type: 'keyword',
        priority: 10
      });
    }
    return this;
  }
  
  addOperators(operators: Record<string, string>): this {
    for (const [name, pattern] of Object.entries(operators)) {
      this.tokenDefs.push({
        name,
        pattern: pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        type: 'operator',
        priority: 5
      });
    }
    return this;
  }
  
  generate(): string {
    const lines: string[] = [];
    lines.push('// Auto-generated Lexer');
    lines.push('export interface Token {');
    lines.push('  type: string;');
    lines.push('  value: string;');
    lines.push('  line: number;');
    lines.push('  column: number;');
    lines.push('}');
    lines.push('');
    lines.push('export class Lexer {');
    lines.push('  private input: string = "";');
    lines.push('  private pos: number = 0;');
    lines.push('  private line: number = 1;');
    lines.push('  private column: number = 1;');
    lines.push('');
    lines.push('  tokenize(input: string): Token[] {');
    lines.push('    this.input = input;');
    lines.push('    this.pos = 0;');
    lines.push('    const tokens: Token[] = [];');
    lines.push('    while (this.pos < this.input.length) {');
    lines.push('      const token = this.nextToken();');
    lines.push('      if (token) tokens.push(token);');
    lines.push('    }');
    lines.push('    return tokens;');
    lines.push('  }');
    lines.push('');
    lines.push('  private nextToken(): Token | null {');
    
    // Sort by priority
    const sorted = [...this.tokenDefs].sort((a, b) => (b.priority || 0) - (a.priority || 0));
    
    for (const def of sorted) {
      const pattern = def.pattern instanceof RegExp ? def.pattern.source : def.pattern;
      lines.push(`    // ${def.name}`);
      lines.push(`    const match_${def.name} = this.input.slice(this.pos).match(/^${pattern}/);`);
      lines.push(`    if (match_${def.name}) {`);
      lines.push(`      const value = match_${def.name}[0];`);
      lines.push(`      const token = { type: '${def.name}', value, line: this.line, column: this.column };`);
      lines.push(`      this.advance(value.length);`);
      if (def.type === 'whitespace' || def.type === 'comment') {
        lines.push(`      return null; // Skip ${def.type}`);
      } else {
        lines.push(`      return token;`);
      }
      lines.push(`    }`);
    }
    
    lines.push('    throw new Error(`Unexpected character at ${this.line}:${this.column}`);');
    lines.push('  }');
    lines.push('');
    lines.push('  private advance(n: number): void {');
    lines.push('    for (let i = 0; i < n; i++) {');
    lines.push('      if (this.input[this.pos] === "\\n") {');
    lines.push('        this.line++;');
    lines.push('        this.column = 1;');
    lines.push('      } else {');
    lines.push('        this.column++;');
    lines.push('      }');
    lines.push('      this.pos++;');
    lines.push('    }');
    lines.push('  }');
    lines.push('}');
    
    return lines.join('\n');
  }
}


// ============================================================================
// PARSER GENERATOR (Recursive Descent)
// ============================================================================

export class ParserGenerator {
  private rules: GrammarRule[] = [];
  private startSymbol: string = 'program';
  
  setStartSymbol(symbol: string): this {
    this.startSymbol = symbol;
    return this;
  }
  
  addRule(rule: GrammarRule): this {
    this.rules.push(rule);
    return this;
  }
  
  generate(): string {
    const lines: string[] = [];
    lines.push('// Auto-generated Recursive Descent Parser');
    lines.push('import { Token } from "./lexer";');
    lines.push('');
    lines.push('export interface ASTNode {');
    lines.push('  type: string;');
    lines.push('  children?: ASTNode[];');
    lines.push('  value?: unknown;');
    lines.push('}');
    lines.push('');
    lines.push('export class Parser {');
    lines.push('  private tokens: Token[] = [];');
    lines.push('  private pos: number = 0;');
    lines.push('');
    lines.push('  parse(tokens: Token[]): ASTNode {');
    lines.push('    this.tokens = tokens;');
    lines.push('    this.pos = 0;');
    lines.push(`    return this.${this.startSymbol}();`);
    lines.push('  }');
    lines.push('');
    lines.push('  private current(): Token | null {');
    lines.push('    return this.tokens[this.pos] || null;');
    lines.push('  }');
    lines.push('');
    lines.push('  private advance(): Token {');
    lines.push('    return this.tokens[this.pos++];');
    lines.push('  }');
    lines.push('');
    lines.push('  private expect(type: string): Token {');
    lines.push('    const token = this.current();');
    lines.push('    if (!token || token.type !== type) {');
    lines.push('      throw new Error(`Expected ${type}, got ${token?.type}`);');
    lines.push('    }');
    lines.push('    return this.advance();');
    lines.push('  }');
    lines.push('');
    
    // Generate parsing methods for each rule
    const rulesByName = new Map<string, GrammarRule[]>();
    for (const rule of this.rules) {
      if (!rulesByName.has(rule.name)) {
        rulesByName.set(rule.name, []);
      }
      rulesByName.get(rule.name)!.push(rule);
    }
    
    for (const [name, rules] of rulesByName) {
      lines.push(`  private ${name}(): ASTNode {`);
      lines.push(`    const children: ASTNode[] = [];`);
      lines.push(`    // TODO: Implement parsing logic for ${name}`);
      lines.push(`    return { type: '${name}', children };`);
      lines.push(`  }`);
      lines.push('');
    }
    
    lines.push('}');
    return lines.join('\n');
  }
}

// ============================================================================
// SIMPLE INTERPRETER
// ============================================================================

export class SimpleInterpreter {
  private variables: Map<string, unknown> = new Map();
  private functions: Map<string, (args: unknown[]) => unknown> = new Map();
  
  constructor() {
    // Built-in functions
    this.functions.set('print', (args) => { console.log(...args); return null; });
    this.functions.set('len', (args) => (args[0] as string | unknown[]).length);
    this.functions.set('type', (args) => typeof args[0]);
  }
  
  evaluate(ast: ASTNode): unknown {
    switch (ast.type) {
      case 'program':
        return this.evaluateProgram(ast);
      case 'assignment':
        return this.evaluateAssignment(ast);
      case 'binary_op':
        return this.evaluateBinaryOp(ast);
      case 'unary_op':
        return this.evaluateUnaryOp(ast);
      case 'call':
        return this.evaluateCall(ast);
      case 'if':
        return this.evaluateIf(ast);
      case 'while':
        return this.evaluateWhile(ast);
      case 'identifier':
        return this.variables.get(ast.value as string);
      case 'number':
        return ast.value as number;
      case 'string':
        return ast.value as string;
      case 'boolean':
        return ast.value as boolean;
      default:
        throw new Error(`Unknown AST node type: ${ast.type}`);
    }
  }
  
  private evaluateProgram(ast: ASTNode): unknown {
    let result: unknown = null;
    for (const child of ast.children || []) {
      result = this.evaluate(child);
    }
    return result;
  }
  
  private evaluateAssignment(ast: ASTNode): unknown {
    const [nameNode, valueNode] = ast.children || [];
    const name = nameNode.value as string;
    const value = this.evaluate(valueNode);
    this.variables.set(name, value);
    return value;
  }
  
  private evaluateBinaryOp(ast: ASTNode): unknown {
    const [leftNode, rightNode] = ast.children || [];
    const left = this.evaluate(leftNode) as number;
    const right = this.evaluate(rightNode) as number;
    const op = ast.value as string;
    
    switch (op) {
      case '+': return left + right;
      case '-': return left - right;
      case '*': return left * right;
      case '/': return left / right;
      case '%': return left % right;
      case '==': return left === right;
      case '!=': return left !== right;
      case '<': return left < right;
      case '>': return left > right;
      case '<=': return left <= right;
      case '>=': return left >= right;
      case '&&': return left && right;
      case '||': return left || right;
      default: throw new Error(`Unknown operator: ${op}`);
    }
  }
  
  private evaluateUnaryOp(ast: ASTNode): unknown {
    const [operandNode] = ast.children || [];
    const operand = this.evaluate(operandNode);
    const op = ast.value as string;
    
    switch (op) {
      case '-': return -(operand as number);
      case '!': return !operand;
      default: throw new Error(`Unknown unary operator: ${op}`);
    }
  }
  
  private evaluateCall(ast: ASTNode): unknown {
    const name = ast.value as string;
    const args = (ast.children || []).map(child => this.evaluate(child));
    
    const fn = this.functions.get(name);
    if (!fn) throw new Error(`Unknown function: ${name}`);
    
    return fn(args);
  }
  
  private evaluateIf(ast: ASTNode): unknown {
    const [condNode, thenNode, elseNode] = ast.children || [];
    const condition = this.evaluate(condNode);
    
    if (condition) {
      return this.evaluate(thenNode);
    } else if (elseNode) {
      return this.evaluate(elseNode);
    }
    return null;
  }
  
  private evaluateWhile(ast: ASTNode): unknown {
    const [condNode, bodyNode] = ast.children || [];
    let result: unknown = null;
    
    while (this.evaluate(condNode)) {
      result = this.evaluate(bodyNode);
    }
    return result;
  }
}


// ============================================================================
// DETECTOR DE REQUISITOS
// ============================================================================

export function shouldEnableCompilerInterpreter(prompt: string): boolean {
  const promptLower = prompt.toLowerCase();
  
  const keywords = [
    // Compiladores
    'compiler', 'compilador', 'compile', 'compilar',
    'llvm', 'gcc', 'clang', 'rustc', 'javac',
    
    // Interpretadores
    'interpreter', 'interpretador', 'interpret',
    'repl', 'eval', 'execute',
    
    // Lexer/Parser
    'lexer', 'lexical', 'tokenizer', 'tokenização',
    'parser', 'parsing', 'grammar', 'gramática',
    'ast', 'abstract syntax tree', 'árvore sintática',
    
    // Linguagens
    'criar linguagem', 'create language', 'dsl',
    'domain specific language', 'linguagem de domínio',
    'programming language', 'linguagem de programação',
    
    // Técnicas
    'recursive descent', 'lr parser', 'll parser',
    'pratt parser', 'operator precedence',
    'semantic analysis', 'type checking',
    'code generation', 'geração de código',
    'optimization', 'otimização',
    
    // IR
    'intermediate representation', 'ir',
    'bytecode', 'opcode', 'instruction set',
    
    // JIT
    'jit', 'just in time', 'runtime compilation',
    
    // Ferramentas
    'flex', 'bison', 'yacc', 'antlr', 'peg',
    'nom', 'pest', 'lalrpop', 'tree-sitter'
  ];
  
  return keywords.some(k => promptLower.includes(k));
}

// ============================================================================
// MANIFESTO TEXTUAL
// ============================================================================

export const COMPILER_INTERPRETER_MANIFEST = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║     🔨 COMPILER & INTERPRETER MANIFEST - MESTRE DA TRADUÇÃO 🔨              ║
║                                                                              ║
║     "DO CÓDIGO FONTE AO CÓDIGO MÁQUINA,                                     ║
║      CADA TRANSFORMAÇÃO É UMA ARTE."                                        ║
║                                                                              ║
║     NÍVEL: 95 (GOD MODE - LANGUAGE CREATION)                                ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════════════════════
🔨 PIPELINE DE COMPILAÇÃO
═══════════════════════════════════════════════════════════════════════════════

  Source Code
      ↓
  ┌─────────────────┐
  │  LEXER          │  → Tokens
  │  (Tokenização)  │
  └─────────────────┘
      ↓
  ┌─────────────────┐
  │  PARSER         │  → AST (Abstract Syntax Tree)
  │  (Análise)      │
  └─────────────────┘
      ↓
  ┌─────────────────┐
  │  SEMANTIC       │  → AST Anotada + Symbol Table
  │  (Tipos, Scope) │
  └─────────────────┘
      ↓
  ┌─────────────────┐
  │  IR GENERATION  │  → Intermediate Representation
  │  (LLVM IR, etc) │
  └─────────────────┘
      ↓
  ┌─────────────────┐
  │  OPTIMIZATION   │  → IR Otimizada
  │  (Passes)       │
  └─────────────────┘
      ↓
  ┌─────────────────┐
  │  CODE GEN       │  → Assembly / Bytecode / Machine Code
  │  (Target)       │
  └─────────────────┘

═══════════════════════════════════════════════════════════════════════════════
📋 TIPOS DE ANÁLISE LÉXICA
═══════════════════════════════════════════════════════════════════════════════

TOKENS COMUNS:
├── Keywords: if, else, while, for, return, function
├── Operators: +, -, *, /, ==, !=, <, >, &&, ||
├── Literals: 42, 3.14, "hello", true, false
├── Identifiers: variableName, functionName
├── Delimiters: (, ), {, }, [, ], ;, ,
├── Whitespace: espaços, tabs, newlines (geralmente ignorados)
└── Comments: // single line, /* multi line */

TÉCNICAS:
├── Regex-based: Simples, mas pode ser lento
├── DFA (Deterministic Finite Automaton): Rápido, usado em produção
├── Hand-written: Máximo controle, usado em compiladores reais
└── Generator (Flex, re2c): Gera código otimizado

═══════════════════════════════════════════════════════════════════════════════
🌳 TIPOS DE PARSERS
═══════════════════════════════════════════════════════════════════════════════

TOP-DOWN:
├── Recursive Descent: Fácil de implementar, LL(k)
├── LL(1): Uma lookahead, tabela de parsing
├── Pratt Parser: Excelente para expressões, precedência
└── PEG (Parsing Expression Grammar): Backtracking, memoization

BOTTOM-UP:
├── LR(0): Simples, poucos conflitos
├── SLR(1): Simple LR, mais gramáticas
├── LALR(1): Look-Ahead LR, usado em Yacc/Bison
└── GLR: Generalized LR, gramáticas ambíguas

FERRAMENTAS:
├── ANTLR: Java/Python/JS, LL(*)
├── Bison/Yacc: C/C++, LALR(1)
├── Tree-sitter: Incremental, usado em editores
├── Pest (Rust): PEG, fácil de usar
└── Nom (Rust): Parser combinators

═══════════════════════════════════════════════════════════════════════════════
🎯 INTERMEDIATE REPRESENTATIONS
═══════════════════════════════════════════════════════════════════════════════

LLVM IR:
├── SSA form (Static Single Assignment)
├── Typed, low-level
├── Portável entre arquiteturas
└── Usado por: Rust, Swift, Clang

WASM (WebAssembly):
├── Stack-based
├── Binário compacto
├── Sandboxed execution
└── Usado por: Web, Serverless

JVM Bytecode:
├── Stack-based
├── Garbage collected
├── Portável
└── Usado por: Java, Kotlin, Scala

.NET IL (CIL):
├── Stack-based
├── JIT compiled
├── Cross-language
└── Usado por: C#, F#, VB.NET

═══════════════════════════════════════════════════════════════════════════════
⚡ OTIMIZAÇÕES COMUNS
═══════════════════════════════════════════════════════════════════════════════

LOCAL:
├── Constant folding: 2 + 3 → 5
├── Dead code elimination
├── Common subexpression elimination
├── Strength reduction: x * 2 → x << 1
└── Peephole optimization

GLOBAL:
├── Inlining
├── Loop unrolling
├── Loop invariant code motion
├── Tail call optimization
└── Register allocation

INTERPROCEDURAL:
├── Whole program optimization
├── Link-time optimization (LTO)
├── Profile-guided optimization (PGO)
└── Devirtualization

═══════════════════════════════════════════════════════════════════════════════
🔧 LINGUAGENS PARA COMPILADORES
═══════════════════════════════════════════════════════════════════════════════

✅ TIER 1 - IDEAL:
├── Rust: Seguro, rápido, usado em rustc, tree-sitter
├── C/C++: Clássico, usado em GCC, LLVM, V8
├── OCaml: Funcional, usado em Reason, Flow
└── Haskell: Puro, usado em GHC, PureScript

✅ TIER 2 - BOM:
├── Go: Simples, usado em go compiler
├── Zig: Moderno, bootstrapped
└── D: Metaprogramming poderoso

⚠️ TIER 3 - PROTOTIPAGEM:
├── Python: Rápido para prototipar
├── TypeScript: Bom para DSLs web
└── Lua: Embeddable, LuaJIT

═══════════════════════════════════════════════════════════════════════════════

"UM COMPILADOR É UMA PONTE ENTRE O PENSAMENTO HUMANO E A MÁQUINA.
 CONSTRUA PONTES SÓLIDAS."

                    — Compiler & Interpreter Manifest, Level 95
`;

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  LexerGenerator,
  ParserGenerator,
  SimpleInterpreter,
  shouldEnableCompilerInterpreter,
  COMPILER_INTERPRETER_MANIFEST
};
