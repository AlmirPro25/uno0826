/**
 * 🧠 Exemplo de Uso do Alan Turing Resurrection Manifest
 * 
 * Demonstra como usar o manifesto para:
 * 1. Acessar informações biográficas
 * 2. Explorar os 4 pilares do pensamento
 * 3. Obter citações autênticas
 * 4. Simular uma Máquina de Turing
 * 5. Gerar respostas no estilo Turing
 */

import ALAN_TURING_RESURRECTION_MANIFEST, {
  generateTuringStyleResponse,
  getRandomTuringQuote,
  isTuringRelated
} from '../services/manifestos/ALAN_TURING_RESURRECTION_MANIFEST';

// ============================================================
// 1. INFORMAÇÕES BIOGRÁFICAS
// ============================================================
console.log('=== BIOGRAFIA DE ALAN TURING ===\n');

const bio = ALAN_TURING_RESURRECTION_MANIFEST.biography;
console.log(`Nome: ${bio.fullName}`);
console.log(`Nascimento: ${bio.birth.date} em ${bio.birth.place}`);
console.log(`Morte: ${bio.death.date} em ${bio.death.place} (${bio.death.age} anos)`);
console.log(`\nEducação:`);
bio.education.forEach(e => {
  console.log(`  - ${e.institution} (${e.period}): ${e.degree || e.notes}`);
});

// ============================================================
// 2. OS QUATRO PILARES
// ============================================================
console.log('\n=== OS QUATRO PILARES DO PENSAMENTO TURING ===\n');

const pillars = ALAN_TURING_RESURRECTION_MANIFEST.pillars;

// Pilar 1: Teoria da Computação
const computation = pillars.computationTheory;
console.log(`📐 ${computation.name} (${computation.year})`);
console.log(`   Paper: "${computation.paper}"`);
console.log(`   Problema: ${computation.problem.name}`);
console.log(`   Resposta de Turing: ${computation.problem.turingAnswer}`);

// Pilar 2: Criptoanálise
const crypto = pillars.cryptanalysis;
console.log(`\n🔐 ${crypto.name} (${crypto.period})`);
console.log(`   Local: ${crypto.location}`);
console.log(`   Desafio: ${crypto.challenge.configurations} configurações de Enigma`);
console.log(`   Impacto: ${crypto.warImpact.estimatedEffect}`);
console.log(`   Vidas salvas: ${crypto.warImpact.livesSaved}`);


// Pilar 3: Inteligência Artificial
const ai = pillars.artificialIntelligence;
console.log(`\n🤖 ${ai.name} (${ai.year})`);
console.log(`   Paper: "${ai.paper}"`);
console.log(`   Pergunta original: "${ai.originalQuestion}"`);
console.log(`   Reformulação: "${ai.turingReformulation}"`);

// Pilar 4: Biologia Matemática
const biology = pillars.mathematicalBiology;
console.log(`\n🧬 ${biology.name} (${biology.year})`);
console.log(`   Paper: "${biology.paper}"`);
console.log(`   Pergunta: "${biology.question}"`);
console.log(`   Padrões: ${biology.turingPatterns.join(', ')}`);

// ============================================================
// 3. CITAÇÕES AUTÊNTICAS
// ============================================================
console.log('\n=== CITAÇÕES DE ALAN TURING ===\n');

for (let i = 0; i < 5; i++) {
  console.log(`"${getRandomTuringQuote()}"\n`);
}

// ============================================================
// 4. SIMULADOR DE MÁQUINA DE TURING
// ============================================================
console.log('=== SIMULADOR DE MÁQUINA DE TURING ===\n');

class TuringMachine {
  tape: string[];
  head: number;
  state: string;
  transitions: Map<string, [string, string, 'L' | 'R']>;
  finalStates: Set<string>;

  constructor(tape: string, initialState: string, finalStates: string[]) {
    this.tape = [...tape, ...Array(100).fill('_')];
    this.head = 0;
    this.state = initialState;
    this.finalStates = new Set(finalStates);
    this.transitions = new Map();
  }

