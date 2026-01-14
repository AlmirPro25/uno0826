/**
 * Serviço para gerenciar pessoas e reconhecimento facial
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface Person {
  id: number;
  name: string;
  description?: string;
  relationship?: string;
  first_seen: string;
  last_seen: string;
  times_seen: number;
  notes?: string;
}

export interface DetectedPerson {
  name: string;
  isKnown: boolean;
  confidence: number;
  emotion?: string;
  description: string;
}

export interface DetectionResult {
  people: DetectedPerson[];
  analysis: string;
}

class PeopleService {
  /**
   * Detecta pessoas em uma imagem
   */
  async detectPeople(imageFile: File | Blob, sessionId: number): Promise<DetectionResult> {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('sessionId', sessionId.toString());

    const response = await fetch(`${API_BASE_URL}/people/detect`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Erro ao detectar pessoas');
    }

    return response.json();
  }

  /**
   * Adiciona uma nova pessoa ao sistema
   */
  async addPerson(
    name: string,
    imageFile: File | Blob,
    description?: string,
    relationship?: string
  ): Promise<{ success: boolean; personId: number; message: string }> {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('image', imageFile);
    if (description) formData.append('description', description);
    if (relationship) formData.append('relationship', relationship);

    const response = await fetch(`${API_BASE_URL}/people`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Erro ao adicionar pessoa');
    }

    return response.json();
  }

  /**
   * Busca pessoa por ID
   */
  async getPerson(personId: number): Promise<Person> {
    const response = await fetch(`${API_BASE_URL}/people/${personId}`);
    
    if (!response.ok) {
      throw new Error('Pessoa não encontrada');
    }

    return response.json();
  }

  /**
   * Busca pessoa por nome
   */
  async getPersonByName(name: string): Promise<Person> {
    const response = await fetch(`${API_BASE_URL}/people/name/${encodeURIComponent(name)}`);
    
    if (!response.ok) {
      throw new Error('Pessoa não encontrada');
    }

    return response.json();
  }

  /**
   * Lista todas as pessoas conhecidas
   */
  async getAllPeople(): Promise<Person[]> {
    const response = await fetch(`${API_BASE_URL}/people`);
    
    if (!response.ok) {
      throw new Error('Erro ao buscar pessoas');
    }

    return response.json();
  }

  /**
   * Atualiza informações de uma pessoa
   */
  async updatePerson(
    personId: number,
    updates: {
      description?: string;
      relationship?: string;
      notes?: string;
    }
  ): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/people/${personId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      throw new Error('Erro ao atualizar pessoa');
    }

    return response.json();
  }

  /**
   * Busca histórico de detecções de uma pessoa
   */
  async getPersonHistory(personId: number, limit: number = 50) {
    const response = await fetch(`${API_BASE_URL}/people/${personId}/history?limit=${limit}`);
    
    if (!response.ok) {
      throw new Error('Erro ao buscar histórico');
    }

    return response.json();
  }

  /**
   * Remove uma pessoa do sistema
   */
  async deletePerson(personId: number): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/people/${personId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Erro ao remover pessoa');
    }

    return response.json();
  }

  /**
   * Captura frame da webcam e converte para Blob
   */
  async captureWebcamFrame(videoElement: HTMLVideoElement): Promise<Blob> {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Não foi possível criar contexto do canvas');
    }

    ctx.drawImage(videoElement, 0, 0);

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Erro ao capturar frame'));
        }
      }, 'image/jpeg', 0.9);
    });
  }
}

export const peopleService = new PeopleService();
