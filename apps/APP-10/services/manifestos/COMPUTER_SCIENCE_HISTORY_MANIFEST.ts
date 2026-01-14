/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║   🧬 MANIFESTO SUPREMO DA HISTÓRIA DA CIÊNCIA DA COMPUTAÇÃO 🧬              ║
 * ║                                                                              ║
 * ║   "Do Ábaco ao Quantum - A Jornada Completa do Pensamento Computacional"    ║
 * ║                                                                              ║
 * ║   Versão: 1.0.0 | Última Atualização: Dezembro 2025                         ║
 * ║   Autor: Agente Supremo de Conhecimento Computacional                       ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * MISSÃO: Fornecer conhecimento enciclopédico completo sobre toda a história
 * da computação, desde as raízes matemáticas até a era da IA generativa.
 * 
 * Este manifesto transforma o agente em um ESPECIALISTA SUPREMO capaz de:
 * - Ensinar qualquer conceito da história da computação
 * - Relacionar eventos históricos com tecnologias modernas
 * - Citar papers, livros e personagens com precisão
 * - Explicar a evolução do pensamento computacional
 * - Prever tendências baseado em padrões históricos
 */

// ============================================================================
// PARTE I: IDENTIDADE E MISSÃO DO AGENTE
// ============================================================================

export const AGENT_IDENTITY = {
  name: 'Historiador Supremo da Computação',
  version: '1.0.0',
  
  mission: `
    Dominar TODA a história da tecnologia e da ciência da computação,
    do século XIX até 2025, integrando dados históricos, técnicos e teóricos
    em uma linha lógica coerente. Ser capaz de ensinar, explicar, comparar,
    contextualizar, criticar e analisar TODOS os períodos da computação.
  `,
  
  specializations: [
    'História da Computação',
    'História da Tecnologia', 
    'Computação Teórica',
    'Hardware e Arquitetura',
    'Software e Linguagens',
    'Redes e Internet',
    'Inteligência Artificial',
    'Ciência de Dados',
    'Criptografia',
    'Sistemas Distribuídos',
    'Machine Learning e Deep Learning',
    'Computação Quântica'
  ],
  
  capabilities: [
    'Relacionar acontecimentos históricos com impactos tecnológicos contemporâneos',
    'Prever padrões e tendências baseado em análise histórica',
    'Curar conhecimento sugerindo leituras, livros, papers e obras essenciais',
    'Responder com profundidade, precisão e clareza',
    'Criar conexões entre eras tecnológicas',
    'Explicar causa e efeito na evolução tecnológica'
  ]
};

// ============================================================================
// PARTE II: LINHA DO TEMPO COMPLETA DA COMPUTAÇÃO
// ============================================================================

export interface HistoricalPeriod {
  era: string;
  startYear: number;
  endYear: number;
  title: string;
  description: string;
  keyFigures: PersonageEntry[];
  keyEvents: HistoricalEvent[];
  keyInventions: Invention[];
  essentialBooks: BookReference[];
  essentialPapers: PaperReference[];
  technologies: string[];
  impact: string;
}

export interface PersonageEntry {
  name: string;
  birthYear: number;
  deathYear?: number;
  nationality: string;
  role: string;
  contributions: string[];
  famousQuote?: string;
  relatedTo: string[];
}

export interface HistoricalEvent {
  year: number;
  event: string;
  significance: string;
  participants: string[];
  location?: string;
  consequences: string[];
}

export interface Invention {
  name: string;
  year: number;
  inventor: string;
  description: string;
  impact: string;
  predecessors?: string[];
  successors?: string[];
}

export interface BookReference {
  title: string;
  author: string;
  year: number;
  isbn?: string;
  category: string;
  importance: 'fundamental' | 'essential' | 'recommended' | 'advanced';
  summary: string;
}

export interface PaperReference {
  title: string;
  authors: string[];
  year: number;
  publication: string;
  doi?: string;
  citations?: number;
  category: string;
  importance: 'foundational' | 'breakthrough' | 'influential' | 'classic';
  abstract: string;
}

// ============================================================================
// ERA 1: RAÍZES MATEMÁTICAS E PROTOCOMPUTAÇÃO (1800-1900)
// ============================================================================

export const ERA_1_ROOTS: HistoricalPeriod = {
  era: 'ERA_1',
  startYear: 1800,
  endYear: 1900,
  title: 'Raízes Matemáticas e Protocomputação',
  description: `
    O século XIX estabeleceu as fundações matemáticas e mecânicas que tornariam
    a computação possível. A álgebra booleana formalizou a lógica, as máquinas
    de Babbage demonstraram que cálculos podiam ser mecanizados, e Ada Lovelace
    vislumbrou o conceito de programação antes mesmo de existir um computador.
  `,
  
  keyFigures: [
    {
      name: 'George Boole',
      birthYear: 1815,
      deathYear: 1864,
      nationality: 'Britânico',
      role: 'Matemático e Lógico',
      contributions: [
        'Criou a Álgebra Booleana (1854)',
        'Formalizou operações lógicas (AND, OR, NOT)',
        'Estabeleceu base para circuitos digitais',
        'Unificou lógica e matemática'
      ],
      famousQuote: 'No matter how correct a mathematical theorem may appear to be, one ought never to be satisfied that there was not something imperfect about it until it also gives the impression of being beautiful.',
      relatedTo: ['Augustus De Morgan', 'Claude Shannon']
    },
    {
      name: 'Charles Babbage',
      birthYear: 1791,
      deathYear: 1871,
      nationality: 'Britânico',
      role: 'Matemático e Inventor',
      contributions: [
        'Projetou a Difference Engine (1822)',
        'Concebeu a Analytical Engine (1837)',
        'Introduziu conceito de programa armazenado',
        'Pai conceitual do computador moderno'
      ],
      famousQuote: 'On two occasions I have been asked, "Pray, Mr. Babbage, if you put into the machine wrong figures, will the right answers come out?" I am not able rightly to apprehend the kind of confusion of ideas that could provoke such a question.',
      relatedTo: ['Ada Lovelace', 'Luigi Menabrea']
    },
    {
      name: 'Ada Lovelace',
      birthYear: 1815,
      deathYear: 1852,
      nationality: 'Britânica',
      role: 'Matemática e Primeira Programadora',
      contributions: [
        'Escreveu o primeiro algoritmo (1843)',
        'Traduziu e expandiu trabalho de Menabrea',
        'Vislumbrou computação além de números',
        'Previu que máquinas poderiam compor música'
      ],
      famousQuote: 'The Analytical Engine weaves algebraic patterns, just as the Jacquard loom weaves flowers and leaves.',
      relatedTo: ['Charles Babbage', 'Luigi Menabrea']
    },
    {
      name: 'Augustus De Morgan',
      birthYear: 1806,
      deathYear: 1871,
      nationality: 'Britânico',
      role: 'Matemático e Lógico',
      contributions: [
        'Leis de De Morgan',
        'Formalização da lógica proposicional',
        'Influenciou George Boole'
      ],
      relatedTo: ['George Boole']
    },
    {
      name: 'Herman Hollerith',
      birthYear: 1860,
      deathYear: 1929,
      nationality: 'Americano',
      role: 'Inventor e Empresário',
      contributions: [
        'Inventou máquina de tabulação (1890)',
        'Criou sistema de cartões perfurados',
        'Fundou empresa que se tornou IBM',
        'Mecanizou o censo americano'
      ],
      relatedTo: ['Thomas Watson Sr.']
    }
  ],
  
  keyEvents: [
    {
      year: 1822,
      event: 'Babbage propõe a Difference Engine',
      significance: 'Primeira tentativa de mecanizar cálculos matemáticos',
      participants: ['Charles Babbage'],
      location: 'Londres, Inglaterra',
      consequences: ['Inspirou desenvolvimento de calculadoras mecânicas']
    },
    {
      year: 1837,
      event: 'Concepção da Analytical Engine',
      significance: 'Primeiro design de computador programável de propósito geral',
      participants: ['Charles Babbage'],
      location: 'Londres, Inglaterra',
      consequences: ['Conceito de programa armazenado', 'Inspirou Ada Lovelace']
    },
    {
      year: 1843,
      event: 'Ada Lovelace publica notas sobre a Analytical Engine',
      significance: 'Primeiro algoritmo publicado da história',
      participants: ['Ada Lovelace', 'Luigi Menabrea'],
      consequences: ['Nascimento do conceito de programação']
    },
    {
      year: 1854,
      event: 'Boole publica "The Laws of Thought"',
      significance: 'Fundação da álgebra booleana',
      participants: ['George Boole'],
      location: 'Cork, Irlanda',
      consequences: ['Base para toda a lógica digital moderna']
    },
    {
      year: 1890,
      event: 'Hollerith usa cartões perfurados no censo americano',
      significance: 'Primeira aplicação em larga escala de processamento de dados',
      participants: ['Herman Hollerith'],
      location: 'Washington, EUA',
      consequences: ['Fundação da Tabulating Machine Company (futura IBM)']
    }
  ],
  
  keyInventions: [
    {
      name: 'Difference Engine',
      year: 1822,
      inventor: 'Charles Babbage',
      description: 'Calculadora mecânica para computar tabelas polinomiais',
      impact: 'Demonstrou viabilidade de cálculo mecânico automatizado',
      successors: ['Analytical Engine']
    },
    {
      name: 'Analytical Engine',
      year: 1837,
      inventor: 'Charles Babbage',
      description: 'Primeiro design de computador programável de propósito geral',
      impact: 'Conceito de programa armazenado, unidade de controle, memória',
      predecessors: ['Difference Engine'],
      successors: ['ENIAC', 'Computadores modernos']
    },
    {
      name: 'Máquina de Tabulação',
      year: 1890,
      inventor: 'Herman Hollerith',
      description: 'Sistema de cartões perfurados para processamento de dados',
      impact: 'Revolucionou processamento de dados em larga escala',
      successors: ['Mainframes IBM']
    }
  ],
  
  essentialBooks: [
    {
      title: 'The Laws of Thought',
      author: 'George Boole',
      year: 1854,
      category: 'Lógica Matemática',
      importance: 'fundamental',
      summary: 'Obra fundacional que estabelece a álgebra booleana, base de toda computação digital'
    },
    {
      title: 'Sketch of the Analytical Engine',
      author: 'Luigi Menabrea (traduzido e expandido por Ada Lovelace)',
      year: 1843,
      category: 'História da Computação',
      importance: 'fundamental',
      summary: 'Contém o primeiro algoritmo publicado e visão profética sobre computação'
    }
  ],
  
  essentialPapers: [],
  
  technologies: [
    'Álgebra Booleana',
    'Máquinas de Calcular Mecânicas',
    'Cartões Perfurados',
    'Teares de Jacquard (inspiração para programação)'
  ],
  
  impact: `
    Esta era estabeleceu os fundamentos conceituais da computação:
    - Lógica pode ser matematizada (Boole)
    - Cálculos podem ser mecanizados (Babbage)
    - Máquinas podem ser programadas (Lovelace)
    - Dados podem ser processados em escala (Hollerith)
  `
};


// ============================================================================
// ERA 2: FUNDAMENTOS FORMAIS E TEORIA DA COMPUTAÇÃO (1900-1945)
// ============================================================================

