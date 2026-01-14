export interface Session {
  id: number;
  start_time: string;
  end_time?: string;
  summary?: string;
  daily_summary_id?: number;
  created_at: string;
}

export interface Message {
  id: number;
  session_id: number;
  timestamp: string;
  speaker: 'user' | 'model' | 'analysis';
  text: string;
  audio_data?: Buffer;
  created_at: string;
}

export interface Memory {
  id: string;
  timestamp: string;
  content: string;
  type: 'conversation' | 'fact' | 'preference' | 'skill' | 'context';
  importance: number;
  embedding?: Buffer;
  tags: string[];
  related_to: string[];
  created_at: string;
}

export interface Capture {
  id: number;
  session_id?: number;
  message_id?: number;
  timestamp: string;
  image_data: Buffer;
  thumbnail: Buffer;
  description?: string;
  ai_analysis?: string;
  tags: string[];
  created_at: string;
}

export interface DailySummary {
  id: number;
  date: string;
  summary: string;
  key_topics: string[];
  important_facts: string[];
  user_mood: string;
  productivity_score: number;
  ai_insights: string;
  created_at: string;
}

export interface UserProfile {
  id: number;
  name?: string;
  preferences: Record<string, any>;
  skills: string[];
  interests: string[];
  work_patterns: {
    activeHours?: string[];
    commonTasks?: string[];
    toolsUsed?: string[];
  };
  communication_style?: string;
  updated_at: string;
}
