/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║   🔬 MANIFESTO SUPREMO DE ENGENHARIA REVERSA 🔬                              ║
 * ║                                                                              ║
 * ║   "A Arte de Entender Sistemas pelo Avesso"                                  ║
 * ║                                                                              ║
 * ║   Versão: 1.0.0 | Dezembro 2025                                              ║
 * ║   Foco: Educacional, Auditoria, Compatibilidade, Segurança Defensiva        ║
 * ║                                                                              ║
 * ║   ⚠️ AVISO ÉTICO: Este manifesto foca EXCLUSIVAMENTE em:                     ║
 * ║   - Compreensão e documentação de sistemas                                   ║
 * ║   - Auditoria de segurança autorizada                                        ║
 * ║   - Interoperabilidade e compatibilidade                                     ║
 * ║   - Preservação histórica de software                                        ║
 * ║   - Pesquisa acadêmica e educacional                                         ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

// ============================================================================
// PARTE I: IDENTIDADE E MISSÃO
// ============================================================================

export const AGENT_IDENTITY = {
  name: 'Especialista Supremo em Engenharia Reversa',
  version: '1.0.0',
  
  mission: `
    Formar uma IA especialista em engenharia reversa capaz de:
    - Entender e modelar sistemas binários (firmware, executáveis, drivers)
    - Extrair especificações (protocolos, formatos de arquivo, APIs)
    - Gerar documentação técnica e relatórios de compatibilidade
    - Priorizar segurança, privacidade e conformidade legal
    
    RE = COMPREENSÃO, não exploração.
  `,
  
  principles: [
    'Compreensão, não dano - foco em interoperabilidade e defesa',
    'Rigor científico - fundamentar inferências com evidência',
    'Auditabilidade - todo resultado deve ter rastreabilidade',
    'Modularidade cognitiva - separar capacidades por função',
    'Atualização contínua - incorporar pesquisas recentes',
    'Ética absoluta - nunca criar ou facilitar malware'
  ],
  
  ethicalBoundaries: [
    'NUNCA criar payloads maliciosos ou exploits',
    'NUNCA contornar proteções sem autorização explícita',
    'NUNCA analisar sistemas sem permissão legal',
    'SEMPRE documentar propósito legítimo da análise',
    'SEMPRE respeitar DMCA, LGPD e leis aplicáveis',
    'SEMPRE priorizar defesa sobre ataque'
  ]
};


// ============================================================================
// PARTE II: LINHA DO TEMPO HISTÓRICA DA ENGENHARIA REVERSA
// ============================================================================

export interface REHistoricalEvent {
  year: number;
  event: string;
  significance: string;
  category: 'military' | 'hardware' | 'software' | 'security' | 'tools' | 'legal' | 'ai';
  keyFigures?: string[];
  impact: string;
}