export const ERA_2_FOUNDATIONS: HistoricalPeriod = {
  era: 'ERA_2',
  startYear: 1900,
  endYear: 1945,
  title: 'Fundamentos Formais e Teoria da Computação',
  description: `
    O início do século XX viu a formalização matemática da computação.
    Hilbert propôs o Entscheidungsproblem, Gödel provou os limites da matemática,
    e Turing definiu o que significa "computar". Esta era estabeleceu os
    fundamentos teóricos que ainda governam a ciência da computação.
  `,
  
  keyFigures: [
    {
      name: 'David Hilbert',
      birthYear: 1862,
      deathYear: 1943,
      nationality: 'Alemão',
      role: 'Matemático',
      contributions: [
        'Propôs os 23 Problemas de Hilbert (1900)',
        'Formulou o Entscheidungsproblem',
        'Programa de formalização da matemática',
        'Influenciou Gödel, Turing e Church'
      ],
      famousQuote: 'Wir müssen wissen. Wir werden wissen. (Devemos saber. Saberemos.)',
      relatedTo: ['Kurt Gödel', 'Alan Turing', 'Alonzo Church']
    },
    {
      name: 'Kurt Gödel',
      birthYear: 1906,
      deathYear: 1978,
      nationality: 'Austríaco-Americano',
      role: 'Lógico e Matemático',
      contributions: [
        'Teoremas da Incompletude (1931)',
        'Provou limites da formalização matemática',
        'Influenciou teoria da computação',
        'Trabalhou com Einstein em Princeton'
      ],
      famousQuote: 'Either mathematics is too big for the human mind, or the human mind is more than a machine.',
      relatedTo: ['David Hilbert', 'Alan Turing', 'John von Neumann']
    },
    {
      name: 'Alan Turing',
      birthYear: 1912,
      deathYear: 1954,
      nationality: 'Britânico',
      role: 'Matemático, Lógico, Criptógrafo, Pai da Computação',
      contributions: [
        'Máquina de Turing (1936)',
        'Resolveu o Entscheidungsproblem',
        'Definiu computabilidade',
        'Quebrou Enigma na WWII',
        'Propôs Teste de Turing para IA',
        'Trabalhou no ACE'
      ],
      famousQuote: 'We can only see a short distance ahead, but we can see plenty there that needs to be done.',
      relatedTo: ['Alonzo Church', 'John von Neumann', 'Claude Shannon']
    },
    {
      name: 'Alonzo Church',
      birthYear: 1903,
      deathYear: 1995,
      nationality: 'Americano',
      role: 'Matemático e Lógico',
      contributions: [
        'Lambda Cálculo (1936)',
        'Tese de Church-Turing',
        'Resolveu Entscheidungsproblem independentemente',
        'Orientou Alan Turing em Princeton'
      ],
      relatedTo: ['Alan Turing', 'Stephen Kleene']
    },
    {
      name: 'Claude Shannon',
      birthYear: 1916,
      deathYear: 2001,
      nationality: 'Americano',
      role: 'Matemático e Engenheiro Elétrico',
      contributions: [
        'Teoria da Informação (1948)',
        'Aplicou álgebra booleana a circuitos (1937)',
        'Definiu o bit como unidade de informação',
        'Fundou teoria da comunicação digital'
      ],
      famousQuote: 'Information is the resolution of uncertainty.',
      relatedTo: ['George Boole', 'Alan Turing', 'Norbert Wiener']
    },
    {
      name: 'John von Neumann',
      birthYear: 1903,
      deathYear: 1957,
      nationality: 'Húngaro-Americano',
      role: 'Matemático, Físico, Cientista da Computação',
      contributions: [
        'Arquitetura von Neumann (1945)',
        'Conceito de programa armazenado',
        'Teoria dos Jogos',
        'Trabalhou no ENIAC e EDVAC',
        'Autômatos celulares'
      ],
      famousQuote: 'If people do not believe that mathematics is simple, it is only because they do not realize how complicated life is.',
      relatedTo: ['Alan Turing', 'Kurt Gödel', 'J. Presper Eckert']
    }
  ],
  
  keyEvents: [
    {
      year: 1900,
      event: 'Hilbert apresenta os 23 Problemas',
      significance: 'Definiu agenda da matemática do século XX',
      participants: ['David Hilbert'],
      location: 'Paris, França',
      consequences: ['Motivou pesquisa em fundamentos', 'Levou ao Entscheidungsproblem']
    },
    {
      year: 1931,
      event: 'Gödel publica Teoremas da Incompletude',
      significance: 'Provou limites fundamentais da matemática formal',
      participants: ['Kurt Gödel'],
      location: 'Viena, Áustria',
      consequences: ['Fim do programa de Hilbert', 'Influenciou teoria da computação']
    },
    {
      year: 1936,
      event: 'Turing publica "On Computable Numbers"',
      significance: 'Definiu computabilidade e a Máquina de Turing',
      participants: ['Alan Turing'],
      location: 'Cambridge, Inglaterra',
      consequences: ['Fundação da ciência da computação teórica', 'Resolveu Entscheidungsproblem']
    },
    {
      year: 1937,
      event: 'Shannon conecta álgebra booleana a circuitos',
      significance: 'Mostrou como implementar lógica em hardware',
      participants: ['Claude Shannon'],
      location: 'MIT, EUA',
      consequences: ['Base para design de circuitos digitais']
    },
    {
      year: 1943,
      event: 'Colossus entra em operação',
      significance: 'Primeiro computador eletrônico programável',
      participants: ['Tommy Flowers', 'Alan Turing'],
      location: 'Bletchley Park, Inglaterra',
      consequences: ['Quebra de códigos nazistas', 'Acelerou fim da WWII']
    },
    {
      year: 1945,
      event: 'von Neumann escreve "First Draft of a Report on the EDVAC"',
      significance: 'Definiu arquitetura de programa armazenado',
      participants: ['John von Neumann'],
      location: 'EUA',
      consequences: ['Arquitetura padrão de computadores até hoje']
    }
  ],
  
  keyInventions: [
    {
      name: 'Máquina de Turing',
      year: 1936,
      inventor: 'Alan Turing',
      description: 'Modelo abstrato de computação universal',
      impact: 'Definiu matematicamente o que pode ser computado',
      successors: ['Todos os computadores modernos']
    },
    {
      name: 'Lambda Cálculo',
      year: 1936,
      inventor: 'Alonzo Church',
      description: 'Sistema formal para expressar computação via funções',
      impact: 'Base para linguagens funcionais (Lisp, Haskell, etc.)',
      successors: ['LISP', 'Haskell', 'ML']
    },
    {
      name: 'Colossus',
      year: 1943,
      inventor: 'Tommy Flowers',
      description: 'Primeiro computador eletrônico programável',
      impact: 'Quebrou códigos Lorenz na WWII',
      successors: ['ENIAC', 'Computadores eletrônicos']
    },
    {
      name: 'ENIAC',
      year: 1945,
      inventor: 'J. Presper Eckert e John Mauchly',
      description: 'Primeiro computador eletrônico de propósito geral',
      impact: 'Demonstrou viabilidade de computação eletrônica em larga escala',
      predecessors: ['Colossus'],
      successors: ['EDVAC', 'UNIVAC']
    }
  ],
  
  essentialBooks: [
    {
      title: 'Gödel, Escher, Bach: An Eternal Golden Braid',
      author: 'Douglas Hofstadter',
      year: 1979,
      category: 'Lógica e Computação',
      importance: 'essential',
      summary: 'Explora conexões entre lógica, arte e música através de Gödel, Escher e Bach'
    },
    {
      title: 'Alan Turing: The Enigma',
      author: 'Andrew Hodges',
      year: 1983,
      category: 'Biografia',
      importance: 'essential',
      summary: 'Biografia definitiva de Turing, cobrindo sua vida e contribuições'
    },
    {
      title: "Turing's Cathedral: The Origins of the Digital Universe",
      author: 'George Dyson',
      year: 2012,
      category: 'História da Computação',
      importance: 'essential',
      summary: 'História do desenvolvimento dos primeiros computadores em Princeton'
    },
    {
      title: 'The Computer and the Brain',
      author: 'John von Neumann',
      year: 1958,
      category: 'Teoria da Computação',
      importance: 'fundamental',
      summary: 'Comparação entre computadores e o cérebro humano pelo próprio von Neumann'
    }
  ],
  
  essentialPapers: [
    {
      title: 'On Computable Numbers, with an Application to the Entscheidungsproblem',
      authors: ['Alan Turing'],
      year: 1936,
      publication: 'Proceedings of the London Mathematical Society',
      category: 'Teoria da Computação',
      importance: 'foundational',
      abstract: 'Introduz a Máquina de Turing e prova a indecidibilidade do Entscheidungsproblem'
    },
    {
      title: 'A Mathematical Theory of Communication',
      authors: ['Claude Shannon'],
      year: 1948,
      publication: 'Bell System Technical Journal',
      category: 'Teoria da Informação',
      importance: 'foundational',
      abstract: 'Funda a teoria da informação, define entropia e o bit'
    },
    {
      title: 'First Draft of a Report on the EDVAC',
      authors: ['John von Neumann'],
      year: 1945,
      publication: 'Relatório Técnico',
      category: 'Arquitetura de Computadores',
      importance: 'foundational',
      abstract: 'Define a arquitetura de programa armazenado usada até hoje'
    }
  ],
  
  technologies: [
    'Máquina de Turing',
    'Lambda Cálculo',
    'Válvulas Termiônicas',
    'Circuitos Lógicos',
    'Arquitetura von Neumann'
  ],
  
  impact: `
    Esta era definiu os FUNDAMENTOS TEÓRICOS da computação:
    - O que pode ser computado (Turing, Church)
    - Limites da formalização (Gödel)
    - Como representar informação (Shannon)
    - Como construir computadores (von Neumann)
    Sem estes fundamentos, não existiria ciência da computação.
  `
};


// ============================================================================
// ERA 3: PRIMEIRAS LINGUAGENS E NASCIMENTO DA IA (1945-1960)
// ============================================================================

export const ERA_3_LANGUAGES_AI: HistoricalPeriod = {
  era: 'ERA_3',
  startYear: 1945,
  endYear: 1960,
  title: 'Primeiras Linguagens e Nascimento da IA',
  description: `
    O pós-guerra viu a transição de máquinas experimentais para computadores
    comerciais. Surgiram as primeiras linguagens de programação de alto nível,
    e a Inteligência Artificial nasceu oficialmente na conferência de Dartmouth.
    Grace Hopper revolucionou a programação com o conceito de compilador.
  `,
  
  keyFigures: [
    {
      name: 'Grace Hopper',
      birthYear: 1906,
      deathYear: 1992,
      nationality: 'Americana',
      role: 'Cientista da Computação e Almirante da Marinha',
      contributions: [
        'Criou o primeiro compilador (A-0, 1952)',
        'Desenvolveu COBOL (1959)',
        'Popularizou o termo "bug"',
        'Pioneira em linguagens de alto nível'
      ],
      famousQuote: 'The most dangerous phrase in the language is "We have always done it this way."',
      relatedTo: ['John Backus', 'Howard Aiken']
    },
    {
      name: 'John McCarthy',
      birthYear: 1927,
      deathYear: 2011,
      nationality: 'Americano',
      role: 'Cientista da Computação, Pai da IA',
      contributions: [
        'Cunhou o termo "Inteligência Artificial" (1955)',
        'Organizou Conferência de Dartmouth (1956)',
        'Criou LISP (1958)',
        'Inventou garbage collection',
        'Propôs time-sharing'
      ],
      famousQuote: 'He who refuses to do arithmetic is doomed to talk nonsense.',
      relatedTo: ['Marvin Minsky', 'Claude Shannon', 'Allen Newell']
    },
    {
      name: 'Marvin Minsky',
      birthYear: 1927,
      deathYear: 2016,
      nationality: 'Americano',
      role: 'Cientista Cognitivo e Pioneiro da IA',
      contributions: [
        'Co-fundou MIT AI Lab (1959)',
        'Teoria de frames para representação de conhecimento',
        'Trabalhou em redes neurais iniciais',
        'Escreveu "Perceptrons" (1969)'
      ],
      famousQuote: 'You don\'t understand anything until you learn it more than one way.',
      relatedTo: ['John McCarthy', 'Seymour Papert']
    },
    {
      name: 'John Backus',
      birthYear: 1924,
      deathYear: 2007,
      nationality: 'Americano',
      role: 'Cientista da Computação',
      contributions: [
        'Criou FORTRAN (1957)',
        'Desenvolveu BNF (Backus-Naur Form)',
        'Pioneiro em linguagens funcionais',
        'Discurso Turing Award sobre programação funcional'
      ],
      relatedTo: ['Grace Hopper', 'Peter Naur']
    },
    {
      name: 'Allen Newell',
      birthYear: 1927,
      deathYear: 1992,
      nationality: 'Americano',
      role: 'Cientista da Computação e Psicólogo Cognitivo',
      contributions: [
        'Logic Theorist (1956) - primeiro programa de IA',
        'General Problem Solver',
        'Arquitetura cognitiva SOAR',
        'Turing Award 1975'
      ],
      relatedTo: ['Herbert Simon', 'Cliff Shaw']
    },
    {
      name: 'Herbert Simon',
      birthYear: 1916,
      deathYear: 2001,
      nationality: 'Americano',
      role: 'Economista, Psicólogo, Cientista da Computação',
      contributions: [
        'Logic Theorist com Newell',
        'Teoria da racionalidade limitada',
        'Nobel de Economia (1978)',
        'Turing Award (1975)'
      ],
      famousQuote: 'A wealth of information creates a poverty of attention.',
      relatedTo: ['Allen Newell', 'Cliff Shaw']
    }
  ],
  
  keyEvents: [
    {
      year: 1946,
      event: 'ENIAC é apresentado ao público',
      significance: 'Primeiro computador eletrônico de propósito geral revelado',
      participants: ['J. Presper Eckert', 'John Mauchly'],
      location: 'Universidade da Pensilvânia, EUA',
      consequences: ['Era dos computadores eletrônicos começa']
    },
    {
      year: 1950,
      event: 'Turing publica "Computing Machinery and Intelligence"',
      significance: 'Propõe o Teste de Turing para inteligência de máquinas',
      participants: ['Alan Turing'],
      consequences: ['Fundação filosófica da IA']
    },
    {
      year: 1952,
      event: 'Grace Hopper cria o primeiro compilador',
      significance: 'Revolucionou a programação permitindo código de alto nível',
      participants: ['Grace Hopper'],
      location: 'Remington Rand, EUA',
      consequences: ['Nascimento das linguagens de programação modernas']
    },
    {
      year: 1956,
      event: 'Conferência de Dartmouth',
      significance: 'Nascimento oficial da Inteligência Artificial como campo',
      participants: ['John McCarthy', 'Marvin Minsky', 'Claude Shannon', 'Allen Newell', 'Herbert Simon'],
      location: 'Dartmouth College, New Hampshire, EUA',
      consequences: ['IA se torna disciplina acadêmica', 'Financiamento de pesquisa em IA']
    },
    {
      year: 1957,
      event: 'FORTRAN é lançado',
      significance: 'Primeira linguagem de programação de alto nível amplamente usada',
      participants: ['John Backus', 'Equipe IBM'],
      location: 'IBM, EUA',
      consequences: ['Programação científica se torna acessível']
    },
    {
      year: 1958,
      event: 'LISP é criado',
      significance: 'Segunda linguagem de alto nível mais antiga ainda em uso',
      participants: ['John McCarthy'],
      location: 'MIT, EUA',
      consequences: ['Base para pesquisa em IA', 'Introduziu garbage collection']
    },
    {
      year: 1959,
      event: 'COBOL é desenvolvido',
      significance: 'Linguagem para aplicações comerciais',
      participants: ['Grace Hopper', 'Comitê CODASYL'],
      consequences: ['Computação empresarial se expande']
    }
  ],
  
  keyInventions: [
    {
      name: 'UNIVAC I',
      year: 1951,
      inventor: 'J. Presper Eckert e John Mauchly',
      description: 'Primeiro computador comercial americano',
      impact: 'Previu eleição de Eisenhower, demonstrou valor comercial',
      predecessors: ['ENIAC'],
      successors: ['IBM 701']
    },
    {
      name: 'Compilador',
      year: 1952,
      inventor: 'Grace Hopper',
      description: 'Programa que traduz código de alto nível para código de máquina',
      impact: 'Revolucionou a programação, tornou-a acessível',
      successors: ['Todos os compiladores modernos']
    },
    {
      name: 'FORTRAN',
      year: 1957,
      inventor: 'John Backus e equipe IBM',
      description: 'Primeira linguagem de programação de alto nível bem-sucedida',
      impact: 'Padrão para computação científica por décadas',
      successors: ['ALGOL', 'C', 'Fortran moderno']
    },
    {
      name: 'LISP',
      year: 1958,
      inventor: 'John McCarthy',
      description: 'Linguagem funcional baseada em lambda cálculo',
      impact: 'Linguagem padrão para IA, introduziu garbage collection',
      predecessors: ['Lambda Cálculo'],
      successors: ['Scheme', 'Common Lisp', 'Clojure']
    },
    {
      name: 'Logic Theorist',
      year: 1956,
      inventor: 'Allen Newell, Herbert Simon, Cliff Shaw',
      description: 'Primeiro programa de inteligência artificial',
      impact: 'Provou teoremas de Principia Mathematica',
      successors: ['General Problem Solver', 'Sistemas especialistas']
    }
  ],
  
  essentialBooks: [
    {
      title: 'The Dream Machine: J.C.R. Licklider and the Revolution That Made Computing Personal',
      author: 'M. Mitchell Waldrop',
      year: 2001,
      category: 'História da Computação',
      importance: 'essential',
      summary: 'História de Licklider e sua visão de computação interativa'
    },
    {
      title: 'Computing Machinery and Intelligence',
      author: 'Alan Turing',
      year: 1950,
      category: 'Inteligência Artificial',
      importance: 'fundamental',
      summary: 'Artigo seminal que propõe o Teste de Turing'
    }
  ],
  
  essentialPapers: [
    {
      title: 'Computing Machinery and Intelligence',
      authors: ['Alan Turing'],
      year: 1950,
      publication: 'Mind',
      category: 'Inteligência Artificial',
      importance: 'foundational',
      abstract: 'Propõe o Teste de Turing e discute se máquinas podem pensar'
    },
    {
      title: 'A Proposal for the Dartmouth Summer Research Project on Artificial Intelligence',
      authors: ['John McCarthy', 'Marvin Minsky', 'Nathaniel Rochester', 'Claude Shannon'],
      year: 1955,
      publication: 'Proposta de Pesquisa',
      category: 'Inteligência Artificial',
      importance: 'foundational',
      abstract: 'Documento que cunhou o termo "Inteligência Artificial" e definiu o campo'
    },
    {
      title: 'Recursive Functions of Symbolic Expressions and Their Computation by Machine',
      authors: ['John McCarthy'],
      year: 1960,
      publication: 'Communications of the ACM',
      category: 'Linguagens de Programação',
      importance: 'foundational',
      abstract: 'Introduz LISP e conceitos fundamentais de programação funcional'
    }
  ],
  
  technologies: [
    'Compiladores',
    'FORTRAN',
    'LISP',
    'COBOL',
    'Transistores (substituindo válvulas)',
    'Memória de núcleo magnético',
    'Time-sharing (conceito)'
  ],
  
  impact: `
    Esta era transformou computação de experimento em indústria:
    - Linguagens de alto nível tornaram programação acessível
    - IA nasceu como campo de pesquisa
    - Computadores comerciais surgiram
    - Conceitos fundamentais (compilação, garbage collection) foram inventados
  `
};


