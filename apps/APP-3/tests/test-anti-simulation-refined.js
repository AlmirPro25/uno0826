/**
 * Teste do Sistema Anti-Simulação Refinado
 * Valida as melhorias implementadas no sistema inteligente
 */

// Simulação dos diferentes tipos de código para testar o sistema
const testCases = [
  {
    name: "Código Real - Alta Qualidade",
    code: `
import React from 'react';
import { useState } from 'react';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const LoginComponent = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });

  const handleLogin = async () => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      
      const data = await response.json();
      if (data.token) {
        localStorage.setItem('authToken', data.token);
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="login-form">
      <input 
        type="email" 
        value={credentials.email}
        onChange={(e) => setCredentials({...credentials, email: e.target.value})}
        placeholder="Email"
      />
      <input 
        type="password" 
        value={credentials.password}
        onChange={(e) => setCredentials({...credentials, password: e.target.value})}
        placeholder="Password"
      />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
};

export default LoginComponent;
    `,
    expectedScore: 0, // Baixo score = bom código
    shouldPass: true
  },
  
  {
    name: "Código com Simulação Crítica - Base64 Image",
    code: `
const QRCodeGenerator = () => {
  const generateQR = () => {
    // Simulate QR code generation
    const qrCode = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAABjklEQVR4Xu3SsQ0AAAjDMM3/0kPAg/jSjYgKAIkCQCIAkggAJAEgiQJAIAAmCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARAAgCQCARA";
    return qrCode;
  };

  return <img src={generateQR()} alt="QR Code" />;
};
    `,
    expectedScore: 40, // Alto score = código problemático
    shouldPass: false
  },

  {
    name: "Código com Simulação Explícita",
    code: `
const PaymentSystem = () => {
  const processPayment = () => {
    // Aqui você implementaria a integração com Stripe
    // Este seria o endpoint para processar pagamentos
    // Simule a resposta do gateway de pagamento
    console.log("Payment processed");
  };

  return <button onClick={processPayment}>Pay Now</button>;
};
    `,
    expectedScore: 65, // Alto score por simulação explícita
    shouldPass: false
  },

  {
    name: "Código com Placeholders Leves (Aceitável)",
    code: `
const UserProfile = () => {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    // TODO: Implement user data fetching
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user/profile');
      const userData = await response.json();
      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  };

  return (
    <div className="user-profile">
      {user ? (
        <div>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
        </div>
      ) : (
        <div>Loading user data...</div>
      )}
    </div>
  );
};
    `,
    expectedScore: 3, // Baixo score - TODOs são aceitáveis
    shouldPass: true
  },

  {
    name: "Código com Lorem Ipsum",
    code: `
const BlogPost = () => {
  return (
    <article>
      <h1>Lorem Ipsum Dolor Sit Amet</h1>
      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
         Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
      <p>Substitua este conteúdo por texto real do artigo.</p>
    </article>
  );
};
    `,
    expectedScore: 27, // Score moderado por Lorem Ipsum + instrução de substituição
    shouldPass: false
  }
];

