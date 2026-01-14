
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// --- Types ---
export type Category = 'Alimentacao' | 'Transporte' | 'Lazer' | 'Contas' | 'Saude' | 'Outros';

export interface Expense {
  id: string;
  amount: number;
  description: string;
  category: Category;
  date: string;
}

export interface ExpenseSummary {
  totalSpent: number;
  balance: number;
  goalProgress: number;
  categoryDistribution: { category: Category; amount: number; percentage: number }[];
}

interface ExpenseStore {
  expenses: Expense[];
  categories: Category[];
  monthlyGoal: number;
  summary: ExpenseSummary;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  deleteExpense: (id: string) => void;
  setMonthlyGoal: (goal: number) => void;
  calculateSummary: () => void;
}

// --- Dados Iniciais de Exemplo ---
const initialExpenses: Expense[] = [
  { id: '1', amount: 120, description: 'Jantar com amigos', category: 'Lazer', date: '2024-05-15' },
  { id: '2', amount: 80, description: 'Combustível', category: 'Transporte', date: '2024-05-16' },
  { id: '3', amount: 350, description: 'Consulta médica', category: 'Saude', date: '2024-05-17' },
  { id: '4', amount: 50, description: 'Supermercado', category: 'Alimentacao', date: '2024-05-18' },
  { id: '5', amount: 150, description: 'Conta de luz', category: 'Contas', date: '2024-05-19' },
];

const initialGoal = 1500;

// --- Store Zustand com persistência no LocalStorage ---
export const useExpenseStore = create<ExpenseStore>()(
  persist(
    (set, get) => ({
      expenses: initialExpenses,
      categories: ['Alimentacao', 'Transporte', 'Lazer', 'Contas', 'Saude', 'Outros'],
      monthlyGoal: initialGoal,
      summary: { totalSpent: 0, balance: 0, goalProgress: 0, categoryDistribution: [] },

      addExpense: (expense) => {
        set((state) => ({
          expenses: [{ ...expense, id: Date.now().toString() }, ...state.expenses],
        }));
        get().calculateSummary(); // Recalcula o resumo após adicionar
      },

      deleteExpense: (id) => {
        set((state) => ({
          expenses: state.expenses.filter((exp) => exp.id !== id),
        }));
        get().calculateSummary(); // Recalcula o resumo após deletar
      },

      setMonthlyGoal: (goal) => {
        set({ monthlyGoal: goal });
        get().calculateSummary(); // Recalcula o resumo após mudar a meta
      },

      calculateSummary: () => {
        const expenses = get().expenses;
        const monthlyGoal = get().monthlyGoal;
        const categories = get().categories;

        // 1. Calcular total gasto
        const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

        // 2. Calcular distribuição por categoria
        const categoryMap = new Map<Category, number>();
        expenses.forEach((exp) => {
          categoryMap.set(exp.category, (categoryMap.get(exp.category) || 0) + exp.amount);
        });

        const categoryDistribution = categories.map((category) => {
          const amount = categoryMap.get(category) || 0;
          const percentage = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;
          return { category, amount, percentage };
        });

        // 3. Calcular progresso da meta (apenas para exibição)
        const goalProgress = (totalSpent / monthlyGoal) * 100;

        set({
          summary: {
            totalSpent,
            balance: monthlyGoal - totalSpent, // Saldo em relação à meta (pode ser negativo)
            goalProgress,
            categoryDistribution,
          },
        });
      },
    }),
    {
      name: 'finance-manager-storage', // Nome da chave no LocalStorage
      onRehydrate: () => {
        // Recalcular o resumo ao carregar do LocalStorage
        useExpenseStore.getState().calculateSummary();
      }
    }
  )
);