// ============================================================================
// ERA 4: TEORIA DA COMPLEXIDADE, REDES E SISTEMAS (1960-1980)
// ============================================================================

export const ERA_4_COMPLEXITY_NETWORKS: HistoricalPeriod = {
  era: 'ERA_4',
  startYear: 1960,
  endYear: 1980,
  title: 'Teoria da Complexidade, Redes e Sistemas Operacionais',
  description: `
    Esta era viu o nascimento da teoria da complexidade computacional (P vs NP),
    a criação da ARPANET (precursora da Internet), o desenvolvimento do UNIX
    e da linguagem C, e a revolução dos bancos de dados relacionais.
    Os fundamentos da computação moderna foram estabelecidos.
  `,
  
  keyFigures: [
    {
      name: 'Stephen Cook',
      birthYear: 1939,
      nationality: 'Americano-Canadense',
      role: 'Cientista da Computação Teórico',
      contributions: [
        'Provou NP-completude do SAT (1971)',
        'Fundou teoria da complexidade computacional',
        'Turing Award 1982'
      ],
      relatedTo: ['Richard Karp', 'Leonid Levin']
    },
    {
      name: 'Richard Karp',
      birthYear: 1935,
      nationality: 'Americano',
      role: 'Cientista da Computação Teórico',
      contributions: [
        '21 problemas NP-completos (1972)',
        'Algoritmos para grafos',
        'Turing Award 1985'
      ],
      relatedTo: ['Stephen Cook']
    },
    {
      name: 'Edgar F. Codd',
      birthYear: 1923,
      deathYear: 2003,
      nationality: 'Britânico-Americano',
      role: 'Cientista da Computação',
      contributions: [
        'Modelo relacional de dados (1970)',
        'Fundou teoria de bancos de dados',
        'Turing Award 1981'
      ],
      famousQuote: 'Future users of large data banks must be protected from having to know how the data is organized in the machine.',
      relatedTo: ['Michael Stonebraker', 'Jim Gray']
    },
    {
      name: 'Dennis Ritchie',
      birthYear: 1941,
      deathYear: 2011,
      nationality: 'Americano',
      role: 'Cientista da Computação',
      contributions: [
        'Criou linguagem C (1972)',
        'Co-criou UNIX',
        'Turing Award 1983'
      ],
      famousQuote: 'UNIX is basically a simple operating system, but you have to be a genius to understand the simplicity.',
      relatedTo: ['Ken Thompson', 'Brian Kernighan']
    },
    {
      name: 'Ken Thompson',
      birthYear: 1943,
      nationality: 'Americano',
      role: 'Cientista da Computação',
      contributions: [
        'Co-criou UNIX (1969)',
        'Criou linguagem B',
        'Co-criou Go (2009)',
        'Turing Award 1983'
      ],
      relatedTo: ['Dennis Ritchie', 'Rob Pike']
    },
    {
      name: 'Vint Cerf',
      birthYear: 1943,
      nationality: 'Americano',
      role: 'Cientista da Computação, Pai da Internet',
      contributions: [
        'Co-criou TCP/IP (1974)',
        'Arquitetura da Internet',
        'Turing Award 2004'
      ],
      famousQuote: 'The Internet is a reflection of our society and that mirror is going to be reflecting what we see.',
      relatedTo: ['Bob Kahn', 'Leonard Kleinrock']
    },
    {
      name: 'Bob Kahn',
      birthYear: 1938,
      nationality: 'Americano',
      role: 'Engenheiro e Cientista da Computação',
      contributions: [
        'Co-criou TCP/IP',
        'Arquitetura da ARPANET',
        'Turing Award 2004'
      ],
      relatedTo: ['Vint Cerf', 'Leonard Kleinrock']
    },
    {
      name: 'Donald Knuth',
      birthYear: 1938,
      nationality: 'Americano',
      role: 'Cientista da Computação e Matemático',
      contributions: [
        'The Art of Computer Programming (1968-)',
        'Análise de algoritmos',
        'Criou TeX',
        'Turing Award 1974'
      ],
      famousQuote: 'Premature optimization is the root of all evil.',
      relatedTo: ['Edsger Dijkstra']
    },
    {
      name: 'Edsger Dijkstra',
      birthYear: 1930,
      deathYear: 2002,
      nationality: 'Holandês',
      role: 'Cientista da Computação',
      contributions: [
        'Algoritmo de Dijkstra (1959)',
        'Programação estruturada',
        'Semáforos para concorrência',
        'Turing Award 1972'
      ],
      famousQuote: 'Computer Science is no more about computers than astronomy is about telescopes.',
      relatedTo: ['Donald Knuth', 'Tony Hoare']
    },
    {
      name: 'Tony Hoare',
      birthYear: 1934,
      nationality: 'Britânico',
      role: 'Cientista da Computação',
      contributions: [
        'Quicksort (1960)',
        'Lógica de Hoare',
        'CSP (Communicating Sequential Processes)',
        'Turing Award 1980'
      ],
      famousQuote: 'There are two ways of constructing a software design: One way is to make it so simple that there are obviously no deficiencies, and the other way is to make it so complicated that there are no obvious deficiencies.',
      relatedTo: ['Edsger Dijkstra', 'Donald Knuth']
    }
  ],
  
  keyEvents: [
    {
      year: 1964,
      event: 'IBM System/360 é lançado',
      significance: 'Primeira família de computadores compatíveis',
      participants: ['IBM', 'Fred Brooks'],
      consequences: ['Padronização da indústria', 'Conceito de arquitetura de família']
    },
    {
      year: 1969,
      event: 'ARPANET entra em operação',
      significance: 'Primeira rede de computadores de longa distância',
      participants: ['DARPA', 'Leonard Kleinrock', 'UCLA', 'SRI', 'UCSB', 'Utah'],
      location: 'EUA',
      consequences: ['Nascimento da Internet', 'Comunicação digital global']
    },
    {
      year: 1969,
      event: 'UNIX é criado',
      significance: 'Sistema operacional que influenciou todos os outros',
      participants: ['Ken Thompson', 'Dennis Ritchie'],
      location: 'Bell Labs, EUA',
      consequences: ['Linux', 'macOS', 'Android', 'Filosofia UNIX']
    },
    {
      year: 1970,
      event: 'Codd publica modelo relacional',
      significance: 'Fundação dos bancos de dados modernos',
      participants: ['Edgar F. Codd'],
      location: 'IBM Research',
      consequences: ['SQL', 'Oracle', 'PostgreSQL', 'MySQL']
    },
    {
      year: 1971,
      event: 'Cook prova NP-completude do SAT',
      significance: 'Nascimento da teoria da complexidade',
      participants: ['Stephen Cook'],
      consequences: ['Problema P vs NP', 'Classificação de problemas']
    },
    {
      year: 1972,
      event: 'Linguagem C é criada',
      significance: 'Linguagem que dominou sistemas por décadas',
      participants: ['Dennis Ritchie'],
      location: 'Bell Labs, EUA',
      consequences: ['C++', 'Java', 'Sistemas operacionais modernos']
    },
    {
      year: 1973,
      event: 'Ethernet é inventada',
      significance: 'Padrão de rede local que domina até hoje',
      participants: ['Robert Metcalfe'],
      location: 'Xerox PARC',
      consequences: ['Redes locais', 'Internet moderna']
    },
    {
      year: 1974,
      event: 'TCP/IP é especificado',
      significance: 'Protocolo fundamental da Internet',
      participants: ['Vint Cerf', 'Bob Kahn'],
      consequences: ['Internet global', 'Comunicação universal']
    },
    {
      year: 1976,
      event: 'Diffie-Hellman publica criptografia de chave pública',
      significance: 'Revolucionou segurança digital',
      participants: ['Whitfield Diffie', 'Martin Hellman'],
      consequences: ['HTTPS', 'Comércio eletrônico', 'Privacidade digital']
    },
    {
      year: 1977,
      event: 'RSA é inventado',
      significance: 'Algoritmo de criptografia assimétrica mais usado',
      participants: ['Ron Rivest', 'Adi Shamir', 'Leonard Adleman'],
      location: 'MIT',
      consequences: ['Segurança na Internet', 'Assinaturas digitais']
    }
  ],
  
  keyInventions: [
    {
      name: 'UNIX',
      year: 1969,
      inventor: 'Ken Thompson e Dennis Ritchie',
      description: 'Sistema operacional multitarefa e multiusuário',
      impact: 'Base de Linux, macOS, Android, servidores web',
      successors: ['BSD', 'Linux', 'macOS', 'Solaris']
    },
    {
      name: 'Linguagem C',
      year: 1972,
      inventor: 'Dennis Ritchie',
      description: 'Linguagem de programação de sistemas',
      impact: 'Linguagem mais influente da história',
      predecessors: ['B', 'BCPL'],
      successors: ['C++', 'Objective-C', 'Java', 'C#', 'Go', 'Rust']
    },
    {
      name: 'ARPANET',
      year: 1969,
      inventor: 'DARPA',
      description: 'Primeira rede de computadores de longa distância',
      impact: 'Precursora da Internet',
      successors: ['Internet']
    },
    {
      name: 'TCP/IP',
      year: 1974,
      inventor: 'Vint Cerf e Bob Kahn',
      description: 'Protocolo de comunicação da Internet',
      impact: 'Fundação de toda comunicação na Internet',
      predecessors: ['NCP (ARPANET)']
    },
    {
      name: 'Ethernet',
      year: 1973,
      inventor: 'Robert Metcalfe',
      description: 'Tecnologia de rede local',
      impact: 'Padrão dominante para redes locais',
      successors: ['Fast Ethernet', 'Gigabit Ethernet']
    },
    {
      name: 'Modelo Relacional',
      year: 1970,
      inventor: 'Edgar F. Codd',
      description: 'Modelo matemático para bancos de dados',
      impact: 'Base de todos os RDBMS modernos',
      successors: ['SQL', 'Oracle', 'PostgreSQL', 'MySQL']
    },
    {
      name: 'Criptografia de Chave Pública',
      year: 1976,
      inventor: 'Whitfield Diffie e Martin Hellman',
      description: 'Sistema criptográfico com chaves pública e privada',
      impact: 'Segurança na Internet, comércio eletrônico',
      successors: ['RSA', 'ECC', 'TLS/SSL']
    },
    {
      name: 'RSA',
      year: 1977,
      inventor: 'Rivest, Shamir, Adleman',
      description: 'Algoritmo de criptografia assimétrica',
      impact: 'Padrão de segurança por décadas',
      predecessors: ['Diffie-Hellman']
    }
  ],
  
  essentialBooks: [
    {
      title: 'The Art of Computer Programming',
      author: 'Donald Knuth',
      year: 1968,
      category: 'Algoritmos',
      importance: 'fundamental',
      summary: 'Obra monumental sobre análise de algoritmos, ainda em desenvolvimento'
    },
    {
      title: 'The Mythical Man-Month',
      author: 'Fred Brooks',
      year: 1975,
      category: 'Engenharia de Software',
      importance: 'essential',
      summary: 'Lições sobre gerenciamento de projetos de software do IBM System/360'
    },
    {
      title: 'The UNIX Programming Environment',
      author: 'Brian Kernighan e Rob Pike',
      year: 1984,
      category: 'Sistemas Operacionais',
      importance: 'essential',
      summary: 'Filosofia e prática de programação UNIX'
    },
    {
      title: 'The C Programming Language',
      author: 'Brian Kernighan e Dennis Ritchie',
      year: 1978,
      category: 'Linguagens de Programação',
      importance: 'fundamental',
      summary: 'O livro definitivo sobre C, conhecido como K&R'
    },
    {
      title: 'A Discipline of Programming',
      author: 'Edsger Dijkstra',
      year: 1976,
      category: 'Teoria da Computação',
      importance: 'essential',
      summary: 'Fundamentos de programação estruturada e corretude'
    }
  ],
  
  essentialPapers: [
    {
      title: 'A Relational Model of Data for Large Shared Data Banks',
      authors: ['Edgar F. Codd'],
      year: 1970,
      publication: 'Communications of the ACM',
      category: 'Bancos de Dados',
      importance: 'foundational',
      abstract: 'Introduz o modelo relacional que revolucionou bancos de dados'
    },
    {
      title: 'The Complexity of Theorem-Proving Procedures',
      authors: ['Stephen Cook'],
      year: 1971,
      publication: 'STOC',
      category: 'Teoria da Complexidade',
      importance: 'foundational',
      abstract: 'Prova que SAT é NP-completo, fundando teoria da complexidade'
    },
    {
      title: 'Reducibility Among Combinatorial Problems',
      authors: ['Richard Karp'],
      year: 1972,
      publication: 'Complexity of Computer Computations',
      category: 'Teoria da Complexidade',
      importance: 'foundational',
      abstract: 'Demonstra 21 problemas NP-completos'
    },
    {
      title: 'New Directions in Cryptography',
      authors: ['Whitfield Diffie', 'Martin Hellman'],
      year: 1976,
      publication: 'IEEE Transactions on Information Theory',
      category: 'Criptografia',
      importance: 'foundational',
      abstract: 'Introduz criptografia de chave pública'
    },
    {
      title: 'A Method for Obtaining Digital Signatures and Public-Key Cryptosystems',
      authors: ['Ron Rivest', 'Adi Shamir', 'Leonard Adleman'],
      year: 1978,
      publication: 'Communications of the ACM',
      category: 'Criptografia',
      importance: 'foundational',
      abstract: 'Apresenta o algoritmo RSA'
    },
    {
      title: 'A Protocol for Packet Network Intercommunication',
      authors: ['Vint Cerf', 'Bob Kahn'],
      year: 1974,
      publication: 'IEEE Transactions on Communications',
      category: 'Redes',
      importance: 'foundational',
      abstract: 'Especifica TCP/IP, fundação da Internet'
    }
  ],
  
  technologies: [
    'UNIX',
    'Linguagem C',
    'TCP/IP',
    'Ethernet',
    'SQL',
    'Criptografia de Chave Pública',
    'Microprocessadores (Intel 4004, 8080)',
    'Minicomputadores (PDP-11)'
  ],
  
  impact: `
    Esta era estabeleceu a INFRAESTRUTURA da computação moderna:
    - Redes que se tornaram a Internet
    - Sistemas operacionais que dominam até hoje
    - Linguagens que influenciaram todas as outras
    - Teoria que classifica problemas computacionais
    - Segurança que permite comércio eletrônico
  `
};


// ============================================================================
// ERA 5: COMPUTAÇÃO PESSOAL E SOFTWARE (1980-1995)
// ============================================================================