export const RE_TIMELINE: REHistoricalEvent[] = [
  // ERA 1: ORIGENS MILITARES (1940-1960)
  {
    year: 1940,
    event: 'Decodificação da Máquina Enigma',
    significance: 'Primeiro grande projeto de engenharia reversa moderna',
    category: 'military',
    keyFigures: ['Alan Turing', 'Gordon Welchman', 'Dilly Knox'],
    impact: 'Estabeleceu fundamentos de criptoanálise e RE de hardware'
  },
  {
    year: 1945,
    event: 'Análise de equipamentos capturados na WWII',
    significance: 'RE sistemática de tecnologia inimiga',
    category: 'military',
    impact: 'Metodologias de análise de hardware se desenvolvem'
  },
  {
    year: 1950,
    event: 'Guerra Fria - RE de tecnologia soviética',
    significance: 'Análise de radares, mísseis e eletrônicos',
    category: 'military',
    impact: 'RE se torna disciplina de inteligência nacional'
  },
  
  // ERA 2: HARDWARE E CIRCUITOS (1960-1980)
  {
    year: 1965,
    event: 'RE de circuitos integrados',
    significance: 'Análise de chips para compatibilidade',
    category: 'hardware',
    impact: 'Indústria de semicondutores se desenvolve'
  },
  {
    year: 1971,
    event: 'Intel 4004 - primeiro microprocessador',
    significance: 'RE de microprocessadores começa',
    category: 'hardware',
    keyFigures: ['Federico Faggin', 'Ted Hoff'],
    impact: 'Documentação de ISA e comportamento de CPUs'
  },
  {
    year: 1977,
    event: 'Apple II - RE de ROMs',
    significance: 'Hackers analisam BIOS e ROMs',
    category: 'software',
    keyFigures: ['Steve Wozniak'],
    impact: 'Cultura de RE de software nasce'
  },
  
  // ERA 3: SOFTWARE E VIDEOGAMES (1980-1995)
  {
    year: 1983,
    event: 'Nintendo Famicom (NES)',
    significance: 'RE de consoles de videogame',
    category: 'software',
    impact: 'Emuladores e homebrew surgem'
  },
  {
    year: 1985,
    event: 'Primeiros debuggers para DOS',
    significance: 'Ferramentas de análise de software',
    category: 'tools',
    impact: 'DEBUG.COM e ferramentas similares'
  },
  {
    year: 1988,
    event: 'Morris Worm',
    significance: 'Primeiro worm de Internet analisado',
    category: 'security',
    keyFigures: ['Robert Morris'],
    impact: 'RE de malware se torna necessidade'
  },
  {
    year: 1991,
    event: 'IDA (Interactive Disassembler) lançado',
    significance: 'Ferramenta profissional de RE',
    category: 'tools',
    keyFigures: ['Ilfak Guilfanov'],
    impact: 'Padrão da indústria por décadas'
  },
  {
    year: 1994,
    event: 'PlayStation - RE de hardware',
    significance: 'Análise de console 32-bit',
    category: 'hardware',
    impact: 'Emuladores de PS1 surgem'
  },
  
  // ERA 4: PROFISSIONALIZAÇÃO (1995-2010)
  {
    year: 1995,
    event: 'Windows 95 - RE de Win32 API',
    significance: 'Análise massiva de APIs Windows',
    category: 'software',
    impact: 'Wine project, ReactOS, documentação'
  },
  {
    year: 1996,
    event: 'SoftICE lançado',
    significance: 'Debugger kernel-level para Windows',
    category: 'tools',
    impact: 'Análise profunda de drivers e kernel'
  },
  {
    year: 1998,
    event: 'DMCA (Digital Millennium Copyright Act)',
    significance: 'Lei que regula RE nos EUA',
    category: 'legal',
    impact: 'Exceções para interoperabilidade e segurança'
  },
  {
    year: 2000,
    event: 'OllyDbg lançado',
    significance: 'Debugger gratuito e poderoso',
    category: 'tools',
    keyFigures: ['Oleh Yuschuk'],
    impact: 'Democratização de ferramentas de RE'
  },
  {
    year: 2005,
    event: 'IDA Pro + Hex-Rays Decompiler',
    significance: 'Decompilação automatizada',
    category: 'tools',
    keyFigures: ['Ilfak Guilfanov'],
    impact: 'Pseudocódigo C a partir de binários'
  },
  {
    year: 2007,
    event: 'iPhone jailbreak - RE de iOS',
    significance: 'Análise de firmware móvel',
    category: 'software',
    impact: 'Segurança móvel se desenvolve'
  },
  
  // ERA 5: FERRAMENTAS MODERNAS (2010-2020)
  {
    year: 2010,
    event: 'Stuxnet descoberto e analisado',
    significance: 'RE de malware nation-state',
    category: 'security',
    impact: 'Análise de malware avançado'
  },
  {
    year: 2013,
    event: 'angr - Execução Simbólica',
    significance: 'Framework de análise programática',
    category: 'tools',
    keyFigures: ['Yan Shoshitaishvili', 'UCSB SecLab'],
    impact: 'Automação de análise de binários'
  },
  {
    year: 2014,
    event: 'Frida lançado',
    significance: 'Instrumentação dinâmica multiplataforma',
    category: 'tools',
    keyFigures: ['Ole André Vadla Ravnås'],
    impact: 'Hooking e tracing em tempo real'
  },
  {
    year: 2017,
    event: 'Binary Ninja lançado',
    significance: 'Alternativa moderna ao IDA',
    category: 'tools',
    keyFigures: ['Vector 35'],
    impact: 'API moderna para automação'
  },
  {
    year: 2019,
    event: 'Ghidra liberado pela NSA',
    significance: 'Ferramenta enterprise-grade gratuita',
    category: 'tools',
    keyFigures: ['NSA'],
    impact: 'Democratização total de RE profissional'
  },
  
  // ERA 6: IA E FUTURO (2020-2025)
  {
    year: 2020,
    event: 'Neural Decompilation emerge',
    significance: 'IA para traduzir assembly→código',
    category: 'ai',
    impact: 'Modelos seq2seq para decompilação'
  },
  {
    year: 2022,
    event: 'REMEND e papers de Neural RE',
    significance: 'Pesquisa acadêmica em IA+RE',
    category: 'ai',
    impact: 'Inferência semântica de binários'
  },
  {
    year: 2024,
    event: 'LLMs aplicados a RE',
    significance: 'GPT-4 e similares analisam código',
    category: 'ai',
    impact: 'Explicação e documentação automatizada'
  },
  {
    year: 2025,
    event: 'RE assistida por IA generativa',
    significance: 'Agentes autônomos de análise',
    category: 'ai',
    impact: 'Automação de pipeline completo de RE'
  }
];

// ============================================================================
// PARTE III: FERRAMENTAS FUNDAMENTAIS
// ============================================================================

export interface RETool {
  name: string;
  category: 'disassembler' | 'decompiler' | 'debugger' | 'dynamic' | 'symbolic' | 'framework';
  year: number;
  creator: string;
  license: 'commercial' | 'open-source' | 'free';
  platforms: string[];
  description: string;
  useCase: string;
  website?: string;
}

