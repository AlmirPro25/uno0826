/**
 * 🌍 POLYGLOT LANGUAGES MASTER MANIFEST
 * A Aula Definitiva das Linguagens de Programação
 * 
 * Da primeira linha de código até 2025
 * Cada linguagem, sua história, onde ganha, onde perde
 * 
 * Criado por: Almir - Salvador, Bahia
 * "Conhecer as linguagens é conhecer a história da humanidade digital"
 */

export const POLYGLOT_LANGUAGES_MASTER_MANIFEST = {
  // ============================================================================
  // METADATA E ATIVAÇÃO
  // ============================================================================
  
  metadata: {
    name: 'POLYGLOT_LANGUAGES_MASTER',
    displayName: 'Aula das Linguagens - História Completa da Programação',
    version: '1.0.0',
    author: 'Almir - Salvador, Bahia',
    keywords: [
      // Linguagens
      'assembly', 'fortran', 'cobol', 'lisp', 'basic',
      'c', 'c++', 'objective-c', 'pascal', 'ada',
      'perl', 'python', 'ruby', 'php', 'java',
      'javascript', 'typescript', 'c#', 'csharp',
      'go', 'golang', 'rust', 'swift', 'kotlin',
      'scala', 'clojure', 'elixir', 'erlang', 'haskell',
      'lua', 'r', 'matlab', 'julia', 'dart', 'flutter',
      'zig', 'mojo', 'carbon', 'v', 'nim',
      // Conceitos
      'linguagem de programação', 'programming language',
      'história das linguagens', 'comparação de linguagens',
      'qual linguagem usar', 'melhor linguagem',
      'linguagem para iniciante', 'primeira linguagem',
      'backend', 'frontend', 'mobile', 'sistemas', 'embarcados',
      'paradigma', 'orientação a objetos', 'funcional', 'procedural'
    ]
  },

  // ============================================================================
  // FILOSOFIA
  // ============================================================================

  philosophy: {
    core: 'Não existe linguagem perfeita. Existe a linguagem certa para o problema certo.',
    truths: [
      'Cada linguagem nasceu para resolver um problema específico',
      'O que uma ganha em simplicidade, perde em controle',
      'O que uma ganha em performance, perde em produtividade',
      'Linguagens evoluem ou morrem - não existe estagnação',
      'O programador poliglota é mais valioso que o especialista'
    ]
  },

  // ============================================================================
  // LINHA DO TEMPO COMPLETA
  // ============================================================================

  timeline: {
    era1_origins: {
      name: 'Era das Origens (1940-1959)',
      description: 'O nascimento da programação',
      languages: {
        machineCode: {
          year: 1940,
          description: 'Código binário direto - 0s e 1s',
          impact: 'A única linguagem que o computador realmente entende'
        },
        assembly: {
          year: 1949,
          creator: 'Vários (EDSAC)',
          description: 'Mnemônicos para instruções de máquina',
          impact: 'Primeira abstração sobre o hardware'
        },
        fortran: {
          year: 1957,
          creator: 'John Backus (IBM)',
          description: 'FORmula TRANslation - primeira linguagem de alto nível',
          impact: 'Revolucionou a computação científica'
        },
        lisp: {
          year: 1958,
          creator: 'John McCarthy (MIT)',
          description: 'LISt Processing - primeira linguagem funcional',
          impact: 'Base da inteligência artificial'
        },
        cobol: {
          year: 1959,
          creator: 'Grace Hopper e comitê',
          description: 'COmmon Business-Oriented Language',
          impact: 'Ainda roda 95% das transações bancárias'
        }
      }
    },

    era2_structured: {
      name: 'Era Estruturada (1960-1979)',
      description: 'Programação estruturada e sistemas operacionais',
      languages: {
        basic: {
          year: 1964,
          creator: 'Kemeny & Kurtz (Dartmouth)',
          description: 'Beginners All-purpose Symbolic Instruction Code',
          impact: 'Democratizou a programação para iniciantes'
        },
        pascal: {
          year: 1970,
          creator: 'Niklaus Wirth',
          description: 'Linguagem educacional estruturada',
          impact: 'Ensinou uma geração a programar corretamente'
        },
        c: {
          year: 1972,
          creator: 'Dennis Ritchie (Bell Labs)',
          description: 'Linguagem de sistemas de baixo nível',
          impact: 'Base do UNIX, Linux, Windows e praticamente tudo'
        },
        sql: {
          year: 1974,
          creator: 'Donald Chamberlin (IBM)',
          description: 'Structured Query Language',
          impact: 'Padrão universal para bancos de dados'
        },
        ada: {
          year: 1980,
          creator: 'Jean Ichbiah (DoD)',
          description: 'Linguagem para sistemas críticos',
          impact: 'Usada em aviação, defesa, sistemas de vida'
        }
      }
    },

    era3_oop: {
      name: 'Era da Orientação a Objetos (1980-1995)',
      description: 'O paradigma que dominou o mundo',
      languages: {
        cpp: {
          year: 1983,
          creator: 'Bjarne Stroustrup (Bell Labs)',
          description: 'C com Classes - OOP + baixo nível',
          impact: 'Jogos, sistemas, browsers, tudo de alta performance'
        },
        objectiveC: {
          year: 1984,
          creator: 'Brad Cox',
          description: 'C com Smalltalk',
          impact: 'Base do macOS e iOS por décadas'
        },
        perl: {
          year: 1987,
          creator: 'Larry Wall',
          description: 'Practical Extraction and Report Language',
          impact: 'A "fita adesiva da internet" nos anos 90'
        },
        python: {
          year: 1991,
          creator: 'Guido van Rossum',
          description: 'Linguagem legível e versátil',
          impact: 'Domina IA, ciência de dados, automação'
        },
        ruby: {
          year: 1995,
          creator: 'Yukihiro Matsumoto (Matz)',
          description: 'Linguagem otimizada para felicidade do programador',
          impact: 'Rails revolucionou desenvolvimento web'
        },
        java: {
          year: 1995,
          creator: 'James Gosling (Sun)',
          description: 'Write Once, Run Anywhere',
          impact: 'Enterprise, Android, bilhões de dispositivos'
        },
        javascript: {
          year: 1995,
          creator: 'Brendan Eich (Netscape)',
          description: 'Criada em 10 dias para o browser',
          impact: 'A linguagem mais usada do mundo'
        },
        php: {
          year: 1995,
          creator: 'Rasmus Lerdorf',
          description: 'Personal Home Page → PHP: Hypertext Preprocessor',
          impact: '78% dos sites com backend conhecido usam PHP'
        }
      }
    },

    era4_modern: {
      name: 'Era Moderna (2000-2015)',
      description: 'Web 2.0, mobile e cloud',
      languages: {
        csharp: {
          year: 2000,
          creator: 'Anders Hejlsberg (Microsoft)',
          description: 'Java da Microsoft, mas melhor',
          impact: 'Windows, Unity, enterprise, .NET'
        },
        scala: {
          year: 2004,
          creator: 'Martin Odersky',
          description: 'Funcional + OOP na JVM',
          impact: 'Big Data (Spark), sistemas distribuídos'
        },
        go: {
          year: 2009,
          creator: 'Rob Pike, Ken Thompson (Google)',
          description: 'Simplicidade + concorrência',
          impact: 'Docker, Kubernetes, infraestrutura cloud'
        },
        rust: {
          year: 2010,
          creator: 'Graydon Hoare (Mozilla)',
          description: 'Segurança de memória sem garbage collector',
          impact: 'Sistemas, browsers, blockchain, segurança'
        },
        kotlin: {
          year: 2011,
          creator: 'JetBrains',
          description: 'Java moderno e conciso',
          impact: 'Linguagem oficial do Android'
        },
        typescript: {
          year: 2012,
          creator: 'Anders Hejlsberg (Microsoft)',
          description: 'JavaScript com tipos',
          impact: 'Padrão para projetos JS sérios'
        },
        elixir: {
          year: 2012,
          creator: 'José Valim (brasileiro!)',
          description: 'Ruby + Erlang = concorrência elegante',
          impact: 'WhatsApp, Discord, sistemas real-time'
        },
        swift: {
          year: 2014,
          creator: 'Chris Lattner (Apple)',
          description: 'Substituto moderno do Objective-C',
          impact: 'iOS, macOS, watchOS, tvOS'
        }
      }
    },

    era5_future: {
      name: 'Era do Futuro (2015-2025+)',
      description: 'IA, WebAssembly e novas fronteiras',
      languages: {
        dart: {
          year: 2011,
          creator: 'Google',
          description: 'Linguagem do Flutter',
          impact: 'Apps multiplataforma (iOS, Android, Web, Desktop)'
        },
        julia: {
          year: 2012,
          creator: 'MIT',
          description: 'Python + velocidade de C',
          impact: 'Computação científica de alta performance'
        },
        zig: {
          year: 2016,
          creator: 'Andrew Kelley',
          description: 'C moderno sem as armadilhas',
          impact: 'Sistemas, compiladores, substituir C'
        },
        v: {
          year: 2019,
          creator: 'Alexander Medvednikov',
          description: 'Simplicidade de Go + velocidade de C',
          impact: 'Compilação instantânea, sem dependências'
        },
        mojo: {
          year: 2023,
          creator: 'Chris Lattner (Modular)',
          description: 'Python com velocidade de C++',
          impact: 'IA e ML com performance nativa'
        },
        carbon: {
          year: 2022,
          creator: 'Google',
          description: 'Sucessor experimental do C++',
          impact: 'Modernizar código C++ legado'
        }
      }
    }
  }
};


// ============================================================================
// FICHAS TÉCNICAS COMPLETAS - CADA LINGUAGEM
// ============================================================================

