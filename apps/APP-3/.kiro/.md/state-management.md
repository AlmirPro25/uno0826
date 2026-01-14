# 🧠 State Management Supreme Master

## ATIVAÇÃO
Este manifesto é ativado quando o usuário menciona:
- State Management, Estado, Store
- Zustand, Jotai, Valtio, Recoil
- Redux, Redux Toolkit, RTK Query
- TanStack Query, React Query, SWR
- XState, State Machine

## FILOSOFIA
> "O estado é a fonte de toda complexidade. Simplifique-o."

## QUANDO USAR O QUÊ
| Tipo | Solução |
|------|---------|
| Server State | TanStack Query |
| Global UI | Zustand |
| Local UI | useState |
| Complex Logic | XState |
| Atomic | Jotai |

## RECOMENDAÇÕES
- Zustand para estado global simples
- TanStack Query para dados do servidor
- XState para fluxos complexos
- Separe server state de client state

## ANTI-PATTERNS
❌ **NUNCA** coloque server state em Zustand
❌ **NUNCA** use Context para estado frequente
❌ **NUNCA** mute estado diretamente
