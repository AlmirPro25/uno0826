import React, { useState } from 'react';
import { Download, FileText, Calendar, User, Stethoscope, CreditCard, Shield } from 'lucide-react';
import { Button } from './shadcn/Button';
import { Modal } from './Modal';
import { useToast } from './Toast';

interface DataExportProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ExportOption {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  selected: boolean;
}

export function DataExport({ isOpen, onClose }: DataExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [options, setOptions] = useState<ExportOption[]>([
    {
      id: 'profile',
      label: 'Dados Pessoais',
      description: 'Nome, email, telefone, endereço',
      icon: <User className="w-5 h-5" />,
      selected: true,
    },
    {
      id: 'appointments',
      label: 'Consultas',
      description: 'Histórico de agendamentos',
      icon: <Calendar className="w-5 h-5" />,
      selected: true,
    },
    {
      id: 'medical',
      label: 'Prontuários',
      description: 'Registros médicos e diagnósticos',
      icon: <Stethoscope className="w-5 h-5" />,
      selected: true,
    },
    {
      id: 'prescriptions',
      label: 'Receitas',
      description: 'Prescrições médicas',
      icon: <FileText className="w-5 h-5" />,
      selected: true,
    },
    {
      id: 'payments',
      label: 'Pagamentos',
      description: 'Histórico de transações',
      icon: <CreditCard className="w-5 h-5" />,
      selected: false,
    },
    {
      id: 'activity',
      label: 'Atividade',
      description: 'Logs de acesso e ações',
      icon: <Shield className="w-5 h-5" />,
      selected: false,
    },
  ]);
  const toast = useToast();

  const toggleOption = (id: string) => {
    setOptions(options.map(opt => 
      opt.id === id ? { ...opt, selected: !opt.selected } : opt
    ));
  };

  const selectAll = () => {
    setOptions(options.map(opt => ({ ...opt, selected: true })));
  };

  const deselectAll = () => {
    setOptions(options.map(opt => ({ ...opt, selected: false })));
  };

  const handleExport = async () => {
    const selectedOptions = options.filter(opt => opt.selected);
    
    if (selectedOptions.length === 0) {
      toast.error('Selecione pelo menos uma categoria');
      return;
    }

    setIsExporting(true);

    // Simulate export process
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Create mock data
    const exportData = {
      exportDate: new Date().toISOString(),
      format: exportFormat,
      categories: selectedOptions.map(opt => opt.id),
      data: {
        profile: selectedOptions.find(o => o.id === 'profile') ? {
          name: 'João Silva',
          email: 'joao.silva@email.com',
          phone: '(11) 99999-9999',
        } : undefined,
        appointments: selectedOptions.find(o => o.id === 'appointments') ? [
          { date: '2024-01-15', doctor: 'Dr. Costa', status: 'completed' },
          { date: '2024-02-20', doctor: 'Dr. Silva', status: 'scheduled' },
        ] : undefined,
      },
    };

    // Download file
    const blob = new Blob(
      [exportFormat === 'json' ? JSON.stringify(exportData, null, 2) : convertToCSV(exportData)],
      { type: exportFormat === 'json' ? 'application/json' : 'text/csv' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medisync-dados-${new Date().toISOString().split('T')[0]}.${exportFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Dados exportados com sucesso!');
    setIsExporting(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Exportar Meus Dados" size="md">
      <div className="space-y-6">
        {/* LGPD Notice */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Direito à Portabilidade (LGPD Art. 18)</strong><br />
            Você tem o direito de receber seus dados pessoais em formato estruturado e interoperável.
          </p>
        </div>

        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Formato de Exportação
          </label>
          <div className="flex space-x-3">
            <button
              onClick={() => setExportFormat('json')}
              className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                exportFormat === 'json'
                  ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              JSON
            </button>
            <button
              onClick={() => setExportFormat('csv')}
              className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                exportFormat === 'csv'
                  ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              CSV
            </button>
          </div>
        </div>

        {/* Data Categories */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Categorias de Dados
            </label>
            <div className="space-x-2">
              <button 
                onClick={selectAll}
                className="text-xs text-primary-600 hover:text-primary-700"
              >
                Selecionar todos
              </button>
              <span className="text-gray-300">|</span>
              <button 
                onClick={deselectAll}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Limpar
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            {options.map((option) => (
              <button
                key={option.id}
                onClick={() => toggleOption(option.id)}
                className={`w-full flex items-center p-3 rounded-lg border-2 transition-colors ${
                  option.selected
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <div className={`p-2 rounded-lg mr-3 ${
                  option.selected 
                    ? 'bg-primary-100 dark:bg-primary-800 text-primary-600' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                }`}>
                  {option.icon}
                </div>
                <div className="flex-1 text-left">
                  <p className={`font-medium ${
                    option.selected 
                      ? 'text-primary-700 dark:text-primary-300' 
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {option.label}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {option.description}
                  </p>
                </div>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                  option.selected
                    ? 'border-primary-600 bg-primary-600'
                    : 'border-gray-300 dark:border-gray-600'
                }`}>
                  {option.selected && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={isExporting || options.filter(o => o.selected).length === 0}
            className="flex-1"
          >
            {isExporting ? (
              <>Exportando...</>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Exportar Dados
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// Helper function to convert data to CSV
function convertToCSV(data: Record<string, unknown>): string {
  const lines: string[] = [];
  lines.push('Categoria,Campo,Valor');
  
  const flatten = (obj: Record<string, unknown>, prefix = '') => {
    for (const [key, value] of Object.entries(obj)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        flatten(value as Record<string, unknown>, `${prefix}${key}.`);
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (typeof item === 'object') {
            flatten(item as Record<string, unknown>, `${prefix}${key}[${index}].`);
          } else {
            lines.push(`${prefix}${key}[${index}],${item}`);
          }
        });
      } else {
        lines.push(`${prefix}${key},${value}`);
      }
    }
  };
  
  flatten(data);
  return lines.join('\n');
}
