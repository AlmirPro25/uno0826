
import axios from 'axios';

// Define a URL base da API do backend.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const axiosInstance = axios.create({ baseURL: API_BASE_URL });

/**
 * Intercepta requisições para adicionar o token JWT no cabeçalho.
 */
axiosInstance.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

/**
 * Interface para representar uma tarefa.
 */
export interface Task {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  user_id: number;
}

/**
 * Interface para os dados de criação/atualização de tarefa.
 */
export interface TaskData {
  title: string;
  description: string;
  completed?: boolean;
}

/**
 * Busca todas as tarefas do usuário logado.
 * @returns {Promise<Task[]>} Lista de tarefas.
 */
export async function getTasks(): Promise<Task[]> {
  try {
    const response = await axiosInstance.get('/api/tasks');
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Erro ao buscar tarefas.');
  }
}

/**
 * Cria uma nova tarefa.
 * @param {TaskData} data - Dados da nova tarefa.
 * @returns {Promise<Task>} Tarefa criada.
 */
export async function createTask(data: TaskData): Promise<Task> {
  try {
    const response = await axiosInstance.post('/api/tasks', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Erro ao criar tarefa.');
  }
}

/**
 * Atualiza uma tarefa existente.
 * @param {number} id - ID da tarefa.
 * @param {Partial<TaskData>} data - Dados a serem atualizados.
 * @returns {Promise<Task>} Tarefa atualizada.
 */
export async function updateTask(id: number, data: Partial<TaskData>): Promise<Task> {
  try {
    const response = await axiosInstance.put(`/api/tasks/${id}`, data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Erro ao atualizar tarefa.');
  }
}

/**
 * Exclui uma tarefa.
 * @param {number} id - ID da tarefa.
 * @returns {Promise<void>}
 */
export async function deleteTask(id: number): Promise<void> {
  try {
    await axiosInstance.delete(`/api/tasks/${id}`);
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Erro ao excluir tarefa.');
  }
}
