/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║  🧠 STATE MANAGEMENT SUPREME MASTER - O ARQUITETO DO ESTADO                 ║
 * ║                                                                              ║
 * ║  "O estado é a fonte de toda complexidade. Simplifique-o."                  ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

export const STATE_MANAGEMENT_MANIFEST = `
# 🧠 STATE MANAGEMENT SUPREME MASTER

## ATIVAÇÃO
Este manifesto é ativado quando o usuário menciona:
- State Management, Estado, Store, Global State
- Zustand, Jotai, Valtio, Recoil, Nanostores
- Redux, Redux Toolkit, RTK Query
- TanStack Query, React Query, SWR
- XState, State Machine, Finite State
- Context API, useReducer, Signals

## FILOSOFIA
> "O estado é a fonte de toda complexidade. Simplifique-o."

### Princípios Invioláveis
1. **Single Source of Truth** - Um lugar para cada estado
2. **Minimal State** - Derive o que puder, não armazene
3. **Immutability** - Nunca mute diretamente
4. **Separation** - Server state ≠ Client state
5. **Colocation** - Estado perto de quem usa
6. **Predictability** - Estado previsível, debug fácil

## ARQUITETURA DE ESTADO

\`\`\`
┌─────────────────────────────────────────────────────────────────┐
│                    STATE ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    SERVER STATE                          │   │
│  │  TanStack Query / SWR / RTK Query                        │   │
│  │  • API data, cached responses                            │   │
│  │  • Automatic refetching, background updates              │   │
│  │  • Optimistic updates, mutations                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
│                           ▼                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    GLOBAL UI STATE                       │   │
│  │  Zustand / Jotai / Redux                                 │   │
│  │  • Theme, language, user preferences                     │   │
│  │  • Sidebar state, modal state                            │   │
│  │  • Shopping cart, notifications                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
│                           ▼                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    LOCAL UI STATE                        │   │
│  │  useState / useReducer                                   │   │
│  │  • Form inputs, validation                               │   │
│  │  • Component-specific toggles                            │   │
│  │  • Temporary UI state                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
│                           ▼                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    COMPLEX FLOWS                         │   │
│  │  XState / State Machines                                 │   │
│  │  • Multi-step wizards, checkout                          │   │
│  │  • Authentication flows                                  │   │
│  │  • Complex business logic                                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
\`\`\`

## QUANDO USAR O QUÊ

| Tipo de Estado | Solução | Exemplo | Por quê |
|----------------|---------|---------|---------|
| Server State | TanStack Query | Dados da API | Cache, refetch, mutations |
| Global UI | Zustand | Theme, Sidebar | Simples, sem boilerplate |
| Local UI | useState | Form inputs | Escopo limitado |
| Complex Logic | XState | Checkout flow | Estados finitos, transições |
| Atomic | Jotai | Filtros, Toggles | Granular, composable |
| Form State | React Hook Form | Formulários | Validação, performance |
| URL State | nuqs/useSearchParams | Filtros, paginação | Shareable, bookmarkable |

## ZUSTAND - GLOBAL STATE (Recomendado)

### Store Completa com Middlewares
\`\`\`typescript
import { create } from 'zustand';
import { persist, devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Types
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartStore {
  // State
  items: CartItem[];
  isOpen: boolean;
  
  // Actions
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  
  // Computed (getters)
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  devtools(
    subscribeWithSelector(
      persist(
        immer((set, get) => ({
          // Initial State
          items: [],
          isOpen: false,
          
          // Actions with Immer (mutable syntax, immutable result)
          addItem: (item) => set((state) => {
            const existing = state.items.find(i => i.id === item.id);
            if (existing) {
              existing.quantity += 1;
            } else {
              state.items.push({ ...item, quantity: 1 });
            }
          }, false, 'cart/addItem'),
          
          removeItem: (id) => set((state) => {
            state.items = state.items.filter(i => i.id !== id);
          }, false, 'cart/removeItem'),
          
          updateQuantity: (id, quantity) => set((state) => {
            const item = state.items.find(i => i.id === id);
            if (item) {
              if (quantity <= 0) {
                state.items = state.items.filter(i => i.id !== id);
              } else {
                item.quantity = quantity;
              }
            }
          }, false, 'cart/updateQuantity'),
          
          clearCart: () => set({ items: [] }, false, 'cart/clear'),
          
          toggleCart: () => set((state) => {
            state.isOpen = !state.isOpen;
          }, false, 'cart/toggle'),
          
          // Computed values (called as functions)
          totalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
          totalPrice: () => get().items.reduce(
            (sum, item) => sum + item.price * item.quantity, 0
          ),
        })),
        {
          name: 'cart-storage',
          partialize: (state) => ({ items: state.items }), // Only persist items
        }
      )
    ),
    { name: 'CartStore' }
  )
);

// Selectors (prevent unnecessary re-renders)
export const useCartItems = () => useCartStore((s) => s.items);
export const useCartOpen = () => useCartStore((s) => s.isOpen);
export const useCartActions = () => useCartStore((s) => ({
  addItem: s.addItem,
  removeItem: s.removeItem,
  updateQuantity: s.updateQuantity,
  clearCart: s.clearCart,
  toggleCart: s.toggleCart,
}));

// Subscribe to changes outside React
useCartStore.subscribe(
  (state) => state.items,
  (items) => {
    console.log('Cart updated:', items.length, 'items');
    // Analytics, sync, etc.
  }
);
\`\`\`

### Slices Pattern (Large Stores)
\`\`\`typescript
// stores/slices/userSlice.ts
export interface UserSlice {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const createUserSlice: StateCreator<
  UserSlice & CartSlice,
  [],
  [],
  UserSlice
> = (set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
});

// stores/slices/cartSlice.ts
export const createCartSlice: StateCreator<
  UserSlice & CartSlice,
  [],
  [],
  CartSlice
> = (set, get) => ({
  items: [],
  addItem: (item) => {
    // Can access other slices
    if (!get().user) throw new Error('Must be logged in');
    set((state) => ({ items: [...state.items, item] }));
  },
});

// stores/useStore.ts
export const useStore = create<UserSlice & CartSlice>()(
  devtools(
    persist(
      (...a) => ({
        ...createUserSlice(...a),
        ...createCartSlice(...a),
      }),
      { name: 'app-storage' }
    )
  )
);
\`\`\`

## TANSTACK QUERY - SERVER STATE

### Setup Completo
\`\`\`typescript
// lib/query-client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 minutes
      gcTime: 30 * 60 * 1000,        // 30 minutes (was cacheTime)
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// App.tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
\`\`\`

### Query Hooks Factory
\`\`\`typescript
// hooks/api/useUsers.ts
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Query Keys Factory
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: UserFilters) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

// Fetch Users with Filters
export function useUsers(filters: UserFilters = {}) {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: () => api.get<User[]>('/users', { params: filters }),
    placeholderData: (previousData) => previousData, // Keep previous while loading
  });
}

// Fetch Single User
export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => api.get<User>(\`/users/\${id}\`),
    enabled: !!id, // Only fetch if id exists
  });
}

// Infinite Scroll
export function useUsersInfinite(filters: UserFilters = {}) {
  return useInfiniteQuery({
    queryKey: [...userKeys.list(filters), 'infinite'],
    queryFn: ({ pageParam = 1 }) => 
      api.get<PaginatedResponse<User>>('/users', { 
        params: { ...filters, page: pageParam } 
      }),
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
    initialPageParam: 1,
  });
}

// Create User with Optimistic Update
export function useCreateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateUserInput) => api.post<User>('/users', data),
    
    // Optimistic update
    onMutate: async (newUser) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: userKeys.lists() });
      
      // Snapshot previous value
      const previousUsers = queryClient.getQueryData(userKeys.lists());
      
      // Optimistically update
      queryClient.setQueryData(userKeys.lists(), (old: User[] = []) => [
        ...old,
        { ...newUser, id: 'temp-' + Date.now() },
      ]);
      
      return { previousUsers };
    },
    
    // Rollback on error
    onError: (err, newUser, context) => {
      queryClient.setQueryData(userKeys.lists(), context?.previousUsers);
    },
    
    // Refetch after success or error
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

// Update User
export function useUpdateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserInput }) =>
      api.patch<User>(\`/users/\${id}\`, data),
    
    onSuccess: (updatedUser) => {
      // Update cache directly
      queryClient.setQueryData(userKeys.detail(updatedUser.id), updatedUser);
      
      // Update in list cache
      queryClient.setQueryData(userKeys.lists(), (old: User[] = []) =>
        old.map(u => u.id === updatedUser.id ? updatedUser : u)
      );
    },
  });
}

// Delete User
export function useDeleteUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.delete(\`/users/\${id}\`),
    
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: userKeys.detail(deletedId) });
      queryClient.setQueryData(userKeys.lists(), (old: User[] = []) =>
        old.filter(u => u.id !== deletedId)
      );
    },
  });
}
\`\`\`

### Prefetching
\`\`\`typescript
// Prefetch on hover
function UserCard({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  
  const prefetchUser = () => {
    queryClient.prefetchQuery({
      queryKey: userKeys.detail(userId),
      queryFn: () => api.get(\`/users/\${userId}\`),
      staleTime: 5 * 60 * 1000,
    });
  };
  
  return (
    <Link 
      to={\`/users/\${userId}\`}
      onMouseEnter={prefetchUser}
      onFocus={prefetchUser}
    >
      View User
    </Link>
  );
}

// Prefetch in loader (React Router)
export const userLoader = (queryClient: QueryClient) => 
  async ({ params }: LoaderFunctionArgs) => {
    const query = {
      queryKey: userKeys.detail(params.id!),
      queryFn: () => api.get(\`/users/\${params.id}\`),
    };
    
    return queryClient.getQueryData(query.queryKey) ?? 
           await queryClient.fetchQuery(query);
  };
\`\`\`

## XSTATE - COMPLEX STATE MACHINES

### Checkout Flow Machine
\`\`\`typescript
import { createMachine, assign } from 'xstate';
import { useMachine } from '@xstate/react';

// Types
interface CheckoutContext {
  items: CartItem[];
  shippingAddress: Address | null;
  billingAddress: Address | null;
  paymentMethod: PaymentMethod | null;
  orderId: string | null;
  error: string | null;
}

type CheckoutEvent =
  | { type: 'PROCEED' }
  | { type: 'BACK' }
  | { type: 'SET_SHIPPING'; address: Address }
  | { type: 'SET_BILLING'; address: Address }
  | { type: 'SET_PAYMENT'; method: PaymentMethod }
  | { type: 'CONFIRM' }
  | { type: 'RETRY' };

// Machine
const checkoutMachine = createMachine({
  id: 'checkout',
  initial: 'cart',
  context: {
    items: [],
    shippingAddress: null,
    billingAddress: null,
    paymentMethod: null,
    orderId: null,
    error: null,
  } as CheckoutContext,
  
  states: {
    cart: {
      on: {
        PROCEED: {
          target: 'shipping',
          guard: 'hasItems',
        },
      },
    },
    
    shipping: {
      on: {
        BACK: 'cart',
        SET_SHIPPING: {
          actions: assign({
            shippingAddress: ({ event }) => event.address,
          }),
          target: 'billing',
        },
      },
    },
    
    billing: {
      on: {
        BACK: 'shipping',
        SET_BILLING: {
          actions: assign({
            billingAddress: ({ event }) => event.address,
          }),
          target: 'payment',
        },
      },
    },
    
    payment: {
      on: {
        BACK: 'billing',
        SET_PAYMENT: {
          actions: assign({
            paymentMethod: ({ event }) => event.method,
          }),
          target: 'review',
        },
      },
    },
    
    review: {
      on: {
        BACK: 'payment',
        CONFIRM: 'processing',
      },
    },
    
    processing: {
      invoke: {
        id: 'processOrder',
        src: 'processOrder',
        input: ({ context }) => ({
          items: context.items,
          shipping: context.shippingAddress,
          billing: context.billingAddress,
          payment: context.paymentMethod,
        }),
        onDone: {
          target: 'success',
          actions: assign({
            orderId: ({ event }) => event.output.orderId,
          }),
        },
        onError: {
          target: 'error',
          actions: assign({
            error: ({ event }) => event.error.message,
          }),
        },
      },
    },
    
    success: {
      type: 'final',
      entry: 'clearCart',
    },
    
    error: {
      on: {
        RETRY: 'review',
        BACK: 'payment',
      },
    },
  },
}, {
  guards: {
    hasItems: ({ context }) => context.items.length > 0,
  },
  actions: {
    clearCart: () => {
      useCartStore.getState().clearCart();
    },
  },
  actors: {
    processOrder: fromPromise(async ({ input }) => {
      const response = await api.post('/orders', input);
      return response.data;
    }),
  },
});

// Usage
function Checkout() {
  const [state, send] = useMachine(checkoutMachine, {
    context: {
      items: useCartStore.getState().items,
    },
  });
  
  return (
    <div>
      {/* Progress indicator */}
      <Steps current={state.value} />
      
      {/* Step content */}
      {state.matches('cart') && (
        <CartReview onProceed={() => send({ type: 'PROCEED' })} />
      )}
      
      {state.matches('shipping') && (
        <ShippingForm 
          onSubmit={(address) => send({ type: 'SET_SHIPPING', address })}
          onBack={() => send({ type: 'BACK' })}
        />
      )}
      
      {state.matches('processing') && <LoadingSpinner />}
      
      {state.matches('success') && (
        <OrderConfirmation orderId={state.context.orderId} />
      )}
      
      {state.matches('error') && (
        <ErrorMessage 
          message={state.context.error}
          onRetry={() => send({ type: 'RETRY' })}
        />
      )}
    </div>
  );
}
\`\`\`

## JOTAI - ATOMIC STATE

### Atoms Composables
\`\`\`typescript
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { atomWithStorage, atomWithReset, RESET } from 'jotai/utils';
import { atomWithQuery, atomWithMutation } from 'jotai-tanstack-query';

// Primitive atoms
const filterAtom = atom<'all' | 'active' | 'completed'>('all');
const searchAtom = atom('');

// Persisted atom
const todosAtom = atomWithStorage<Todo[]>('todos', []);

// Derived atom (read-only)
const filteredTodosAtom = atom((get) => {
  const filter = get(filterAtom);
  const search = get(searchAtom).toLowerCase();
  const todos = get(todosAtom);
  
  return todos
    .filter(todo => {
      if (filter === 'active') return !todo.completed;
      if (filter === 'completed') return todo.completed;
      return true;
    })
    .filter(todo => 
      todo.title.toLowerCase().includes(search)
    );
});

// Stats atom (derived)
const statsAtom = atom((get) => {
  const todos = get(todosAtom);
  return {
    total: todos.length,
    completed: todos.filter(t => t.completed).length,
    active: todos.filter(t => !t.completed).length,
  };
});

// Write-only atom (action)
const addTodoAtom = atom(null, (get, set, title: string) => {
  const newTodo: Todo = {
    id: crypto.randomUUID(),
    title,
    completed: false,
    createdAt: new Date(),
  };
  set(todosAtom, [...get(todosAtom), newTodo]);
});

// Read-write atom
const toggleTodoAtom = atom(
  null,
  (get, set, id: string) => {
    set(todosAtom, get(todosAtom).map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  }
);

// Async atom with TanStack Query
const userAtom = atomWithQuery((get) => ({
  queryKey: ['user', get(userIdAtom)],
  queryFn: () => fetchUser(get(userIdAtom)),
}));

// Usage
function TodoApp() {
  const todos = useAtomValue(filteredTodosAtom);
  const stats = useAtomValue(statsAtom);
  const addTodo = useSetAtom(addTodoAtom);
  const [filter, setFilter] = useAtom(filterAtom);
  
  return (
    <div>
      <Stats {...stats} />
      <FilterButtons value={filter} onChange={setFilter} />
      <TodoList todos={todos} />
      <AddTodoForm onAdd={addTodo} />
    </div>
  );
}
\`\`\`

## URL STATE (nuqs)

\`\`\`typescript
import { useQueryState, parseAsInteger, parseAsStringEnum } from 'nuqs';

// Single param
const [search, setSearch] = useQueryState('q');

// With parser and default
const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));

// Enum
const [sort, setSort] = useQueryState(
  'sort',
  parseAsStringEnum(['newest', 'oldest', 'popular']).withDefault('newest')
);

// Multiple params
const [filters, setFilters] = useQueryStates({
  q: parseAsString,
  page: parseAsInteger.withDefault(1),
  category: parseAsString,
  sort: parseAsStringEnum(['newest', 'oldest']).withDefault('newest'),
});

// Usage with TanStack Query
function ProductList() {
  const [filters] = useQueryStates({
    q: parseAsString,
    page: parseAsInteger.withDefault(1),
    category: parseAsString,
  });
  
  const { data, isLoading } = useQuery({
    queryKey: ['products', filters],
    queryFn: () => fetchProducts(filters),
  });
  
  return <ProductGrid products={data} loading={isLoading} />;
}
\`\`\`

## FORM STATE (React Hook Form + Zod)

\`\`\`typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

function SignupForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });
  
  const onSubmit = async (data: FormData) => {
    await createUser(data);
    reset();
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}
      
      <input type="password" {...register('password')} />
      {errors.password && <span>{errors.password.message}</span>}
      
      <input type="password" {...register('confirmPassword')} />
      {errors.confirmPassword && <span>{errors.confirmPassword.message}</span>}
      
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Loading...' : 'Sign Up'}
      </button>
    </form>
  );
}
\`\`\`

## PERFORMANCE PATTERNS

### Selector Memoization
\`\`\`typescript
// Zustand - use shallow for object selectors
import { shallow } from 'zustand/shallow';

const { items, total } = useCartStore(
  (state) => ({ items: state.items, total: state.totalPrice() }),
  shallow
);

// Or create stable selectors
const selectCartSummary = (state: CartStore) => ({
  items: state.items,
  total: state.totalPrice(),
});

const summary = useCartStore(selectCartSummary, shallow);
\`\`\`

### Context Splitting
\`\`\`typescript
// Split context to prevent unnecessary re-renders
const UserContext = createContext<User | null>(null);
const UserActionsContext = createContext<UserActions | null>(null);

function UserProvider({ children }) {
  const [user, setUser] = useState<User | null>(null);
  
  // Memoize actions to prevent re-renders
  const actions = useMemo(() => ({
    login: async (credentials) => { /* ... */ },
    logout: () => setUser(null),
  }), []);
  
  return (
    <UserContext.Provider value={user}>
      <UserActionsContext.Provider value={actions}>
        {children}
      </UserActionsContext.Provider>
    </UserContext.Provider>
  );
}

// Hooks
const useUser = () => useContext(UserContext);
const useUserActions = () => useContext(UserActionsContext);
\`\`\`

## CHECKLIST

### Architecture
- [ ] Server state separado de client state?
- [ ] Estado colocado no nível correto?
- [ ] Derivações ao invés de duplicação?

### Performance
- [ ] Selectors para evitar re-renders?
- [ ] Shallow comparison onde necessário?
- [ ] Memoização de actions/callbacks?

### Developer Experience
- [ ] DevTools configurado?
- [ ] TypeScript types completos?
- [ ] Persistência onde necessário?

### Error Handling
- [ ] Loading states tratados?
- [ ] Error states tratados?
- [ ] Retry logic implementado?

## ANTI-PATTERNS

❌ **NUNCA** coloque server state em Zustand/Redux
❌ **NUNCA** use Context para estado que muda frequentemente
❌ **NUNCA** mute estado diretamente (sem Immer)
❌ **NUNCA** crie stores gigantes monolíticas
❌ **NUNCA** duplique estado que pode ser derivado
❌ **NUNCA** ignore TypeScript em state management
❌ **NUNCA** faça fetch em useEffect quando pode usar Query
`;

export default STATE_MANAGEMENT_MANIFEST;