export const LANGUAGE_CARDS = {
  // ==========================================================================
  // ASSEMBLY
  // ==========================================================================
  assembly: {
    name: 'Assembly',
    year: 1949,
    creator: 'Vários (EDSAC, IBM)',
    paradigm: ['Imperativo', 'Baixo nível'],
    typing: 'Nenhum (registradores)',
    
    philosophy: 'Controle total sobre o hardware',
    
    whereWins: [
      'Performance máxima absoluta',
      'Drivers e kernel',
      'Bootloaders',
      'Sistemas embarcados críticos',
      'Otimização de hot paths',
      'Engenharia reversa',
      'Exploits e segurança'
    ],
    
    whereLoses: [
      'Produtividade (muito verboso)',
      'Portabilidade (específico por CPU)',
      'Manutenção (difícil de ler)',
      'Aplicações de alto nível',
      'Desenvolvimento rápido'
    ],
    
    competitors: ['C', 'Rust', 'Zig'],
    
    usedIn2025: [
      'Kernel do Linux (partes críticas)',
      'BIOS/UEFI',
      'Drivers de hardware',
      'Emuladores',
      'Criptografia otimizada'
    ],
    
    codeExample: `
; Assembly x86_64 - Soma dois números
section .text
global _start

_start:
    mov rax, 5      ; primeiro número
    mov rbx, 3      ; segundo número
    add rax, rbx    ; rax = 5 + 3 = 8
    
    ; exit syscall
    mov rax, 60
    xor rdi, rdi
    syscall
    `,
    
    verdict: 'Use quando cada ciclo de CPU importa. Evite para todo o resto.'
  },

  // ==========================================================================
  // C
  // ==========================================================================
  c: {
    name: 'C',
    year: 1972,
    creator: 'Dennis Ritchie (Bell Labs)',
    paradigm: ['Imperativo', 'Procedural'],
    typing: 'Estático, fraco',
    
    philosophy: 'Confiança no programador, acesso direto ao hardware',
    
    whereWins: [
      'Sistemas operacionais',
      'Drivers',
      'Sistemas embarcados',
      'Performance crítica',
      'Portabilidade (roda em tudo)',
      'Bibliotecas de baixo nível',
      'Interpretadores de outras linguagens'
    ],
    
    whereLoses: [
      'Segurança de memória (buffer overflow)',
      'Strings e manipulação de texto',
      'Desenvolvimento web',
      'Aplicações de alto nível',
      'Programação concorrente segura'
    ],
    
    competitors: ['Rust', 'Zig', 'C++', 'Go'],
    
    usedIn2025: [
      'Linux Kernel',
      'Windows Kernel',
      'SQLite',
      'Git',
      'Python (CPython)',
      'Redis',
      'Nginx'
    ],
    
    codeExample: `
#include <stdio.h>

int main() {
    int a = 5, b = 3;
    int soma = a + b;
    printf("Soma: %d\\n", soma);
    return 0;
}
    `,
    
    verdict: 'A mãe de todas as linguagens modernas. Ainda essencial em 2025.'
  },

  // ==========================================================================
  // C++
  // ==========================================================================
  cpp: {
    name: 'C++',
    year: 1983,
    creator: 'Bjarne Stroustrup (Bell Labs)',
    paradigm: ['OOP', 'Procedural', 'Genérico', 'Funcional'],
    typing: 'Estático, forte',
    
    philosophy: 'Você não paga pelo que não usa',
    
    whereWins: [
      'Jogos AAA (Unreal Engine)',
      'Browsers (Chrome, Firefox)',
      'Sistemas de alta performance',
      'Computação gráfica',
      'Sistemas financeiros (HFT)',
      'Compiladores',
      'Bancos de dados'
    ],
    
    whereLoses: [
      'Complexidade absurda',
      'Tempo de compilação',
      'Segurança de memória',
      'Curva de aprendizado',
      'Desenvolvimento web',
      'Scripts rápidos'
    ],
    
    competitors: ['Rust', 'C', 'Go', 'Zig'],
    
    usedIn2025: [
      'Unreal Engine',
      'Chrome/Chromium',
      'Firefox',
      'MySQL/PostgreSQL',
      'Adobe Suite',
      'Microsoft Office',
      'TensorFlow (core)'
    ],
    
    codeExample: `
#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    std::vector<int> nums = {5, 2, 8, 1, 9};
    std::sort(nums.begin(), nums.end());
    
    for (int n : nums) {
        std::cout << n << " ";
    }
    return 0;
}
    `,
    
    verdict: 'Poder absoluto com complexidade absoluta. Use se precisar de performance E OOP.'
  },

  // ==========================================================================
  // PHP
  // ==========================================================================
  php: {
    name: 'PHP',
    year: 1995,
    creator: 'Rasmus Lerdorf',
    paradigm: ['OOP', 'Procedural', 'Funcional'],
    typing: 'Dinâmico (tipos opcionais desde PHP 7)',
    
    philosophy: 'Fazer web funcionar, rápido',
    
    whereWins: [
      'WordPress (43% da web)',
      'Desenvolvimento web rápido',
      'CMSs (Drupal, Joomla)',
      'E-commerce (Magento, WooCommerce)',
      'Hospedagem barata (roda em qualquer lugar)',
      'Laravel (framework moderno)',
      'APIs REST simples'
    ],
    
    whereLoses: [
      'Aplicações real-time',
      'Sistemas de alta concorrência',
      'Mobile nativo',
      'Machine Learning',
      'Sistemas de baixo nível',
      'Reputação (código legado ruim)'
    ],
    
    competitors: ['Node.js', 'Python', 'Ruby', 'Go'],
    
    usedIn2025: [
      'WordPress (43% da web)',
      'Facebook (parcialmente)',
      'Wikipedia',
      'Slack (backend)',
      'Mailchimp',
      'Etsy',
      'Laravel apps'
    ],
    
    modernPHP: {
      version: 'PHP 8.3+ (2024)',
      features: [
        'Tipos estritos',
        'Atributos (annotations)',
        'Named arguments',
        'Match expression',
        'Enums',
        'Fibers (async)',
        'JIT compilation',
        'Readonly properties'
      ]
    },
    
    codeExample: `
<?php
// PHP 8+ moderno

declare(strict_types=1);

readonly class User {
    public function __construct(
        public string $name,
        public string $email,
        public int $age
    ) {}
}

function greet(User $user): string {
    return match(true) {
        $user->age < 18 => "Oi, jovem {$user->name}!",
        $user->age < 60 => "Olá, {$user->name}!",
        default => "Bom dia, Sr(a). {$user->name}!"
    };
}

$user = new User('Almir', 'almir@email.com', 24);
echo greet($user); // "Olá, Almir!"
    `,
    
    frameworks: {
      laravel: 'O melhor framework PHP - elegante e poderoso',
      symfony: 'Enterprise, componentes reutilizáveis',
      slim: 'Micro-framework para APIs',
      wordpress: 'CMS mais usado do mundo'
    },
    
    verdict: 'Não é sexy, mas paga as contas. PHP moderno é surpreendentemente bom.'
  },

  // ==========================================================================
  // PYTHON
  // ==========================================================================
  python: {
    name: 'Python',
    year: 1991,
    creator: 'Guido van Rossum',
    paradigm: ['OOP', 'Procedural', 'Funcional'],
    typing: 'Dinâmico (type hints opcionais)',
    
    philosophy: 'Legibilidade conta. Simples é melhor que complexo.',
    
    whereWins: [
      'Machine Learning / IA',
      'Ciência de dados',
      'Automação e scripts',
      'Backend web (Django, FastAPI)',
      'Prototipagem rápida',
      'Educação (primeira linguagem)',
      'DevOps e infraestrutura'
    ],
    
    whereLoses: [
      'Performance (lento)',
      'Mobile nativo',
      'Aplicações desktop',
      'Jogos AAA',
      'Sistemas de baixo nível',
      'Concorrência (GIL)'
    ],
    
    competitors: ['JavaScript', 'Go', 'Rust', 'Julia'],
    
    usedIn2025: [
      'TensorFlow, PyTorch',
      'Instagram',
      'Spotify',
      'Netflix',
      'Dropbox',
      'Reddit',
      'NASA'
    ],
    
    codeExample: `
# Python moderno com type hints

from dataclasses import dataclass
from typing import Optional

@dataclass
class User:
    name: str
    email: str
    age: int
    
def greet(user: User) -> str:
    match user.age:
        case age if age < 18:
            return f"Oi, jovem {user.name}!"
        case age if age < 60:
            return f"Olá, {user.name}!"
        case _:
            return f"Bom dia, Sr(a). {user.name}!"

user = User("Almir", "almir@email.com", 24)
print(greet(user))  # "Olá, Almir!"
    `,
    
    verdict: 'A linguagem mais versátil. Se você só pode aprender uma, aprenda Python.'
  },

  // ==========================================================================
  // JAVASCRIPT
  // ==========================================================================
  javascript: {
    name: 'JavaScript',
    year: 1995,
    creator: 'Brendan Eich (Netscape) - criada em 10 dias!',
    paradigm: ['OOP (prototypes)', 'Funcional', 'Event-driven'],
    typing: 'Dinâmico, fraco',
    
    philosophy: 'Funcionar no browser, custe o que custar',
    
    whereWins: [
      'Frontend web (único nativo)',
      'Full-stack (Node.js)',
      'Apps mobile (React Native)',
      'Desktop (Electron)',
      'Serverless',
      'Ecossistema gigante (npm)',
      'Contratações (mais vagas)'
    ],
    
    whereLoses: [
      'Tipos (use TypeScript)',
      'Performance CPU-bound',
      'Sistemas de baixo nível',
      'Machine Learning (use Python)',
      'Consistência (muitas formas de fazer)'
    ],
    
    competitors: ['TypeScript', 'Python', 'Go', 'Rust+WASM'],
    
    usedIn2025: [
      'Todos os sites do mundo',
      'Node.js (backend)',
      'React, Vue, Angular',
      'React Native',
      'Electron (VS Code, Discord)',
      'Deno, Bun'
    ],
    
    codeExample: `
// JavaScript ES2024

class User {
  #privateField;
  
  constructor(name, email, age) {
    this.name = name;
    this.email = email;
    this.age = age;
  }
  
  greet() {
    if (this.age < 18) return \`Oi, jovem \${this.name}!\`;
    if (this.age < 60) return \`Olá, \${this.name}!\`;
    return \`Bom dia, Sr(a). \${this.name}!\`;
  }
}

const user = new User('Almir', 'almir@email.com', 24);
console.log(user.greet()); // "Olá, Almir!"
    `,
    
    verdict: 'Ame ou odeie, você VAI usar JavaScript. É inevitável.'
  },

  // ==========================================================================
  // TYPESCRIPT
  // ==========================================================================
  typescript: {
    name: 'TypeScript',
    year: 2012,
    creator: 'Anders Hejlsberg (Microsoft)',
    paradigm: ['OOP', 'Funcional', 'Genérico'],
    typing: 'Estático, forte (compila para JS)',
    
    philosophy: 'JavaScript que escala',
    
    whereWins: [
      'Projetos grandes',
      'Equipes grandes',
      'Refatoração segura',
      'Autocomplete inteligente',
      'Documentação via tipos',
      'Menos bugs em produção',
      'Backend Node.js sério'
    ],
    
    whereLoses: [
      'Projetos pequenos (overhead)',
      'Prototipagem rápida',
      'Tempo de compilação',
      'Configuração inicial',
      'Curva de aprendizado dos tipos avançados'
    ],
    
    competitors: ['JavaScript', 'Flow', 'ReScript'],
    
    usedIn2025: [
      'VS Code',
      'Angular',
      'Deno',
      'Nest.js',
      'Next.js',
      'Prisma',
      'tRPC'
    ],
    
    codeExample: `
// TypeScript moderno

interface User {
  readonly name: string;
  readonly email: string;
  readonly age: number;
}

function greet(user: User): string {
  if (user.age < 18) return \`Oi, jovem \${user.name}!\`;
  if (user.age < 60) return \`Olá, \${user.name}!\`;
  return \`Bom dia, Sr(a). \${user.name}!\`;
}

const user: User = { name: 'Almir', email: 'almir@email.com', age: 24 };
console.log(greet(user)); // "Olá, Almir!"
    `,
    
    verdict: 'JavaScript cresceu. TypeScript é o JavaScript adulto.'
  }
};


