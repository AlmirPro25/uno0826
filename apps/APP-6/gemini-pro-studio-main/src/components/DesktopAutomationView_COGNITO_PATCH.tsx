/**
 * 🔧 PATCH PARA ADICIONAR ABA COGNITO
 * 
 * Adicione este código no DesktopAutomationView.tsx
 * Logo após as outras abas (vision, agent, triggers, history)
 */

// ADICIONAR NO CONTEÚDO DAS ABAS (após {activeTab === 'history' && ...})

{activeTab === 'cognito' && (
  <div className="space-y-6">
    <CognitoPanel />
  </div>
)}

// OU se preferir inline:

{activeTab === 'cognito' && (
  <div className="space-y-6">
    <div>
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <i className="fa-solid fa-brain text-purple-400"></i>
        🧠 COGNITO - Recursos Avançados
      </h2>
      <p className="text-text-secondary text-sm mb-4">
        Memória de longo prazo, skills reutilizáveis, cache inteligente
      </p>
    </div>

    {/* Importar e usar o CognitoPanel */}
    <CognitoPanel />
  </div>
)}