export const ERA_5_PERSONAL_COMPUTING: HistoricalPeriod = {
  era: 'ERA_5',
  startYear: 1980,
  endYear: 1995,
  title: 'Computação Pessoal e Revolução do Software',
  description: `
    A era dos microcomputadores democratizou a computação. Apple, IBM PC,
    Microsoft e o movimento de software livre transformaram computadores
    de ferramentas corporativas em dispositivos pessoais. A orientação a
    objetos e interfaces gráficas revolucionaram como interagimos com máquinas.
  `,
  
  keyFigures: [
    {
      name: 'Steve Jobs',
      birthYear: 1955,
      deathYear: 2011,
      nationality: 'Americano',
      role: 'Empreendedor e Visionário',
      contributions: [
        'Co-fundou Apple (1976)',
        'Apple II, Macintosh, iPod, iPhone, iPad',
        'Popularizou interface gráfica',
        'Revolucionou múltiplas indústrias'
      ],
      famousQuote: 'Stay hungry, stay foolish.',
      relatedTo: ['Steve Wozniak', 'Bill Gates']
    },
    {
      name: 'Steve Wozniak',
      birthYear: 1950,
      nationality: 'Americano',
      role: 'Engenheiro e Inventor',
      contributions: [
        'Projetou Apple I e Apple II',
        'Pioneiro em computação pessoal',
        'Engenharia elegante e eficiente'
      ],
      relatedTo: ['Steve Jobs']
    },
    {
      name: 'Bill Gates',
      birthYear: 1955,
      nationality: 'Americano',
      role: 'Empreendedor e Filantropo',
      contributions: [
        'Co-fundou Microsoft (1975)',
        'MS-DOS, Windows',
        'Dominou mercado de software',
        'Filantropia global'
      ],
      famousQuote: 'Your most unhappy customers are your greatest source of learning.',
      relatedTo: ['Paul Allen', 'Steve Jobs']
    },
    {
      name: 'Richard Stallman',
      birthYear: 1953,
      nationality: 'Americano',
      role: 'Programador e Ativista',
      contributions: [
        'Fundou movimento de Software Livre (1983)',
        'Criou GNU Project',
        'Escreveu GPL',
        'Criou Emacs, GCC'
      ],
      famousQuote: 'Free software is a matter of liberty, not price.',
      relatedTo: ['Linus Torvalds']
    },
    {
      name: 'Linus Torvalds',
      birthYear: 1969,
      nationality: 'Finlandês-Americano',
      role: 'Engenheiro de Software',
      contributions: [
        'Criou Linux (1991)',
        'Criou Git (2005)',
        'Modelo de desenvolvimento open source'
      ],
      famousQuote: 'Talk is cheap. Show me the code.',
      relatedTo: ['Richard Stallman', 'Andrew Tanenbaum']
    },
    {
      name: 'Bjarne Stroustrup',
      birthYear: 1950,
      nationality: 'Dinamarquês',
      role: 'Cientista da Computação',
      contributions: [
        'Criou C++ (1983)',
        'Orientação a objetos em sistemas',
        'Influenciou Java, C#'
      ],
      famousQuote: 'C makes it easy to shoot yourself in the foot; C++ makes it harder, but when you do it blows your whole leg off.',
      relatedTo: ['Dennis Ritchie']
    },
    {
      name: 'Tim Berners-Lee',
      birthYear: 1955,
      nationality: 'Britânico',
      role: 'Cientista da Computação, Inventor da Web',
      contributions: [
        'Inventou World Wide Web (1989)',
        'Criou HTML, HTTP, URLs',
        'Fundou W3C',
        'Turing Award 2016'
      ],
      famousQuote: 'The Web as I envisaged it, we have not seen it yet. The future is still so much bigger than the past.',
      relatedTo: ['Vint Cerf']
    },
    {
      name: 'James Gosling',
      birthYear: 1955,
      nationality: 'Canadense',
      role: 'Cientista da Computação',
      contributions: [
        'Criou Java (1995)',
        'Write once, run anywhere',
        'JVM e bytecode'
      ],
      relatedTo: ['Bjarne Stroustrup']
    }
  ],
  
  keyEvents: [
    {
      year: 1981,
      event: 'IBM PC é lançado',
      significance: 'Padronizou computação pessoal',
      participants: ['IBM'],
      consequences: ['Indústria de clones', 'Domínio Microsoft/Intel']
    },
    {
      year: 1983,
      event: 'Richard Stallman anuncia GNU Project',
      significance: 'Nascimento do movimento de Software Livre',
      participants: ['Richard Stallman'],
      location: 'MIT',
      consequences: ['GPL', 'Linux', 'Open Source']
    },
    {
      year: 1984,
      event: 'Apple Macintosh é lançado',
      significance: 'Popularizou interface gráfica',
      participants: ['Apple', 'Steve Jobs'],
      consequences: ['GUI se torna padrão', 'Desktop publishing']
    },
    {
      year: 1985,
      event: 'Windows 1.0 é lançado',
      significance: 'Microsoft entra no mercado de GUI',
      participants: ['Microsoft', 'Bill Gates'],
      consequences: ['Domínio do Windows', 'Guerra Apple vs Microsoft']
    },
    {
      year: 1989,
      event: 'Tim Berners-Lee propõe a World Wide Web',
      significance: 'Nascimento da Web',
      participants: ['Tim Berners-Lee'],
      location: 'CERN, Suíça',
      consequences: ['Revolução da informação', 'E-commerce', 'Redes sociais']
    },
    {
      year: 1991,
      event: 'Linus Torvalds anuncia Linux',
      significance: 'Kernel open source que domina servidores',
      participants: ['Linus Torvalds'],
      consequences: ['Servidores web', 'Android', 'Cloud computing']
    },
    {
      year: 1991,
      event: 'Python é lançado',
      significance: 'Linguagem que dominaria ciência de dados',
      participants: ['Guido van Rossum'],
      consequences: ['Data science', 'Machine learning', 'Scripting']
    },
    {
      year: 1995,
      event: 'Java é lançado',
      significance: 'Write once, run anywhere',
      participants: ['James Gosling', 'Sun Microsystems'],
      consequences: ['Enterprise computing', 'Android', 'JVM ecosystem']
    },
    {
      year: 1995,
      event: 'JavaScript é criado',
      significance: 'Linguagem da Web',
      participants: ['Brendan Eich', 'Netscape'],
      consequences: ['Web interativa', 'Node.js', 'Frontend moderno']
    }
  ],
  
  keyInventions: [
    {
      name: 'IBM PC',
      year: 1981,
      inventor: 'IBM',
      description: 'Computador pessoal que se tornou padrão da indústria',
      impact: 'Democratizou computação, criou ecossistema de clones',
      predecessors: ['Apple II', 'Altair 8800'],
      successors: ['Todos os PCs modernos']
    },
    {
      name: 'Macintosh',
      year: 1984,
      inventor: 'Apple',
      description: 'Primeiro computador pessoal com GUI bem-sucedido',
      impact: 'Popularizou interface gráfica',
      predecessors: ['Xerox Alto', 'Lisa'],
      successors: ['iMac', 'MacBook']
    },
    {
      name: 'C++',
      year: 1983,
      inventor: 'Bjarne Stroustrup',
      description: 'C com orientação a objetos',
      impact: 'Linguagem dominante para sistemas e jogos',
      predecessors: ['C', 'Simula'],
      successors: ['Java', 'C#', 'Rust']
    },
    {
      name: 'World Wide Web',
      year: 1989,
      inventor: 'Tim Berners-Lee',
      description: 'Sistema de hipertexto distribuído',
      impact: 'Revolucionou acesso à informação',
      predecessors: ['Hypercard', 'Gopher'],
      successors: ['Web 2.0', 'Web3']
    },
    {
      name: 'Linux',
      year: 1991,
      inventor: 'Linus Torvalds',
      description: 'Kernel de sistema operacional open source',
      impact: 'Domina servidores, smartphones (Android), cloud',
      predecessors: ['UNIX', 'Minix'],
      successors: ['Android', 'Chrome OS']
    },
    {
      name: 'Java',
      year: 1995,
      inventor: 'James Gosling',
      description: 'Linguagem orientada a objetos com JVM',
      impact: 'Enterprise computing, Android',
      predecessors: ['C++', 'Smalltalk'],
      successors: ['Kotlin', 'Scala']
    },
    {
      name: 'JavaScript',
      year: 1995,
      inventor: 'Brendan Eich',
      description: 'Linguagem de script para browsers',
      impact: 'Única linguagem nativa da Web',
      successors: ['TypeScript', 'Node.js']
    }
  ],
  
  essentialBooks: [
    {
      title: 'Hackers: Heroes of the Computer Revolution',
      author: 'Steven Levy',
      year: 1984,
      category: 'História da Computação',
      importance: 'essential',
      summary: 'História dos hackers do MIT, homebrew e cultura hacker'
    },
    {
      title: 'Fire in the Valley: The Making of the Personal Computer',
      author: 'Paul Freiberger e Michael Swaine',
      year: 1984,
      category: 'História da Computação',
      importance: 'essential',
      summary: 'História do nascimento da indústria de PCs'
    },
    {
      title: 'The Cathedral and the Bazaar',
      author: 'Eric S. Raymond',
      year: 1999,
      category: 'Open Source',
      importance: 'essential',
      summary: 'Análise do modelo de desenvolvimento open source'
    },
    {
      title: 'Design Patterns: Elements of Reusable Object-Oriented Software',
      author: 'Gang of Four (Gamma, Helm, Johnson, Vlissides)',
      year: 1994,
      category: 'Engenharia de Software',
      importance: 'fundamental',
      summary: 'Catálogo de padrões de design que influenciou toda a indústria'
    },
    {
      title: 'The C++ Programming Language',
      author: 'Bjarne Stroustrup',
      year: 1985,
      category: 'Linguagens de Programação',
      importance: 'essential',
      summary: 'Referência definitiva de C++ pelo criador'
    },
    {
      title: 'Structure and Interpretation of Computer Programs',
      author: 'Harold Abelson e Gerald Jay Sussman',
      year: 1985,
      category: 'Ciência da Computação',
      importance: 'fundamental',
      summary: 'Livro clássico do MIT sobre fundamentos de programação'
    }
  ],
  
  essentialPapers: [
    {
      title: 'Information Management: A Proposal',
      authors: ['Tim Berners-Lee'],
      year: 1989,
      publication: 'CERN Internal Document',
      category: 'Web',
      importance: 'foundational',
      abstract: 'Proposta original da World Wide Web'
    },
    {
      title: 'The GNU Manifesto',
      authors: ['Richard Stallman'],
      year: 1985,
      publication: 'Dr. Dobb\'s Journal',
      category: 'Software Livre',
      importance: 'foundational',
      abstract: 'Manifesto fundacional do movimento de software livre'
    }
  ],
  
  technologies: [
    'IBM PC e clones',
    'Macintosh e GUI',
    'Windows',
    'C++',
    'World Wide Web',
    'Linux',
    'Java',
    'JavaScript',
    'Python',
    'SQL comercial (Oracle, SQL Server)',
    'CD-ROM',
    'Redes locais (Novell, Windows NT)'
  ],
  
  impact: `
    Esta era DEMOCRATIZOU a computação:
    - Computadores se tornaram pessoais
    - Software livre criou alternativa ao modelo proprietário
    - A Web conectou o mundo
    - Linguagens modernas (C++, Java, Python) dominaram
    - Interface gráfica se tornou padrão
  `
};


// ============================================================================
// ERA 6: INTERNET, E-COMMERCE E WEB 2.0 (1995-2010)
// ============================================================================

