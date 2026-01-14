
import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

/**
 * Interface para as propriedades do componente CreateTaskForm.
 */
interface CreateTaskFormProps {
  onClose: () => void;
  onCreateTask: (title: string, description: string) => void;
}

/**
 * Componente de formulário para criar uma nova tarefa. Exibido em um modal.
 * @param {CreateTaskFormProps} props - Propriedades do componente.
 * @returns {JSX.Element} O componente CreateTaskForm.
 */
function CreateTaskForm({ onClose, onCreateTask }: CreateTaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /**
   * Manipula o envio do formulário. Valida os dados e chama a função de criação de tarefa.
   * @param {React.FormEvent} e - Evento de formulário.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() === '') {
      setError('O título da tarefa é obrigatório.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onCreateTask(title, description);
    } catch (err) {
      setError('Falha ao criar tarefa.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-2xl transform transition-all duration-300 scale-100 opacity-100">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h2 id="modal-title" className="text-xl font-semibold text-text-dark">Adicionar Nova Tarefa</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 focus-visible-primary"
            aria-label="Fechar modal"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-text-dark">Título</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus-visible-primary"
              required
              aria-required="true"
              aria-label="Título da tarefa"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-text-dark">Descrição (opcional)</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus-visible-primary resize-none"
              aria-label="Descrição da tarefa"
            />
          </div>

          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 focus-visible-primary transition duration-150 ease-in-out"
              aria-label="Cancelar criação de tarefa"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="py-2 px-4 border border-transparent rounded-lg text-white font-semibold shadow-md focus-visible-primary disabled:opacity-50 transition duration-150 ease-in-out bg-primary hover:bg-indigo-600"
              aria-label="Criar tarefa"
            >
              {loading ? 'Criando...' : 'Criar Tarefa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateTaskForm;
