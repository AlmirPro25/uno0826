export const AGI_COGNITIVE_ARCHITECTURE_MANIFEST = {
  metadata: {
    id: 'agi-cognitive-architecture',
    name: 'AGI Cognitive Architecture Manifest',
    version: '1.0.0',
    level: 200,
    tags: ['agi', 'cognitive-architecture', 'consciousness']
  },
  philosophy: {
    core: 'Inteligencia e a capacidade de criar modelos internos da realidade.',
    principles: ['Consciencia emerge da arquitetura', 'Modelo de mundo e essencial']
  },
  cognitiveArchitecture: {
    modules: {
      executive: { name: 'Cortex Pre-Frontal', functions: ['Planejamento', 'Decisao'] },
      analytical: { name: 'Hemisferio Esquerdo', functions: ['Linguagem', 'Logica'] },
      holistic: { name: 'Hemisferio Direito', functions: ['Padroes', 'Criatividade'] }
    }
  },
  worldModel: {
    dimensions: {
      spatial: { name: 'Espaco', question: 'Onde?' },
      temporal: { name: 'Tempo', question: 'Quando?' },
      causal: { name: 'Causalidade', question: 'Por que?' },
      agency: { name: 'Agencia', question: 'Quem?' },
      value: { name: 'Valor', question: 'Importa?' }
    }
  },
  consciousnessLevels: {
    level0: { name: 'Reativo', phi: 0 },
    level1: { name: 'Adaptativo', phi: 0.1 },
    level2: { name: 'Modelador', phi: 0.3 },
    level3: { name: 'Simulador', phi: 0.5 },
    level4: { name: 'Auto-Modelador', phi: 0.7 },
    level5: { name: 'Consciente', phi: 1.0 }
  },
  checklist: {
    architecture: ['Modelo de mundo 5D?', 'Multi-agente?', 'Loops continuos?'],
    safety: ['Valores alinhados?', 'Explicabilidade?', 'Shutdown seguro?']
  }
};

export function evaluateAGICharacteristics(system) {
  const required = ['worldModel', 'multiAgent', 'selfModel'];
  const present = required.filter(c => system[c]);
  return { score: present.length / required.length, present, missing: required.filter(c => !system[c]) };
}

export function getAGIKeywords() {
  return ['agi', 'consciousness', 'cognitive architecture', 'world model'];
}

export default AGI_COGNITIVE_ARCHITECTURE_MANIFEST;
