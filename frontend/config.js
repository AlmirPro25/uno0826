// ========================================
// PROST-QS - Configuração Global do Frontend
// ========================================

const CONFIG = {
    // URL do Backend API
    API_URL: 'https://uno0826.onrender.com',
    
    // Versão do Frontend
    VERSION: '1.0.0',
    
    // Nome do sistema
    APP_NAME: 'PROST-QS'
};

// Função helper para chamadas à API
async function apiCall(endpoint, options = {}) {
    const token = localStorage.getItem('prost_token');
    
    const defaultHeaders = {
        'Content-Type': 'application/json'
    };
    
    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${CONFIG.API_URL}${endpoint}`, {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers
        }
    });
    
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(error.error || `HTTP ${response.status}`);
    }
    
    return response.json();
}

// Funções de autenticação
const Auth = {
    async login(username, password) {
        const data = await apiCall('/api/v1/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        localStorage.setItem('prost_token', data.token);
        return data;
    },
    
    async register(username, password, email) {
        return apiCall('/api/v1/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, password, email })
        });
    },
    
    logout() {
        localStorage.removeItem('prost_token');
        window.location.href = '/';
    },
    
    isLoggedIn() {
        return !!localStorage.getItem('prost_token');
    },
    
    getToken() {
        return localStorage.getItem('prost_token');
    }
};

// Funções de Apps
const Apps = {
    async list() {
        return apiCall('/api/v1/apps/mine');
    },
    
    async create(name, description) {
        return apiCall('/api/v1/apps', {
            method: 'POST',
            body: JSON.stringify({ name, description })
        });
    },
    
    async get(id) {
        return apiCall(`/api/v1/apps/${id}`);
    },
    
    async createCredential(appId, name) {
        return apiCall(`/api/v1/apps/${appId}/credentials`, {
            method: 'POST',
            body: JSON.stringify({ name })
        });
    }
};

// Exportar para uso global
window.CONFIG = CONFIG;
window.apiCall = apiCall;
window.Auth = Auth;
window.Apps = Apps;

console.log(`🚀 PROST-QS Frontend v${CONFIG.VERSION} carregado`);
console.log(`📡 API: ${CONFIG.API_URL}`);
