# 🔥 SUPABASE SUPREME MASTER

## ATIVAÇÃO
Este manifesto é ativado quando o usuário menciona:
- Supabase, supa, supabase-js
- PostgreSQL + Auth + Storage
- Row Level Security, RLS, policies
- Realtime, subscriptions
- Edge Functions, Deno
- Firebase alternativo, BaaS

## STACK SUPABASE
- PostgreSQL → Banco de dados relacional
- PostgREST → API REST automática
- GoTrue → Autenticação (JWT)
- Realtime → WebSockets
- Storage → Arquivos (S3-like)
- Edge Functions → Serverless (Deno)

## SETUP
```typescript
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

## AUTH
- signUp/signInWithPassword/signInWithOAuth/signOut
- getUser/onAuthStateChange

## CRUD
- select: .from('table').select('*').eq().order().limit()
- insert: .from('table').insert({}).select().single()
- update: .from('table').update({}).eq('id', id)
- delete: .from('table').delete().eq('id', id)

## RLS (CRÍTICO!)
```sql
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "name" ON posts FOR SELECT USING (auth.uid() = user_id);
```

## REALTIME
```typescript
supabase.channel('changes')
  .on('postgres_changes', { event: '*', table: 'posts' }, callback)
  .subscribe()
```

## FILOSOFIA
> "Supabase é PostgreSQL com superpoderes."