// Função para simular o sistema de pontuação
function calculateSimulationScore(code, context = {}) {
  let simulationScore = 0;
  const issues = [];
  
  // Remover placeholders de imagem válidos
  const codeWithoutImagePlaceholders = code.replace(/ai-researched-image:\/\/[^"'\s]+/g, 'VALID_IMAGE_PLACEHOLDER');
  
  // Padrões críticos de simulação (alta severidade)
  const criticalPatterns = [
    { pattern: /aqui você (conectaria|implementaria|adicionaria)/i, weight: 30, type: 'critical_simulation' },
    { pattern: /este seria o (endpoint|código|arquivo)/i, weight: 25, type: 'hypothetical_code' },
    { pattern: /simule (a|o|os|as)/i, weight: 35, type: 'explicit_simulation' },
    { pattern: /data:image\/[^;]+;base64,/i, weight: 40, type: 'base64_image' },
  ];
  
  // Padrões moderados (média severidade)
  const moderatePatterns = [
    { pattern: /lorem ipsum/i, weight: 15, type: 'placeholder_text' },
    { pattern: /substitua (por|este|esta)/i, weight: 12, type: 'replacement_instruction' },
    { pattern: /exemplo de (como|uso)/i, weight: 10, type: 'example_code' },
    { pattern: /\[placeholder\]/i, weight: 8, type: 'bracket_placeholder' },
    { pattern: /\{placeholder\}/i, weight: 8, type: 'brace_placeholder' },
  ];
  
  // Padrões leves (baixa severidade)
  const lightPatterns = [
    { pattern: /TODO:/i, weight: 3, type: 'todo_comment' },
    { pattern: /FIXME:/i, weight: 3, type: 'fixme_comment' },
    { pattern: /placeholder text/i, weight: 5, type: 'placeholder_reference' },
    { pattern: /placeholder content/i, weight: 5, type: 'placeholder_reference' },
  ];
  
  // Verificar padrões críticos
  for (const {pattern, weight, type} of criticalPatterns) {
    if (pattern.test(codeWithoutImagePlaceholders)) {
      simulationScore += weight;
      issues.push({type, severity: 'high', pattern: pattern.source});
    }
  }
  
  // Verificar padrões moderados
  for (const {pattern, weight, type} of moderatePatterns) {
    if (pattern.test(codeWithoutImagePlaceholders)) {
      simulationScore += weight;
      issues.push({type, severity: 'medium', pattern: pattern.source});
    }
  }
  
  // Verificar padrões leves
  for (const {pattern, weight, type} of lightPatterns) {
    if (pattern.test(codeWithoutImagePlaceholders)) {
      const contextualWeight = isAcceptableInContext(type, context) ? weight * 0.3 : weight;
      simulationScore += contextualWeight;
      issues.push({type, severity: 'low', pattern: pattern.source});
    }
  }
  
  // Bonificações por código real
  const realCodeBonuses = [
    { pattern: /import .+ from ['"].+['"]/g, bonus: -2, type: 'real_imports' },
    { pattern: /export (default |const |function )/g, bonus: -1, type: 'real_exports' },
    { pattern: /\.(get|post|put|delete)\(/g, bonus: -3, type: 'real_api_methods' },
    { pattern: /jwt\.sign|bcrypt\.(hash|compare)/g, bonus: -5, type: 'real_auth' },
    { pattern: /prisma\.|mongoose\./g, bonus: -4, type: 'real_database' },
  ];
  
  for (const {pattern, bonus} of realCodeBonuses) {
    const matches = codeWithoutImagePlaceholders.match(pattern);
    if (matches) {
      simulationScore += bonus * matches.length;
    }
  }
  
  // Garantir que o score não seja negativo
  simulationScore = Math.max(0, simulationScore);
  
  return {
    score: simulationScore,
    issues,
    isAcceptable: simulationScore < 20
  };
}

function isAcceptableInContext(patternType, context) {
  if (!context) return false;
  
  if ((patternType === 'todo_comment' || patternType === 'fixme_comment') && 
      context.developmentPhase === 'prototype') {
    return true;
  }
  
  if (patternType.includes('placeholder') && context.isTemplate) {
    return true;
  }
  
  return false;
}

// Executar testes
console.log('🧪 TESTE DO SISTEMA ANTI-SIMULAÇÃO REFINADO\n');
console.log('=' .repeat(60));

let passedTests = 0;
let totalTests = testCases.length;

testCases.forEach((testCase, index) => {
  console.log(`\n📋 Teste ${index + 1}: ${testCase.name}`);
  console.log('-'.repeat(40));
  
  const result = calculateSimulationScore(testCase.code);
  
  console.log(`Score calculado: ${result.score}`);
  console.log(`Score esperado: ~${testCase.expectedScore}`);
  console.log(`Deveria passar: ${testCase.shouldPass ? 'Sim' : 'Não'}`);
  console.log(`Resultado: ${result.isAcceptable ? 'APROVADO' : 'REJEITADO'}`);
  
  if (result.issues.length > 0) {
    console.log(`Problemas detectados:`);
    result.issues.forEach(issue => {
      console.log(`  - ${issue.type} (${issue.severity})`);
    });
  }
  
  const testPassed = result.isAcceptable === testCase.shouldPass;
  console.log(`Status: ${testPassed ? '✅ PASSOU' : '❌ FALHOU'}`);
  
  if (testPassed) passedTests++;
});

console.log('\n' + '='.repeat(60));
console.log(`📊 RESULTADO FINAL: ${passedTests}/${totalTests} testes passaram`);
console.log(`Taxa de sucesso: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (passedTests === totalTests) {
  console.log('🎉 TODOS OS TESTES PASSARAM! Sistema refinado funcionando corretamente.');
} else {
  console.log('⚠️  Alguns testes falharam. Revisar configurações do sistema.');
}

// Teste de estratégias adaptativas
console.log('\n🔄 TESTE DE ESTRATÉGIAS ADAPTATIVAS');
console.log('=' .repeat(60));

const problematicCode = `
// Aqui você implementaria a conexão com o banco
// Este seria o arquivo de configuração
// Simule a autenticação do usuário
const auth = "placeholder for auth system";
`;

const analysis = calculateSimulationScore(problematicCode);
console.log(`\nCódigo problemático detectado com score: ${analysis.score}`);
console.log('Problemas encontrados:');
analysis.issues.forEach(issue => {
  console.log(`  - ${issue.type} (severidade: ${issue.severity})`);
});

// Simular estratégia de refinamento
function buildRefinementStrategy(issues) {
  const highSeverityIssues = issues.filter(i => i.severity === 'high');
  const mediumSeverityIssues = issues.filter(i => i.severity === 'medium');
  
  if (highSeverityIssues.length > 0) {
    const criticalTypes = highSeverityIssues.map(i => i.type);
    
    if (criticalTypes.includes('critical_simulation')) {
      return {
        focus: 'real_implementation',
        approach: 'aggressive',
        specificInstructions: [
          'Implemente funcionalidades reais, não simulações',
          'Use APIs e bibliotecas reais',
          'Crie lógica de negócio funcional'
        ]
      };
    }
  }
  
  if (mediumSeverityIssues.length > 2) {
    return {
      focus: 'placeholder_elimination',
      approach: 'moderate',
      specificInstructions: [
        'Substitua todos os placeholders por conteúdo real',
        'Use dados realistas em vez de Lorem Ipsum',
        'Implemente funcionalidades completas'
      ]
    };
  }
  
  return {
    focus: 'general_improvement',
    approach: 'gentle',
    specificInstructions: [
      'Melhore a qualidade geral do código',
      'Adicione mais funcionalidades reais',
      'Garanta que tudo funcione corretamente'
    ]
  };
}

const strategy = buildRefinementStrategy(analysis.issues);
console.log(`\n🎯 Estratégia de refinamento sugerida:`);
console.log(`Foco: ${strategy.focus}`);
console.log(`Abordagem: ${strategy.approach}`);
console.log(`Instruções específicas:`);
strategy.specificInstructions.forEach(instruction => {
  console.log(`  • ${instruction}`);
});

console.log('\n✨ TESTE CONCLUÍDO - Sistema Anti-Simulação Refinado validado!');