export const RE_TOOLS: RETool[] = [
  // DISASSEMBLERS & DECOMPILERS
  {
    name: 'IDA Pro',
    category: 'disassembler',
    year: 1991,
    creator: 'Ilfak Guilfanov / Hex-Rays',
    license: 'commercial',
    platforms: ['Windows', 'Linux', 'macOS'],
    description: 'Disassembler interativo padrão da indústria',
    useCase: 'Análise estática profissional de binários',
    website: 'https://hex-rays.com/ida-pro/'
  },
  {
    name: 'Hex-Rays Decompiler',
    category: 'decompiler',
    year: 2005,
    creator: 'Ilfak Guilfanov',
    license: 'commercial',
    platforms: ['Windows', 'Linux', 'macOS'],
    description: 'Decompilador que gera pseudocódigo C',
    useCase: 'Reconstrução de código-fonte aproximado'
  },
  {
    name: 'Ghidra',
    category: 'disassembler',
    year: 2019,
    creator: 'NSA',
    license: 'open-source',
    platforms: ['Windows', 'Linux', 'macOS'],
    description: 'Suite completa de RE com decompilador',
    useCase: 'Análise profissional gratuita',
    website: 'https://ghidra-sre.org/'
  },
  {
    name: 'Binary Ninja',
    category: 'disassembler',
    year: 2017,
    creator: 'Vector 35',
    license: 'commercial',
    platforms: ['Windows', 'Linux', 'macOS'],
    description: 'Plataforma moderna com API Python',
    useCase: 'Automação e scripting de análise',
    website: 'https://binary.ninja/'
  },
  {
    name: 'Radare2',
    category: 'framework',
    year: 2006,
    creator: 'pancake (Sergi Àlvarez)',
    license: 'open-source',
    platforms: ['Windows', 'Linux', 'macOS', 'Android', 'iOS'],
    description: 'Framework de RE via linha de comando',
    useCase: 'Análise scriptável e portátil',
    website: 'https://rada.re/'
  },
  
  // DEBUGGERS
  {
    name: 'OllyDbg',
    category: 'debugger',
    year: 2000,
    creator: 'Oleh Yuschuk',
    license: 'free',
    platforms: ['Windows'],
    description: 'Debugger user-mode para Windows x86',
    useCase: 'Análise dinâmica de executáveis Windows'
  },
  {
    name: 'x64dbg',
    category: 'debugger',
    year: 2013,
    creator: 'mrexodia',
    license: 'open-source',
    platforms: ['Windows'],
    description: 'Debugger moderno x86/x64 para Windows',
    useCase: 'Sucessor espiritual do OllyDbg',
    website: 'https://x64dbg.com/'
  },
  {
    name: 'GDB',
    category: 'debugger',
    year: 1986,
    creator: 'GNU Project',
    license: 'open-source',
    platforms: ['Linux', 'macOS', 'Windows'],
    description: 'GNU Debugger - padrão em sistemas Unix',
    useCase: 'Debug de binários ELF e análise de core dumps'
  },
  {
    name: 'WinDbg',
    category: 'debugger',
    year: 1999,
    creator: 'Microsoft',
    license: 'free',
    platforms: ['Windows'],
    description: 'Debugger kernel e user-mode da Microsoft',
    useCase: 'Análise de drivers e kernel Windows'
  },
  
  // INSTRUMENTAÇÃO DINÂMICA
  {
    name: 'Frida',
    category: 'dynamic',
    year: 2014,
    creator: 'Ole André Vadla Ravnås',
    license: 'open-source',
    platforms: ['Windows', 'Linux', 'macOS', 'Android', 'iOS'],
    description: 'Toolkit de instrumentação dinâmica',
    useCase: 'Hooking, tracing e modificação em runtime',
    website: 'https://frida.re/'
  },
  {
    name: 'DynamoRIO',
    category: 'dynamic',
    year: 2002,
    creator: 'MIT / Google',
    license: 'open-source',
    platforms: ['Windows', 'Linux', 'Android'],
    description: 'Framework de instrumentação binária',
    useCase: 'Análise de cobertura e profiling'
  },
  {
    name: 'Pin',
    category: 'dynamic',
    year: 2004,
    creator: 'Intel',
    license: 'free',
    platforms: ['Windows', 'Linux', 'macOS'],
    description: 'Framework de instrumentação da Intel',
    useCase: 'Análise de performance e segurança'
  },
  
  // EXECUÇÃO SIMBÓLICA
  {
    name: 'angr',
    category: 'symbolic',
    year: 2013,
    creator: 'UCSB SecLab',
    license: 'open-source',
    platforms: ['Windows', 'Linux', 'macOS'],
    description: 'Framework de execução simbólica em Python',
    useCase: 'Análise automatizada e exploração de caminhos',
    website: 'https://angr.io/'
  },
  {
    name: 'KLEE',
    category: 'symbolic',
    year: 2008,
    creator: 'Stanford / Imperial College',
    license: 'open-source',
    platforms: ['Linux'],
    description: 'Execução simbólica para LLVM bitcode',
    useCase: 'Geração automática de testes'
  },
  {
    name: 'Triton',
    category: 'symbolic',
    year: 2015,
    creator: 'Quarkslab',
    license: 'open-source',
    platforms: ['Windows', 'Linux', 'macOS'],
    description: 'Framework de análise binária dinâmica',
    useCase: 'Taint analysis e execução simbólica'
  },
  
  // EMULADORES
  {
    name: 'Unicorn Engine',
    category: 'framework',
    year: 2015,
    creator: 'Nguyen Anh Quynh',
    license: 'open-source',
    platforms: ['Windows', 'Linux', 'macOS'],
    description: 'Framework de emulação de CPU leve',
    useCase: 'Emulação de código para análise',
    website: 'https://www.unicorn-engine.org/'
  },
  {
    name: 'QEMU',
    category: 'framework',
    year: 2003,
    creator: 'Fabrice Bellard',
    license: 'open-source',
    platforms: ['Windows', 'Linux', 'macOS'],
    description: 'Emulador de sistema completo',
    useCase: 'Emulação de firmware e sistemas inteiros'
  }
];


// ============================================================================
// PARTE IV: ARQUITETURA COGNITIVA DO AGENTE DE RE
// ============================================================================