// ==========================================================================
// JAVA
// ==========================================================================
export const JAVA_CARD = {
  name: 'Java',
  year: 1995,
  creator: 'James Gosling (Sun Microsystems)',
  paradigm: ['OOP', 'Imperativo'],
  typing: 'Estático, forte',
  
  philosophy: 'Write Once, Run Anywhere (WORA)',
  
  whereWins: [
    'Enterprise (bancos, seguradoras)',
    'Android (ainda muito usado)',
    'Big Data (Hadoop, Spark)',
    'Microservices (Spring Boot)',
    'Sistemas distribuídos',
    'Estabilidade e maturidade',
    'Vagas de emprego'
  ],
  
  whereLoses: [
    'Verbosidade extrema',
    'Startup time lento',
    'Consumo de memória',
    'Desenvolvimento web moderno',
    'Scripts rápidos',
    'Mobile iOS'
  ],
  
  competitors: ['Kotlin', 'C#', 'Go', 'Scala'],
  
  usedIn2025: [
    'Android (legado)',
    'Spring Boot',
    'Minecraft',
    'LinkedIn',
    'Netflix',
    'Amazon',
    'Bancos brasileiros'
  ],
  
  codeExample: `
// Java 21+ moderno

public record User(String name, String email, int age) {}

public class Main {
    public static String greet(User user) {
        return switch (user.age()) {
            case int a when a < 18 -> "Oi, jovem " + user.name() + "!";
            case int a when a < 60 -> "Olá, " + user.name() + "!";
            default -> "Bom dia, Sr(a). " + user.name() + "!";
        };
    }
    
    public static void main(String[] args) {
        var user = new User("Almir", "almir@email.com", 24);
        System.out.println(greet(user)); // "Olá, Almir!"
    }
}
  `,
  
  verdict: 'Não é sexy, mas é sólido. Bilhões de dispositivos rodam Java.'
};

// ==========================================================================
// GO (GOLANG)
// ==========================================================================
export const GO_CARD = {
  name: 'Go (Golang)',
  year: 2009,
  creator: 'Rob Pike, Ken Thompson, Robert Griesemer (Google)',
  paradigm: ['Imperativo', 'Concorrente'],
  typing: 'Estático, forte',
  
  philosophy: 'Simplicidade é a sofisticação suprema',
  
  whereWins: [
    'Cloud e infraestrutura',
    'Microservices',
    'CLIs e ferramentas',
    'Concorrência (goroutines)',
    'Compilação rápida',
    'Deploy simples (binário único)',
    'DevOps'
  ],
  
  whereLoses: [
    'Sem generics até recentemente',
    'Tratamento de erros verboso',
    'Sem exceções',
    'GUI/Desktop',
    'Ecossistema menor que JS/Python',
    'Sem herança (composição only)'
  ],
  
  competitors: ['Rust', 'Java', 'C#', 'Node.js'],
  
  usedIn2025: [
    'Docker',
    'Kubernetes',
    'Terraform',
    'Prometheus',
    'Grafana',
    'Hugo',
    'CockroachDB'
  ],
  
  codeExample: `
package main

import "fmt"

type User struct {
    Name  string
    Email string
    Age   int
}

func greet(u User) string {
    switch {
    case u.Age < 18:
        return fmt.Sprintf("Oi, jovem %s!", u.Name)
    case u.Age < 60:
        return fmt.Sprintf("Olá, %s!", u.Name)
    default:
        return fmt.Sprintf("Bom dia, Sr(a). %s!", u.Name)
    }
}

func main() {
    user := User{Name: "Almir", Email: "almir@email.com", Age: 24}
    fmt.Println(greet(user)) // "Olá, Almir!"
}
  `,
  
  verdict: 'A linguagem da cloud. Se você trabalha com infra, aprenda Go.'
};

// ==========================================================================
// RUST
// ==========================================================================
export const RUST_CARD = {
  name: 'Rust',
  year: 2010,
  creator: 'Graydon Hoare (Mozilla)',
  paradigm: ['Imperativo', 'Funcional', 'Concorrente'],
  typing: 'Estático, forte, ownership system',
  
  philosophy: 'Segurança de memória sem garbage collector',
  
  whereWins: [
    'Segurança de memória garantida',
    'Performance igual a C/C++',
    'Concorrência sem data races',
    'WebAssembly',
    'Sistemas críticos',
    'Blockchain',
    'Ferramentas CLI'
  ],
  
  whereLoses: [
    'Curva de aprendizado íngreme',
    'Tempo de compilação',
    'Borrow checker frustrante',
    'Ecossistema ainda crescendo',
    'Prototipagem rápida',
    'Menos vagas que outras'
  ],
  
  competitors: ['C', 'C++', 'Go', 'Zig'],
  
  usedIn2025: [
    'Firefox (Servo)',
    'Cloudflare',
    'Discord',
    'Dropbox',
    'AWS (Firecracker)',
    'Linux Kernel (parcial)',
    'Solana (blockchain)'
  ],
  
  codeExample: `
struct User {
    name: String,
    email: String,
    age: u8,
}

fn greet(user: &User) -> String {
    match user.age {
        0..=17 => format!("Oi, jovem {}!", user.name),
        18..=59 => format!("Olá, {}!", user.name),
        _ => format!("Bom dia, Sr(a). {}!", user.name),
    }
}

fn main() {
    let user = User {
        name: String::from("Almir"),
        email: String::from("almir@email.com"),
        age: 24,
    };
    println!("{}", greet(&user)); // "Olá, Almir!"
}
  `,
  
  verdict: 'O futuro dos sistemas. Difícil de aprender, impossível de esquecer.'
};

// ==========================================================================
// SWIFT
// ==========================================================================
export const SWIFT_CARD = {
  name: 'Swift',
  year: 2014,
  creator: 'Chris Lattner (Apple)',
  paradigm: ['OOP', 'Funcional', 'Protocol-oriented'],
  typing: 'Estático, forte',
  
  philosophy: 'Seguro, rápido e expressivo',
  
  whereWins: [
    'iOS/macOS/watchOS/tvOS',
    'Segurança de tipos',
    'Performance nativa',
    'Sintaxe moderna',
    'Interop com Objective-C',
    'SwiftUI (UI declarativa)'
  ],
  
  whereLoses: [
    'Só ecossistema Apple',
    'ABI instável (melhorou)',
    'Servidor (ainda crescendo)',
    'Cross-platform limitado',
    'Menos vagas que JS/Python'
  ],
  
  competitors: ['Kotlin', 'Objective-C', 'Flutter/Dart'],
  
  usedIn2025: [
    'Todos os apps iOS',
    'macOS apps',
    'Apple Watch',
    'Apple TV',
    'Vapor (backend)'
  ],
  
  codeExample: `
struct User {
    let name: String
    let email: String
    let age: Int
}

func greet(_ user: User) -> String {
    switch user.age {
    case ..<18:
        return "Oi, jovem \\(user.name)!"
    case 18..<60:
        return "Olá, \\(user.name)!"
    default:
        return "Bom dia, Sr(a). \\(user.name)!"
    }
}

let user = User(name: "Almir", email: "almir@email.com", age: 24)
print(greet(user)) // "Olá, Almir!"
  `,
  
  verdict: 'Quer fazer app pra iPhone? Swift é o caminho.'
};

// ==========================================================================
// KOTLIN
// ==========================================================================
export const KOTLIN_CARD = {
  name: 'Kotlin',
  year: 2011,
  creator: 'JetBrains',
  paradigm: ['OOP', 'Funcional'],
  typing: 'Estático, forte, null-safe',
  
  philosophy: 'Java moderno, conciso e seguro',
  
  whereWins: [
    'Android (linguagem oficial)',
    'Null safety nativo',
    'Interop 100% com Java',
    'Coroutines (async elegante)',
    'Sintaxe concisa',
    'Multiplatform (KMM)'
  ],
  
  whereLoses: [
    'Tempo de compilação',
    'Tamanho do runtime',
    'iOS (ainda experimental)',
    'Menos recursos que Scala',
    'Comunidade menor que Java'
  ],
  
  competitors: ['Java', 'Swift', 'Dart/Flutter'],
  
  usedIn2025: [
    'Android apps',
    'Spring Boot',
    'Ktor (backend)',
    'Gradle',
    'Pinterest',
    'Trello',
    'Uber'
  ],
  
  codeExample: `
data class User(
    val name: String,
    val email: String,
    val age: Int
)

fun greet(user: User): String = when {
    user.age < 18 -> "Oi, jovem \${user.name}!"
    user.age < 60 -> "Olá, \${user.name}!"
    else -> "Bom dia, Sr(a). \${user.name}!"
}

fun main() {
    val user = User("Almir", "almir@email.com", 24)
    println(greet(user)) // "Olá, Almir!"
}
  `,
  
  verdict: 'Java sem a dor. Se você faz Android, Kotlin é obrigatório.'
};

