
import { useExpenseStore, Expense } from '../store';
import { useMemo, useState } from 'react';
import { DollarSign, Goal, BarChart, X, Utensils, Bus, ShoppingBag, Home, Heart, MoreHorizontal } from 'lucide-react';
import PieChartComponent from './PieChartComponent';

// --- Helpers de Formatação ---
const formatCurrency = (amount: number) => {
  return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// --- Ícones de Categoria ---
const categoryIcons: Record<string, JSX.Element> = {
  Alimentacao: <Utensils size={18} />,
  Transporte: <Bus size={18} />,
  Lazer: <ShoppingBag size={18} />, // Usando shopping bag para compras/lazer
  Contas: <Home size={18} />,
  Saude: <Heart size={18} />,
  Outros: <MoreHorizontal size={18} />,
};

// --- Componente de Item da Lista de Despesas ---
const ExpenseListItem: React.FC<{ expense: Expense }> = ({ expense }) => {
  const { deleteExpense } = useExpenseStore();

  const handleDelete = () => {
    deleteExpense(expense.id);
  };

  return (
    <div className="flex items-center justify-between p-3 border-b border-gray-700 hover:bg-[#1f2937] transition-colors duration-150 rounded-lg group">
      <div className="flex items-center space-x-4">
        <div className="w-8 h-8 rounded-full bg-[#1e293b] text-[#10b981] flex items-center justify-center border border-[#10b981] group-hover:bg-[#10b981] group-hover:text-white transition-all duration-300">
          {categoryIcons[expense.category]}
        </div>
        <div>
          <p className="font-medium text-gray-100">{expense.description}</p>
          <p className="text-sm text-gray-400">{expense.category} | {formatDate(expense.date)}</p>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <p className="font-semibold text-red-400">{formatCurrency(expense.amount)}</p>
        <button
          onClick={handleDelete}
          className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:text-red-500"
          data-aid={`delete-expense-${expense.id}`}
          aria-label="Deletar despesa"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

// --- Componente da Barra de Progresso da Meta ---
const GoalProgress: React.FC<{ goalProgress: number; totalSpent: number; monthlyGoal: number }> = ({ goalProgress, totalSpent, monthlyGoal }) => {
  const progressPercentage = Math.min(goalProgress, 100);
  const colorClass = progressPercentage < 70 ? 'bg-green-500' : progressPercentage < 90 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-gray-400">
        <span className="font-medium">Meta de Gastos:</span>
        <span className="font-medium">{formatCurrency(monthlyGoal)}</span>
      </div>
      <div className="w-full h-3 bg-gray-600 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      <div className="text-center text-xs text-gray-400">
        {formatCurrency(totalSpent)} / {formatCurrency(monthlyGoal)} ({Math.round(progressPercentage)}%)
      </div>
    </div>
  );
};

// --- Componente Principal do Dashboard ---
export default function Dashboard() {
  const { summary, expenses, monthlyGoal } = useExpenseStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Filtragem das despesas
  const filteredExpenses = useMemo(() => {
    if (!selectedCategory || selectedCategory === 'Todos') {
      return expenses;
    }
    return expenses.filter(expense => expense.category === selectedCategory);
  }, [expenses, selectedCategory]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Coluna 1: Resumo de Gastos e Meta (Mobile: topo; Desktop: lateral) */}
      <div className="md:col-span-1 space-y-6">
        <div className="bg-[#1e293b] rounded-xl shadow-lg p-6 space-y-4" data-aid="summary-card">
          <h2 className="text-xl font-semibold text-gray-50 flex items-center space-x-2">
            <DollarSign size={20} className="text-[#10b981]" />
            <span>Resumo Mensal</span>
          </h2>
          <div className="space-y-2 border-t border-gray-600 pt-4">
            <div className="flex justify-between text-lg">
              <span className="text-gray-300">Total Gasto:</span>
              <span className="font-bold text-red-400">{formatCurrency(summary.totalSpent)}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span className="text-gray-300">Saldo Restante:</span>
              <span className={`font-bold ${summary.balance >= 0 ? 'text-[#10b981]' : 'text-red-400'}`}>
                {formatCurrency(summary.balance)}
              </span>
            </div>
          </div>
        </div>

        {/* Card de Meta de Gastos */}
        <div className="bg-[#1e293b] rounded-xl shadow-lg p-6 space-y-4" data-aid="goal-progress-card">
          <h2 className="text-xl font-semibold text-gray-50 flex items-center space-x-2">
            <Goal size={20} className="text-[#10b981]" />
            <span>Meta de Gastos</span>
          </h2>
          <GoalProgress goalProgress={summary.goalProgress} totalSpent={summary.totalSpent} monthlyGoal={monthlyGoal} />
        </div>
      </div>

      {/* Coluna 2: Gráfico de Pizza (Mobile: meio; Desktop: central) */}
      <div className="md:col-span-2 space-y-6">
        <div className="bg-[#1e293b] rounded-xl shadow-lg p-6" data-aid="pie-chart-card">
          <h2 className="text-xl font-semibold text-gray-50 flex items-center space-x-2 mb-4">
            <BarChart size={20} className="text-[#10b981]" />
            <span>Gastos por Categoria</span>
          </h2>
          <div className="w-full h-80">
            <PieChartComponent data={summary.categoryDistribution} />
          </div>
        </div>
      </div>
      
      {/* Coluna 3: Lista de Transações (Mobile: Fim; Desktop: central) */}
      <div className="md:col-span-3">
        <div className="bg-[#1e293b] rounded-xl shadow-lg p-6 space-y-4" data-aid="transactions-list-card">
          <h2 className="text-xl font-semibold text-gray-50 border-b border-gray-600 pb-3">Histórico de Despesas</h2>
          
          {/* Filtro por Categoria */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full md:w-auto p-2 border border-gray-600 rounded-lg bg-[#0f172a] text-gray-300 focus:ring-2 focus:ring-[#10b981] transition-colors duration-200"
            data-aid="category-filter-select"
          >
            <option value="">Todos</option>
            {useExpenseStore.getState().categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Lista de Despesas */}
          <div className="max-h-96 overflow-y-auto space-y-2">
            {filteredExpenses.length === 0 ? (
              <div className="text-center text-gray-400 p-4">Nenhuma despesa encontrada para esta categoria.</div>
            ) : (
              filteredExpenses.map(expense => (
                <ExpenseListItem key={expense.id} expense={expense} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
