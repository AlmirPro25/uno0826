import axios from "axios";

// API URL - Oracle Cloud em produção
// export const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.prostqs.com.br/api/v1";
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://64.181.175.25:8080/api/v1";

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 30000, // 30 seconds timeout
});

api.interceptors.request.use(
    (config) => {
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("token");
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Não fazer redirect automático no interceptor
        // Deixar o auth-context lidar com isso de forma controlada
        return Promise.reject(error);
    }
);
