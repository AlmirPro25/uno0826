
import { PencilIcon, TrashIcon, CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

/**
 * Interface para representar uma tarefa.
 */
interface Task {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

/**
 * Interface para as propriedades do componente TaskItem.
 */
interface TaskItemProps {
  task: Task;
  onToggleCompleted: (taskId: number, currentStatus: boolean) => void;
  onDelete: (taskId: number) => void;
}

/**
 * Componente de item individual da lista de tarefas.
 * @param {TaskItemProps} props - Propriedades do componente.
 * @returns {JSX.Element} O componente TaskItem.
 */
function TaskItem({ task, onToggleCompleted, onDelete }: TaskItemProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  return (
    <div className={`flex items-start justify-between p-4 rounded-lg shadow-sm transition duration-300 ease-in-out ${task.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'} border`}>
      <div className="flex items-start space-x-3">
        {/* Ícone de status da tarefa */}
        <button
          onClick={() => onToggleCompleted(task.id, task.completed)}
          className={`mt-1 flex-shrink-0 focus-visible-primary rounded-full transition duration-150 ease-in-out ${task.completed ? 'text-green-600 hover:text-green-700' : 'text-gray-400 hover:text-primary'}`}
          aria-label={task.completed ? 'Desmarcar como concluída' : 'Marcar como concluída'}
          aria-checked={task.completed}
          role="checkbox"
        >
          {task.completed ? (
            <CheckCircleIcon className="w-6 h-6 fill-green-600" aria-hidden="true" />
          ) : (
            <CheckCircleIcon className="w-6 h-6" aria-hidden="true" />
          )}
        </button>

        {/* Detalhes da tarefa */}
        <div className="flex-grow">
          <p className={`text-lg font-semibold ${task.completed ? 'text-gray-500 line-through' : 'text-text-dark'}`}>{task.title}</p>
          {task.description && <p className={`text-sm mt-1 ${task.completed ? 'text-gray-400 line-through' : 'text-gray-500'}`}>{task.description}</p>}
        </div>
      </div>

      {/* Ações da tarefa */}
      <div className="flex space-x-2 flex-shrink-0">
        <button
          onClick={() => onDelete(task.id)} // Implementação de exclusão direta. Para edição, seria um modal similar ao CreateTaskForm.
          className="p-2 text-gray-400 hover:text-red-600 focus-visible-primary rounded-lg transition duration-150 ease-in-out"
          aria-label="Excluir tarefa"
        >
          <TrashIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Modal de confirmação de exclusão (exemplo de resiliência) */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-2xl">
            <h3 id="delete-modal-title" className="text-xl font-semibold text-text-dark mb-4">Confirmar Exclusão</h3>
            <p className="text-gray-600 mb-6">Tem certeza que deseja excluir a tarefa "{task.title}"?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="py-2 px-4 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 focus-visible-primary"
                aria-label="Cancelar exclusão"
              >
                Cancelar
              </button>
              <button
                onClick={() => { onDelete(task.id); setShowDeleteModal(false); }}
                className="py-2 px-4 border border-transparent rounded-lg text-white font-semibold shadow-md focus-visible-primary transition duration-150 ease-in-out bg-red-600 hover:bg-red-700"
                aria-label="Confirmar exclusão"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TaskItem;
