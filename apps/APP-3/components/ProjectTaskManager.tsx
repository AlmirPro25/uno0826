
import React, { useState, useMemo, useCallback } from 'react';

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

interface ProjectTaskManagerProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onAddTask: (text: string) => void;
  onToggleTask: (taskId: string) => void;
  onRemoveTask: (taskId: string) => void;
}

const ProjectTaskManager: React.FC<ProjectTaskManagerProps> = ({
  isOpen,
  onClose,
  tasks,
  onAddTask,
  onToggleTask,
  onRemoveTask,
}) => {
  const [newTaskText, setNewTaskText] = useState('');

  const progressPercent = useMemo(() => {
    if (tasks.length === 0) return 0;
    const completedTasks = tasks.filter(task => task.completed).length;
    return Math.round((completedTasks / tasks.length) * 100);
  }, [tasks]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskText.trim()) {
      onAddTask(newTaskText.trim());
      setNewTaskText('');
    }
  };

  const handleOverlayClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);
  
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [tasks]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900 bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-[140] p-4" // Higher z-index
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-manager-title"
    >
      <div className="bg-slate-800 p-5 sm:p-6 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col text-slate-100 border border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <h2 id="task-manager-title" className="text-xl sm:text-2xl font-semibold text-cyan-400">
            <i className="fa-solid fa-list-check mr-2"></i>Gerenciador de Tarefas do Projeto
          </h2>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-cyan-300 transition-colors p-1 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500" 
            aria-label="Fechar gerenciador de tarefas"
          >
            <i className="fa-solid fa-times w-5 h-5"></i>
          </button>
        </div>

        {/* Barra de Progresso */}
        <div className="mb-4">
          <div className="flex justify-between text-sm font-medium text-slate-300 mb-1">
            <span>Progresso Geral</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3">
            <div 
              className="bg-cyan-500 h-3 rounded-full transition-all duration-300 ease-out" 
              style={{ width: `${progressPercent}%` }}
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            ></div>
          </div>
        </div>

        {/* Formulário para Adicionar Tarefa */}
        <form onSubmit={handleAddTask} className="mb-4 flex items-center gap-2">
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="Nova tarefa..."
            className="flex-grow p-2.5 bg-slate-700 text-slate-100 placeholder-slate-400 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
            aria-label="Descrição da nova tarefa"
          />
          <button
            type="submit"
            disabled={!newTaskText.trim()}
            className="p-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 disabled:bg-slate-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors duration-150 ease-in-out"
            aria-label="Adicionar nova tarefa"
          >
            <i className="fa-solid fa-plus w-5 h-5"></i>
          </button>
        </form>

        {/* Lista de Tarefas */}
        <div className="flex-grow overflow-y-auto space-y-2.5 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-700/50 pr-1 min-h-[200px]">
          {sortedTasks.length === 0 && (
            <p className="text-center text-slate-400 py-4 italic">Nenhuma tarefa ainda. Adicione algumas!</p>
          )}
          {sortedTasks.map((task, index) => (
            <div 
              key={task.id} 
              className={`flex items-center p-2.5 rounded-lg transition-all duration-200 ease-in-out
                          ${task.completed ? 'bg-slate-700/60 opacity-70' : 'bg-slate-700 hover:bg-slate-600/70'}
                          ${!task.completed && index === sortedTasks.findIndex(t => !t.completed) ? 'ring-2 ring-cyan-500 shadow-lg' : 'border border-slate-600/50'}`}
              aria-labelledby={`task-label-${task.id}`}
            >
              <input
                type="checkbox"
                id={`task-checkbox-${task.id}`}
                checked={task.completed}
                onChange={() => onToggleTask(task.id)}
                className="form-checkbox h-5 w-5 text-cyan-500 bg-slate-600 border-slate-500 rounded focus:ring-cyan-400 focus:ring-offset-slate-800 cursor-pointer mr-3 shrink-0"
                aria-controls={`task-label-${task.id}`}
              />
              <label 
                id={`task-label-${task.id}`}
                className={`flex-grow text-sm cursor-pointer ${task.completed ? 'line-through text-slate-400' : 'text-slate-200'}`}
                onClick={() => onToggleTask(task.id)}
              >
                {task.text}
              </label>
              <button
                onClick={() => onRemoveTask(task.id)}
                className="ml-3 p-1.5 text-slate-400 hover:text-red-400 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors shrink-0"
                aria-label={`Remover tarefa: ${task.text}`}
              >
                <i className="fa-solid fa-trash-can w-4 h-4"></i>
              </button>
            </div>
          ))}
        </div>
        
        <div className="mt-5 pt-4 border-t border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-400 flex items-center gap-2"
          >
            <i className="fa-solid fa-times"></i>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectTaskManager;