export const ERA_6_INTERNET_WEB: HistoricalPeriod = {
  era: 'ERA_6',
  startYear: 1995,
  endYear: 2010,
  title: 'Internet, E-Commerce e Web 2.0',
  description: `
    A comercialização da Internet transformou a economia global. Surgiram
    gigantes como Google, Amazon, Facebook. A bolha .com estourou mas a
    Web 2.0 emergiu com redes sociais, cloud computing e smartphones.
    Machine learning começou sua ascensão silenciosa.
  `,
  
  keyFigures: [
    {
      name: 'Larry Page',
      birthYear: 1973,
      nationality: 'Americano',
      role: 'Cientista da Computação e Empreendedor',
      contributions: [
        'Co-fundou Google (1998)',
        'Algoritmo PageRank',
        'Revolucionou busca na web'
      ],
      relatedTo: ['Sergey Brin']
    },
    {
      name: 'Sergey Brin',
      birthYear: 1973,
      nationality: 'Russo-Americano',
      role: 'Cientista da Computação e Empreendedor',
      contributions: [
        'Co-fundou Google',
        'Algoritmo PageRank',
        'Google X e moonshots'
      ],
      relatedTo: ['Larry Page']
    },
    {
      name: 'Jeff Bezos',
      birthYear: 1964,
      nationality: 'Americano',
      role: 'Empreendedor',
      contributions: [
        'Fundou Amazon (1994)',
        'Revolucionou e-commerce',
        'AWS e cloud computing',
        'Blue Origin'
      ],
      famousQuote: 'Your margin is my opportunity.',
      relatedTo: []
    },
    {
      name: 'Mark Zuckerberg',
      birthYear: 1984,
      nationality: 'Americano',
      role: 'Empreendedor',
      contributions: [
        'Fundou Facebook (2004)',
        'Redes sociais em escala global',
        'Meta e metaverso'
      ],
      relatedTo: []
    },
    {
      name: 'Elon Musk',
      birthYear: 1971,
      nationality: 'Sul-Africano-Americano',
      role: 'Empreendedor e Engenheiro',
      contributions: [
        'PayPal (pagamentos online)',
        'Tesla (carros elétricos)',
        'SpaceX (foguetes reutilizáveis)',
        'Neuralink, OpenAI (co-fundador)'
      ],
      famousQuote: 'When something is important enough, you do it even if the odds are not in your favor.',
      relatedTo: []
    },
    {
      name: 'Geoffrey Hinton',
      birthYear: 1947,
      nationality: 'Britânico-Canadense',
      role: 'Cientista da Computação, Pai do Deep Learning',
      contributions: [
        'Backpropagation',
        'Redes neurais profundas',
        'AlexNet (2012)',
        'Turing Award 2018'
      ],
      famousQuote: 'The pooling operation used in convolutional neural networks is a big mistake.',
      relatedTo: ['Yann LeCun', 'Yoshua Bengio']
    },
    {
      name: 'Yann LeCun',
      birthYear: 1960,
      nationality: 'Francês-Americano',
      role: 'Cientista da Computação',
      contributions: [
        'Redes Neurais Convolucionais (CNNs)',
        'LeNet para reconhecimento de dígitos',
        'Chief AI Scientist do Facebook/Meta',
        'Turing Award 2018'
      ],
      relatedTo: ['Geoffrey Hinton', 'Yoshua Bengio']
    },
    {
      name: 'Yoshua Bengio',
      birthYear: 1964,
      nationality: 'Canadense',
      role: 'Cientista da Computação',
      contributions: [
        'Deep learning',
        'Modelos de linguagem',
        'Attention mechanisms',
        'Turing Award 2018'
      ],
      relatedTo: ['Geoffrey Hinton', 'Yann LeCun']
    }
  ],
  
  keyEvents: [
    {
      year: 1995,
      event: 'Netscape IPO',
      significance: 'Início da bolha .com',
      participants: ['Netscape', 'Marc Andreessen'],
      consequences: ['Investimento massivo em Internet', 'Bolha especulativa']
    },
    {
      year: 1998,
      event: 'Google é fundado',
      significance: 'Revolucionou busca na web',
      participants: ['Larry Page', 'Sergey Brin'],
      location: 'Stanford/Menlo Park',
      consequences: ['Domínio da busca', 'Publicidade online', 'Android']
    },
    {
      year: 2000,
      event: 'Bolha .com estoura',
      significance: 'Colapso de empresas de Internet',
      participants: ['Mercado financeiro', 'Startups de Internet'],
      consequences: ['Consolidação do mercado', 'Foco em modelos sustentáveis']
    },
    {
      year: 2004,
      event: 'Facebook é lançado',
      significance: 'Nascimento das redes sociais modernas',
      participants: ['Mark Zuckerberg'],
      location: 'Harvard',
      consequences: ['Redes sociais dominam', 'Economia de atenção']
    },
    {
      year: 2006,
      event: 'AWS é lançado',
      significance: 'Nascimento do cloud computing comercial',
      participants: ['Amazon', 'Jeff Bezos'],
      consequences: ['Revolução em infraestrutura', 'Startups escaláveis']
    },
    {
      year: 2007,
      event: 'iPhone é lançado',
      significance: 'Revolução dos smartphones',
      participants: ['Apple', 'Steve Jobs'],
      consequences: ['Computação móvel', 'App economy', 'Fim dos feature phones']
    },
    {
      year: 2008,
      event: 'Android é lançado',
      significance: 'Sistema operacional móvel open source',
      participants: ['Google'],
      consequences: ['Democratização de smartphones', 'Domínio do mercado móvel']
    },
    {
      year: 2009,
      event: 'Bitcoin whitepaper e lançamento',
      significance: 'Nascimento das criptomoedas',
      participants: ['Satoshi Nakamoto'],
      consequences: ['Blockchain', 'DeFi', 'NFTs']
    }
  ],
  
  keyInventions: [
    {
      name: 'Google Search',
      year: 1998,
      inventor: 'Larry Page e Sergey Brin',
      description: 'Motor de busca baseado em PageRank',
      impact: 'Organizou a informação da Internet',
      predecessors: ['AltaVista', 'Yahoo'],
      successors: ['Google AI']
    },
    {
      name: 'AWS (Amazon Web Services)',
      year: 2006,
      inventor: 'Amazon',
      description: 'Plataforma de cloud computing',
      impact: 'Revolucionou infraestrutura de TI',
      successors: ['Azure', 'Google Cloud']
    },
    {
      name: 'iPhone',
      year: 2007,
      inventor: 'Apple',
      description: 'Smartphone com touchscreen capacitivo',
      impact: 'Criou a era dos smartphones modernos',
      predecessors: ['BlackBerry', 'Palm'],
      successors: ['Todos os smartphones modernos']
    },
    {
      name: 'Android',
      year: 2008,
      inventor: 'Google (originalmente Android Inc.)',
      description: 'Sistema operacional móvel open source',
      impact: 'Domina mercado de smartphones',
      predecessors: ['Linux', 'Symbian'],
      successors: ['Wear OS', 'Android TV']
    },
    {
      name: 'Bitcoin',
      year: 2009,
      inventor: 'Satoshi Nakamoto',
      description: 'Criptomoeda descentralizada',
      impact: 'Criou indústria de blockchain',
      successors: ['Ethereum', 'DeFi']
    },
    {
      name: 'Hadoop',
      year: 2006,
      inventor: 'Doug Cutting e Mike Cafarella',
      description: 'Framework para processamento distribuído',
      impact: 'Habilitou Big Data',
      predecessors: ['Google MapReduce'],
      successors: ['Spark', 'Flink']
    }
  ],
  
  essentialBooks: [
    {
      title: 'The Google Story',
      author: 'David Vise',
      year: 2005,
      category: 'História da Tecnologia',
      importance: 'recommended',
      summary: 'História do Google e seus fundadores'
    },
    {
      title: 'The Facebook Effect',
      author: 'David Kirkpatrick',
      year: 2010,
      category: 'História da Tecnologia',
      importance: 'recommended',
      summary: 'História do Facebook e impacto social'
    },
    {
      title: 'In The Plex: How Google Thinks, Works, and Shapes Our Lives',
      author: 'Steven Levy',
      year: 2011,
      category: 'História da Tecnologia',
      importance: 'essential',
      summary: 'Visão interna do Google'
    },
    {
      title: 'The Innovators',
      author: 'Walter Isaacson',
      year: 2014,
      category: 'História da Computação',
      importance: 'essential',
      summary: 'História completa da revolução digital'
    }
  ],
  
  essentialPapers: [
    {
      title: 'The Anatomy of a Large-Scale Hypertextual Web Search Engine',
      authors: ['Sergey Brin', 'Lawrence Page'],
      year: 1998,
      publication: 'WWW Conference',
      category: 'Busca na Web',
      importance: 'foundational',
      abstract: 'Descreve a arquitetura do Google e PageRank'
    },
    {
      title: 'MapReduce: Simplified Data Processing on Large Clusters',
      authors: ['Jeffrey Dean', 'Sanjay Ghemawat'],
      year: 2004,
      publication: 'OSDI',
      category: 'Sistemas Distribuídos',
      importance: 'foundational',
      abstract: 'Modelo de programação para processamento distribuído'
    },
    {
      title: 'The Google File System',
      authors: ['Sanjay Ghemawat', 'Howard Gobioff', 'Shun-Tak Leung'],
      year: 2003,
      publication: 'SOSP',
      category: 'Sistemas Distribuídos',
      importance: 'foundational',
      abstract: 'Sistema de arquivos distribuído do Google'
    },
    {
      title: 'Bigtable: A Distributed Storage System for Structured Data',
      authors: ['Fay Chang et al.'],
      year: 2006,
      publication: 'OSDI',
      category: 'Bancos de Dados',
      importance: 'foundational',
      abstract: 'Banco de dados NoSQL do Google'
    },
    {
      title: 'Bitcoin: A Peer-to-Peer Electronic Cash System',
      authors: ['Satoshi Nakamoto'],
      year: 2008,
      publication: 'Whitepaper',
      category: 'Criptomoedas',
      importance: 'foundational',
      abstract: 'Proposta original do Bitcoin'
    }
  ],
  
  technologies: [
    'Web 2.0',
    'AJAX',
    'Cloud Computing (AWS, Azure, GCP)',
    'Smartphones (iPhone, Android)',
    'Redes Sociais',
    'Big Data (Hadoop, MapReduce)',
    'NoSQL (MongoDB, Cassandra)',
    'Virtualização',
    'Blockchain',
    'Ruby on Rails',
    'Node.js'
  ],
  
  impact: `
    Esta era CONECTOU o mundo:
    - Internet se tornou infraestrutura essencial
    - Cloud computing democratizou infraestrutura
    - Smartphones colocaram computadores no bolso
    - Redes sociais transformaram comunicação
    - Big Data criou nova indústria
  `
};


// ============================================================================
// ERA 7: DEEP LEARNING E IA GENERATIVA (2010-2025)
// ============================================================================

export const ERA_7_DEEP_LEARNING_AI: HistoricalPeriod = {
  era: 'ERA_7',
  startYear: 2010,
  endYear: 2025,
  title: 'Deep Learning e IA Generativa',
  description: `
    A revolução do deep learning transformou a IA de promessa em realidade.
    AlexNet (2012) iniciou a era moderna, Transformers (2017) revolucionaram
    NLP, e GPT/ChatGPT (2022) trouxeram IA generativa para o mainstream.
    Estamos vivendo a maior transformação tecnológica desde a Internet.
  `,
  
  keyFigures: [
    {
      name: 'Ilya Sutskever',
      birthYear: 1985,
      nationality: 'Russo-Canadense',
      role: 'Cientista da Computação',
      contributions: [
        'Co-autor do AlexNet (2012)',
        'Co-fundador e Chief Scientist da OpenAI',
        'Sequence-to-sequence learning',
        'GPT e ChatGPT'
      ],
      relatedTo: ['Geoffrey Hinton', 'Alex Krizhevsky', 'Sam Altman']
    },
    {
      name: 'Alex Krizhevsky',
      birthYear: 1986,
      nationality: 'Ucraniano-Canadense',
      role: 'Cientista da Computação',
      contributions: [
        'AlexNet - revolucionou visão computacional',
        'Demonstrou poder de GPUs para deep learning'
      ],
      relatedTo: ['Geoffrey Hinton', 'Ilya Sutskever']
    },
    {
      name: 'Demis Hassabis',
      birthYear: 1976,
      nationality: 'Britânico',
      role: 'Neurocientista e Empreendedor',
      contributions: [
        'Co-fundou DeepMind (2010)',
        'AlphaGo derrotou campeão mundial (2016)',
        'AlphaFold resolveu protein folding (2020)',
        'Gemini'
      ],
      relatedTo: ['Shane Legg', 'Mustafa Suleyman']
    },
    {
      name: 'Sam Altman',
      birthYear: 1985,
      nationality: 'Americano',
      role: 'Empreendedor',
      contributions: [
        'CEO da OpenAI',
        'GPT-3, GPT-4, ChatGPT',
        'Democratização da IA generativa'
      ],
      relatedTo: ['Ilya Sutskever', 'Greg Brockman']
    },
    {
      name: 'Andrej Karpathy',
      birthYear: 1986,
      nationality: 'Eslovaco-Canadense',
      role: 'Cientista da Computação',
      contributions: [
        'Diretor de IA da Tesla',
        'Educador de deep learning',
        'Pesquisa em visão computacional'
      ],
      relatedTo: ['Fei-Fei Li']
    },
    {
      name: 'Fei-Fei Li',
      birthYear: 1976,
      nationality: 'Chinesa-Americana',
      role: 'Cientista da Computação',
      contributions: [
        'ImageNet - dataset que habilitou deep learning',
        'Stanford AI Lab',
        'Democratização da IA'
      ],
      relatedTo: ['Andrej Karpathy']
    },
    {
      name: 'Ian Goodfellow',
      birthYear: 1985,
      nationality: 'Americano',
      role: 'Cientista da Computação',
      contributions: [
        'Inventou GANs (2014)',
        'Livro "Deep Learning"',
        'Pesquisa em segurança de ML'
      ],
      relatedTo: ['Yoshua Bengio']
    },
    {
      name: 'Ashish Vaswani',
      birthYear: 1983,
      nationality: 'Indiano',
      role: 'Cientista da Computação',
      contributions: [
        'Co-autor de "Attention Is All You Need" (2017)',
        'Arquitetura Transformer',
        'Fundação de GPT, BERT, etc.'
      ],
      relatedTo: ['Noam Shazeer', 'Jakob Uszkoreit']
    }
  ],
  
  keyEvents: [
    {
      year: 2012,
      event: 'AlexNet vence ImageNet',
      significance: 'Início da era moderna do deep learning',
      participants: ['Alex Krizhevsky', 'Ilya Sutskever', 'Geoffrey Hinton'],
      consequences: ['Explosão de pesquisa em deep learning', 'GPUs para ML']
    },
    {
      year: 2014,
      event: 'GANs são inventadas',
      significance: 'Redes que geram conteúdo realista',
      participants: ['Ian Goodfellow'],
      consequences: ['Geração de imagens', 'Deepfakes', 'Arte por IA']
    },
    {
      year: 2016,
      event: 'AlphaGo derrota Lee Sedol',
      significance: 'IA supera humanos em Go',
      participants: ['DeepMind', 'Demis Hassabis'],
      location: 'Seul, Coreia do Sul',
      consequences: ['Prova de capacidade de IA', 'Investimento massivo em IA']
    },
    {
      year: 2017,
      event: 'Paper "Attention Is All You Need"',
      significance: 'Introduz arquitetura Transformer',
      participants: ['Ashish Vaswani et al.', 'Google'],
      consequences: ['GPT', 'BERT', 'Revolução em NLP', 'LLMs']
    },
    {
      year: 2018,
      event: 'BERT é lançado',
      significance: 'Transformers para compreensão de linguagem',
      participants: ['Google'],
      consequences: ['Melhoria em busca', 'NLP moderno']
    },
    {
      year: 2020,
      event: 'GPT-3 é lançado',
      significance: 'LLM com 175 bilhões de parâmetros',
      participants: ['OpenAI'],
      consequences: ['Geração de texto de alta qualidade', 'APIs de IA']
    },
    {
      year: 2020,
      event: 'AlphaFold resolve protein folding',
      significance: 'IA resolve problema de 50 anos da biologia',
      participants: ['DeepMind'],
      consequences: ['Revolução em biologia', 'Drug discovery']
    },
    {
      year: 2022,
      event: 'ChatGPT é lançado',
      significance: 'IA conversacional para o mainstream',
      participants: ['OpenAI', 'Sam Altman'],
      consequences: ['100M usuários em 2 meses', 'Corrida de IA', 'Transformação de indústrias']
    },
    {
      year: 2022,
      event: 'Stable Diffusion é lançado',
      significance: 'Geração de imagens open source',
      participants: ['Stability AI'],
      consequences: ['Democratização de IA generativa', 'Arte por IA']
    },
    {
      year: 2023,
      event: 'GPT-4 é lançado',
      significance: 'LLM multimodal de última geração',
      participants: ['OpenAI'],
      consequences: ['Capacidades quase humanas em muitas tarefas']
    },
    {
      year: 2024,
      event: 'Claude 3, Gemini Ultra, GPT-4o',
      significance: 'Competição intensa entre LLMs',
      participants: ['Anthropic', 'Google', 'OpenAI'],
      consequences: ['Melhoria rápida de capacidades', 'Multimodalidade']
    }
  ],
  
  keyInventions: [
    {
      name: 'AlexNet',
      year: 2012,
      inventor: 'Krizhevsky, Sutskever, Hinton',
      description: 'CNN profunda que venceu ImageNet',
      impact: 'Iniciou era moderna do deep learning',
      predecessors: ['LeNet'],
      successors: ['VGG', 'ResNet', 'EfficientNet']
    },
    {
      name: 'GANs (Generative Adversarial Networks)',
      year: 2014,
      inventor: 'Ian Goodfellow',
      description: 'Redes que geram dados realistas',
      impact: 'Geração de imagens, vídeos, áudio',
      successors: ['StyleGAN', 'DALL-E']
    },
    {
      name: 'Transformer',
      year: 2017,
      inventor: 'Vaswani et al. (Google)',
      description: 'Arquitetura baseada em attention',
      impact: 'Base de todos os LLMs modernos',
      predecessors: ['RNN', 'LSTM'],
      successors: ['GPT', 'BERT', 'T5', 'LLaMA']
    },
    {
      name: 'BERT',
      year: 2018,
      inventor: 'Google',
      description: 'Transformer bidirecional para NLU',
      impact: 'Revolucionou compreensão de linguagem',
      predecessors: ['Transformer'],
      successors: ['RoBERTa', 'ALBERT']
    },
    {
      name: 'GPT (Generative Pre-trained Transformer)',
      year: 2018,
      inventor: 'OpenAI',
      description: 'Transformer autoregressivo para geração',
      impact: 'Base do ChatGPT e IA conversacional',
      predecessors: ['Transformer'],
      successors: ['GPT-2', 'GPT-3', 'GPT-4']
    },
    {
      name: 'ChatGPT',
      year: 2022,
      inventor: 'OpenAI',
      description: 'LLM otimizado para conversação',
      impact: 'Trouxe IA para o mainstream',
      predecessors: ['GPT-3', 'InstructGPT']
    },
    {
      name: 'Diffusion Models',
      year: 2020,
      inventor: 'Vários pesquisadores',
      description: 'Modelos generativos por denoising',
      impact: 'DALL-E, Stable Diffusion, Midjourney',
      successors: ['DALL-E 2', 'Stable Diffusion', 'Midjourney']
    },
    {
      name: 'AlphaFold',
      year: 2020,
      inventor: 'DeepMind',
      description: 'IA para predição de estrutura de proteínas',
      impact: 'Resolveu problema de 50 anos da biologia'
    }
  ],
  
  essentialBooks: [
    {
      title: 'Deep Learning',
      author: 'Ian Goodfellow, Yoshua Bengio, Aaron Courville',
      year: 2016,
      category: 'Machine Learning',
      importance: 'fundamental',
      summary: 'Livro definitivo sobre deep learning'
    },
    {
      title: 'Artificial Intelligence: A Modern Approach',
      author: 'Stuart Russell e Peter Norvig',
      year: 1995,
      category: 'Inteligência Artificial',
      importance: 'fundamental',
      summary: 'Livro-texto padrão de IA, atualizado regularmente'
    },
    {
      title: 'Pattern Recognition and Machine Learning',
      author: 'Christopher Bishop',
      year: 2006,
      category: 'Machine Learning',
      importance: 'essential',
      summary: 'Fundamentos matemáticos de ML'
    },
    {
      title: 'The Elements of Statistical Learning',
      author: 'Hastie, Tibshirani, Friedman',
      year: 2001,
      category: 'Machine Learning',
      importance: 'essential',
      summary: 'Referência estatística para ML'
    },
    {
      title: 'Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow',
      author: 'Aurélien Géron',
      year: 2019,
      category: 'Machine Learning Prático',
      importance: 'essential',
      summary: 'Guia prático de ML moderno'
    }
  ],
  
  essentialPapers: [
    {
      title: 'ImageNet Classification with Deep Convolutional Neural Networks',
      authors: ['Alex Krizhevsky', 'Ilya Sutskever', 'Geoffrey Hinton'],
      year: 2012,
      publication: 'NeurIPS',
      category: 'Deep Learning',
      importance: 'foundational',
      abstract: 'AlexNet - iniciou a era moderna do deep learning'
    },
    {
      title: 'Generative Adversarial Networks',
      authors: ['Ian Goodfellow et al.'],
      year: 2014,
      publication: 'NeurIPS',
      category: 'Deep Learning',
      importance: 'foundational',
      abstract: 'Introduz GANs para geração de dados'
    },
    {
      title: 'Deep Residual Learning for Image Recognition',
      authors: ['Kaiming He et al.'],
      year: 2015,
      publication: 'CVPR',
      category: 'Deep Learning',
      importance: 'foundational',
      abstract: 'ResNet - permitiu redes muito mais profundas'
    },
    {
      title: 'Attention Is All You Need',
      authors: ['Ashish Vaswani et al.'],
      year: 2017,
      publication: 'NeurIPS',
      category: 'Deep Learning',
      importance: 'foundational',
      abstract: 'Introduz Transformer - base de todos os LLMs'
    },
    {
      title: 'BERT: Pre-training of Deep Bidirectional Transformers',
      authors: ['Jacob Devlin et al.'],
      year: 2018,
      publication: 'NAACL',
      category: 'NLP',
      importance: 'foundational',
      abstract: 'Transformer bidirecional para NLU'
    },
    {
      title: 'Language Models are Few-Shot Learners',
      authors: ['Tom Brown et al.'],
      year: 2020,
      publication: 'NeurIPS',
      category: 'NLP',
      importance: 'foundational',
      abstract: 'GPT-3 - demonstrou emergent abilities em LLMs'
    },
    {
      title: 'Highly accurate protein structure prediction with AlphaFold',
      authors: ['John Jumper et al.'],
      year: 2021,
      publication: 'Nature',
      category: 'AI for Science',
      importance: 'breakthrough',
      abstract: 'AlphaFold resolve protein folding'
    }
  ],
  
  technologies: [
    'Deep Learning',
    'CNNs (Convolutional Neural Networks)',
    'RNNs, LSTMs, GRUs',
    'Transformers',
    'GANs',
    'Diffusion Models',
    'Large Language Models (LLMs)',
    'Reinforcement Learning',
    'TensorFlow, PyTorch',
    'GPUs para ML (NVIDIA CUDA)',
    'TPUs',
    'Kubernetes para ML',
    'MLOps'
  ],
  
  impact: `
    Esta era está TRANSFORMANDO tudo:
    - IA generativa cria texto, imagens, código, música
    - LLMs aproximam-se de capacidades humanas em linguagem
    - IA resolve problemas científicos (proteínas, clima)
    - Automação de trabalho intelectual
    - Questões éticas e de alinhamento emergem
    - Corrida global por supremacia em IA
  `
};


