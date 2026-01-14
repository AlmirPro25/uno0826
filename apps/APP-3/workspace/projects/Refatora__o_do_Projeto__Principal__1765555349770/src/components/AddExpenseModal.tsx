
import { useState } from 'react';
import { useExpenseStore, Category } from '../store';
import { X } from 'lucide-react';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// --- Componente de Modal para Adicionar Despesa ---
const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isOpen, onClose }) => {
  const { addExpense, categories } = useExpenseStore();
  const [amount, setAmount] = useState<number | ''>('');
  const [category, setCategory] = useState<Category | ''>('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');

  const handleSave = () => {
    // Validação de dados
    if (!amount || amount <= 0 || !category || !description || !date) {
      setError('Por favor, preencha todos os campos corretamente.');
      return;
    }

    addExpense({
      amount: Number(amount),
      category: category as Category,
      description,
      date,
    });

    // Resetar formulário e fechar modal
    setAmount('');
    setCategory('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity duration-300" data-aid="add-expense-modal">
      <div className="bg-[#1e293b] rounded-xl shadow-2xl p-6 md:p-8 w-full max-w-md space-y-6 transform transition-transform duration-300 scale-100 opacity-100">
        <div className="flex justify-between items-center border-b border-gray-600 pb-3">
          <h2 className="text-2xl font-bold text-gray-50">Adicionar Nova Despesa</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-100 transition-colors duration-200" data-aid="close-modal-button" aria-label="Fechar modal">
            <X size={24} />
          </button>
        </div>
        
        {/* Formulário de Despesa */}
        <div className="space-y-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-1">Valor (R$)</label>
            <input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full p-3 bg-[#0f172a] border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-[#10b981] transition-colors duration-200"
              placeholder="Ex: 50.00"
              data-aid="expense-amount-input"
              required
            />
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1">Categoria</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full p-3 bg-[#0f172a] border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-[#10b981] transition-colors duration-200"
              data-aid="expense-category-select"
              required
            >
              <option value="" disabled>Selecione uma categoria</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Descrição</label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 bg-[#0f172a] border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-[#10b981] transition-colors duration-200"
              placeholder="Ex: Almoço no restaurante japonês"
              data-aid="expense-description-input"
              required
            />
          </div>
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-1">Data</label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-3 bg-[#0f172a] border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-[#10b981] transition-colors duration-200"
              data-aid="expense-date-input"
              required
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-400 font-medium bg-red-900 bg-opacity-30 p-2 rounded-lg" data-aid="form-error-message">
            {error}
          </p>
        )}

        {/* Botões de Ação */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-600">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors duration-200"
            data-aid="cancel-expense-button"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-[#10b981] text-white rounded-lg hover:bg-[#0c9b6f] transition-colors duration-200 disabled:opacity-50"
            data-aid="save-expense-button"
          >
            Salvar Despesa
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddExpenseModal;