  addTransition(state: string, symbol: string, newState: string, newSymbol: string, direction: 'L' | 'R') {
    this.transitions.set(`${state},${symbol}`, [newState, newSymbol, direction]);
  }

  step(): boolean {
    const symbol = this.tape[this.head];
    const key = `${this.state},${symbol}`;
    const transition = this.transitions.get(key);
    
    if (!transition) return false;
    
    const [newState, newSymbol, direction] = transition;
    this.tape[this.head] = newSymbol;
    this.state = newState;
    this.head += direction === 'R' ? 1 : -1;
    
    return !this.finalStates.has(this.state);
  }

  run(maxSteps = 1000): string {
    let steps = 0;
    while (this.step() && steps < maxSteps) steps++;
    return this.tape.join('').replace(/_+$/, '');
  }
}

// Exemplo 1: Inverter bits (0→1, 1→0)
console.log('Exemplo 1: Inversor de Bits');
const inverter = new TuringMachine('0110100', 'q0', ['qf']);
inverter.addTransition('q0', '0', 'q0', '1', 'R');
inverter.addTransition('q0', '1', 'q0', '0', 'R');
inverter.addTransition('q0', '_', 'qf', '_', 'R');
console.log(`  Entrada: 0110100`);
console.log(`  Saída:   ${inverter.run()}`);

// Exemplo 2: Incrementador binário
console.log('\nExemplo 2: Incrementador Binário (+1)');
const incrementer = new TuringMachine('1011', 'q0', ['qf']);
incrementer.addTransition('q0', '0', 'q0', '0', 'R');
incrementer.addTransition('q0', '1', 'q0', '1', 'R');
incrementer.addTransition('q0', '_', 'q1', '_', 'L');
incrementer.addTransition('q1', '1', 'q1', '0', 'L');
incrementer.addTransition('q1', '0', 'qf', '1', 'L');
incrementer.addTransition('q1', '_', 'qf', '1', 'L');
console.log(`  Entrada: 1011 (11 em decimal)`);
console.log(`  Saída:   ${incrementer.run()} (12 em decimal)`);

// ============================================================
// 5. RESPOSTA NO ESTILO TURING
// ============================================================
console.log('\n=== RESPOSTA NO ESTILO TURING ===\n');

const question = 'Máquinas podem realmente pensar?';
console.log(`Pergunta: "${question}"\n`);
console.log(generateTuringStyleResponse(question));

// ============================================================
// 6. VERIFICAR TÓPICOS RELACIONADOS
// ============================================================
console.log('\n=== VERIFICAÇÃO DE TÓPICOS ===\n');

const topics = [
  'Máquina de Turing',
  'Teste de Turing',
  'Enigma e Bletchley Park',
  'Morfogênese',
  'Receita de bolo',
  'Inteligência Artificial',
  'Futebol'
];

topics.forEach(topic => {
  const related = isTuringRelated(topic);
  console.log(`  "${topic}": ${related ? '✅ Relacionado a Turing' : '❌ Não relacionado'}`);
});

// ============================================================
// 7. AS 9 OBJEÇÕES À IA
// ============================================================
console.log('\n=== AS 9 OBJEÇÕES À IA (1950) ===\n');

const objections = ai.nineObjections;
objections.forEach((obj, i) => {
  console.log(`${i + 1}. ${obj.name}`);
  console.log(`   Objeção: "${obj.claim}"`);
  console.log(`   Resposta de Turing: "${obj.response}"\n`);
});

// ============================================================
// 8. HONRAS PÓSTUMAS
// ============================================================
console.log('=== HONRAS PÓSTUMAS ===\n');

bio.posthumousHonors.forEach(h => {
  console.log(`  ${h.year}: ${h.honor}`);
});

// ============================================================
// 9. FILOSOFIA FINAL
// ============================================================
console.log('\n=== FILOSOFIA FINAL ===\n');

const philosophy = ALAN_TURING_RESURRECTION_MANIFEST.philosophy;
console.log(philosophy.essence.trim());
console.log(`\n"${philosophy.finalQuote.text}"`);
console.log(`— ${philosophy.finalQuote.attribution}`);
console.log(`   ${philosophy.finalQuote.titles}`);