// ==========================================================================
// DART (FLUTTER)
// ==========================================================================
export const DART_CARD = {
  name: 'Dart',
  year: 2011,
  creator: 'Google',
  paradigm: ['OOP', 'Funcional'],
  typing: 'Estático, forte (sound null safety)',
  
  philosophy: 'Uma linguagem, todas as plataformas',
  
  whereWins: [
    'Flutter (iOS, Android, Web, Desktop)',
    'Hot reload instantâneo',
    'UI declarativa',
    'Performance nativa',
    'Uma codebase, múltiplas plataformas',
    'Null safety'
  ],
  
  whereLoses: [
    'Fora do Flutter, pouco usado',
    'Ecossistema menor',
    'Backend (ainda crescendo)',
    'Menos vagas que React Native',
    'Dependência do Google'
  ],
  
  competitors: ['React Native', 'Swift', 'Kotlin'],
  
  usedIn2025: [
    'Google Ads',
    'Alibaba',
    'BMW',
    'eBay',
    'Nubank (parcial)',
    'Google Pay'
  ],
  
  codeExample: `
class User {
  final String name;
  final String email;
  final int age;
  
  User({required this.name, required this.email, required this.age});
}

String greet(User user) {
  if (user.age < 18) return 'Oi, jovem \${user.name}!';
  if (user.age < 60) return 'Olá, \${user.name}!';
  return 'Bom dia, Sr(a). \${user.name}!';
}

void main() {
  final user = User(name: 'Almir', email: 'almir@email.com', age: 24);
  print(greet(user)); // "Olá, Almir!"
}
  `,
  
  verdict: 'Flutter é o futuro do cross-platform. Dart vem junto.'
};

// ==========================================================================
// C#
// ==========================================================================
export const CSHARP_CARD = {
  name: 'C#',
  year: 2000,
  creator: 'Anders Hejlsberg (Microsoft)',
  paradigm: ['OOP', 'Funcional', 'Genérico'],
  typing: 'Estático, forte',
  
  philosophy: 'O melhor de Java e C++ combinados',
  
  whereWins: [
    'Unity (jogos)',
    'Windows desktop',
    'Enterprise (.NET)',
    'Azure',
    'APIs (ASP.NET Core)',
    'Xamarin (mobile)',
    'Blazor (web)'
  ],
  
  whereLoses: [
    'Linux (melhorou com .NET Core)',
    'Ecossistema fora da Microsoft',
    'Mobile nativo (use Swift/Kotlin)',
    'Startups (preferem Node/Python)',
    'Machine Learning (use Python)'
  ],
  
  competitors: ['Java', 'Kotlin', 'TypeScript'],
  
  usedIn2025: [
    'Unity games',
    'Stack Overflow',
    'Microsoft',
    'Intuit',
    'GoDaddy',
    'Bancos'
  ],
  
  codeExample: `
public record User(string Name, string Email, int Age);

public static class Program
{
    public static string Greet(User user) => user.Age switch
    {
        < 18 => $"Oi, jovem {user.Name}!",
        < 60 => $"Olá, {user.Name}!",
        _ => $"Bom dia, Sr(a). {user.Name}!"
    };
    
    public static void Main()
    {
        var user = new User("Almir", "almir@email.com", 24);
        Console.WriteLine(Greet(user)); // "Olá, Almir!"
    }
}
  `,
  
  verdict: 'Quer fazer jogos? Unity + C#. Quer enterprise? .NET + C#.'
};


// ==========================================================================
// RUBY
// ==========================================================================
export const RUBY_CARD = {
  name: 'Ruby',
  year: 1995,
  creator: 'Yukihiro Matsumoto (Matz) - Japão',
  paradigm: ['OOP', 'Funcional', 'Imperativo'],
  typing: 'Dinâmico, forte (duck typing)',
  
  philosophy: 'Otimizado para a felicidade do programador',
  
  whereWins: [
    'Rails (desenvolvimento web rápido)',
    'Prototipagem',
    'Startups (MVP rápido)',
    'Scripts elegantes',
    'DSLs (Domain Specific Languages)',
    'Testes (RSpec)',
    'DevOps (Chef, Puppet)'
  ],
  
  whereLoses: [
    'Performance (lento)',
    'Mobile',
    'Concorrência (GIL)',
    'Machine Learning',
    'Sistemas de baixo nível',
    'Vagas diminuindo'
  ],
  
  competitors: ['Python', 'Node.js', 'Elixir', 'Go'],
  
  usedIn2025: [
    'GitHub',
    'Shopify',
    'Airbnb',
    'Twitch',
    'Basecamp',
    'Hulu',
    'SoundCloud'
  ],
  
  codeExample: `
# Ruby elegante

class User
  attr_reader :name, :email, :age
  
  def initialize(name:, email:, age:)
    @name = name
    @email = email
    @age = age
  end
  
  def greet
    case age
    when 0...18 then "Oi, jovem #{name}!"
    when 18...60 then "Olá, #{name}!"
    else "Bom dia, Sr(a). #{name}!"
    end
  end
end

user = User.new(name: 'Almir', email: 'almir@email.com', age: 24)
puts user.greet # "Olá, Almir!"
  `,
  
  verdict: 'Rails ainda é mágico para MVPs. Ruby é pura elegância.'
};

// ==========================================================================
// ELIXIR
// ==========================================================================
export const ELIXIR_CARD = {
  name: 'Elixir',
  year: 2012,
  creator: 'José Valim (BRASILEIRO! 🇧🇷)',
  paradigm: ['Funcional', 'Concorrente'],
  typing: 'Dinâmico, forte',
  
  philosophy: 'Produtividade de Ruby + Concorrência de Erlang',
  
  whereWins: [
    'Sistemas real-time',
    'WebSockets (Phoenix)',
    'Alta concorrência',
    'Tolerância a falhas',
    'Sistemas distribuídos',
    'IoT',
    'Telecomunicações'
  ],
  
  whereLoses: [
    'Ecossistema menor',
    'Curva de aprendizado (funcional)',
    'Menos vagas',
    'Machine Learning',
    'Mobile',
    'Processamento numérico'
  ],
  
  competitors: ['Go', 'Node.js', 'Rust', 'Erlang'],
  
  usedIn2025: [
    'WhatsApp (Erlang/Elixir)',
    'Discord',
    'Pinterest',
    'Bleacher Report',
    'PepsiCo',
    'Moz'
  ],
  
  codeExample: `
defmodule User do
  defstruct [:name, :email, :age]
  
  def greet(%User{name: name, age: age}) do
    cond do
      age < 18 -> "Oi, jovem #{name}!"
      age < 60 -> "Olá, #{name}!"
      true -> "Bom dia, Sr(a). #{name}!"
    end
  end
end

user = %User{name: "Almir", email: "almir@email.com", age: 24}
IO.puts User.greet(user) # "Olá, Almir!"
  `,
  
  verdict: 'Criada por brasileiro! Perfeita para sistemas que nunca podem cair.'
};

// ==========================================================================
// SCALA
// ==========================================================================
export const SCALA_CARD = {
  name: 'Scala',
  year: 2004,
  creator: 'Martin Odersky (EPFL)',
  paradigm: ['OOP', 'Funcional'],
  typing: 'Estático, forte, inferência',
  
  philosophy: 'Unir OOP e funcional na JVM',
  
  whereWins: [
    'Big Data (Apache Spark)',
    'Sistemas distribuídos',
    'Programação funcional tipada',
    'Akka (atores)',
    'Streaming de dados',
    'Finanças'
  ],
  
  whereLoses: [
    'Complexidade',
    'Tempo de compilação',
    'Curva de aprendizado',
    'Comunidade fragmentada',
    'Verbosidade (às vezes)',
    'Menos vagas que Java'
  ],
  
  competitors: ['Kotlin', 'Java', 'Clojure', 'Haskell'],
  
  usedIn2025: [
    'Apache Spark',
    'Twitter',
    'LinkedIn',
    'Netflix',
    'Airbnb',
    'Morgan Stanley'
  ],
  
  codeExample: `
case class User(name: String, email: String, age: Int)

def greet(user: User): String = user.age match {
  case a if a < 18 => s"Oi, jovem \${user.name}!"
  case a if a < 60 => s"Olá, \${user.name}!"
  case _ => s"Bom dia, Sr(a). \${user.name}!"
}

val user = User("Almir", "almir@email.com", 24)
println(greet(user)) // "Olá, Almir!"
  `,
  
  verdict: 'Se você trabalha com Big Data, Scala é inevitável.'
};

