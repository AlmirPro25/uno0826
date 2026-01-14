
import React, { useState } from 'react';
import { Plus, Trash2, CheckSquare, Square, ListTodo, AlertCircle } from 'lucide-react';
import { useStore } from '../store';

export const TaskManager: React.FC = () => {
  const { tasks, addTask, toggleTask, deleteTask, openConfirmation } = useStore();
  const [newTaskText, setNewTaskText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTaskText.trim();

    if (!trimmed) {
      setError("Task cannot be empty");
      return;
    }

    if (trimmed.length > 100) {
      setError("Task cannot exceed 100 characters");
      return;
    }

    addTask(trimmed);
    setNewTaskText('');
    setError(null);
  };

  const handleDelete = (id: string, text: string) => {
    openConfirmation({
      title: 'Delete Task',
      message: `Are you sure you want to delete the task: "${text}"?`,
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: () => deleteTask(id)
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTaskText(e.target.value);
    if (error) setError(null);
  };

  return (
    <div className="flex flex-col h-full bg-[#0c0c0e] select-none">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2 shrink-0">
        <ListTodo className="w-4 h-4 text-indigo-400" />
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tasks</span>
        <span className="ml-auto text-[10px] text-slate-600 font-mono bg-[#18181b] px-1.5 py-0.5 rounded">
            {tasks.filter(t => t.completed).length}/{tasks.length}
        </span>
      </div>

      {/* Input Area */}
      <div className="p-3 bg-[#121214] border-b border-slate-800/50">
        <form onSubmit={handleAddTask} className="relative">
          <input
            type="text"
            value={newTaskText}
            onChange={handleChange}
            placeholder="Add a new task..."
            className={`w-full bg-[#18181b] border ${error ? 'border-red-500/50 focus:border-red-500' : 'border-slate-700 focus:border-indigo-500'} text-white text-xs px-3 py-2 rounded focus:outline-none placeholder-slate-600 transition-colors pr-8`}
          />
          <button 
            type="submit"
            disabled={!newTaskText.trim()}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-indigo-400 disabled:opacity-0 transition-all"
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>
        {error && (
            <div className="flex items-center gap-1.5 mt-2 text-[10px] text-red-400 animate-in slide-in-from-top-1">
                <AlertCircle className="w-3 h-3" />
                <span>{error}</span>
            </div>
        )}
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center text-slate-600 gap-2">
            <CheckSquare className="w-8 h-8 opacity-20" />
            <span className="text-xs italic">No tasks yet.</span>
          </div>
        ) : (
          tasks.map(task => (
            <div 
              key={task.id} 
              className={`group flex items-start gap-3 p-2 rounded hover:bg-[#18181b] transition-colors border border-transparent hover:border-white/5 ${task.completed ? 'opacity-60' : 'opacity-100'}`}
            >
              <button 
                onClick={() => toggleTask(task.id)}
                className={`flex-shrink-0 mt-0.5 transition-colors ${task.completed ? 'text-emerald-500' : 'text-slate-500 hover:text-indigo-400'}`}
              >
                {task.completed ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              </button>
              
              <span className={`flex-1 text-xs leading-5 break-words ${task.completed ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                {task.text}
              </span>

              <button 
                onClick={() => handleDelete(task.id, task.text)}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-red-400 transition-all"
                title="Delete Task"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