export const RE_COGNITIVE_ARCHITECTURE = {
  layers: {
    ingestion: {
      name: 'Camada de Ingestão e Triagem',
      responsibilities: [
        'Identificação de tipo de arquivo (PE/ELF/Mach-O/firmware)',
        'Detecção de arquitetura (x86/x64/ARM/MIPS/RISC-V)',
        'Extração de metadados e assinaturas',
        'Classificação de risco e prioridade',
        'Geração de manifesto do alvo'
      ],
      outputs: ['Metadados estruturados', 'Plano de análise', 'Hash SHA256']
    },
    
    staticAnalysis: {
      name: 'Camada de Análise Estática',
      responsibilities: [
        'Desmontagem (disassembly) completa',
        'Recuperação de CFG (Control Flow Graph)',
        'Identificação de strings e constantes',
        'Leitura de símbolos quando disponíveis',
        'Decompilação para pseudocódigo',
        'Identificação de padrões idiomáticos do compilador',
        'Inferência de tipos e estruturas'
      ],
      tools: ['Ghidra', 'IDA Pro', 'Binary Ninja', 'Radare2'],
      outputs: ['CFG', 'Pseudocódigo', 'Lista de funções', 'Strings']
    },
    
    dynamicAnalysis: {
      name: 'Camada de Análise Dinâmica',
      responsibilities: [
        'Execução controlada em sandbox',
        'Instrumentação com hooks (Frida)',
        'Coleta de I/O e chamadas de sistema',
        'Monitoramento de comunicação de rede',
        'Tracing de execução'
      ],
      tools: ['Frida', 'DynamoRIO', 'Pin', 'strace/ltrace'],
      outputs: ['Traces de execução', 'Logs de syscalls', 'Capturas de rede']
    },
    
    symbolicExecution: {
      name: 'Camada de Execução Simbólica',
      responsibilities: [
        'Exploração automática de caminhos',
        'Resolução de constraints',
        'Geração de inputs para cobertura',
        'Detecção de caminhos não alcançados',
        'Análise de taint (propagação de dados)'
      ],
      tools: ['angr', 'KLEE', 'Triton'],
      outputs: ['Inputs de teste', 'Mapa de caminhos', 'Constraints']
    },
    
    semanticInference: {
      name: 'Camada de Inferência Semântica (IA)',
      responsibilities: [
        'Neural decompilation (assembly→código)',
        'Nomeação probabilística de funções',
        'Identificação de padrões (parsers, alocadores)',
        'Detecção de máquinas de estado',
        'Reconstrução de estruturas de dados'
      ],
      techniques: ['Seq2Seq', 'Transformers', 'Graph Neural Networks'],
      outputs: ['Código reconstruído', 'Nomes sugeridos', 'Confiança %']
    },
    
    verification: {
      name: 'Camada de Verificação e Evidência',
      responsibilities: [
        'Validação de hipóteses via testes',
        'Comparação de comportamento observado vs esperado',
        'Geração de provas executáveis',
        'Re-compilação de pseudocódigo para validação'
      ],
      outputs: ['Scripts de teste', 'Relatório de validação', 'Evidências']
    },
    
    documentation: {
      name: 'Camada de Documentação',
      responsibilities: [
        'Geração de diagramas (CFG, call graph)',
        'Especificação de protocolos descobertos',
        'Relatório técnico estruturado',
        'Resumo executivo para stakeholders'
      ],
      outputs: ['PDF/Markdown', 'Diagramas UML', 'Especificações']
    }
  },
  
  pipeline: [
    '1. Ingestão → Identificação e hashing',
    '2. Sandbox → Quick run para captura de sinais',
    '3. Estático → Disassembly + CFG recovery',
    '4. Semântico → Neural decompilation + inferência',
    '5. Dinâmico → Verificação com Frida/emulação',
    '6. Simbólico → angr para branches não observados',
    '7. Documentação → Relatório + artefatos'
  ]
};

// ============================================================================
// PARTE V: CONCEITOS FUNDAMENTAIS
// ============================================================================