// ==========================================================================
// HASKELL
// ==========================================================================
export const HASKELL_CARD = {
  name: 'Haskell',
  year: 1990,
  creator: 'Comitê acadêmico',
  paradigm: ['Funcional puro', 'Lazy evaluation'],
  typing: 'Estático, forte, inferência (Hindley-Milner)',
  
  philosophy: 'Pureza funcional absoluta',
  
  whereWins: [
    'Programação funcional pura',
    'Compiladores',
    'Verificação formal',
    'Pesquisa acadêmica',
    'Finanças (análise de risco)',
    'Blockchain (Cardano)'
  ],
  
  whereLoses: [
    'Curva de aprendizado brutal',
    'Ecossistema limitado',
    'Poucas vagas',
    'Debugging difícil (lazy)',
    'Performance imprevisível',
    'Aplicações práticas limitadas'
  ],
  
  competitors: ['OCaml', 'F#', 'Scala', 'Rust'],
  
  usedIn2025: [
    'Cardano (blockchain)',
    'Facebook (spam filter)',
    'GitHub (Semantic)',
    'Standard Chartered',
    'Pesquisa acadêmica'
  ],
  
  codeExample: `
data User = User { name :: String, email :: String, age :: Int }

greet :: User -> String
greet user
  | age user < 18 = "Oi, jovem " ++ name user ++ "!"
  | age user < 60 = "Olá, " ++ name user ++ "!"
  | otherwise = "Bom dia, Sr(a). " ++ name user ++ "!"

main :: IO ()
main = do
  let user = User "Almir" "almir@email.com" 24
  putStrLn (greet user) -- "Olá, Almir!"
  `,
  
  verdict: 'A linguagem que te faz um programador melhor, mesmo que nunca use.'
};

// ==========================================================================
// LUA
// ==========================================================================
export const LUA_CARD = {
  name: 'Lua',
  year: 1993,
  creator: 'Roberto Ierusalimschy (BRASILEIRO! 🇧🇷 - PUC-Rio)',
  paradigm: ['Imperativo', 'Procedural', 'Funcional'],
  typing: 'Dinâmico, fraco',
  
  philosophy: 'Simples, leve, embarcável',
  
  whereWins: [
    'Scripting em jogos',
    'Sistemas embarcados',
    'Configuração',
    'Extensibilidade',
    'Nginx (OpenResty)',
    'Redis scripting',
    'Tamanho mínimo (~200KB)'
  ],
  
  whereLoses: [
    'Aplicações standalone',
    'Web backend',
    'Ecossistema pequeno',
    'Índices começam em 1 (!)',
    'Sem OOP nativo',
    'Tipagem fraca'
  ],
  
  competitors: ['Python', 'JavaScript', 'Squirrel'],
  
  usedIn2025: [
    'World of Warcraft',
    'Roblox',
    'Angry Birds',
    'Adobe Lightroom',
    'Nginx/OpenResty',
    'Redis',
    'Neovim'
  ],
  
  codeExample: `
-- Lua simples e elegante

local User = {}
User.__index = User

function User.new(name, email, age)
  local self = setmetatable({}, User)
  self.name = name
  self.email = email
  self.age = age
  return self
end

function User:greet()
  if self.age < 18 then
    return "Oi, jovem " .. self.name .. "!"
  elseif self.age < 60 then
    return "Olá, " .. self.name .. "!"
  else
    return "Bom dia, Sr(a). " .. self.name .. "!"
  end
end

local user = User.new("Almir", "almir@email.com", 24)
print(user:greet()) -- "Olá, Almir!"
  `,
  
  verdict: 'Criada no Brasil! Perfeita para embedding em jogos e sistemas.'
};

// ==========================================================================
// R
// ==========================================================================
export const R_CARD = {
  name: 'R',
  year: 1993,
  creator: 'Ross Ihaka e Robert Gentleman',
  paradigm: ['Funcional', 'OOP', 'Vetorial'],
  typing: 'Dinâmico',
  
  philosophy: 'Estatística e visualização de dados',
  
  whereWins: [
    'Estatística',
    'Visualização (ggplot2)',
    'Análise de dados',
    'Bioinformática',
    'Pesquisa acadêmica',
    'Relatórios (R Markdown)'
  ],
  
  whereLoses: [
    'Performance',
    'Produção/Deploy',
    'Aplicações gerais',
    'Web',
    'Sintaxe inconsistente',
    'Gerenciamento de memória'
  ],
  
  competitors: ['Python', 'Julia', 'MATLAB'],
  
  usedIn2025: [
    'Pesquisa acadêmica',
    'Farmacêuticas',
    'Finanças',
    'Bioinformática',
    'Jornalismo de dados'
  ],
  
  codeExample: `
# R para estatística

user <- list(name = "Almir", email = "almir@email.com", age = 24)

greet <- function(user) {
  if (user$age < 18) {
    paste0("Oi, jovem ", user$name, "!")
  } else if (user$age < 60) {
    paste0("Olá, ", user$name, "!")
  } else {
    paste0("Bom dia, Sr(a). ", user$name, "!")
  }
}

print(greet(user)) # "Olá, Almir!"
  `,
  
  verdict: 'Para estatística pura, R ainda é rei. Para ML em produção, use Python.'
};

// ==========================================================================
// JULIA
// ==========================================================================
export const JULIA_CARD = {
  name: 'Julia',
  year: 2012,
  creator: 'Jeff Bezanson, Stefan Karpinski, Viral Shah, Alan Edelman (MIT)',
  paradigm: ['Funcional', 'Imperativo', 'Múltiplo dispatch'],
  typing: 'Dinâmico com tipos opcionais',
  
  philosophy: 'Velocidade de C com facilidade de Python',
  
  whereWins: [
    'Computação científica',
    'Simulações numéricas',
    'Machine Learning',
    'Física computacional',
    'Otimização',
    'Paralelismo nativo'
  ],
  
  whereLoses: [
    'Time-to-first-plot (compilação)',
    'Ecossistema menor',
    'Menos vagas',
    'Web',
    'Mobile',
    'Aplicações gerais'
  ],
  
  competitors: ['Python', 'R', 'MATLAB', 'Fortran'],
  
  usedIn2025: [
    'NASA',
    'Federal Reserve',
    'Pfizer',
    'BlackRock',
    'Climate modeling',
    'Pesquisa científica'
  ],
  
  codeExample: `
struct User
    name::String
    email::String
    age::Int
end

function greet(user::User)
    if user.age < 18
        return "Oi, jovem \$(user.name)!"
    elseif user.age < 60
        return "Olá, \$(user.name)!"
    else
        return "Bom dia, Sr(a). \$(user.name)!"
    end
end

user = User("Almir", "almir@email.com", 24)
println(greet(user)) # "Olá, Almir!"
  `,
  
  verdict: 'O futuro da computação científica. Python com esteroides.'
};


// ==========================================================================
// ZIG
// ==========================================================================
export const ZIG_CARD = {
  name: 'Zig',
  year: 2016,
  creator: 'Andrew Kelley',
  paradigm: ['Imperativo', 'Sistemas'],
  typing: 'Estático, forte',
  
  philosophy: 'C moderno sem as armadilhas',
  
  whereWins: [
    'Substituir C',
    'Interop com C perfeito',
    'Sem hidden control flow',
    'Compilação cross-platform',
    'Sistemas embarcados',
    'Compiladores'
  ],
  
  whereLoses: [
    'Ecossistema nascente',
    'Documentação limitada',
    'Poucas vagas',
    'Ainda em desenvolvimento',
    'Comunidade pequena'
  ],
  
  competitors: ['C', 'Rust', 'C++'],
  
  usedIn2025: [
    'Bun (runtime JS)',
    'Uber (parcial)',
    'Sistemas embarcados',
    'Compiladores'
  ],
  
  codeExample: `
const std = @import("std");

const User = struct {
    name: []const u8,
    email: []const u8,
    age: u8,
};

fn greet(user: User) []const u8 {
    if (user.age < 18) {
        return "Oi, jovem!";
    } else if (user.age < 60) {
        return "Olá!";
    } else {
        return "Bom dia!";
    }
}

pub fn main() void {
    const user = User{ .name = "Almir", .email = "almir@email.com", .age = 24 };
    std.debug.print("{s}\\n", .{greet(user)});
}
  `,
  
  verdict: 'O C que C deveria ter sido. Observe de perto.'
};

// ==========================================================================
// MOJO
// ==========================================================================
export const MOJO_CARD = {
  name: 'Mojo 🔥',
  year: 2023,
  creator: 'Chris Lattner (Modular) - criador do Swift e LLVM',
  paradigm: ['Imperativo', 'OOP', 'Sistemas'],
  typing: 'Estático, forte (superset de Python)',
  
  philosophy: 'Python com velocidade de C++',
  
  whereWins: [
    'IA/ML com performance nativa',
    'Compatível com Python',
    'SIMD automático',
    'GPU programming',
    'Sistemas de alta performance',
    'Inferência de modelos'
  ],
  
  whereLoses: [
    'Muito novo (2023)',
    'Ecossistema inexistente',
    'Ainda em beta',
    'Documentação limitada',
    'Futuro incerto'
  ],
  
  competitors: ['Python', 'C++', 'Rust', 'Julia'],
  
  usedIn2025: [
    'Modular (empresa criadora)',
    'Pesquisa em IA',
    'Early adopters'
  ],
  
  codeExample: `
# Mojo - Python turbinado

struct User:
    var name: String
    var email: String
    var age: Int
    
    fn __init__(inout self, name: String, email: String, age: Int):
        self.name = name
        self.email = email
        self.age = age
    
    fn greet(self) -> String:
        if self.age < 18:
            return "Oi, jovem " + self.name + "!"
        elif self.age < 60:
            return "Olá, " + self.name + "!"
        else:
            return "Bom dia, Sr(a). " + self.name + "!"

fn main():
    let user = User("Almir", "almir@email.com", 24)
    print(user.greet())  # "Olá, Almir!"
  `,
  
  verdict: 'O futuro do Python para IA? Muito promissor, mas ainda cedo.'
};

// ==========================================================================
// CARBON
// ==========================================================================
export const CARBON_CARD = {
  name: 'Carbon',
  year: 2022,
  creator: 'Google',
  paradigm: ['Imperativo', 'OOP', 'Genérico'],
  typing: 'Estático, forte',
  
  philosophy: 'Sucessor experimental do C++',
  
  whereWins: [
    'Interop com C++ existente',
    'Sintaxe moderna',
    'Segurança melhorada',
    'Migração gradual de C++',
    'Tooling moderno'
  ],
  
  whereLoses: [
    'Experimental (não pronto)',
    'Pode nunca sair do Google',
    'Competição com Rust',
    'Sem ecossistema',
    'Futuro incerto'
  ],
  
  competitors: ['C++', 'Rust', 'Zig'],
  
  usedIn2025: [
    'Apenas experimentos internos do Google',
    'Não recomendado para produção'
  ],
  
  codeExample: `
// Carbon - C++ do futuro (experimental)

class User {
  var name: String;
  var email: String;
  var age: i32;
}

fn Greet(user: User) -> String {
  if (user.age < 18) {
    return "Oi, jovem!";
  } else if (user.age < 60) {
    return "Olá!";
  } else {
    return "Bom dia!";
  }
}

fn Main() -> i32 {
  var user: User = {.name = "Almir", .email = "almir@email.com", .age = 24};
  Print(Greet(user));
  return 0;
}
  `,
  
  verdict: 'Interessante, mas espere. Rust já resolve o problema do C++.'
};

