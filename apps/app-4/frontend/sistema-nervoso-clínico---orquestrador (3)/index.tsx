import React from 'react';
import ReactDOM from 'react-dom/client';
import TelemedicineModule from './App';
import { Especialidade, Medico, RegistroMedico } from './types';

// --- MOCK DO SISTEMA PRINCIPAL (HOST SYSTEM) ---
// Em produção, isso seria a sua aplicação principal importando o <TelemedicineModule />

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Elemento raiz não encontrado.");
}

// Simulando um médico logado no sistema principal
const currentUserMock: Medico = {
    id: 'M_HOST_001',
    nome: 'Dr. Usuário Anfitrião',
    especialidade: Especialidade.CLINICA_GERAL,
    crm: 'HOST-123',
    disponivel: true,
    scoreMatch: 0,
    tags: ['Host System User'],
    fotoUrl: 'https://ui-avatars.com/api/?name=Dr+User&background=0D8ABC&color=fff'
};

const handleSystemExit = () => {
    console.log("[HOST SYSTEM] Módulo de Telemedicina encerrado pelo usuário.");
    alert("Callback de Saída acionado: O usuário voltou para o sistema principal.");
};

const handleSessionComplete = (registro: RegistroMedico) => {
    console.log("[HOST SYSTEM] Novo Prontuário Recebido:", registro);
    alert(`Prontuário salvo no DB Principal! ID: ${registro.id}`);
    // Aqui você faria: await api.post('/medical-records', registro);
};

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {/* Integração: O Sistema Principal monta o Módulo SNDT */}
    <TelemedicineModule 
        doctorContext={currentUserMock} 
        onExit={handleSystemExit}
        onSessionComplete={handleSessionComplete}
        // Se você quiser abrir direto em um paciente, descomente abaixo:
        // initialPatientId="P001"
    />
  </React.StrictMode>
);