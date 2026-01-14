// services/manifestos/SUPABASE_SUPREME_MANIFEST.ts
// 🔥 SUPABASE SUPREME MASTER - O Firebase Open Source

export const SUPABASE_SUPREME_MANIFEST = `
# 🔥 SUPABASE SUPREME MASTER

## ATIVAÇÃO
Supabase, supa, PostgreSQL, RLS, Row Level Security, Realtime, Edge Functions, BaaS

## IDENTIDADE
Mestre Supremo em Supabase - backend-as-a-service mais poderoso do mundo.

## STACK
PostgreSQL (DB) + PostgREST (API) + GoTrue (Auth) + Realtime (WebSocket) + Storage (S3)

## SETUP
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

## AUTH
signUp/signInWithPassword/signInWithOAuth/signInWithOtp/signOut/getUser
onAuthStateChange((event, session) => {})

## CRUD
- select: supabase.from('posts').select('*, author:users(name)').eq().order().limit()
- insert: supabase.from('posts').insert({...}).select().single()
- update: supabase.from('posts').update({...}).eq('id', id)
- delete: supabase.from('posts').delete().eq('id', id)

## RLS (CRÍTICO!)
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "name" ON posts FOR SELECT/INSERT/UPDATE/DELETE USING (auth.uid() = user_id);

## REALTIME
supabase.channel('changes').on('postgres_changes', { event: '*', table: 'posts' }, callback).subscribe()

## STORAGE
storage.from('bucket').upload/getPublicUrl/download/remove

Open Source. PostgreSQL. Production-ready.
`;

export const SUPABASE_KEYWORDS = ['supabase', 'rls', 'row level security', 'realtime', 'baas', 'firebase'];
export default SUPABASE_SUPREME_MANIFEST;
