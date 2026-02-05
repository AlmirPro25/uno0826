
import axios from 'axios';

// Instância Axios configurada para comunicar com o Motor (Server.js)
export const api = axios.create({
  baseURL: 'http://localhost:3000/api', // Hardcoded para simplicidade neste ambiente
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

===FILE: frontend/src/store/useFleetStore.ts===
LANGUAGE: typescript
