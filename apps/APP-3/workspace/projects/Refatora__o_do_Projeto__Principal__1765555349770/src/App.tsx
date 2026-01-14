
import { useState } from 'react';
import { useExpenseStore } from './store';
import Dashboard from './components/Dashboard';
import AddExpenseModal from './components/AddExpenseModal';
import { PlusCircle } from 'lucide-react';

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { calculateSummary } = useExpenseStore();

  // Calcula o resumo na inicialização
  calculateSummary();

  return (
    <div className="flex flex-col min-h-screen">
      <header className="py-4 px-6 md:px-10 border-b border-gray-700">
        <h1 className="text-2xl font-bold text-gray-50 uppercase tracking-wider">Manifest Finance Manager</h1>
      </header>
      <main className="flex-1 p-4 md:p-10">
        <Dashboard />
      </main>
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 md:bottom-10 md:right-10 w-16 h-16 bg-[#10b981] text-white rounded-full shadow-lg hover:bg-[#0c9b6f] transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-[#10b981] focus:ring-opacity-50 flex items-center justify-center z-50 transform hover:scale-105"
        data-aid="add-expense-button"
        aria-label="Adicionar nova despesa"
      >
        <PlusCircle size={32} />
      </button>
      <AddExpenseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
