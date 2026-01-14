import React, { useState, useEffect } from 'react';
import { ProjectFileSystem } from '@/services/ProjectFileSystem';
import type { Project } from '@/services/ProjectFileSystem';

interface ProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectsModal: React.FC<ProjectsModalProps> = ({ isOpen, onClose }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'size'>('recent');

  useEffect(() => {
    if (isOpen) {
      loadProjects();
    }
  }, [isOpen]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const allProjects = await ProjectFileSystem.listProjects();
      setProjects(allProjects);
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects
    .filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        case 'size':
          return (b.files?.length || 0) - (a.files?.length || 0);
        default:
          return 0;
      }
    });

  const handleOpenProject = async (projectId: string) => {
    try {
      await ProjectFileSystem.openInExplorer(projectId);
    } catch (error) {
      console.error('Erro ao abrir projeto:', error);
    }
  };

  const handleInstallProject = async (projectId: string) => {
    try {
      const result = await ProjectFileSystem.installAsApp(projectId);
      if (result.success) {
        alert(`✅ App instalado! ID: ${result.appId}`);
      } else {
        alert(`❌ Erro: ${result.error}`);
      }
    } catch (error: any) {
      alert(`❌ Erro: ${error.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <i className="fas fa-folder-open text-purple-400"></i>
              Projetos Salvos
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              {projects.length} projeto{projects.length !== 1 ? 's' : ''} encontrado{projects.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input
                type="text"
                placeholder="Buscar projetos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="recent">Mais Recentes</option>
              <option value="name">Nome (A-Z)</option>
              <option value="size">Tamanho</option>
            </select>
            <button
              onClick={loadProjects}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <i className="fas fa-sync-alt"></i>
              Atualizar
            </button>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <i className="fas fa-spinner fa-spin text-4xl text-purple-400 mb-4"></i>
                <p className="text-slate-400">Carregando projetos...</p>
              </div>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <i className="fas fa-folder-open text-6xl text-slate-600 mb-4"></i>
                <p className="text-slate-400 text-lg">
                  {searchTerm ? 'Nenhum projeto encontrado' : 'Nenhum projeto salvo ainda'}
                </p>
                <p className="text-slate-500 text-sm mt-2">
                  {searchTerm ? 'Tente outro termo de busca' : 'Crie um projeto no chat para começar'}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="bg-slate-700 rounded-lg p-4 hover:bg-slate-600 transition-colors border border-slate-600"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold truncate">{project.name}</h3>
                      <p className="text-slate-400 text-xs mt-1">ID: {project.id}</p>
                    </div>
                    <i className="fas fa-folder text-2xl text-purple-400 ml-2"></i>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-slate-300">
                      <i className="fas fa-file-code w-5 text-slate-400"></i>
                      <span>{project.files?.length || 0} arquivo{project.files?.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center text-sm text-slate-300">
                      <i className="fas fa-calendar w-5 text-slate-400"></i>
                      <span>{new Date(project.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center text-sm text-slate-300">
                      <i className="fas fa-clock w-5 text-slate-400"></i>
                      <span>{new Date(project.createdAt).toLocaleTimeString('pt-BR')}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenProject(project.id)}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                      title="Abrir no Explorer"
                    >
                      <i className="fas fa-folder-open"></i>
                      Abrir
                    </button>
                    <button
                      onClick={() => handleInstallProject(project.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                      title="Instalar como App"
                    >
                      <i className="fas fa-box"></i>
                      Instalar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 bg-slate-800/50">
          <div className="flex items-center justify-between text-sm text-slate-400">
            <span>
              Mostrando {filteredProjects.length} de {projects.length} projeto{projects.length !== 1 ? 's' : ''}
            </span>
            <span>
              Localização: C:\Users\...\aiweaver\projects\
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
