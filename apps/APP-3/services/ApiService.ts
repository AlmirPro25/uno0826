// src/services/ApiService.ts

const BASE_URL = 'http://localhost:3001/api'; // Direct URL to the backend for local development.

export class ApiError extends Error {
    public status: number;
    public details?: any;

    constructor(message: string, status: number, details?: any) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.details = details;
    }
}

async function request<T>(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', body?: any): Promise<T> {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    const token = localStorage.getItem('aiWebWeaverAuthToken');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
        method,
        headers,
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, config);
        
        const responseBody = await response.json();

        if (!response.ok) {
            const errorMessage = responseBody.message || `HTTP error! status: ${response.status}`;
            throw new ApiError(errorMessage, response.status, responseBody.errors);
        }

        return responseBody as T;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        console.error('Network or other fetch error:', error);
        throw new ApiError('Falha na comunicação com o servidor. Verifique sua conexão ou o status do backend.', 503);
    }
}

export const apiService = {
    get: <T>(endpoint: string) => request<T>(endpoint, 'GET'),
    post: <T>(endpoint: string, body: any) => request<T>(endpoint, 'POST', body),
    put: <T>(endpoint: string, body: any) => request<T>(endpoint, 'PUT', body),
    delete: <T>(endpoint: string) => request<T>(endpoint, 'DELETE'),
};