export const RE_FUNDAMENTAL_CONCEPTS = {
  binaryFormats: {
    name: 'Formatos de Binários',
    description: 'Estruturas de arquivos executáveis',
    topics: [
      {
        name: 'PE (Portable Executable)',
        platform: 'Windows',
        components: ['DOS Header', 'PE Header', 'Sections', 'Import/Export Tables', 'Resources'],
        tools: ['PE-bear', 'CFF Explorer', 'pestudio']
      },
      {
        name: 'ELF (Executable and Linkable Format)',
        platform: 'Linux/Unix',
        components: ['ELF Header', 'Program Headers', 'Section Headers', 'Symbol Tables', 'Relocations'],
        tools: ['readelf', 'objdump', 'elfutils']
      },
      {
        name: 'Mach-O',
        platform: 'macOS/iOS',
        components: ['Header', 'Load Commands', 'Segments', 'Sections'],
        tools: ['otool', 'MachOView', 'jtool2']
      },
      {
        name: 'DEX (Dalvik Executable)',
        platform: 'Android',
        components: ['Header', 'String IDs', 'Type IDs', 'Method IDs', 'Class Definitions'],
        tools: ['jadx', 'apktool', 'dex2jar']
      }
    ]
  },
  
  cpuArchitectures: {
    name: 'Arquiteturas de CPU',
    description: 'Conjuntos de instruções e registradores',
    architectures: [
      {
        name: 'x86 (IA-32)',
        bits: 32,
        endianness: 'little',
        registers: ['EAX', 'EBX', 'ECX', 'EDX', 'ESI', 'EDI', 'EBP', 'ESP', 'EIP'],
        callingConventions: ['cdecl', 'stdcall', 'fastcall']
      },
      {
        name: 'x86-64 (AMD64)',
        bits: 64,
        endianness: 'little',
        registers: ['RAX', 'RBX', 'RCX', 'RDX', 'RSI', 'RDI', 'RBP', 'RSP', 'RIP', 'R8-R15'],
        callingConventions: ['System V AMD64 ABI', 'Microsoft x64']
      },
      {
        name: 'ARM (32-bit)',
        bits: 32,
        endianness: 'bi-endian',
        registers: ['R0-R12', 'SP (R13)', 'LR (R14)', 'PC (R15)'],
        modes: ['ARM', 'Thumb', 'Thumb-2']
      },
      {
        name: 'ARM64 (AArch64)',
        bits: 64,
        endianness: 'bi-endian',
        registers: ['X0-X30', 'SP', 'PC', 'PSTATE'],
        callingConventions: ['AAPCS64']
      },
      {
        name: 'MIPS',
        bits: 32,
        endianness: 'bi-endian',
        registers: ['$zero', '$at', '$v0-$v1', '$a0-$a3', '$t0-$t9', '$s0-$s7', '$gp', '$sp', '$fp', '$ra'],
        common: 'Roteadores, IoT'
      },
      {
        name: 'RISC-V',
        bits: 32,
        endianness: 'little',
        registers: ['x0-x31'],
        common: 'Emergente, open-source ISA'
      }
    ]
  },
  
  analysisTypes: {
    name: 'Tipos de Análise',
    types: [
      {
        name: 'Análise Estática',
        description: 'Examinar código sem executá-lo',
        advantages: ['Cobertura completa', 'Seguro', 'Rápido para triagem'],
        disadvantages: ['Não vê comportamento real', 'Ofuscação dificulta'],
        tools: ['Ghidra', 'IDA', 'Binary Ninja']
      },
      {
        name: 'Análise Dinâmica',
        description: 'Observar código em execução',
        advantages: ['Vê comportamento real', 'Resolve valores em runtime'],
        disadvantages: ['Cobertura limitada', 'Risco de execução'],
        tools: ['Frida', 'x64dbg', 'OllyDbg']
      },
      {
        name: 'Execução Simbólica',
        description: 'Executar com valores simbólicos',
        advantages: ['Explora múltiplos caminhos', 'Gera inputs automaticamente'],
        disadvantages: ['Path explosion', 'Computacionalmente caro'],
        tools: ['angr', 'KLEE', 'Triton']
      },
      {
        name: 'Análise Híbrida',
        description: 'Combinar estática + dinâmica',
        advantages: ['Melhor cobertura', 'Validação cruzada'],
        disadvantages: ['Mais complexo', 'Requer mais recursos'],
        tools: ['Combinação de ferramentas']
      }
    ]
  },
  
  antiAnalysisTechniques: {
    name: 'Técnicas Anti-Análise (para reconhecimento)',
    description: 'Técnicas usadas para dificultar RE - conhecer para identificar',
    techniques: [
      {
        name: 'Packing',
        description: 'Compressão/criptografia do código',
        detection: 'Entropia alta, imports suspeitos',
        tools: ['Detect It Easy', 'PEiD']
      },
      {
        name: 'Obfuscation',
        description: 'Transformação de código para dificultar leitura',
        types: ['Control flow flattening', 'Dead code insertion', 'String encryption'],
        detection: 'Padrões anômalos de CFG'
      },
      {
        name: 'Anti-Debugging',
        description: 'Detecção de debuggers',
        methods: ['IsDebuggerPresent', 'Timing checks', 'Hardware breakpoint detection'],
        bypass: 'Patches, plugins de debugger'
      },
      {
        name: 'VM Detection',
        description: 'Detecção de máquinas virtuais',
        methods: ['CPUID checks', 'Registry keys', 'MAC address'],
        bypass: 'Hardening de VM'
      },
      {
        name: 'Code Virtualization',
        description: 'Tradução para bytecode proprietário',
        examples: ['VMProtect', 'Themida'],
        analysis: 'Análise de VM handler'
      }
    ]
  }
};

// ============================================================================
// PARTE VI: CASOS DE USO ÉTICOS E LEGAIS
// ============================================================================

export const RE_ETHICAL_USE_CASES = {
  legitimate: [
    {
      name: 'Auditoria de Segurança',
      description: 'Análise autorizada para encontrar vulnerabilidades',
      requirements: ['Contrato de autorização', 'Escopo definido', 'NDA'],
      examples: ['Pentest', 'Bug bounty', 'Compliance']
    },
    {
      name: 'Interoperabilidade',
      description: 'Criar software compatível com sistemas existentes',
      legalBasis: 'DMCA §1201(f) - exceção para interoperabilidade',
      examples: ['Wine (Windows→Linux)', 'Samba', 'ReactOS']
    },
    {
      name: 'Análise de Malware',
      description: 'Entender ameaças para criar defesas',
      requirements: ['Ambiente isolado', 'Propósito defensivo'],
      examples: ['Antivírus', 'Threat intelligence', 'Incident response']
    },
    {
      name: 'Preservação Digital',
      description: 'Manter software histórico funcionando',
      examples: ['Emuladores de consoles antigos', 'Arquivamento de jogos'],
      organizations: ['Internet Archive', 'Video Game History Foundation']
    },
    {
      name: 'Pesquisa Acadêmica',
      description: 'Avanço do conhecimento científico',
      requirements: ['IRB approval quando aplicável', 'Publicação responsável'],
      examples: ['Papers de segurança', 'Análise de protocolos']
    },
    {
      name: 'Forense Digital',
      description: 'Investigação de incidentes e crimes',
      requirements: ['Autorização legal', 'Cadeia de custódia'],
      examples: ['Investigação de breach', 'Análise de evidências']
    },
    {
      name: 'Recuperação de Software',
      description: 'Recuperar código quando fonte foi perdido',
      requirements: ['Propriedade do software', 'Licença permite'],
      examples: ['Legacy systems', 'Código-fonte perdido']
    }
  ],
  
  legalFramework: {
    usa: {
      law: 'DMCA (Digital Millennium Copyright Act)',
      year: 1998,
      keyPoints: [
        'Proíbe contornar medidas de proteção tecnológica (TPM)',
        'Exceção §1201(f): interoperabilidade',
        'Exceção §1201(j): pesquisa de segurança',
        'Exceção §1201(g): pesquisa de criptografia'
      ]
    },
    eu: {
      law: 'EU Software Directive (2009/24/EC)',
      keyPoints: [
        'Permite RE para interoperabilidade',
        'Não requer autorização do titular',
        'Informações não podem ser usadas para criar cópia'
      ]
    },
    brazil: {
      law: 'Lei de Software (9.609/98) + LGPD',
      keyPoints: [
        'Proteção de software como direito autoral',
        'Exceções para backup e interoperabilidade',
        'LGPD regula dados pessoais encontrados'
      ]
    }
  },
  
  guardrails: [
    'SEMPRE documentar propósito legítimo antes de iniciar',
    'SEMPRE obter autorização quando necessário',
    'NUNCA compartilhar exploits ou vulnerabilidades sem coordenação',
    'NUNCA analisar sistemas sem permissão',
    'PAUSAR e consultar jurídico se houver dúvida',
    'RESPEITAR NDAs e contratos',
    'REPORTAR vulnerabilidades de forma responsável'
  ]
};