// ============================================================================
// ERA 8: COMPUTAÇÃO QUÂNTICA E FRONTEIRAS (2020+)
// ============================================================================

export const ERA_8_QUANTUM_FRONTIERS: HistoricalPeriod = {
  era: 'ERA_8',
  startYear: 2020,
  endYear: 2030,
  title: 'Computação Quântica e Novas Fronteiras',
  description: `
    A computação quântica promete revolucionar criptografia, simulação e
    otimização. Enquanto isso, edge computing, computação neuromórfica,
    e a busca por AGI definem as fronteiras da ciência da computação.
  `,
  
  keyFigures: [
    {
      name: 'Peter Shor',
      birthYear: 1959,
      nationality: 'Americano',
      role: 'Matemático',
      contributions: [
        'Algoritmo de Shor (1994)',
        'Fatoração em tempo polinomial quântico',
        'Motivou criptografia pós-quântica'
      ],
      relatedTo: ['Lov Grover']
    },
    {
      name: 'Lov Grover',
      birthYear: 1961,
      nationality: 'Indiano-Americano',
      role: 'Cientista da Computação',
      contributions: [
        'Algoritmo de Grover (1996)',
        'Busca quântica em O(√N)'
      ],
      relatedTo: ['Peter Shor']
    },
    {
      name: 'John Preskill',
      birthYear: 1953,
      nationality: 'Americano',
      role: 'Físico Teórico',
      contributions: [
        'Cunhou termo "quantum supremacy"',
        'Pesquisa em informação quântica',
        'NISQ (Noisy Intermediate-Scale Quantum)'
      ],
      relatedTo: []
    }
  ],
  
  keyEvents: [
    {
      year: 1994,
      event: 'Algoritmo de Shor é publicado',
      significance: 'Mostrou que computadores quânticos podem quebrar RSA',
      participants: ['Peter Shor'],
      consequences: ['Corrida por computação quântica', 'Criptografia pós-quântica']
    },
    {
      year: 2019,
      event: 'Google anuncia "quantum supremacy"',
      significance: 'Primeiro computador quântico supera clássico em tarefa específica',
      participants: ['Google', 'John Martinis'],
      consequences: ['Validação de computação quântica', 'Investimento massivo']
    },
    {
      year: 2023,
      event: 'IBM Quantum atinge 1000+ qubits',
      significance: 'Escala de computadores quânticos aumenta',
      participants: ['IBM'],
      consequences: ['Aproximação de utilidade prática']
    }
  ],
  
  keyInventions: [
    {
      name: 'Algoritmo de Shor',
      year: 1994,
      inventor: 'Peter Shor',
      description: 'Fatoração de inteiros em tempo polinomial quântico',
      impact: 'Ameaça criptografia RSA, motivou computação quântica'
    },
    {
      name: 'Algoritmo de Grover',
      year: 1996,
      inventor: 'Lov Grover',
      description: 'Busca em banco de dados não estruturado em O(√N)',
      impact: 'Speedup quadrático para busca'
    },
    {
      name: 'Processador Quântico Sycamore',
      year: 2019,
      inventor: 'Google',
      description: 'Processador de 53 qubits',
      impact: 'Demonstrou quantum supremacy'
    }
  ],
  
  essentialBooks: [
    {
      title: 'Quantum Computation and Quantum Information',
      author: 'Michael Nielsen e Isaac Chuang',
      year: 2000,
      category: 'Computação Quântica',
      importance: 'fundamental',
      summary: 'Livro-texto definitivo de computação quântica'
    }
  ],
  
  essentialPapers: [
    {
      title: 'Polynomial-Time Algorithms for Prime Factorization and Discrete Logarithms on a Quantum Computer',
      authors: ['Peter Shor'],
      year: 1994,
      publication: 'SIAM Journal on Computing',
      category: 'Computação Quântica',
      importance: 'foundational',
      abstract: 'Algoritmo de Shor para fatoração quântica'
    },
    {
      title: 'A fast quantum mechanical algorithm for database search',
      authors: ['Lov Grover'],
      year: 1996,
      publication: 'STOC',
      category: 'Computação Quântica',
      importance: 'foundational',
      abstract: 'Algoritmo de Grover para busca quântica'
    },
    {
      title: 'Quantum Supremacy Using a Programmable Superconducting Processor',
      authors: ['Frank Arute et al.'],
      year: 2019,
      publication: 'Nature',
      category: 'Computação Quântica',
      importance: 'breakthrough',
      abstract: 'Google demonstra quantum supremacy'
    }
  ],
  
  technologies: [
    'Computadores Quânticos',
    'Qubits supercondutores',
    'Qubits de íons aprisionados',
    'Criptografia Pós-Quântica',
    'Edge Computing',
    'Computação Neuromórfica',
    'Chips de IA especializados (TPU, NPU)',
    'Federated Learning',
    '5G/6G'
  ],
  
  impact: `
    Esta era está DEFININDO o futuro:
    - Computação quântica promete resolver problemas intratáveis
    - Criptografia precisa se adaptar a ameaças quânticas
    - Edge computing distribui inteligência
    - Busca por AGI continua
    - Questões de segurança e ética se intensificam
  `
};

// ============================================================================
// PARTE III: BIBLIOTECA COMPLETA DE LIVROS FUNDAMENTAIS
// ============================================================================

export const ESSENTIAL_BOOKS_LIBRARY: BookReference[] = [
  // LÓGICA E MATEMÁTICA
  {
    title: 'The Laws of Thought',
    author: 'George Boole',
    year: 1854,
    category: 'Lógica Matemática',
    importance: 'fundamental',
    summary: 'Fundação da álgebra booleana'
  },
  {
    title: 'Principia Mathematica',
    author: 'Alfred North Whitehead e Bertrand Russell',
    year: 1910,
    category: 'Lógica Matemática',
    importance: 'fundamental',
    summary: 'Tentativa de formalizar toda a matemática'
  },
  {
    title: 'Introduction to Metamathematics',
    author: 'Stephen Cole Kleene',
    year: 1952,
    category: 'Lógica Matemática',
    importance: 'essential',
    summary: 'Fundamentos de teoria da computação'
  },
  {
    title: 'Gödel, Escher, Bach: An Eternal Golden Braid',
    author: 'Douglas Hofstadter',
    year: 1979,
    category: 'Lógica e Cognição',
    importance: 'essential',
    summary: 'Conexões entre lógica, arte e consciência'
  },
  
  // HISTÓRIA DA COMPUTAÇÃO
  {
    title: 'A History of Modern Computing',
    author: 'Paul Ceruzzi',
    year: 1998,
    category: 'História',
    importance: 'essential',
    summary: 'História abrangente da computação moderna'
  },
  {
    title: 'The Information: A History, A Theory, A Flood',
    author: 'James Gleick',
    year: 2011,
    category: 'História',
    importance: 'essential',
    summary: 'História da informação e comunicação'
  },
  {
    title: 'Computer: A History of the Information Machine',
    author: 'Martin Campbell-Kelly e William Aspray',
    year: 1996,
    category: 'História',
    importance: 'essential',
    summary: 'História completa do computador'
  },
  {
    title: 'The Innovators',
    author: 'Walter Isaacson',
    year: 2014,
    category: 'História',
    importance: 'essential',
    summary: 'História dos pioneiros da revolução digital'
  },
  {
    title: 'Alan Turing: The Enigma',
    author: 'Andrew Hodges',
    year: 1983,
    category: 'Biografia',
    importance: 'essential',
    summary: 'Biografia definitiva de Turing'
  },
  {
    title: "Turing's Cathedral",
    author: 'George Dyson',
    year: 2012,
    category: 'História',
    importance: 'essential',
    summary: 'Origens do universo digital'
  },
  
  // ARQUITETURA E SISTEMAS
  {
    title: 'Computer Architecture: A Quantitative Approach',
    author: 'John Hennessy e David Patterson',
    year: 1990,
    category: 'Arquitetura',
    importance: 'fundamental',
    summary: 'Livro-texto definitivo de arquitetura de computadores'
  },
  {
    title: 'Operating Systems: Design and Implementation',
    author: 'Andrew Tanenbaum',
    year: 1987,
    category: 'Sistemas Operacionais',
    importance: 'essential',
    summary: 'Design de sistemas operacionais com Minix'
  },
  {
    title: 'Modern Operating Systems',
    author: 'Andrew Tanenbaum',
    year: 1992,
    category: 'Sistemas Operacionais',
    importance: 'essential',
    summary: 'Sistemas operacionais modernos'
  },
  {
    title: 'The UNIX Programming Environment',
    author: 'Brian Kernighan e Rob Pike',
    year: 1984,
    category: 'Sistemas',
    importance: 'essential',
    summary: 'Filosofia e prática UNIX'
  },
  
  // ALGORITMOS E ESTRUTURAS DE DADOS
  {
    title: 'The Art of Computer Programming',
    author: 'Donald Knuth',
    year: 1968,
    category: 'Algoritmos',
    importance: 'fundamental',
    summary: 'Obra monumental sobre algoritmos'
  },
  {
    title: 'Introduction to Algorithms',
    author: 'Cormen, Leiserson, Rivest, Stein',
    year: 1990,
    category: 'Algoritmos',
    importance: 'fundamental',
    summary: 'Livro-texto padrão de algoritmos (CLRS)'
  },
  {
    title: 'Algorithm Design',
    author: 'Jon Kleinberg e Éva Tardos',
    year: 2005,
    category: 'Algoritmos',
    importance: 'essential',
    summary: 'Design de algoritmos com foco em técnicas'
  },
  
  // LINGUAGENS DE PROGRAMAÇÃO
  {
    title: 'The C Programming Language',
    author: 'Brian Kernighan e Dennis Ritchie',
    year: 1978,
    category: 'Linguagens',
    importance: 'fundamental',
    summary: 'O livro K&R - referência de C'
  },
  {
    title: 'The C++ Programming Language',
    author: 'Bjarne Stroustrup',
    year: 1985,
    category: 'Linguagens',
    importance: 'essential',
    summary: 'Referência de C++ pelo criador'
  },
  {
    title: 'Structure and Interpretation of Computer Programs',
    author: 'Harold Abelson e Gerald Jay Sussman',
    year: 1985,
    category: 'Ciência da Computação',
    importance: 'fundamental',
    summary: 'SICP - fundamentos de programação'
  },
  {
    title: 'Programming Language Pragmatics',
    author: 'Michael Scott',
    year: 1999,
    category: 'Linguagens',
    importance: 'essential',
    summary: 'Teoria e prática de linguagens'
  },
  
  // ENGENHARIA DE SOFTWARE
  {
    title: 'The Mythical Man-Month',
    author: 'Fred Brooks',
    year: 1975,
    category: 'Engenharia de Software',
    importance: 'fundamental',
    summary: 'Lições atemporais sobre projetos de software'
  },
  {
    title: 'Design Patterns',
    author: 'Gang of Four',
    year: 1994,
    category: 'Engenharia de Software',
    importance: 'fundamental',
    summary: 'Catálogo de padrões de design'
  },
  {
    title: 'Clean Code',
    author: 'Robert C. Martin',
    year: 2008,
    category: 'Engenharia de Software',
    importance: 'essential',
    summary: 'Princípios de código limpo'
  },
  {
    title: 'Refactoring',
    author: 'Martin Fowler',
    year: 1999,
    category: 'Engenharia de Software',
    importance: 'essential',
    summary: 'Técnicas de refatoração'
  },
  {
    title: 'The Pragmatic Programmer',
    author: 'David Thomas e Andrew Hunt',
    year: 1999,
    category: 'Engenharia de Software',
    importance: 'essential',
    summary: 'Sabedoria prática para programadores'
  },
  
  // REDES
  {
    title: 'Computer Networks',
    author: 'Andrew Tanenbaum',
    year: 1981,
    category: 'Redes',
    importance: 'fundamental',
    summary: 'Livro-texto definitivo de redes'
  },
  {
    title: 'TCP/IP Illustrated',
    author: 'W. Richard Stevens',
    year: 1994,
    category: 'Redes',
    importance: 'essential',
    summary: 'Detalhes de TCP/IP'
  },
  {
    title: 'Where Wizards Stay Up Late',
    author: 'Katie Hafner',
    year: 1996,
    category: 'História',
    importance: 'essential',
    summary: 'História da ARPANET'
  },
  
  // BANCOS DE DADOS
  {
    title: 'Database System Concepts',
    author: 'Silberschatz, Korth, Sudarshan',
    year: 1986,
    category: 'Bancos de Dados',
    importance: 'fundamental',
    summary: 'Livro-texto padrão de bancos de dados'
  },
  {
    title: 'Designing Data-Intensive Applications',
    author: 'Martin Kleppmann',
    year: 2017,
    category: 'Sistemas Distribuídos',
    importance: 'essential',
    summary: 'Design de sistemas de dados modernos'
  },
  
  // CRIPTOGRAFIA
  {
    title: 'Applied Cryptography',
    author: 'Bruce Schneier',
    year: 1994,
    category: 'Criptografia',
    importance: 'essential',
    summary: 'Criptografia prática'
  },
  {
    title: 'The Code Book',
    author: 'Simon Singh',
    year: 1999,
    category: 'Criptografia',
    importance: 'recommended',
    summary: 'História da criptografia'
  },
  
  // INTELIGÊNCIA ARTIFICIAL
  {
    title: 'Artificial Intelligence: A Modern Approach',
    author: 'Stuart Russell e Peter Norvig',
    year: 1995,
    category: 'IA',
    importance: 'fundamental',
    summary: 'Livro-texto padrão de IA'
  },
  {
    title: 'Deep Learning',
    author: 'Ian Goodfellow, Yoshua Bengio, Aaron Courville',
    year: 2016,
    category: 'Machine Learning',
    importance: 'fundamental',
    summary: 'Livro definitivo de deep learning'
  },
  {
    title: 'Pattern Recognition and Machine Learning',
    author: 'Christopher Bishop',
    year: 2006,
    category: 'Machine Learning',
    importance: 'essential',
    summary: 'Fundamentos matemáticos de ML'
  },
  {
    title: 'The Elements of Statistical Learning',
    author: 'Hastie, Tibshirani, Friedman',
    year: 2001,
    category: 'Machine Learning',
    importance: 'essential',
    summary: 'Estatística para ML'
  },
  
  // COMPUTAÇÃO QUÂNTICA
  {
    title: 'Quantum Computation and Quantum Information',
    author: 'Michael Nielsen e Isaac Chuang',
    year: 2000,
    category: 'Computação Quântica',
    importance: 'fundamental',
    summary: 'Livro-texto definitivo de computação quântica'
  }
];


