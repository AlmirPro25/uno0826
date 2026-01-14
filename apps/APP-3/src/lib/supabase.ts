import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Database types
export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  subscription_tier: 'free' | 'pro' | 'enterprise';
  api_usage_count: number;
  api_usage_limit: number;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  html_content: string;
  project_plan?: string;
  selected_model: string;
  is_public: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface ProjectSnapshot {
  id: string;
  project_id: string;
  user_id: string;
  snapshot_name: string;
  snapshot_description?: string;
  html_content: string;
  project_plan?: string;
  created_at: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  project_id?: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  chat_session_id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

// Auth helpers
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signUpWithEmail = async (email: string, password: string, fullName?: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      }
    }
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

// Project helpers
export const saveProject = async (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('projects')
    .insert([project])
    .select()
    .single();
  
  return { data, error };
};

export const updateProject = async (id: string, updates: Partial<Project>) => {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  return { data, error };
};

export const getUserProjects = async (userId: string) => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  
  return { data, error };
};

export const getProject = async (id: string) => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();
  
  return { data, error };
};

export const deleteProject = async (id: string) => {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);
  
  return { error };
};

// Snapshot helpers
export const saveSnapshot = async (snapshot: Omit<ProjectSnapshot, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('project_snapshots')
    .insert([snapshot])
    .select()
    .single();
  
  return { data, error };
};

export const getProjectSnapshots = async (projectId: string) => {
  const { data, error } = await supabase
    .from('project_snapshots')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  
  return { data, error };
};

export const deleteSnapshot = async (id: string) => {
  const { error } = await supabase
    .from('project_snapshots')
    .delete()
    .eq('id', id);
  
  return { error };
};

// Chat helpers
export const createChatSession = async (session: Omit<ChatSession, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('chat_sessions')
    .insert([session])
    .select()
    .single();
  
  return { data, error };
};

export const getChatSessions = async (userId: string) => {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  
  return { data, error };
};

export const saveChatMessage = async (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert([message])
    .select()
    .single();
  
  return { data, error };
};

export const getChatMessages = async (sessionId: string) => {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('chat_session_id', sessionId)
    .order('timestamp', { ascending: true });
  
  return { data, error };
};

// API usage tracking
export const trackApiUsage = async (endpoint: string, tokensUsed: number = 0, costCents: number = 0) => {
  const user = await getCurrentUser();
  if (!user) return;

  const { error } = await supabase
    .from('api_usage')
    .insert([{
      user_id: user.id,
      endpoint,
      tokens_used: tokensUsed,
      cost_cents: costCents
    }]);

  if (!error) {
    // Update user's usage count
    await supabase.rpc('increment_api_usage', { user_id: user.id, increment: 1 });
  }

  return { error };
};