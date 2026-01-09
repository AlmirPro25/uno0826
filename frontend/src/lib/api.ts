import axios from "axios";

// IMPORTANTE: Em produção, usar a URL completa com /api/v1
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://uno0826.onrender.com/api/v1";

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(
    (config) => {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
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
        if (error.response?.status === 401) {
            if (typeof window !== "undefined") {
                localStorage.removeItem("token");
                // Optional: Redirect to login if not already there
                // window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);
