/**
 * VersionHistory - Componente de Histórico de Versões de Prontuários
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History, 
  Clock, 
  User, 
  ChevronRight, 
  RotateCcw, 
  GitCompare,
  FileText,
  Download,
  X,
  Check,
  AlertCircle
} from 'lucide-react';
import { 
  MedicalRecordVersion, 
  FieldDiff,
  getVersions, 
  getVersion, 
  compareVersions, 
  restoreVersion 
} from '@/api/medicalRecordVersions';

interface VersionHistoryProps {
  recordId: number;
  onRestore?: (version: MedicalRecordVersion) => void;
  onClose?: () => void;
}

export function VersionHistory({ recordId, onRestore, onClose }: VersionHistoryProps) {
  const [versions, setVersions] = useState<MedicalRecordVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<MedicalRecordVersion | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareFrom, setCompareFrom] = useState<number | null>(null);
  const [compareTo, setCompareTo] = useState<number | null>(null);
  const [differences, setDifferences] = useState<FieldDiff[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    loadVersions();
  }, [recordId]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      const data = await getVersions(recordId);
      setVersions(data);
    } catch (error) {
      console.error('Erro ao carregar versões:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVersion = async (version: MedicalRecordVersion) => {
    if (compareMode) {
      if (!compareFrom) {
        setCompareFrom(version.version);
      } else if (!compareTo) {
        setCompareTo(version.version);
        // Carregar diferenças
        try {
          const result = await compareVersions(recordId, compareFrom, version.version);
          setDifferences(result.differences);
        } catch (error) {
          console.error('Erro ao comparar versões:', error);
        }
      }
    } else {
      setSelectedVersion(version);
    }
  };

  const handleRestore = async () => {
    if (!selectedVersion) return;

    try {
      setRestoring(true);
      const restored = await restoreVersion(recordId, selectedVersion.version);
      onRestore?.(restored);
      loadVersions();
      setSelectedVersion(null);
    } catch (error) {
      console.error('Erro ao restaurar versão:', error);
    } finally {
      setRestoring(false);
    }
  };

  const resetCompare = () => {
    setCompareMode(false);
    setCompareFrom(null);
    setCompareTo(null);
    setDifferences([]);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden max-w-4xl w-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <History className="w-6 h-6" />
            <h2 className="text-lg font-semibold">Histórico de Versões</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (compareMode) {
                  resetCompare();
                } else {
                  setCompareMode(true);
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                compareMode 
                  ? 'bg-white text-blue-600' 
                  : 'bg-blue-500 hover:bg-blue-400'
              }`}
            >
              <GitCompare className="w-4 h-4 inline mr-1" />
              {compareMode ? 'Cancelar' : 'Comparar'}
            </button>
            {onClose && (
              <button onClick={onClose} className="p-1 hover:bg-blue-500 rounded">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
        {compareMode && (
          <p className="text-blue-100 text-sm mt-2">
            {!compareFrom 
              ? 'Selecione a primeira versão para comparar'
              : !compareTo 
                ? 'Selecione a segunda versão para comparar'
                : `Comparando versão ${compareFrom} com versão ${compareTo}`
            }
          </p>
        )}
      </div>

      <div className="flex">
        {/* Lista de Versões */}
        <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
          {versions.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              Nenhuma versão encontrada
            </div>
          ) : (
            versions.map((version) => (
              <button
                key={version.id}
                onClick={() => handleSelectVersion(version)}
                className={`w-full p-3 text-left border-b border-gray-100 dark:border-gray-700 
                          hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  selectedVersion?.id === version.id 
                    ? 'bg-blue-50 dark:bg-blue-900/20' 
                    : ''
                } ${
                  compareMode && (compareFrom === version.version || compareTo === version.version)
                    ? 'bg-green-50 dark:bg-green-900/20'
                    : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 dark:text-white">
                    Versão {version.version}
                  </span>
                  {compareMode && compareFrom === version.version && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                      De
                    </span>
                  )}
                  {compareMode && compareTo === version.version && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                      Para
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(version.created_at)}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <User className="w-3 h-3" />
                  {version.changed_by_name}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                  {version.change_summary}
                </p>
              </button>
            ))
          )}
        </div>

        {/* Detalhes / Comparação */}
        <div className="flex-1 p-4 max-h-96 overflow-y-auto">
          {compareMode && differences.length > 0 ? (
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Diferenças entre versões
              </h3>
              <div className="space-y-4">
                {differences.map((diff, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 dark:bg-gray-700 px-3 py-2 font-medium text-sm">
                      {diff.field}
                    </div>
                    <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-gray-700">
                      <div className="p-3">
                        <span className="text-xs text-red-600 font-medium">Antes</span>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">
                          {diff.old_value || '(vazio)'}
                        </p>
                      </div>
                      <div className="p-3">
                        <span className="text-xs text-green-600 font-medium">Depois</span>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">
                          {diff.new_value || '(vazio)'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : selectedVersion ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Versão {selectedVersion.version}
                </h3>
                <button
                  onClick={handleRestore}
                  disabled={restoring || selectedVersion.version === versions[0]?.version}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white 
                           rounded-lg text-sm font-medium hover:bg-blue-700 
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {restoring ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <RotateCcw className="w-4 h-4" />
                  )}
                  Restaurar
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <Clock className="w-4 h-4" />
                    {formatDate(selectedVersion.created_at)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <User className="w-4 h-4" />
                    {selectedVersion.changed_by_name}
                  </div>
                  {selectedVersion.change_reason && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <FileText className="w-4 h-4" />
                      {selectedVersion.change_reason}
                    </div>
                  )}
                </div>

                {selectedVersion.diagnosis && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Diagnóstico
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                      {selectedVersion.diagnosis}
                    </p>
                  </div>
                )}

                {selectedVersion.symptoms && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Sintomas
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                      {selectedVersion.symptoms}
                    </p>
                  </div>
                )}

                {selectedVersion.treatment && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tratamento
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                      {selectedVersion.treatment}
                    </p>
                  </div>
                )}

                {selectedVersion.notes && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Observações
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                      {selectedVersion.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <History className="w-12 h-12 mb-3 opacity-50" />
              <p>Selecione uma versão para ver os detalhes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente compacto para exibir badge de versão
interface VersionBadgeProps {
  version: number;
  totalVersions: number;
  onClick?: () => void;
}

export function VersionBadge({ version, totalVersions, onClick }: VersionBadgeProps) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 
               text-gray-600 dark:text-gray-400 rounded text-xs hover:bg-gray-200 
               dark:hover:bg-gray-600 transition-colors"
    >
      <History className="w-3 h-3" />
      v{version} de {totalVersions}
    </button>
  );
}

export default VersionHistory;