// ==========================================================================
// COBOL
// ==========================================================================
export const COBOL_CARD = {
  name: 'COBOL',
  year: 1959,
  creator: 'Grace Hopper e comitê CODASYL',
  paradigm: ['Imperativo', 'Procedural'],
  typing: 'Estático',
  
  philosophy: 'Linguagem de negócios legível por humanos',
  
  whereWins: [
    'Sistemas bancários legados',
    'Mainframes IBM',
    'Processamento de transações',
    'Estabilidade (60+ anos)',
    'Salários altos (escassez)'
  ],
  
  whereLoses: [
    'Verbosidade extrema',
    'Tecnologia antiga',
    'Difícil de aprender',
    'Sem ecossistema moderno',
    'Imagem negativa'
  ],
  
  competitors: ['Java', 'C#', 'Python'],
  
  usedIn2025: [
    '95% das transações ATM',
    '80% das transações presenciais',
    'Bancos (Itaú, BB, Caixa)',
    'Governo',
    'Seguradoras'
  ],
  
  codeExample: `
       IDENTIFICATION DIVISION.
       PROGRAM-ID. GREET-USER.
       
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 USER-NAME PIC X(50) VALUE "Almir".
       01 USER-AGE PIC 99 VALUE 24.
       01 GREETING PIC X(100).
       
       PROCEDURE DIVISION.
           IF USER-AGE < 18
               MOVE "Oi, jovem!" TO GREETING
           ELSE IF USER-AGE < 60
               MOVE "Olá!" TO GREETING
           ELSE
               MOVE "Bom dia!" TO GREETING
           END-IF.
           DISPLAY GREETING.
           STOP RUN.
  `,
  
  verdict: 'Não é sexy, mas paga MUITO bem. Bancos precisam de você.'
};

// ==========================================================================
// FORTRAN
// ==========================================================================
export const FORTRAN_CARD = {
  name: 'Fortran',
  year: 1957,
  creator: 'John Backus (IBM)',
  paradigm: ['Imperativo', 'Procedural', 'OOP (moderno)'],
  typing: 'Estático, forte',
  
  philosophy: 'FORmula TRANslation - computação científica',
  
  whereWins: [
    'Computação científica',
    'Simulações numéricas',
    'Física computacional',
    'Previsão do tempo',
    'Engenharia',
    'Performance numérica'
  ],
  
  whereLoses: [
    'Aplicações gerais',
    'Web',
    'Mobile',
    'Strings e texto',
    'Imagem antiga',
    'Ecossistema limitado'
  ],
  
  competitors: ['Julia', 'Python', 'C++'],
  
  usedIn2025: [
    'NASA',
    'CERN',
    'Previsão meteorológica',
    'Simulações nucleares',
    'Engenharia aeroespacial'
  ],
  
  codeExample: `
program greet_user
    implicit none
    character(len=50) :: name
    integer :: age
    
    name = "Almir"
    age = 24
    
    if (age < 18) then
        print *, "Oi, jovem ", trim(name), "!"
    else if (age < 60) then
        print *, "Olá, ", trim(name), "!"
    else
        print *, "Bom dia, Sr(a). ", trim(name), "!"
    end if
end program greet_user
  `,
  
  verdict: 'A primeira linguagem de alto nível. Ainda viva na ciência.'
};

// ==========================================================================
// LISP
// ==========================================================================
export const LISP_CARD = {
  name: 'Lisp',
  year: 1958,
  creator: 'John McCarthy (MIT)',
  paradigm: ['Funcional', 'Metaprogramação'],
  typing: 'Dinâmico',
  
  philosophy: 'Código é dado, dado é código (homoiconicidade)',
  
  whereWins: [
    'Inteligência Artificial (histórico)',
    'Metaprogramação',
    'Macros poderosas',
    'Emacs',
    'Pesquisa em linguagens',
    'Prototipagem de ideias'
  ],
  
  whereLoses: [
    'Parênteses infinitos',
    'Ecossistema fragmentado',
    'Poucas vagas',
    'Performance',
    'Aplicações práticas modernas'
  ],
  
  competitors: ['Clojure', 'Scheme', 'Racket', 'Haskell'],
  
  usedIn2025: [
    'Emacs',
    'AutoCAD (AutoLISP)',
    'Pesquisa acadêmica',
    'Clojure (dialeto moderno)'
  ],
  
  codeExample: `
;; Common Lisp

(defstruct user name email age)

(defun greet (user)
  (cond
    ((< (user-age user) 18) 
     (format nil "Oi, jovem ~a!" (user-name user)))
    ((< (user-age user) 60) 
     (format nil "Olá, ~a!" (user-name user)))
    (t 
     (format nil "Bom dia, Sr(a). ~a!" (user-name user)))))

(let ((user (make-user :name "Almir" :email "almir@email.com" :age 24)))
  (print (greet user))) ; "Olá, Almir!"
  `,
  
  verdict: 'A mãe da programação funcional. Aprenda para expandir sua mente.'
};

// ==========================================================================
// PERL
// ==========================================================================
export const PERL_CARD = {
  name: 'Perl',
  year: 1987,
  creator: 'Larry Wall',
  paradigm: ['Imperativo', 'OOP', 'Funcional'],
  typing: 'Dinâmico',
  
  philosophy: 'Há mais de uma forma de fazer (TIMTOWTDI)',
  
  whereWins: [
    'Regex (melhor suporte)',
    'Text processing',
    'Sysadmin scripts',
    'Bioinformática',
    'One-liners poderosos',
    'CGI (histórico)'
  ],
  
  whereLoses: [
    'Legibilidade (write-only)',
    'Ecossistema envelhecendo',
    'Vagas diminuindo',
    'Web moderna',
    'Reputação de "feio"'
  ],
  
  competitors: ['Python', 'Ruby', 'Go'],
  
  usedIn2025: [
    'Bioinformática',
    'Sysadmin legado',
    'DuckDuckGo',
    'Booking.com'
  ],
  
  codeExample: `
#!/usr/bin/perl
use strict;
use warnings;

package User;
sub new {
    my ($class, %args) = @_;
    return bless \\%args, $class;
}

sub greet {
    my $self = shift;
    if ($self->{age} < 18) {
        return "Oi, jovem $self->{name}!";
    } elsif ($self->{age} < 60) {
        return "Olá, $self->{name}!";
    } else {
        return "Bom dia, Sr(a). $self->{name}!";
    }
}

my $user = User->new(name => 'Almir', email => 'almir@email.com', age => 24);
print $user->greet(), "\\n"; # "Olá, Almir!"
  `,
  
  verdict: 'A fita adesiva da internet dos anos 90. Ainda útil para regex.'
};

// ==========================================================================
// SQL
// ==========================================================================
export const SQL_CARD = {
  name: 'SQL',
  year: 1974,
  creator: 'Donald Chamberlin e Raymond Boyce (IBM)',
  paradigm: ['Declarativo', 'Set-based'],
  typing: 'Estático (por coluna)',
  
  philosophy: 'Diga O QUE você quer, não COMO conseguir',
  
  whereWins: [
    'Bancos de dados relacionais',
    'Consultas complexas',
    'Relatórios',
    'Data warehousing',
    'Transações ACID',
    'Padrão universal'
  ],
  
  whereLoses: [
    'Dados não-estruturados',
    'Grafos',
    'Tempo real',
    'Escalabilidade horizontal',
    'Flexibilidade de schema'
  ],
  
  competitors: ['NoSQL', 'GraphQL', 'MongoDB Query'],
  
  usedIn2025: [
    'PostgreSQL',
    'MySQL',
    'SQL Server',
    'Oracle',
    'SQLite',
    'Praticamente todo sistema'
  ],
  
  codeExample: `
-- SQL padrão

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    age INTEGER CHECK (age >= 0)
);

INSERT INTO users (name, email, age) VALUES ('Almir', 'almir@email.com', 24);

SELECT 
    name,
    CASE 
        WHEN age < 18 THEN 'Oi, jovem ' || name || '!'
        WHEN age < 60 THEN 'Olá, ' || name || '!'
        ELSE 'Bom dia, Sr(a). ' || name || '!'
    END AS greeting
FROM users;
  `,
  
  verdict: 'Não é uma linguagem de programação, mas você PRECISA saber.'
};

// ==========================================================================
// CLOJURE
// ==========================================================================
export const CLOJURE_CARD = {
  name: 'Clojure',
  year: 2007,
  creator: 'Rich Hickey',
  paradigm: ['Funcional', 'Lisp moderno'],
  typing: 'Dinâmico (spec opcional)',
  
  philosophy: 'Simplicidade, imutabilidade, concorrência',
  
  whereWins: [
    'Programação funcional na JVM',
    'Concorrência (STM)',
    'Dados imutáveis',
    'REPL-driven development',
    'ClojureScript (frontend)',
    'Macros poderosas'
  ],
  
  whereLoses: [
    'Startup time (JVM)',
    'Curva de aprendizado',
    'Poucas vagas',
    'Debugging',
    'Ecossistema menor'
  ],
  
  competitors: ['Scala', 'Kotlin', 'Elixir', 'Haskell'],
  
  usedIn2025: [
    'Nubank (BRASILEIRO! 🇧🇷)',
    'Walmart',
    'CircleCI',
    'Puppet'
  ],
  
  codeExample: `
;; Clojure elegante

(defrecord User [name email age])

(defn greet [user]
  (cond
    (< (:age user) 18) (str "Oi, jovem " (:name user) "!")
    (< (:age user) 60) (str "Olá, " (:name user) "!")
    :else (str "Bom dia, Sr(a). " (:name user) "!")))

(def user (->User "Almir" "almir@email.com" 24))
(println (greet user)) ; "Olá, Almir!"
  `,
  
  verdict: 'Nubank usa! Lisp moderno para quem quer funcional na JVM.'
};


