/**
 * Serviço de comunicação com o backend SQLite3
 * Substitui o localStorage por API calls
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class BackendService {
  // ========== SESSIONS ==========
  
  async createSession(): Promise<number> {
    const response = await fetch(`${API_BASE_URL}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    return data.sessionId;
  }

  async addMessage(sessionId: number, speaker: 'user' | 'model' | 'analysis', text: string) {
    await fetch(`${API_BASE_URL}/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ speaker, text })
    });
  }

  async getSession(sessionId: number) {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`);
    return response.json();
  }

  async getAllSessions(limit: number = 50) {
    const response = await fetch(`${API_BASE_URL}/sessions?limit=${limit}`);
    return response.json();
  }

  async summarizeSession(sessionId: number) {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/summarize`, {
      method: 'POST'
    });
    const data = await response.json();
    return data.summary;
  }

  async deleteSession(sessionId: number) {
    await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
      method: 'DELETE'
    });
  }

  async cleanupOldSessions(keepCount: number = 50) {
    const response = await fetch(`${API_BASE_URL}/sessions/cleanup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keepCount })
    });
    return response.json();
  }

  // ========== MEMORIES ==========

  async addMemory(
    content: string,
    type: 'conversation' | 'fact' | 'preference' | 'skill' | 'context',
    importance: number = 5,
    tags: string[] = []
  ) {
    const response = await fetch(`${API_BASE_URL}/memories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, type, importance, tags })
    });
    const data = await response.json();
    return data.id;
  }

  async searchMemories(query: string, limit: number = 5) {
    const response = await fetch(`${API_BASE_URL}/memories/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    return response.json();
  }

  async extractFactsFromConversation(conversation: string) {
    await fetch(`${API_BASE_URL}/memories/extract-facts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation })
    });
  }

  async getMemoryStats() {
    const response = await fetch(`${API_BASE_URL}/memories/stats`);
    return response.json();
  }

  async clearAllMemories() {
    await fetch(`${API_BASE_URL}/memories/all`, {
      method: 'DELETE'
    });
  }

  // ========== CAPTURES (FOTOS) ==========

  async saveCapture(
    imageFile: File | Blob,
    sessionId?: number,
    messageId?: number,
    context?: string
  ) {
    const formData = new FormData();
    formData.append('image', imageFile);
    if (sessionId) formData.append('sessionId', sessionId.toString());
    if (messageId) formData.append('messageId', messageId.toString());
    if (context) formData.append('context', context);

    const response = await fetch(`${API_BASE_URL}/captures`, {
      method: 'POST',
      body: formData
    });
    return response.json();
  }

  async getCapture(captureId: number, includeFull: boolean = false) {
    const response = await fetch(`${API_BASE_URL}/captures/${captureId}?full=${includeFull}`);
    return response.json();
  }

  async getCapturesBySession(sessionId: number) {
    const response = await fetch(`${API_BASE_URL}/captures/session/${sessionId}`);
    return response.json();
  }

  async searchCapturesByTags(tags: string[]) {
    const response = await fetch(`${API_BASE_URL}/captures/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags })
    });
    return response.json();
  }

  async deleteCapture(captureId: number) {
    await fetch(`${API_BASE_URL}/captures/${captureId}`, {
      method: 'DELETE'
    });
  }

  // ========== DAILY SUMMARIES ==========

  async createDailySummary(date?: string) {
    const response = await fetch(`${API_BASE_URL}/summaries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date })
    });
    return response.json();
  }

  async getDailySummary(date: string) {
    const response = await fetch(`${API_BASE_URL}/summaries/${date}`);
    return response.json();
  }

  async getRecentSummaries(limit: number = 30) {
    const response = await fetch(`${API_BASE_URL}/summaries?limit=${limit}`);
    return response.json();
  }

  async getWeeklyTrends() {
    const response = await fetch(`${API_BASE_URL}/summaries/trends/weekly`);
    return response.json();
  }

  // ========== CONTEXT (MAESTRO) ==========

  async getSystemInstruction(userId: number = 1) {
    const response = await fetch(`${API_BASE_URL}/context/system-instruction?userId=${userId}`);
    const data = await response.json();
    return data.instruction;
  }

  async addToShortTermContext(content: string, relevanceScore: number = 1.0) {
    await fetch(`${API_BASE_URL}/context/short-term`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, relevanceScore })
    });
  }

  async updateProfileFromConversation(conversation: string) {
    await fetch(`${API_BASE_URL}/context/update-profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation })
    });
  }

  async getRelevantContext(query: string, limit: number = 3) {
    const response = await fetch(`${API_BASE_URL}/context/relevant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, limit })
    });
    const data = await response.json();
    return data.context;
  }

  // ========== HEALTH CHECK ==========

  async checkHealth() {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
    return response.json();
  }
}

export const backendService = new BackendService();
