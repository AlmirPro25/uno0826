
import React, { useState, useCallback, useMemo } from 'react';
import type { StoredProjectSnapshot, AppPhase } from '@/store/useAppStore';

interface ProjectSnapshotsModalProps {
  isOpen: boolean;
  onClose: () => void;
  snapshots: StoredProjectSnapshot[];
  onSaveSnapshot: (name: string, description?: string) => void;
  onLoadSnapshot: (snapshotId: string) => void;
  onDeleteSnapshot: (snapshotId: string) => void;
  onRenameSnapshot: (snapshotId: string, newName: string, newDescription?: string) => void;
  currentAppPhase: AppPhase;
}

const ProjectSnapshotsModal: React.FC<ProjectSnapshotsModalProps> = ({
  isOpen,
  onClose,
  snapshots,
  onSaveSnapshot,
  onLoadSnapshot,
  onDeleteSnapshot,
  onRenameSnapshot,
  currentAppPhase,
}) => {
  const [newSnapshotName, setNewSnapshotName] = useState('');
  const [newSnapshotDescription, setNewSnapshotDescription] = useState('');
  const [editingSnapshot, setEditingSnapshot] = useState<StoredProjectSnapshot | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const isModalDisabled = useMemo(() => currentAppPhase === 'MANAGING_SNAPSHOTS' && !editingSnapshot, [currentAppPhase, editingSnapshot]);


  const handleSaveCurrentSnapshot = () => {
    onSaveSnapshot(newSnapshotName.trim() || `Snapshot ${new Date().toLocaleTimeString()}`, newSnapshotDescription.trim());
    setNewSnapshotName('');
    setNewSnapshotDescription('');
  };

  const startEditing = (snapshot: StoredProjectSnapshot) => {
    setEditingSnapshot(snapshot);
    setEditName(snapshot.snapshotName);
    setEditDescription(snapshot.snapshotDescription || '');
  };

  const cancelEditing = () => {
    setEditingSnapshot(null);
    setEditName('');
    setEditDescription('');
  };

  const submitRename = () => {
    if (editingSnapshot && editName.trim()) {
      onRenameSnapshot(editingSnapshot.snapshotId, editName.trim(), editDescription.trim());
      cancelEditing();
    }
  };
  
  const sortedSnapshots = useMemo(() => {
    return [...snapshots].sort((a, b) => new Date(b.snapshotTimestamp).getTime() - new Date(a.snapshotTimestamp).getTime());
  }, [snapshots]);

  const handleOverlayClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isModalDisabled && !editingSnapshot) {
      onClose();
    }
  }, [onClose, isModalDisabled, editingSnapshot]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900 bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-[160] p-4" // Higher z-index
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="snapshots-modal-title"
    >
      <div className="bg-slate-800 p-5 sm:p-6 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col text-slate-100 border border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <h2 id="snapshots-modal-title" className="text-xl sm:text-2xl font-semibold text-blue-400">
            <i className="fa-solid fa-layer-group mr-2"></i>Gerenciador de Snapshots do Projeto
          </h2>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-blue-300 transition-colors p-1 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" 
            aria-label="Fechar modal de snapshots"
            disabled={isModalDisabled || !!editingSnapshot}
          >
            <i className="fa-solid fa-times w-5 h-5"></i>
          </button>
        </div>

        {/* Save Current Snapshot Section */}
        {!editingSnapshot && (
            <div className="mb-4 p-3 bg-slate-700/50 rounded-lg border border-slate-600/70">
                <h3 className="text-md font-semibold text-slate-200 mb-2">Salvar Snapshot Atual</h3>
                <div className="space-y-2">
                    <input
                    type="text"
                    value={newSnapshotName}
                    onChange={(e) => setNewSnapshotName(e.target.value)}
                    placeholder="Nome do Snapshot (opcional)"
                    className="w-full p-2 bg-slate-700 text-slate-100 placeholder-slate-400 border border-slate-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                    disabled={isModalDisabled}
                    />
                    <textarea
                    value={newSnapshotDescription}
                    onChange={(e) => setNewSnapshotDescription(e.target.value)}
                    placeholder="Descrição (opcional)"
                    rows={2}
                    className="w-full p-2 bg-slate-700 text-slate-100 placeholder-slate-400 border border-slate-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm resize-none scrollbar-thin"
                    disabled={isModalDisabled}
                    />
                </div>
                <button
                    onClick={handleSaveCurrentSnapshot}
                    className="mt-2 w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-slate-500 disabled:opacity-70 transition-colors text-sm font-medium"
                    disabled={isModalDisabled}
                >
                    <i className="fa-solid fa-camera-retro mr-1.5"></i> Salvar Snapshot
                </button>
            </div>
        )}

        {/* Edit Snapshot Section (shown when editing) */}
        {editingSnapshot && (
            <div className="mb-4 p-3 bg-slate-700/80 rounded-lg border border-blue-500/50 ring-1 ring-blue-500">
                <h3 className="text-md font-semibold text-blue-300 mb-2">Editando Snapshot: <span className="italic">{editingSnapshot.snapshotName}</span></h3>
                <div className="space-y-2">
                    <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Novo nome para o Snapshot"
                    className="w-full p-2 bg-slate-600 text-slate-100 placeholder-slate-400 border border-slate-500 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 text-sm"
                    />
                    <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Nova descrição (opcional)"
                    rows={2}
                    className="w-full p-2 bg-slate-600 text-slate-100 placeholder-slate-400 border border-slate-500 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 text-sm resize-none scrollbar-thin"
                    />
                </div>
                <div className="mt-3 flex gap-2">
                    <button
                        onClick={submitRename}
                        disabled={!editName.trim()}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-md text-xs font-medium focus:outline-none focus:ring-1 focus:ring-green-400 disabled:opacity-60"
                    >
                        <i className="fa-solid fa-check mr-1"></i> Salvar Alterações
                    </button>
                    <button
                        onClick={cancelEditing}
                        className="px-3 py-1.5 bg-slate-500 hover:bg-slate-400 text-white rounded-md text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-300"
                    >
                        <i className="fa-solid fa-times mr-1"></i> Cancelar
                    </button>
                </div>
            </div>
        )}

        {/* Snapshots List */}
        <div className={`flex-grow overflow-y-auto space-y-2.5 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-700/50 pr-1 ${editingSnapshot ? 'opacity-50 pointer-events-none' : ''}`}>
          <h3 className="text-md font-semibold text-slate-200 mt-2 mb-1">Snapshots Salvos ({sortedSnapshots.length})</h3>
          {sortedSnapshots.length === 0 && (
            <p className="text-center text-slate-400 py-3 italic text-sm">Nenhum snapshot salvo ainda.</p>
          )}
          {sortedSnapshots.map((snapshot) => (
            <div 
              key={snapshot.snapshotId} 
              className="p-3 bg-slate-700 rounded-lg border border-slate-600 hover:border-slate-500 transition-colors"
            >
              <div className="flex justify-between items-start mb-1">
                <h4 className="text-sm font-semibold text-slate-100 break-all">{snapshot.snapshotName}</h4>
                <span className="text-xs text-slate-400 flex-shrink-0 ml-2">
                  {new Date(snapshot.snapshotTimestamp).toLocaleString()}
                </span>
              </div>
              {snapshot.snapshotDescription && (
                <p className="text-xs text-slate-300 mb-2 break-words">{snapshot.snapshotDescription}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-1.5">
                <button
                  onClick={() => onLoadSnapshot(snapshot.snapshotId)}
                  className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-md text-xs font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-sky-400 disabled:bg-slate-500 disabled:opacity-70"
                  disabled={isModalDisabled || !!editingSnapshot}
                  title="Carregar este snapshot (substitui o trabalho atual)"
                >
                  <i className="fa-solid fa-upload mr-1"></i> Carregar
                </button>
                <button
                  onClick={() => startEditing(snapshot)}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-md text-xs font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-amber-400 disabled:bg-slate-500 disabled:opacity-70"
                  disabled={isModalDisabled || !!editingSnapshot}
                  title="Renomear ou editar descrição deste snapshot"
                >
                  <i className="fa-solid fa-pencil mr-1"></i> Renomear/Editar
                </button>
                <button
                  onClick={() => onDeleteSnapshot(snapshot.snapshotId)}
                  className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded-md text-xs font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-red-400 disabled:bg-slate-500 disabled:opacity-70"
                  disabled={isModalDisabled || !!editingSnapshot}
                  title="Excluir este snapshot permanentemente"
                >
                  <i className="fa-solid fa-trash-can mr-1"></i> Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-auto pt-4 border-t border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors text-sm font-medium focus:outline-none focus:ring-1 focus:ring-slate-400"
            disabled={isModalDisabled || !!editingSnapshot}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectSnapshotsModal;