// ============================================================================
// TABELAS DE COMPARAÇÃO - ONDE CADA UMA GANHA
// ============================================================================

export const COMPARISON_TABLES = {
  // ==========================================================================
  // POR CASO DE USO
  // ==========================================================================
  byUseCase: {
    backend_web: {
      title: 'Backend Web',
      ranking: [
        { lang: 'Go', score: 95, reason: 'Performance + simplicidade + concorrência' },
        { lang: 'Node.js/TypeScript', score: 90, reason: 'Ecossistema + full-stack' },
        { lang: 'Python/FastAPI', score: 88, reason: 'Produtividade + ML integration' },
        { lang: 'Java/Spring', score: 85, reason: 'Enterprise + estabilidade' },
        { lang: 'C#/.NET', score: 85, reason: 'Microsoft stack + performance' },
        { lang: 'PHP/Laravel', score: 82, reason: 'Simplicidade + hospedagem barata' },
        { lang: 'Ruby/Rails', score: 78, reason: 'Produtividade + convenções' },
        { lang: 'Rust/Actix', score: 75, reason: 'Performance máxima (mas complexo)' },
        { lang: 'Elixir/Phoenix', score: 80, reason: 'Real-time + concorrência' }
      ]
    },
    
    frontend_web: {
      title: 'Frontend Web',
      ranking: [
        { lang: 'TypeScript/React', score: 95, reason: 'Ecossistema + tipos + vagas' },
        { lang: 'TypeScript/Vue', score: 90, reason: 'Simplicidade + performance' },
        { lang: 'TypeScript/Angular', score: 85, reason: 'Enterprise + estrutura' },
        { lang: 'TypeScript/Svelte', score: 88, reason: 'Performance + simplicidade' },
        { lang: 'JavaScript', score: 80, reason: 'Sem build step (projetos simples)' },
        { lang: 'Dart/Flutter Web', score: 75, reason: 'Cross-platform (mas pesado)' },
        { lang: 'Rust/WASM', score: 70, reason: 'Performance crítica (nicho)' }
      ]
    },
    
    mobile_android: {
      title: 'Mobile Android',
      ranking: [
        { lang: 'Kotlin', score: 95, reason: 'Oficial Google + moderno' },
        { lang: 'Dart/Flutter', score: 90, reason: 'Cross-platform + hot reload' },
        { lang: 'TypeScript/React Native', score: 85, reason: 'Ecossistema JS + cross' },
        { lang: 'Java', score: 75, reason: 'Legado + estável' },
        { lang: 'C++/NDK', score: 60, reason: 'Performance crítica (jogos)' }
      ]
    },
    
    mobile_ios: {
      title: 'Mobile iOS',
      ranking: [
        { lang: 'Swift', score: 95, reason: 'Oficial Apple + SwiftUI' },
        { lang: 'Dart/Flutter', score: 88, reason: 'Cross-platform + performance' },
        { lang: 'TypeScript/React Native', score: 82, reason: 'Ecossistema JS' },
        { lang: 'Objective-C', score: 65, reason: 'Legado (evite para novo)' }
      ]
    },
    
    machine_learning: {
      title: 'Machine Learning / IA',
      ranking: [
        { lang: 'Python', score: 98, reason: 'TensorFlow, PyTorch, scikit-learn' },
        { lang: 'Julia', score: 85, reason: 'Performance + sintaxe matemática' },
        { lang: 'R', score: 75, reason: 'Estatística + visualização' },
        { lang: 'Mojo', score: 70, reason: 'Python + performance (novo)' },
        { lang: 'C++', score: 65, reason: 'Inferência otimizada' },
        { lang: 'Rust', score: 60, reason: 'ML em produção seguro' }
      ]
    },
    
    sistemas_embarcados: {
      title: 'Sistemas Embarcados / IoT',
      ranking: [
        { lang: 'C', score: 95, reason: 'Padrão da indústria + controle total' },
        { lang: 'C++', score: 90, reason: 'C + abstrações' },
        { lang: 'Rust', score: 85, reason: 'Segurança + performance' },
        { lang: 'Zig', score: 80, reason: 'C moderno + seguro' },
        { lang: 'Assembly', score: 70, reason: 'Controle absoluto (quando necessário)' },
        { lang: 'MicroPython', score: 65, reason: 'Prototipagem rápida' },
        { lang: 'Lua', score: 60, reason: 'Scripting leve' }
      ]
    },
    
    jogos: {
      title: 'Desenvolvimento de Jogos',
      ranking: [
        { lang: 'C#/Unity', score: 95, reason: 'Unity domina indie + mobile' },
        { lang: 'C++/Unreal', score: 95, reason: 'AAA + performance máxima' },
        { lang: 'GDScript/Godot', score: 85, reason: 'Open source + simples' },
        { lang: 'Lua', score: 80, reason: 'Scripting em engines' },
        { lang: 'Rust/Bevy', score: 70, reason: 'Emergente + seguro' },
        { lang: 'JavaScript/Phaser', score: 65, reason: 'Jogos web simples' }
      ]
    },
    
    devops_infra: {
      title: 'DevOps / Infraestrutura',
      ranking: [
        { lang: 'Go', score: 95, reason: 'Docker, K8s, Terraform' },
        { lang: 'Python', score: 90, reason: 'Ansible, scripts, automação' },
        { lang: 'Bash', score: 85, reason: 'Scripts de sistema' },
        { lang: 'Rust', score: 75, reason: 'Ferramentas de alta performance' },
        { lang: 'TypeScript', score: 70, reason: 'Pulumi, CDK' }
      ]
    },
    
    blockchain: {
      title: 'Blockchain / Web3',
      ranking: [
        { lang: 'Solidity', score: 95, reason: 'Ethereum smart contracts' },
        { lang: 'Rust', score: 90, reason: 'Solana, Polkadot' },
        { lang: 'Go', score: 85, reason: 'Hyperledger, nodes' },
        { lang: 'Haskell', score: 80, reason: 'Cardano' },
        { lang: 'TypeScript', score: 75, reason: 'DApps frontend' }
      ]
    },
    
    ciencia_dados: {
      title: 'Ciência de Dados',
      ranking: [
        { lang: 'Python', score: 95, reason: 'Pandas, NumPy, Jupyter' },
        { lang: 'R', score: 90, reason: 'Estatística + ggplot2' },
        { lang: 'SQL', score: 88, reason: 'Consultas + ETL' },
        { lang: 'Julia', score: 80, reason: 'Performance numérica' },
        { lang: 'Scala/Spark', score: 75, reason: 'Big Data' }
      ]
    }
  },

  // ==========================================================================
  // POR PLATAFORMA
  // ==========================================================================
  byPlatform: {
    windows: {
      native: ['C#', 'C++', 'Rust'],
      recommended: 'C# para apps, C++ para jogos/sistemas',
      frameworks: ['.NET/WPF', 'Qt', 'Electron']
    },
    
    macos: {
      native: ['Swift', 'Objective-C', 'C++'],
      recommended: 'Swift para apps nativos',
      frameworks: ['SwiftUI', 'AppKit', 'Electron']
    },
    
    linux: {
      native: ['C', 'C++', 'Rust', 'Go'],
      recommended: 'C para kernel, Go para apps, Rust para segurança',
      frameworks: ['GTK', 'Qt', 'Electron']
    },
    
    android: {
      native: ['Kotlin', 'Java'],
      crossPlatform: ['Dart/Flutter', 'TypeScript/React Native'],
      recommended: 'Kotlin para nativo, Flutter para cross'
    },
    
    ios: {
      native: ['Swift', 'Objective-C'],
      crossPlatform: ['Dart/Flutter', 'TypeScript/React Native'],
      recommended: 'Swift para nativo, Flutter para cross'
    },
    
    web_browser: {
      native: ['JavaScript', 'TypeScript'],
      compiled: ['Rust/WASM', 'Go/WASM', 'C++/WASM'],
      recommended: 'TypeScript para 99% dos casos'
    },
    
    embedded: {
      native: ['C', 'C++', 'Assembly'],
      modern: ['Rust', 'Zig'],
      scripting: ['MicroPython', 'Lua'],
      recommended: 'C para produção, Rust para novos projetos'
    },
    
    cloud_serverless: {
      supported: ['Node.js', 'Python', 'Go', 'Java', 'C#', 'Rust'],
      recommended: 'Node.js para simplicidade, Go para performance'
    }
  },

  // ==========================================================================
  // TRADE-OFFS
  // ==========================================================================
  tradeoffs: {
    performance_vs_produtividade: {
      maxPerformance: ['C', 'C++', 'Rust', 'Assembly'],
      balanced: ['Go', 'Java', 'C#', 'Swift', 'Kotlin'],
      maxProdutividade: ['Python', 'Ruby', 'JavaScript', 'PHP']
    },
    
    seguranca_vs_flexibilidade: {
      maxSeguranca: ['Rust', 'Haskell', 'Ada'],
      balanced: ['Go', 'TypeScript', 'Kotlin', 'Swift'],
      maxFlexibilidade: ['Python', 'JavaScript', 'Ruby', 'Lua']
    },
    
    curva_aprendizado: {
      facil: ['Python', 'JavaScript', 'Lua', 'PHP', 'Ruby'],
      medio: ['Java', 'C#', 'Go', 'TypeScript', 'Kotlin', 'Swift'],
      dificil: ['C', 'C++', 'Rust', 'Haskell', 'Assembly']
    },
    
    vagas_mercado_2025: {
      muitasVagas: ['JavaScript', 'TypeScript', 'Python', 'Java', 'C#'],
      vagasEstáveis: ['Go', 'Kotlin', 'Swift', 'PHP', 'Ruby'],
      poucasVagas: ['Rust', 'Elixir', 'Haskell', 'Clojure', 'Scala'],
      vagasNicho: ['COBOL', 'Fortran', 'Assembly', 'Ada']
    },
    
    salario_medio_brasil_2025: {
      alto: ['Go', 'Rust', 'Scala', 'Elixir', 'COBOL'],
      medio: ['Java', 'C#', 'Python', 'TypeScript', 'Kotlin'],
      variavel: ['JavaScript', 'PHP', 'Ruby']
    }
  }
};