// ============================================================================
// PARTE VII: PAPERS E REFERÊNCIAS CIENTÍFICAS
// ============================================================================

export interface REPaper {
  title: string;
  authors: string[];
  year: number;
  venue: string;
  category: string;
  abstract: string;
  importance: 'foundational' | 'breakthrough' | 'influential';
  url?: string;
}

export const RE_SCIENTIFIC_PAPERS: REPaper[] = [
  // EXECUÇÃO SIMBÓLICA
  {
    title: 'Symbolic Execution for Software Testing: Three Decades Later',
    authors: ['Cristian Cadar', 'Koushik Sen'],
    year: 2013,
    venue: 'Communications of the ACM',
    category: 'Symbolic Execution',
    abstract: 'Survey abrangente de 30 anos de execução simbólica',
    importance: 'foundational'
  },
  {
    title: 'KLEE: Unassisted and Automatic Generation of High-Coverage Tests',
    authors: ['Cristian Cadar', 'Daniel Dunbar', 'Dawson Engler'],
    year: 2008,
    venue: 'OSDI',
    category: 'Symbolic Execution',
    abstract: 'Framework de execução simbólica para LLVM',
    importance: 'foundational'
  },
  {
    title: 'SOK: (State of) The Art of War: Offensive Techniques in Binary Analysis',
    authors: ['Yan Shoshitaishvili et al.'],
    year: 2016,
    venue: 'IEEE S&P',
    category: 'Binary Analysis',
    abstract: 'Survey sistemático de técnicas de análise binária',
    importance: 'foundational'
  },
  
  // DECOMPILAÇÃO
  {
    title: 'Native x86 Decompilation Using Semantics-Preserving Structural Analysis',
    authors: ['Edward Schwartz', 'JongHyup Lee', 'Maverick Woo', 'David Brumley'],
    year: 2013,
    venue: 'USENIX Security',
    category: 'Decompilation',
    abstract: 'Técnicas de decompilação preservando semântica',
    importance: 'influential'
  },
  {
    title: 'No More Gotos: Decompilation Using Pattern-Independent Control-Flow Structuring',
    authors: ['Khaled Yakdan et al.'],
    year: 2015,
    venue: 'NDSS',
    category: 'Decompilation',
    abstract: 'Estruturação de controle de fluxo em decompilação',
    importance: 'influential'
  },
  
  // NEURAL DECOMPILATION (IA)
  {
    title: 'Neural Decompilation',
    authors: ['Omer Katz', 'Yuval Olshaker', 'Yoav Goldberg', 'Eran Yahav'],
    year: 2019,
    venue: 'arXiv',
    category: 'AI/ML',
    abstract: 'Uso de redes neurais para decompilação',
    importance: 'breakthrough'
  },
  {
    title: 'REMEND: Recovering Semantics of Decompiled Code with Neural Machine Translation',
    authors: ['Ruoyu Wu et al.'],
    year: 2024,
    venue: 'ACM CCS',
    category: 'AI/ML',
    abstract: 'Tradução neural para recuperar semântica de código decompilado',
    importance: 'breakthrough'
  },
  {
    title: 'Beyond the C: Retargetable Decompilation using Neural Machine Translation',
    authors: ['Ati Priya Bajaj et al.'],
    year: 2024,
    venue: 'arXiv',
    category: 'AI/ML',
    abstract: 'Decompilação neural para múltiplas linguagens',
    importance: 'influential'
  },
  
  // ANÁLISE DE MALWARE
  {
    title: 'A Survey on Automated Dynamic Malware Analysis Techniques and Tools',
    authors: ['Yanfang Ye et al.'],
    year: 2017,
    venue: 'ACM Computing Surveys',
    category: 'Malware Analysis',
    abstract: 'Survey de técnicas de análise dinâmica de malware',
    importance: 'foundational'
  },
  {
    title: 'Semantics-Aware Machine Learning for Function Recognition in Binary Code',
    authors: ['Eui Chul Richard Shin et al.'],
    year: 2015,
    venue: 'IEEE S&P',
    category: 'AI/ML',
    abstract: 'ML para reconhecimento de funções em binários',
    importance: 'influential'
  },
  
  // FIRMWARE
  {
    title: 'Firmalice - Automatic Detection of Authentication Bypass Vulnerabilities in Binary Firmware',
    authors: ['Yan Shoshitaishvili et al.'],
    year: 2015,
    venue: 'NDSS',
    category: 'Firmware Analysis',
    abstract: 'Análise automática de vulnerabilidades em firmware',
    importance: 'influential'
  },
  {
    title: 'FirmUp: Precise Static Detection of Common Vulnerabilities in Firmware',
    authors: ['Qingkai Shi et al.'],
    year: 2022,
    venue: 'ASPLOS',
    category: 'Firmware Analysis',
    abstract: 'Detecção estática de vulnerabilidades em firmware',
    importance: 'influential'
  }
];

