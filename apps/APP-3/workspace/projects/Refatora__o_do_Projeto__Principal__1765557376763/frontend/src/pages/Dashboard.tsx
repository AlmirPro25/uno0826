
import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '../hooks/useAuthContext';
import { getTasks, createTask, updateTask, deleteTask } from '../services/taskService';
import TaskItem from '../components/TaskItem';
import CreateTaskForm from '../components/CreateTaskForm';
import { PlusIcon, ArrowPathIcon, MagnifyingGlassIcon, Bars3Icon, UserIcon } from '@heroicons/react/24/outline';

/**
 * Interface para representar uma tarefa.
 */
interface Task {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  user_id: number;
}

/**
 * Componente da página principal do Dashboard.
 * @returns {JSX.Element} O componente DashboardPage.
 */
function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'active' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { user, logout } = useAuthContext();

  /**
   * Função para carregar as tarefas do backend.
   */
  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const fetchedTasks = await getTasks();
      setTasks(fetchedTasks);
    } catch (err: any) {
      setError(err.message || 'Falha ao carregar tarefas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  /**
   * Manipula a criação de uma nova tarefa.
   * @param {string} title - Título da nova tarefa.
   * @param {string} description - Descrição da nova tarefa.
   */
  const handleCreateTask = async (title: string, description: string) => {
    try {
      await createTask({ title, description });
      loadTasks(); // Recarrega a lista após a criação
      setShowForm(false);
    } catch (err: any) {
      setError(err.message || 'Falha ao criar tarefa.');
    }
  };

  /**
   * Manipula a alternância do status de conclusão de uma tarefa.
   * @param {number} taskId - ID da tarefa a ser atualizada.
   * @param {boolean} currentStatus - Status atual da tarefa.
   */
  const handleToggleCompleted = async (taskId: number, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      await updateTask(taskId, { completed: newStatus });
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId ? { ...task, completed: newStatus } : task
        )
      );
    } catch (err: any) {
      setError(err.message || 'Falha ao atualizar tarefa.');
    }
  };

  /**
   * Manipula a exclusão de uma tarefa.
   * @param {number} taskId - ID da tarefa a ser excluída.
   */
  const handleDeleteTask = async (taskId: number) => {
    try {
      await deleteTask(taskId);
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    } catch (err: any) {
      setError(err.message || 'Falha ao excluir tarefa.');
    }
  };

  /**
   * Filtra as tarefas com base no modo de filtro e na consulta de pesquisa.
   */
  const filteredTasks = tasks.filter(task => {
    const searchMatch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        task.description.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterMode === 'active') return !task.completed && searchMatch;
    if (filterMode === 'completed') return task.completed && searchMatch;
    return searchMatch;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
      <header className="w-full max-w-4xl flex justify-between items-center bg-white p-4 rounded-xl shadow-md mb-6 sticky top-4 z-10">
        <h1 className="text-2xl font-bold text-primary">TaskFlow</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={loadTasks}
            className="p-2 text-primary hover:text-indigo-600 focus-visible-primary rounded-lg transition duration-150 ease-in-out"
            aria-label="Recarregar tarefas"
          >
            <ArrowPathIcon className="w-6 h-6" />
          </button>
          <button
            onClick={logout}
            className="p-2 text-gray-600 hover:text-red-600 focus-visible-primary rounded-lg transition duration-150 ease-in-out"
            aria-label="Sair da conta"
          >
            <UserIcon className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="w-full max-w-4xl">
        {user && (
          <p className="mb-4 text-center text-gray-600 text-sm">
            Bem-vindo(a), {user.email}! Gerencie suas tarefas abaixo.
          </p>
        )}

        {/* Barra de Pesquisa e Filtros */}
        <div className="mb-6 flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div className="relative flex-grow">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar tarefas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus-visible-primary"
              aria-label="Pesquisar tarefas por título ou descrição"
            />
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setFilterMode('all')}
              className={`py-2 px-4 rounded-lg text-sm font-semibold transition duration-150 focus-visible-primary ${
                filterMode === 'all' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
              aria-pressed={filterMode === 'all'}
            >
              Todas
            </button>
            <button
              onClick={() => setFilterMode('active')}
              className={`py-2 px-4 rounded-lg text-sm font-semibold transition duration-150 focus-visible-primary ${
                filterMode === 'active' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
              aria-pressed={filterMode === 'active'}
            >
              Ativas
            </button>
            <button
              onClick={() => setFilterMode('completed')}
              className={`py-2 px-4 rounded-lg text-sm font-semibold transition duration-150 focus-visible-primary ${
                filterMode === 'completed' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
              aria-pressed={filterMode === 'completed'}
            >
              Concluídas
            </button>
          </div>
        </div>

        {/* Exibição das Tarefas */}
        <section className="space-y-3">
          {loading ? (
            <div className="p-4 bg-white rounded-lg shadow-sm text-center text-gray-500">Carregando tarefas...</div>
          ) : error ? (
            <div className="p-4 bg-red-100 text-red-700 rounded-lg border border-red-200">{error}</div>
          ) : filteredTasks.length === 0 ? (
            <div className="p-4 bg-white rounded-lg shadow-sm text-center text-gray-500">Nenhuma tarefa encontrada.</div>
          ) : (
            filteredTasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onToggleCompleted={handleToggleCompleted}
                onDelete={handleDeleteTask}
              />
            ))
          )}
        </section>
      </main>

      {/* Botão de Adicionar Tarefa */}
      <div className="fixed bottom-6 right-6 z-20">
        <button
          onClick={() => setShowForm(true)}
          className="bg-accent text-white rounded-full p-4 shadow-xl hover:bg-pink-600 transition duration-300 focus-visible-primary"
          aria-label="Adicionar nova tarefa"
        >
          <PlusIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Modal de Criação de Tarefa */}
      {showForm && (
        <CreateTaskForm
          onClose={() => setShowForm(false)}
          onCreateTask={handleCreateTask}
        />
      )}
    </div>
  );
}

export default DashboardPage;
