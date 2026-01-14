import React, { useState } from 'react';
import { GeminiResponse } from '../types';

interface ExportManagerProps {
  response: GeminiResponse;
  prompt: string;
  onClose: () => void;
}

interface ExportOptions {
  includeCode: boolean;
  includeExplanation: boolean;
  includeArchitecture: boolean;
  includeUI: boolean;
  includeJS: boolean;
  format: 'zip' | 'github' | 'colab' | 'docker';
  dockerBase: 'python' | 'tensorflow' | 'pytorch';
  requirements: string[];
}

export const ExportManager: React.FC<ExportManagerProps> = ({ response, prompt, onClose }) => {
  const [options, setOptions] = useState<ExportOptions>({
    includeCode: true,
    includeExplanation: true,
    includeArchitecture: true,
    includeUI: !!response.uiCode,
    includeJS: !!response.jsCode,
    format: 'zip',
    dockerBase: 'tensorflow',
    requirements: ['tensorflow>=2.13.0', 'numpy>=1.21.0', 'matplotlib>=3.5.0']
  });

  const generateDockerfile = () => {
    const baseImages = {
      python: 'python:3.9-slim',
      tensorflow: 'tensorflow/tensorflow:2.13.0',
      pytorch: 'pytorch/pytorch:2.0.0-cuda11.7-cudnn8-runtime'
    };

    return `FROM ${baseImages[options.dockerBase]}

WORKDIR /app

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \\
    gcc \\
    g++ \\
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements
COPY requirements.txt .

# Instalar dependências Python
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código
COPY . .

# Expor porta para Streamlit (se aplicável)
EXPOSE 8501

# Comando padrão
CMD ["python", "train.py"]`;
  };

  const generateRequirementsTxt = () => {
    const baseRequirements = [...options.requirements];
    
    if (response.uiCode?.framework === 'Streamlit') {
      baseRequirements.push('streamlit>=1.28.0');
    } else if (response.uiCode?.framework === 'Gradio') {
      baseRequirements.push('gradio>=3.50.0');
    }
    
    if (response.jsCode) {
      baseRequirements.push('tensorflowjs>=4.0.0');
    }
    
    return baseRequirements.join('\n');
  };

  const generateReadme = () => {
    return `# Projeto de IA Gerado Automaticamente

## Descrição
${prompt}

## Arquitetura
${response.explanation.split('\n').slice(0, 3).join('\n')}

## Instalação

### Usando Docker (Recomendado)
\`\`\`bash
docker build -t meu-projeto-ia .
docker run -p 8501:8501 meu-projeto-ia
\`\`\`

### Instalação Manual
\`\`\`bash
pip install -r requirements.txt
\`\`\`

## Uso

### Treinamento
\`\`\`bash
python train.py --epochs 10 --learning_rate 0.001 --batch_size 32
\`\`\`

${response.uiCode ? `### Interface de Usuário
\`\`\`bash
${response.uiCode.framework === 'Streamlit' ? 'streamlit run app.py' : 'python app.py'}
\`\`\`
` : ''}

${response.jsCode ? `### Versão JavaScript
Abra o arquivo \`index.html\` no navegador para executar a versão JavaScript.
` : ''}

## Estrutura do Projeto
\`\`\`
${options.includeCode ? '├── train.py          # Script de treinamento\n' : ''}${options.includeUI && response.uiCode ? '├── app.py            # Interface de usuário\n' : ''}${options.includeJS && response.jsCode ? '├── index.html        # Versão JavaScript\n├── model.js          # Modelo TensorFlow.js\n' : ''}├── requirements.txt  # Dependências Python
├── Dockerfile        # Container Docker
├── README.md         # Este arquivo
${options.includeArchitecture ? '└── architecture.json # Arquitetura da rede\n' : ''}
\`\`\`

## Licença
MIT License - Gerado automaticamente pelo Criador de Redes Neurais AI
`;
  };

  const generateGitHubActions = () => {
    return `name: Treinar Modelo IA

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  train:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python 3.9
      uses: actions/setup-python@v3
      with:
        python-version: 3.9
        
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt
        
    - name: Train model
      run: |
        python train.py --epochs 5 --batch_size 32
        
    - name: Upload model artifacts
      uses: actions/upload-artifact@v3
      with:
        name: trained-model
        path: |
          *.keras
          *.h5
          model/`;
  };

  const generateColabNotebook = () => {
    const notebook = {
      nbformat: 4,
      nbformat_minor: 0,
      metadata: {
        colab: {
          provenance: []
        },
        kernelspec: {
          name: "python3",
          display_name: "Python 3"
        }
      },
      cells: [
        {
          cell_type: "markdown",
          metadata: {},
          source: [`# ${prompt}\n\nEste notebook foi gerado automaticamente pelo Criador de Redes Neurais AI.`]
        },
        {
          cell_type: "code",
          metadata: {},
          source: [`# Instalar dependências\n!pip install ${options.requirements.join(' ')}`],
          execution_count: null,
          outputs: []
        },
        {
          cell_type: "code",
          metadata: {},
          source: [response.pythonCode],
          execution_count: null,
          outputs: []
        }
      ]
    };
    
    return JSON.stringify(notebook, null, 2);
  };

  const handleExport = async () => {
    const files: { [key: string]: string } = {};
    
    if (options.includeCode) {
      files['train.py'] = response.pythonCode;
    }
    
    if (options.includeExplanation) {
      files['README.md'] = generateReadme();
    }
    
    if (options.includeArchitecture) {
      files['architecture.json'] = JSON.stringify(response.architecture, null, 2);
    }
    
    if (options.includeUI && response.uiCode) {
      files['app.py'] = response.uiCode.code;
    }
    
    if (options.includeJS && response.jsCode) {
      files['index.html'] = `<!DOCTYPE html>
<html>
<head>
    <title>Modelo IA - JavaScript</title>
    <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.0.0/dist/tf.min.js"></script>
</head>
<body>
    <h1>Modelo IA em JavaScript</h1>
    <div id="app"></div>
    <script>
${response.jsCode}
    </script>
</body>
</html>`;
    }
    
    files['requirements.txt'] = generateRequirementsTxt();
    
    if (options.format === 'docker') {
      files['Dockerfile'] = generateDockerfile();
      files['.dockerignore'] = `__pycache__/
*.pyc
*.pyo
*.pyd
.Python
env/
venv/
.venv/
pip-log.txt
pip-delete-this-directory.txt
.tox/
.coverage
.coverage.*
.cache
nosetests.xml
coverage.xml
*.cover
*.log
.git
.mypy_cache
.pytest_cache
.hypothesis`;
    }
    
    if (options.format === 'github') {
      files['.github/workflows/train.yml'] = generateGitHubActions();
      files['.gitignore'] = `__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg
MANIFEST
*.keras
*.h5
model/
logs/
.env
.venv
env/
venv/
ENV/
env.bak/
venv.bak/`;
    }
    
    if (options.format === 'colab') {
      files['notebook.ipynb'] = generateColabNotebook();
    }
    
    // Criar e baixar ZIP
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    
    Object.entries(files).forEach(([filename, content]) => {
      zip.file(filename, content);
    });
    
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `projeto-ia-${Date.now()}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Exportar Projeto</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Conteúdo a Incluir</h3>
            <div className="space-y-2">
              {[
                { key: 'includeCode', label: 'Código Python de Treinamento', available: true },
                { key: 'includeExplanation', label: 'Documentação e README', available: true },
                { key: 'includeArchitecture', label: 'Arquitetura da Rede (JSON)', available: true },
                { key: 'includeUI', label: 'Interface de Usuário', available: !!response.uiCode },
                { key: 'includeJS', label: 'Versão JavaScript', available: !!response.jsCode }
              ].map(({ key, label, available }) => (
                <label key={key} className={`flex items-center gap-2 ${!available ? 'opacity-50' : ''}`}>
                  <input
                    type="checkbox"
                    checked={options[key as keyof ExportOptions] as boolean}
                    onChange={(e) => setOptions(prev => ({ ...prev, [key]: e.target.checked }))}
                    disabled={!available}
                    className="rounded border-gray-500 bg-gray-800 text-purple-600"
                  />
                  <span className="text-gray-300">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Formato de Exportação</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'zip', label: 'Arquivo ZIP', desc: 'Pacote completo' },
                { value: 'github', label: 'Projeto GitHub', desc: 'Com CI/CD' },
                { value: 'colab', label: 'Google Colab', desc: 'Notebook Jupyter' },
                { value: 'docker', label: 'Container Docker', desc: 'Pronto para deploy' }
              ].map(({ value, label, desc }) => (
                <label key={value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="format"
                    value={value}
                    checked={options.format === value}
                    onChange={(e) => setOptions(prev => ({ ...prev, format: e.target.value as any }))}
                    className="sr-only"
                  />
                  <div className={`p-3 border rounded-lg transition-all ${
                    options.format === value 
                      ? 'border-purple-500 bg-purple-500/10' 
                      : 'border-gray-600 hover:border-gray-500'
                  }`}>
                    <div className="font-medium text-white">{label}</div>
                    <div className="text-sm text-gray-400">{desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {options.format === 'docker' && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Configuração Docker</h3>
              <select
                value={options.dockerBase}
                onChange={(e) => setOptions(prev => ({ ...prev, dockerBase: e.target.value as any }))}
                className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg text-gray-200"
              >
                <option value="python">Python 3.9 Slim</option>
                <option value="tensorflow">TensorFlow Official</option>
                <option value="pytorch">PyTorch CUDA</option>
              </select>
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Dependências Adicionais</h3>
            <textarea
              value={options.requirements.join('\n')}
              onChange={(e) => setOptions(prev => ({ 
                ...prev, 
                requirements: e.target.value.split('\n').filter(r => r.trim()) 
              }))}
              className="w-full h-24 p-2 bg-gray-900 border border-gray-600 rounded-lg text-gray-200 text-sm font-mono"
              placeholder="tensorflow>=2.13.0&#10;numpy>=1.21.0"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleExport}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Exportar Projeto
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};