// ============================================================================
// GUIA DE PRIMEIRA LINGUAGEM
// ============================================================================

export const FIRST_LANGUAGE_GUIDE = {
  porObjetivo: {
    'Quero emprego rápido': {
      linguagem: 'JavaScript/TypeScript',
      razao: 'Mais vagas, full-stack, ecossistema gigante',
      caminho: 'HTML/CSS → JavaScript → TypeScript → React/Node.js'
    },
    'Quero fazer apps mobile': {
      linguagem: 'Dart/Flutter',
      razao: 'Uma linguagem, iOS + Android + Web',
      caminho: 'Dart básico → Flutter → Firebase → Deploy'
    },
    'Quero trabalhar com IA': {
      linguagem: 'Python',
      razao: 'TensorFlow, PyTorch, toda a comunidade de ML',
      caminho: 'Python básico → NumPy/Pandas → ML → Deep Learning'
    },
    'Quero entender computação de verdade': {
      linguagem: 'C',
      razao: 'Entender memória, ponteiros, como tudo funciona',
      caminho: 'C → Estruturas de dados → Sistemas operacionais'
    },
    'Quero fazer jogos': {
      linguagem: 'C#',
      razao: 'Unity domina o mercado indie e mobile',
      caminho: 'C# básico → Unity → Publicar primeiro jogo'
    },
    'Quero trabalhar em banco/enterprise': {
      linguagem: 'Java',
      razao: 'Estável, muitas vagas, Spring Boot',
      caminho: 'Java → Spring Boot → Microservices → Cloud'
    },
    'Quero fazer sites WordPress': {
      linguagem: 'PHP',
      razao: '43% da web usa WordPress',
      caminho: 'PHP básico → WordPress → Plugins → Temas'
    }
  },
  
  porIdade: {
    'Criança (8-12 anos)': {
      linguagem: 'Scratch → Python',
      razao: 'Visual primeiro, depois texto'
    },
    'Adolescente (13-17 anos)': {
      linguagem: 'Python ou JavaScript',
      razao: 'Resultados rápidos, comunidade grande'
    },
    'Adulto iniciante': {
      linguagem: 'Python ou JavaScript',
      razao: 'Mercado de trabalho + versatilidade'
    },
    'Profissional migrando': {
      linguagem: 'Depende da área atual',
      razao: 'Aproveitar conhecimento existente'
    }
  }
};

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Verifica se o manifesto deve ser ativado baseado no prompt
 */
export function shouldActivatePolyglotManifest(prompt: string): boolean {
  const lowerPrompt = prompt.toLowerCase();
  const keywords = POLYGLOT_LANGUAGES_MASTER_MANIFEST.metadata.keywords;
  
  return keywords.some(keyword => lowerPrompt.includes(keyword.toLowerCase()));
}

/**
 * Retorna a ficha de uma linguagem específica
 */
export function getLanguageCard(languageName: string): any {
  const normalizedName = languageName.toLowerCase().trim();
  
  const cardMap: Record<string, any> = {
    'assembly': LANGUAGE_CARDS.assembly,
    'c': LANGUAGE_CARDS.c,
    'c++': LANGUAGE_CARDS.cpp,
    'cpp': LANGUAGE_CARDS.cpp,
    'php': LANGUAGE_CARDS.php,
    'python': LANGUAGE_CARDS.python,
    'javascript': LANGUAGE_CARDS.javascript,
    'js': LANGUAGE_CARDS.javascript,
    'typescript': LANGUAGE_CARDS.typescript,
    'ts': LANGUAGE_CARDS.typescript,
    'java': JAVA_CARD,
    'go': GO_CARD,
    'golang': GO_CARD,
    'rust': RUST_CARD,
    'swift': SWIFT_CARD,
    'kotlin': KOTLIN_CARD,
    'dart': DART_CARD,
    'flutter': DART_CARD,
    'c#': CSHARP_CARD,
    'csharp': CSHARP_CARD,
    'ruby': RUBY_CARD,
    'elixir': ELIXIR_CARD,
    'scala': SCALA_CARD,
    'haskell': HASKELL_CARD,
    'lua': LUA_CARD,
    'r': R_CARD,
    'julia': JULIA_CARD,
    'zig': ZIG_CARD,
    'mojo': MOJO_CARD,
    'carbon': CARBON_CARD,
    'cobol': COBOL_CARD,
    'fortran': FORTRAN_CARD,
    'lisp': LISP_CARD,
    'perl': PERL_CARD,
    'sql': SQL_CARD,
    'clojure': CLOJURE_CARD
  };
  
  return cardMap[normalizedName] || null;
}

/**
 * Retorna recomendação de linguagem por caso de uso
 */
export function getRecommendationByUseCase(useCase: string): any {
  const normalizedUseCase = useCase.toLowerCase();
  
  if (normalizedUseCase.includes('backend') || normalizedUseCase.includes('api')) {
    return COMPARISON_TABLES.byUseCase.backend_web;
  }
  if (normalizedUseCase.includes('frontend') || normalizedUseCase.includes('web')) {
    return COMPARISON_TABLES.byUseCase.frontend_web;
  }
  if (normalizedUseCase.includes('android')) {
    return COMPARISON_TABLES.byUseCase.mobile_android;
  }
  if (normalizedUseCase.includes('ios') || normalizedUseCase.includes('iphone')) {
    return COMPARISON_TABLES.byUseCase.mobile_ios;
  }
  if (normalizedUseCase.includes('ml') || normalizedUseCase.includes('ia') || normalizedUseCase.includes('machine learning')) {
    return COMPARISON_TABLES.byUseCase.machine_learning;
  }
  if (normalizedUseCase.includes('embarcado') || normalizedUseCase.includes('iot') || normalizedUseCase.includes('embedded')) {
    return COMPARISON_TABLES.byUseCase.sistemas_embarcados;
  }
  if (normalizedUseCase.includes('jogo') || normalizedUseCase.includes('game')) {
    return COMPARISON_TABLES.byUseCase.jogos;
  }
  if (normalizedUseCase.includes('devops') || normalizedUseCase.includes('infra')) {
    return COMPARISON_TABLES.byUseCase.devops_infra;
  }
  if (normalizedUseCase.includes('blockchain') || normalizedUseCase.includes('web3')) {
    return COMPARISON_TABLES.byUseCase.blockchain;
  }
  if (normalizedUseCase.includes('dados') || normalizedUseCase.includes('data')) {
    return COMPARISON_TABLES.byUseCase.ciencia_dados;
  }
  
  return null;
}

/**
 * Lista todas as linguagens disponíveis
 */
export function listAllLanguages(): string[] {
  return [
    'Assembly', 'C', 'C++', 'PHP', 'Python', 'JavaScript', 'TypeScript',
    'Java', 'Go', 'Rust', 'Swift', 'Kotlin', 'Dart', 'C#',
    'Ruby', 'Elixir', 'Scala', 'Haskell', 'Lua', 'R', 'Julia',
    'Zig', 'Mojo', 'Carbon', 'COBOL', 'Fortran', 'Lisp', 'Perl', 'SQL', 'Clojure'
  ];
}

/**
 * Retorna linguagens brasileiras
 */
export function getBrazilianLanguages(): any[] {
  return [
    { name: 'Lua', creator: 'Roberto Ierusalimschy (PUC-Rio)', year: 1993 },
    { name: 'Elixir', creator: 'José Valim', year: 2012 }
  ];
}

/**
 * Retorna empresas brasileiras e suas linguagens
 */
export function getBrazilianCompaniesLanguages(): any[] {
  return [
    { company: 'Nubank', languages: ['Clojure', 'Dart/Flutter', 'Python'] },
    { company: 'iFood', languages: ['Kotlin', 'Go', 'Python'] },
    { company: 'PagSeguro', languages: ['Java', 'Kotlin', 'Go'] },
    { company: 'Mercado Livre', languages: ['Go', 'Java', 'Scala'] },
    { company: 'Stone', languages: ['Elixir', 'Go', 'TypeScript'] },
    { company: 'Itaú', languages: ['Java', 'COBOL', 'Python'] },
    { company: 'Bradesco', languages: ['Java', 'COBOL', 'C#'] }
  ];
}

// ============================================================================
// EXPORT PRINCIPAL
// ============================================================================

export default {
  manifest: POLYGLOT_LANGUAGES_MASTER_MANIFEST,
  languageCards: LANGUAGE_CARDS,
  additionalCards: {
    java: JAVA_CARD,
    go: GO_CARD,
    rust: RUST_CARD,
    swift: SWIFT_CARD,
    kotlin: KOTLIN_CARD,
    dart: DART_CARD,
    csharp: CSHARP_CARD,
    ruby: RUBY_CARD,
    elixir: ELIXIR_CARD,
    scala: SCALA_CARD,
    haskell: HASKELL_CARD,
    lua: LUA_CARD,
    r: R_CARD,
    julia: JULIA_CARD,
    zig: ZIG_CARD,
    mojo: MOJO_CARD,
    carbon: CARBON_CARD,
    cobol: COBOL_CARD,
    fortran: FORTRAN_CARD,
    lisp: LISP_CARD,
    perl: PERL_CARD,
    sql: SQL_CARD,
    clojure: CLOJURE_CARD
  },
  comparisons: COMPARISON_TABLES,
  firstLanguageGuide: FIRST_LANGUAGE_GUIDE,
  helpers: {
    shouldActivate: shouldActivatePolyglotManifest,
    getLanguageCard,
    getRecommendationByUseCase,
    listAllLanguages,
    getBrazilianLanguages,
    getBrazilianCompaniesLanguages
  }
};