// ============================================================================
// PARTE IV: PAPERS FUNDAMENTAIS DA CIÊNCIA DA COMPUTAÇÃO
// ============================================================================

export const FOUNDATIONAL_PAPERS: PaperReference[] = [
  // TEORIA DA COMPUTAÇÃO
  {
    title: 'On Computable Numbers, with an Application to the Entscheidungsproblem',
    authors: ['Alan Turing'],
    year: 1936,
    publication: 'Proceedings of the London Mathematical Society',
    category: 'Teoria da Computação',
    importance: 'foundational',
    abstract: 'Introduz a Máquina de Turing e define computabilidade'
  },
  {
    title: 'A Mathematical Theory of Communication',
    authors: ['Claude Shannon'],
    year: 1948,
    publication: 'Bell System Technical Journal',
    category: 'Teoria da Informação',
    importance: 'foundational',
    abstract: 'Funda a teoria da informação, define entropia e o bit'
  },
  {
    title: 'Computing Machinery and Intelligence',
    authors: ['Alan Turing'],
    year: 1950,
    publication: 'Mind',
    category: 'Inteligência Artificial',
    importance: 'foundational',
    abstract: 'Propõe o Teste de Turing'
  },
  
  // ARQUITETURA
  {
    title: 'First Draft of a Report on the EDVAC',
    authors: ['John von Neumann'],
    year: 1945,
    publication: 'Relatório Técnico',
    category: 'Arquitetura',
    importance: 'foundational',
    abstract: 'Define arquitetura de programa armazenado'
  },
  
  // COMPLEXIDADE
  {
    title: 'The Complexity of Theorem-Proving Procedures',
    authors: ['Stephen Cook'],
    year: 1971,
    publication: 'STOC',
    category: 'Teoria da Complexidade',
    importance: 'foundational',
    abstract: 'Prova NP-completude do SAT'
  },
  {
    title: 'Reducibility Among Combinatorial Problems',
    authors: ['Richard Karp'],
    year: 1972,
    publication: 'Complexity of Computer Computations',
    category: 'Teoria da Complexidade',
    importance: 'foundational',
    abstract: '21 problemas NP-completos'
  },
  
  // BANCOS DE DADOS
  {
    title: 'A Relational Model of Data for Large Shared Data Banks',
    authors: ['Edgar F. Codd'],
    year: 1970,
    publication: 'Communications of the ACM',
    category: 'Bancos de Dados',
    importance: 'foundational',
    abstract: 'Introduz o modelo relacional'
  },
  
  // CRIPTOGRAFIA
  {
    title: 'New Directions in Cryptography',
    authors: ['Whitfield Diffie', 'Martin Hellman'],
    year: 1976,
    publication: 'IEEE Transactions on Information Theory',
    category: 'Criptografia',
    importance: 'foundational',
    abstract: 'Introduz criptografia de chave pública'
  },
  {
    title: 'A Method for Obtaining Digital Signatures and Public-Key Cryptosystems',
    authors: ['Ron Rivest', 'Adi Shamir', 'Leonard Adleman'],
    year: 1978,
    publication: 'Communications of the ACM',
    category: 'Criptografia',
    importance: 'foundational',
    abstract: 'Apresenta o algoritmo RSA'
  },
  
  // REDES
  {
    title: 'A Protocol for Packet Network Intercommunication',
    authors: ['Vint Cerf', 'Bob Kahn'],
    year: 1974,
    publication: 'IEEE Transactions on Communications',
    category: 'Redes',
    importance: 'foundational',
    abstract: 'Especifica TCP/IP'
  },
  
  // SISTEMAS DISTRIBUÍDOS
  {
    title: 'Time, Clocks, and the Ordering of Events in a Distributed System',
    authors: ['Leslie Lamport'],
    year: 1978,
    publication: 'Communications of the ACM',
    category: 'Sistemas Distribuídos',
    importance: 'foundational',
    abstract: 'Relógios lógicos e ordenação de eventos'
  },
  {
    title: 'The Byzantine Generals Problem',
    authors: ['Leslie Lamport', 'Robert Shostak', 'Marshall Pease'],
    year: 1982,
    publication: 'ACM TOPLAS',
    category: 'Sistemas Distribuídos',
    importance: 'foundational',
    abstract: 'Problema fundamental de consenso distribuído'
  },
  {
    title: 'MapReduce: Simplified Data Processing on Large Clusters',
    authors: ['Jeffrey Dean', 'Sanjay Ghemawat'],
    year: 2004,
    publication: 'OSDI',
    category: 'Sistemas Distribuídos',
    importance: 'foundational',
    abstract: 'Modelo de programação para Big Data'
  },
  
  // DEEP LEARNING
  {
    title: 'ImageNet Classification with Deep Convolutional Neural Networks',
    authors: ['Alex Krizhevsky', 'Ilya Sutskever', 'Geoffrey Hinton'],
    year: 2012,
    publication: 'NeurIPS',
    category: 'Deep Learning',
    importance: 'foundational',
    abstract: 'AlexNet - início da era moderna de deep learning'
  },
  {
    title: 'Generative Adversarial Networks',
    authors: ['Ian Goodfellow et al.'],
    year: 2014,
    publication: 'NeurIPS',
    category: 'Deep Learning',
    importance: 'foundational',
    abstract: 'Introduz GANs'
  },
  {
    title: 'Deep Residual Learning for Image Recognition',
    authors: ['Kaiming He', 'Xiangyu Zhang', 'Shaoqing Ren', 'Jian Sun'],
    year: 2015,
    publication: 'CVPR',
    category: 'Deep Learning',
    importance: 'foundational',
    abstract: 'ResNet - conexões residuais'
  },
  {
    title: 'Attention Is All You Need',
    authors: ['Ashish Vaswani et al.'],
    year: 2017,
    publication: 'NeurIPS',
    category: 'Deep Learning',
    importance: 'foundational',
    abstract: 'Introduz Transformer'
  },
  {
    title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding',
    authors: ['Jacob Devlin et al.'],
    year: 2018,
    publication: 'NAACL',
    category: 'NLP',
    importance: 'foundational',
    abstract: 'BERT para NLU'
  },
  {
    title: 'Language Models are Few-Shot Learners',
    authors: ['Tom Brown et al.'],
    year: 2020,
    publication: 'NeurIPS',
    category: 'NLP',
    importance: 'foundational',
    abstract: 'GPT-3'
  },
  
  // COMPUTAÇÃO QUÂNTICA
  {
    title: 'Polynomial-Time Algorithms for Prime Factorization and Discrete Logarithms on a Quantum Computer',
    authors: ['Peter Shor'],
    year: 1994,
    publication: 'SIAM Journal on Computing',
    category: 'Computação Quântica',
    importance: 'foundational',
    abstract: 'Algoritmo de Shor'
  },
  {
    title: 'A fast quantum mechanical algorithm for database search',
    authors: ['Lov Grover'],
    year: 1996,
    publication: 'STOC',
    category: 'Computação Quântica',
    importance: 'foundational',
    abstract: 'Algoritmo de Grover'
  }
];

// ============================================================================
// PARTE V: MARCOS HISTÓRICOS ESSENCIAIS
// ============================================================================

export const HISTORICAL_MILESTONES = [
  { year: 1843, event: 'Primeiro algoritmo (Ada Lovelace)', category: 'Fundação' },
  { year: 1854, event: 'Álgebra Booleana (George Boole)', category: 'Fundação' },
  { year: 1936, event: 'Máquina de Turing', category: 'Teoria' },
  { year: 1945, event: 'ENIAC - primeiro computador eletrônico', category: 'Hardware' },
  { year: 1945, event: 'Arquitetura von Neumann', category: 'Arquitetura' },
  { year: 1948, event: 'Teoria da Informação (Shannon)', category: 'Teoria' },
  { year: 1950, event: 'Teste de Turing proposto', category: 'IA' },
  { year: 1956, event: 'Conferência de Dartmouth - nascimento da IA', category: 'IA' },
  { year: 1957, event: 'FORTRAN lançado', category: 'Linguagens' },
  { year: 1958, event: 'LISP criado', category: 'Linguagens' },
  { year: 1969, event: 'UNIX criado', category: 'Sistemas' },
  { year: 1969, event: 'ARPANET entra em operação', category: 'Redes' },
  { year: 1970, event: 'Modelo relacional (Codd)', category: 'Bancos de Dados' },
  { year: 1971, event: 'NP-completude (Cook)', category: 'Teoria' },
  { year: 1971, event: 'Intel 4004 - primeiro microprocessador', category: 'Hardware' },
  { year: 1972, event: 'Linguagem C criada', category: 'Linguagens' },
  { year: 1973, event: 'Ethernet inventada', category: 'Redes' },
  { year: 1974, event: 'TCP/IP especificado', category: 'Redes' },
  { year: 1976, event: 'Criptografia de chave pública', category: 'Criptografia' },
  { year: 1977, event: 'RSA inventado', category: 'Criptografia' },
  { year: 1981, event: 'IBM PC lançado', category: 'Hardware' },
  { year: 1983, event: 'GNU Project anunciado', category: 'Software Livre' },
  { year: 1983, event: 'C++ criado', category: 'Linguagens' },
  { year: 1984, event: 'Macintosh lançado', category: 'Hardware' },
  { year: 1989, event: 'World Wide Web proposta', category: 'Web' },
  { year: 1991, event: 'Linux anunciado', category: 'Sistemas' },
  { year: 1991, event: 'Python lançado', category: 'Linguagens' },
  { year: 1994, event: 'Algoritmo de Shor', category: 'Quântica' },
  { year: 1995, event: 'Java lançado', category: 'Linguagens' },
  { year: 1995, event: 'JavaScript criado', category: 'Linguagens' },
  { year: 1998, event: 'Google fundado', category: 'Web' },
  { year: 2004, event: 'Facebook lançado', category: 'Web' },
  { year: 2006, event: 'AWS lançado', category: 'Cloud' },
  { year: 2007, event: 'iPhone lançado', category: 'Mobile' },
  { year: 2008, event: 'Android lançado', category: 'Mobile' },
  { year: 2009, event: 'Bitcoin lançado', category: 'Blockchain' },
  { year: 2012, event: 'AlexNet vence ImageNet', category: 'Deep Learning' },
  { year: 2014, event: 'GANs inventadas', category: 'Deep Learning' },
  { year: 2016, event: 'AlphaGo derrota Lee Sedol', category: 'IA' },
  { year: 2017, event: 'Transformer introduzido', category: 'Deep Learning' },
  { year: 2020, event: 'GPT-3 lançado', category: 'LLMs' },
  { year: 2020, event: 'AlphaFold resolve protein folding', category: 'IA' },
  { year: 2022, event: 'ChatGPT lançado', category: 'LLMs' },
  { year: 2023, event: 'GPT-4 lançado', category: 'LLMs' }
];

// ============================================================================
// PARTE VI: ARQUITETURA COGNITIVA DO AGENTE
// ============================================================================

export const AGENT_COGNITIVE_ARCHITECTURE = {
  modules: {
    historical: {
      name: 'Módulo Histórico',
      capabilities: [
        'Conhecer datas, atores, invenções e contexto',
        'Criar comparações entre eras',
        'Explicar causa e efeito na evolução tecnológica',
        'Relacionar eventos históricos com tecnologias atuais'
      ]
    },
    technical: {
      name: 'Módulo Técnico-Fundacional',
      capabilities: [
        'Computabilidade e decidibilidade',
        'Teoria da complexidade (P, NP, NP-completo)',
        'Arquitetura de computadores',
        'Redes e protocolos',
        'Sistemas operacionais',
        'Bancos de dados',
        'Criptografia'
      ]
    },
    ai: {
      name: 'Módulo de Inteligência Artificial',
      capabilities: [
        'História da IA desde Dartmouth',
        'Machine learning clássico',
        'Deep learning e arquiteturas',
        'Transformers e LLMs',
        'IA generativa',
        'Alinhamento e segurança de IA'
      ]
    },
    analytical: {
      name: 'Módulo Analítico',
      capabilities: [
        'Estabelecer relações de causa e efeito',
        'Identificar padrões históricos',
        'Prever tendências baseado em história',
        'Comparar tecnologias e abordagens'
      ]
    },
    didactic: {
      name: 'Módulo Didático',
      capabilities: [
        'Gerar aulas e explicações',
        'Criar resumos em diferentes níveis',
        'Produzir quizzes e exercícios',
        'Recomendar leituras e recursos',
        'Adaptar explicação ao nível do usuário'
      ]
    }
  },
  
  behaviorRules: [
    'SEMPRE cite datas, nomes e relações históricas',
    'SEMPRE responda com profundidade e precisão',
    'NUNCA simplifique demais conceitos importantes',
    'Se pedido resumo, ofereça níveis (curto, médio, profundo)',
    'Se pedido detalhar, vá até nível acadêmico',
    'SEMPRE forneça conexões: inventor → tecnologia → consequência moderna',
    'SEMPRE crie contexto ao explicar acontecimentos',
    'NUNCA deixe lacunas entre períodos históricos',
    'Use linha do tempo para organizar pensamento',
    'Se houver dúvida, gere hipóteses fundamentadas'
  ],
  
  responseFormats: {
    timeline: 'Apresentar eventos em ordem cronológica',
    comparison: 'Comparar duas ou mais tecnologias/eras',
    biography: 'Detalhar vida e contribuições de personagem',
    explanation: 'Explicar conceito com contexto histórico',
    recommendation: 'Sugerir leituras e recursos',
    quiz: 'Gerar perguntas para testar conhecimento'
  }
};