// ============================================================================
// PARTE VIII: LIVROS FUNDAMENTAIS
// ============================================================================

export interface REBook {
  title: string;
  author: string;
  year: number;
  publisher: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  description: string;
}

export const RE_ESSENTIAL_BOOKS: REBook[] = [
  // FUNDAMENTOS
  {
    title: 'Reverse Engineering for Beginners',
    author: 'Dennis Yurichev',
    year: 2013,
    publisher: 'Self-published (free)',
    category: 'Fundamentals',
    level: 'beginner',
    description: 'Livro gratuito e abrangente sobre RE, cobre x86/x64/ARM'
  },
  {
    title: 'Practical Reverse Engineering',
    author: 'Bruce Dang, Alexandre Gazet, Elias Bachaalany',
    year: 2014,
    publisher: 'Wiley',
    category: 'Fundamentals',
    level: 'intermediate',
    description: 'x86, x64, ARM, Windows kernel, obfuscation'
  },
  {
    title: 'The IDA Pro Book',
    author: 'Chris Eagle',
    year: 2011,
    publisher: 'No Starch Press',
    category: 'Tools',
    level: 'intermediate',
    description: 'Guia definitivo do IDA Pro'
  },
  {
    title: 'The Ghidra Book',
    author: 'Chris Eagle, Kara Nance',
    year: 2020,
    publisher: 'No Starch Press',
    category: 'Tools',
    level: 'intermediate',
    description: 'Guia completo do Ghidra'
  },
  
  // MALWARE
  {
    title: 'Practical Malware Analysis',
    author: 'Michael Sikorski, Andrew Honig',
    year: 2012,
    publisher: 'No Starch Press',
    category: 'Malware',
    level: 'intermediate',
    description: 'Análise de malware hands-on'
  },
  {
    title: 'Malware Analyst\'s Cookbook',
    author: 'Michael Ligh et al.',
    year: 2010,
    publisher: 'Wiley',
    category: 'Malware',
    level: 'advanced',
    description: 'Receitas e ferramentas para análise de malware'
  },
  
  // WINDOWS
  {
    title: 'Windows Internals (Part 1 & 2)',
    author: 'Pavel Yosifovich, Mark Russinovich et al.',
    year: 2017,
    publisher: 'Microsoft Press',
    category: 'Windows',
    level: 'advanced',
    description: 'Internals do Windows - essencial para RE de Windows'
  },
  
  // EXPLOITS (para entender defesas)
  {
    title: 'Hacking: The Art of Exploitation',
    author: 'Jon Erickson',
    year: 2008,
    publisher: 'No Starch Press',
    category: 'Security',
    level: 'intermediate',
    description: 'Fundamentos de exploração - para entender defesas'
  },
  {
    title: 'The Shellcoder\'s Handbook',
    author: 'Chris Anley et al.',
    year: 2007,
    publisher: 'Wiley',
    category: 'Security',
    level: 'advanced',
    description: 'Técnicas de exploração - conhecimento defensivo'
  },
  
  // COMPILADORES (para entender o que RE desfaz)
  {
    title: 'Compilers: Principles, Techniques, and Tools',
    author: 'Aho, Lam, Sethi, Ullman',
    year: 2006,
    publisher: 'Pearson',
    category: 'Compilers',
    level: 'advanced',
    description: 'Dragon Book - entender compilação ajuda em decompilação'
  },
  
  // ARQUITETURA
  {
    title: 'Computer Systems: A Programmer\'s Perspective',
    author: 'Randal Bryant, David O\'Hallaron',
    year: 2015,
    publisher: 'Pearson',
    category: 'Architecture',
    level: 'intermediate',
    description: 'Fundamentos de sistemas - essencial para RE'
  }
];

// ============================================================================
// PARTE IX: MÉTRICAS E AVALIAÇÃO
// ============================================================================

export const RE_METRICS = {
  staticAnalysis: [
    {
      name: 'Function Recovery Rate',
      description: 'Porcentagem de funções corretamente identificadas',
      formula: 'funções_corretas / funções_totais * 100',
      benchmark: '> 90% para binários não-ofuscados'
    },
    {
      name: 'CFG Accuracy',
      description: 'Precisão do grafo de controle de fluxo',
      formula: 'edges_corretas / edges_totais * 100',
      benchmark: '> 95% para código normal'
    },
    {
      name: 'Type Recovery Precision',
      description: 'Precisão na inferência de tipos',
      formula: 'tipos_corretos / tipos_inferidos * 100',
      benchmark: '> 80% é considerado bom'
    }
  ],
  
  decompilation: [
    {
      name: 'Semantic Equivalence',
      description: 'Código decompilado produz mesma saída',
      method: 'Testes de entrada/saída comparativos',
      benchmark: '100% para código crítico'
    },
    {
      name: 'Readability Score',
      description: 'Qualidade do pseudocódigo gerado',
      method: 'Métricas de complexidade ciclomática, nomes significativos',
      benchmark: 'Subjetivo, avaliação humana'
    },
    {
      name: 'Recompilability',
      description: 'Código decompilado pode ser recompilado',
      method: 'Tentar compilar pseudocódigo',
      benchmark: 'Ideal: 100% recompilável'
    }
  ],
  
  dynamicAnalysis: [
    {
      name: 'Code Coverage',
      description: 'Porcentagem de código executado',
      formula: 'instruções_executadas / instruções_totais * 100',
      benchmark: '> 70% é bom para análise geral'
    },
    {
      name: 'API Coverage',
      description: 'APIs do sistema chamadas e documentadas',
      formula: 'apis_documentadas / apis_chamadas * 100',
      benchmark: '100% para análise completa'
    }
  ],
  
  symbolicExecution: [
    {
      name: 'Path Coverage',
      description: 'Caminhos de execução explorados',
      formula: 'caminhos_explorados / caminhos_possíveis * 100',
      benchmark: 'Depende do programa, path explosion é comum'
    },
    {
      name: 'Constraint Solving Time',
      description: 'Tempo para resolver constraints',
      benchmark: '< 1s por constraint para ser prático'
    }
  ]
};

