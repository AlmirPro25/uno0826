/**
 * CONFIGURAÇÃO GLOBAL DO PAINEL ADMIN
 * Troque a URL abaixo para o IP/Domínio da sua VM na Oracle ou Google Cloud.
 */
const CONFIG = {
    // API_BASE: 'http://localhost:8080/api/v1', // Para rodar local
    API_BASE: 'https://api.prostqs.com.br/api/v1', // URL de Produção (Oracle)
    ENV: 'production'
};

// Exportar para uso global se necessário
if (typeof window !== 'undefined') {
    window.APP_CONFIG = CONFIG;
}