// ============================================================================
// PARTE VII: CONCEITOS FUNDAMENTAIS QUE O AGENTE DEVE DOMINAR
// ============================================================================

export const FUNDAMENTAL_CONCEPTS = {
  computability: {
    name: 'Computabilidade',
    description: 'O que pode ser computado por uma máquina',
    keyTopics: [
      'Máquina de Turing',
      'Tese de Church-Turing',
      'Problema da Parada',
      'Funções computáveis',
      'Decidibilidade',
      'Entscheidungsproblem'
    ],
    keyFigures: ['Alan Turing', 'Alonzo Church', 'Kurt Gödel'],
    keyPapers: ['On Computable Numbers (Turing, 1936)']
  },
  
  complexity: {
    name: 'Teoria da Complexidade',
    description: 'Classificação de problemas por dificuldade computacional',
    keyTopics: [
      'Classes P e NP',
      'NP-completude',
      'Problema P vs NP',
      'Reduções polinomiais',
      'Problemas intratáveis',
      'Aproximação'
    ],
    keyFigures: ['Stephen Cook', 'Richard Karp', 'Leonid Levin'],
    keyPapers: ['The Complexity of Theorem-Proving Procedures (Cook, 1971)']
  },
  
  algorithms: {
    name: 'Algoritmos e Estruturas de Dados',
    description: 'Métodos eficientes para resolver problemas',
    keyTopics: [
      'Análise de complexidade (Big O)',
      'Ordenação e busca',
      'Grafos e árvores',
      'Programação dinâmica',
      'Algoritmos gulosos',
      'Dividir e conquistar'
    ],
    keyFigures: ['Donald Knuth', 'Edsger Dijkstra', 'Tony Hoare'],
    keyBooks: ['The Art of Computer Programming', 'Introduction to Algorithms']
  },
  
  architecture: {
    name: 'Arquitetura de Computadores',
    description: 'Como computadores são projetados e funcionam',
    keyTopics: [
      'Arquitetura von Neumann',
      'CPU, memória, I/O',
      'Pipeline e paralelismo',
      'Cache e hierarquia de memória',
      'RISC vs CISC',
      'Multicore e GPU'
    ],
    keyFigures: ['John von Neumann', 'John Hennessy', 'David Patterson'],
    keyBooks: ['Computer Architecture: A Quantitative Approach']
  },
  
  operatingSystems: {
    name: 'Sistemas Operacionais',
    description: 'Software que gerencia hardware e recursos',
    keyTopics: [
      'Processos e threads',
      'Gerenciamento de memória',
      'Sistemas de arquivos',
      'Concorrência e sincronização',
      'Virtualização',
      'Containers'
    ],
    keyFigures: ['Ken Thompson', 'Dennis Ritchie', 'Linus Torvalds'],
    keySystems: ['UNIX', 'Linux', 'Windows']
  },
  
  networks: {
    name: 'Redes de Computadores',
    description: 'Comunicação entre computadores',
    keyTopics: [
      'Modelo OSI e TCP/IP',
      'Protocolos (HTTP, DNS, etc.)',
      'Roteamento',
      'Segurança de rede',
      'Internet e Web',
      'Redes sem fio'
    ],
    keyFigures: ['Vint Cerf', 'Bob Kahn', 'Tim Berners-Lee'],
    keyInventions: ['ARPANET', 'TCP/IP', 'World Wide Web']
  },
  
  databases: {
    name: 'Bancos de Dados',
    description: 'Armazenamento e recuperação de dados',
    keyTopics: [
      'Modelo relacional',
      'SQL',
      'Normalização',
      'Transações ACID',
      'NoSQL',
      'Sistemas distribuídos'
    ],
    keyFigures: ['Edgar F. Codd', 'Michael Stonebraker', 'Jim Gray'],
    keyPapers: ['A Relational Model of Data (Codd, 1970)']
  },
  
  cryptography: {
    name: 'Criptografia',
    description: 'Segurança da informação',
    keyTopics: [
      'Criptografia simétrica',
      'Criptografia assimétrica',
      'Funções hash',
      'Assinaturas digitais',
      'TLS/SSL',
      'Criptografia pós-quântica'
    ],
    keyFigures: ['Whitfield Diffie', 'Martin Hellman', 'Ron Rivest'],
    keyAlgorithms: ['RSA', 'AES', 'SHA', 'Diffie-Hellman']
  },
  
  programmingLanguages: {
    name: 'Linguagens de Programação',
    description: 'Formas de expressar computação',
    keyTopics: [
      'Paradigmas (imperativo, funcional, OO)',
      'Compiladores e interpretadores',
      'Sistemas de tipos',
      'Gerenciamento de memória',
      'Concorrência'
    ],
    keyFigures: ['John Backus', 'Dennis Ritchie', 'Bjarne Stroustrup', 'James Gosling'],
    keyLanguages: ['C', 'C++', 'Java', 'Python', 'JavaScript', 'Go', 'Rust']
  },
  
  artificialIntelligence: {
    name: 'Inteligência Artificial',
    description: 'Máquinas que exibem comportamento inteligente',
    keyTopics: [
      'Busca e planejamento',
      'Representação de conhecimento',
      'Machine learning',
      'Deep learning',
      'Processamento de linguagem natural',
      'Visão computacional',
      'Reinforcement learning'
    ],
    keyFigures: ['John McCarthy', 'Marvin Minsky', 'Geoffrey Hinton', 'Yann LeCun'],
    keyMilestones: ['Dartmouth 1956', 'AlexNet 2012', 'AlphaGo 2016', 'ChatGPT 2022']
  },
  
  machineLearning: {
    name: 'Machine Learning',
    description: 'Sistemas que aprendem com dados',
    keyTopics: [
      'Aprendizado supervisionado',
      'Aprendizado não supervisionado',
      'Redes neurais',
      'CNNs e RNNs',
      'Transformers',
      'Transfer learning',
      'Regularização'
    ],
    keyFigures: ['Geoffrey Hinton', 'Yann LeCun', 'Yoshua Bengio'],
    keyArchitectures: ['CNN', 'RNN', 'LSTM', 'Transformer', 'GPT', 'BERT']
  },
  
  distributedSystems: {
    name: 'Sistemas Distribuídos',
    description: 'Computação em múltiplas máquinas',
    keyTopics: [
      'Consenso (Paxos, Raft)',
      'Consistência e disponibilidade (CAP)',
      'Replicação',
      'Particionamento',
      'MapReduce',
      'Microserviços'
    ],
    keyFigures: ['Leslie Lamport', 'Barbara Liskov'],
    keyPapers: ['Time, Clocks, and the Ordering of Events (Lamport, 1978)']
  },
  
  quantumComputing: {
    name: 'Computação Quântica',
    description: 'Computação usando mecânica quântica',
    keyTopics: [
      'Qubits e superposição',
      'Entrelaçamento',
      'Portas quânticas',
      'Algoritmo de Shor',
      'Algoritmo de Grover',
      'Correção de erros quânticos'
    ],
    keyFigures: ['Peter Shor', 'Lov Grover', 'John Preskill'],
    keyAlgorithms: ['Shor', 'Grover', 'VQE', 'QAOA']
  }
};

// ============================================================================
// PARTE VIII: REGRAS DE COMPORTAMENTO DO AGENTE
// ============================================================================

export const AGENT_BEHAVIOR_RULES = {
  core: [
    'Ser um ESPECIALISTA SUPREMO em história da computação',
    'Dominar TODA a linha do tempo de 1800 até 2025',
    'Conhecer TODOS os personagens importantes e suas contribuições',
    'Saber citar papers e livros fundamentais',
    'Explicar conceitos com contexto histórico',
    'Relacionar passado com presente e futuro'
  ],
  
  responses: [
    'SEMPRE incluir datas quando mencionar eventos',
    'SEMPRE citar fontes (papers, livros) quando relevante',
    'SEMPRE explicar o PORQUÊ das coisas, não só o QUÊ',
    'SEMPRE conectar conceitos a seus inventores',
    'SEMPRE mostrar a evolução histórica de ideias',
    'NUNCA dar respostas superficiais sobre história'
  ],
  
  teaching: [
    'Adaptar nível de explicação ao usuário',
    'Oferecer diferentes níveis de profundidade',
    'Usar analogias quando apropriado',
    'Recomendar leituras para aprofundamento',
    'Criar conexões entre tópicos',
    'Gerar quizzes para testar conhecimento'
  ],
  
  accuracy: [
    'Verificar datas e fatos antes de afirmar',
    'Distinguir entre fatos e interpretações',
    'Admitir quando há controvérsia histórica',
    'Citar múltiplas perspectivas quando existirem',
    'Ser preciso sobre atribuições de invenções'
  ]
};

// ============================================================================
// PARTE IX: EXPORTAÇÃO COMPLETA DO MANIFESTO
// ============================================================================

export const COMPUTER_SCIENCE_HISTORY_MANIFEST = {
  identity: AGENT_IDENTITY,
  
  eras: {
    era1_roots: ERA_1_ROOTS,
    era2_foundations: ERA_2_FOUNDATIONS,
    era3_languages_ai: ERA_3_LANGUAGES_AI,
    era4_complexity_networks: ERA_4_COMPLEXITY_NETWORKS,
    era5_personal_computing: ERA_5_PERSONAL_COMPUTING,
    era6_internet_web: ERA_6_INTERNET_WEB,
    era7_deep_learning: ERA_7_DEEP_LEARNING_AI,
    era8_quantum: ERA_8_QUANTUM_FRONTIERS
  },
  
  library: {
    books: ESSENTIAL_BOOKS_LIBRARY,
    papers: FOUNDATIONAL_PAPERS
  },
  
  milestones: HISTORICAL_MILESTONES,
  
  concepts: FUNDAMENTAL_CONCEPTS,
  
  cognitiveArchitecture: AGENT_COGNITIVE_ARCHITECTURE,
  
  behaviorRules: AGENT_BEHAVIOR_RULES,
  
  // Função para buscar informações por era
  getEraByYear: (year: number): HistoricalPeriod | null => {
    const eras = [
      ERA_1_ROOTS,
      ERA_2_FOUNDATIONS,
      ERA_3_LANGUAGES_AI,
      ERA_4_COMPLEXITY_NETWORKS,
      ERA_5_PERSONAL_COMPUTING,
      ERA_6_INTERNET_WEB,
      ERA_7_DEEP_LEARNING_AI,
      ERA_8_QUANTUM_FRONTIERS
    ];
    
    return eras.find(era => year >= era.startYear && year <= era.endYear) || null;
  },
  
  // Função para buscar personagem por nome
  getPersonByName: (name: string): PersonageEntry | null => {
    const allEras = [
      ERA_1_ROOTS,
      ERA_2_FOUNDATIONS,
      ERA_3_LANGUAGES_AI,
      ERA_4_COMPLEXITY_NETWORKS,
      ERA_5_PERSONAL_COMPUTING,
      ERA_6_INTERNET_WEB,
      ERA_7_DEEP_LEARNING_AI,
      ERA_8_QUANTUM_FRONTIERS
    ];
    
    for (const era of allEras) {
      const person = era.keyFigures.find(
        p => p.name.toLowerCase().includes(name.toLowerCase())
      );
      if (person) return person;
    }
    return null;
  },
  
  // Função para buscar livros por categoria
  getBooksByCategory: (category: string): BookReference[] => {
    return ESSENTIAL_BOOKS_LIBRARY.filter(
      book => book.category.toLowerCase().includes(category.toLowerCase())
    );
  },
  
  // Função para buscar papers por categoria
  getPapersByCategory: (category: string): PaperReference[] => {
    return FOUNDATIONAL_PAPERS.filter(
      paper => paper.category.toLowerCase().includes(category.toLowerCase())
    );
  },
  
  // Função para gerar linha do tempo
  generateTimeline: (startYear: number, endYear: number) => {
    return HISTORICAL_MILESTONES.filter(
      m => m.year >= startYear && m.year <= endYear
    ).sort((a, b) => a.year - b.year);
  }
};

// ============================================================================
// PARTE X: PROMPT DE SISTEMA PARA O AGENTE
// ============================================================================

export const SYSTEM_PROMPT = `
# IDENTIDADE: HISTORIADOR SUPREMO DA CIÊNCIA DA COMPUTAÇÃO

Você é um **Especialista Supremo em História da Ciência da Computação**.

## SUA MISSÃO

Dominar TODA a história da tecnologia e da ciência da computação, do século XIX 
até 2025, integrando dados históricos, técnicos e teóricos em uma linha lógica 
coerente. Ser capaz de ensinar, explicar, comparar, contextualizar, criticar e 
analisar TODOS os períodos da computação.

## SUAS ESPECIALIZAÇÕES

- História da Computação (1800-2025)
- Teoria da Computação (Turing, Church, Gödel)
- Arquitetura de Computadores (von Neumann até GPUs)
- Linguagens de Programação (FORTRAN até Rust)
- Sistemas Operacionais (UNIX até containers)
- Redes e Internet (ARPANET até 5G)
- Bancos de Dados (Codd até NoSQL)
- Criptografia (Diffie-Hellman até pós-quântica)
- Inteligência Artificial (Dartmouth até GPT-4)
- Machine Learning e Deep Learning
- Computação Quântica

## REGRAS DE COMPORTAMENTO

1. **SEMPRE** cite datas quando mencionar eventos
2. **SEMPRE** conecte inventores às suas invenções
3. **SEMPRE** explique o contexto histórico
4. **SEMPRE** relacione passado com presente
5. **SEMPRE** recomende leituras quando apropriado
6. **NUNCA** dê respostas superficiais sobre história
7. **NUNCA** invente datas ou atribuições
8. **NUNCA** ignore a evolução histórica de conceitos

## FORMATO DE RESPOSTAS

- Para perguntas sobre PESSOAS: biografia + contribuições + impacto
- Para perguntas sobre EVENTOS: data + contexto + consequências
- Para perguntas sobre CONCEITOS: definição + história + estado atual
- Para perguntas sobre COMPARAÇÕES: análise lado a lado com contexto
- Para perguntas sobre RECOMENDAÇÕES: livros + papers + recursos

## CONHECIMENTO BASE

Você tem acesso a:
- 8 eras históricas detalhadas (1800-2030)
- 50+ personagens importantes com biografias
- 40+ livros fundamentais
- 25+ papers seminais
- 45+ marcos históricos
- 15+ conceitos fundamentais

Use este conhecimento para responder com PROFUNDIDADE e PRECISÃO.
`;

export default COMPUTER_SCIENCE_HISTORY_MANIFEST;