// ============================================================================
// PARTE X: REGRAS DE COMPORTAMENTO DO AGENTE
// ============================================================================

export const RE_AGENT_BEHAVIOR = {
  coreRules: [
    'SEMPRE documentar propósito legítimo antes de análise',
    'SEMPRE usar ambiente isolado (sandbox/VM) para execução',
    'SEMPRE preservar integridade do artefato original (hash)',
    'SEMPRE gerar evidências rastreáveis',
    'NUNCA executar código suspeito fora de sandbox',
    'NUNCA compartilhar vulnerabilidades sem coordenação',
    'NUNCA criar ou facilitar malware',
    'PAUSAR se detectar conteúdo ilegal e reportar'
  ],
  
  analysisProtocol: [
    '1. Verificar autorização e propósito legítimo',
    '2. Calcular hash SHA256 do artefato',
    '3. Identificar tipo, arquitetura e metadados',
    '4. Executar triagem em sandbox isolado',
    '5. Análise estática (Ghidra/IDA)',
    '6. Análise dinâmica se necessário (Frida)',
    '7. Execução simbólica para caminhos não cobertos',
    '8. Documentar descobertas com evidências',
    '9. Gerar relatório estruturado',
    '10. Aplicar guardrails antes de compartilhar'
  ],
  
  outputFormats: {
    manifest: 'JSON com metadados e plano de análise',
    cfgDiagram: 'Graphviz DOT ou imagem PNG',
    pseudocode: 'C-like com comentários explicativos',
    report: 'Markdown/PDF com sumário executivo',
    evidence: 'Scripts de teste reproduzíveis'
  },
  
  confidenceScoring: {
    high: '> 90% - Alta confiança, múltiplas evidências',
    medium: '70-90% - Confiança moderada, algumas evidências',
    low: '< 70% - Baixa confiança, hipótese a validar',
    unknown: 'Não foi possível determinar'
  }
};

// ============================================================================
// PARTE XI: EXPORTAÇÃO DO MANIFESTO
// ============================================================================

export const REVERSE_ENGINEERING_MANIFEST = {
  identity: AGENT_IDENTITY,
  timeline: RE_TIMELINE,
  tools: RE_TOOLS,
  cognitiveArchitecture: RE_COGNITIVE_ARCHITECTURE,
  fundamentalConcepts: RE_FUNDAMENTAL_CONCEPTS,
  ethicalUseCases: RE_ETHICAL_USE_CASES,
  scientificPapers: RE_SCIENTIFIC_PAPERS,
  essentialBooks: RE_ESSENTIAL_BOOKS,
  metrics: RE_METRICS,
  agentBehavior: RE_AGENT_BEHAVIOR,
  
  // Funções utilitárias
  getToolsByCategory: (category: string) => {
    return RE_TOOLS.filter(t => t.category === category);
  },
  
  getTimelineByCategory: (category: string) => {
    return RE_TIMELINE.filter(e => e.category === category);
  },
  
  getBooksByLevel: (level: string) => {
    return RE_ESSENTIAL_BOOKS.filter(b => b.level === level);
  }
};

// ============================================================================
// PARTE XII: SYSTEM PROMPT PARA O AGENTE
// ============================================================================

export const RE_SYSTEM_PROMPT = `
# IDENTIDADE: ESPECIALISTA SUPREMO EM ENGENHARIA REVERSA

Você é um **Especialista em Engenharia Reversa** focado em:
- Compreensão e documentação de sistemas
- Auditoria de segurança autorizada
- Interoperabilidade e compatibilidade
- Preservação histórica de software
- Pesquisa acadêmica e educacional

## PRINCÍPIOS ÉTICOS INVIOLÁVEIS

1. RE = COMPREENSÃO, não exploração
2. NUNCA criar ou facilitar malware
3. NUNCA contornar proteções sem autorização
4. SEMPRE documentar propósito legítimo
5. SEMPRE usar ambientes isolados
6. SEMPRE reportar vulnerabilidades responsavelmente

## CAPACIDADES

- Análise estática (Ghidra, IDA, Binary Ninja)
- Análise dinâmica (Frida, debuggers)
- Execução simbólica (angr, KLEE)
- Decompilação e reconstrução de código
- Documentação técnica estruturada
- Identificação de padrões e vulnerabilidades

## PIPELINE DE ANÁLISE

1. Verificar autorização
2. Hash e identificação do artefato
3. Triagem em sandbox
4. Análise estática
5. Análise dinâmica (se necessário)
6. Execução simbólica (se necessário)
7. Documentação com evidências
8. Relatório estruturado

## FORMATO DE RESPOSTAS

- Para FERRAMENTAS: nome + uso + quando aplicar
- Para CONCEITOS: definição + contexto + exemplos
- Para ANÁLISE: metodologia + descobertas + evidências
- Para CÓDIGO: pseudocódigo comentado + explicação

## GUARDRAILS

- Se detectar conteúdo malicioso: PAUSAR e alertar
- Se solicitado criar exploit: RECUSAR educadamente
- Se dúvida legal: RECOMENDAR consulta jurídica
- Se sem autorização: NÃO PROSSEGUIR
`;

export default REVERSE_ENGINEERING_MANIFEST;
