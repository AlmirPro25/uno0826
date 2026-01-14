import React, { useState } from 'react';
import { GeminiResponse } from '../types';

interface ShareManagerProps {
  response: GeminiResponse;
  prompt: string;
  onClose: () => void;
}

interface ShareOptions {
  includeCode: boolean;
  includeExplanation: boolean;
  includeArchitecture: boolean;
  shareMethod: 'link' | 'gist' | 'pastebin' | 'email';
  privacy: 'public' | 'unlisted' | 'private';
  expirationDays: number;
}

export const ShareManager: React.FC<ShareManagerProps> = ({ response, prompt, onClose }) => {
  const [options, setOptions] = useState<ShareOptions>({
    includeCode: true,
    includeExplanation: true,
    includeArchitecture: false,
    shareMethod: 'link',
    privacy: 'unlisted',
    expirationDays: 30
  });
  
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateShareableContent = () => {
    let content = `# ${prompt}\n\n`;
    
    if (options.includeExplanation) {
      content += `## Explicação\n${response.explanation}\n\n`;
    }
    
    if (options.includeCode) {
      content += `## Código Python\n\`\`\`python\n${response.pythonCode}\n\`\`\`\n\n`;
    }
    
    if (options.includeArchitecture) {
      content += `## Arquitetura da Rede\n\`\`\`json\n${JSON.stringify(response.architecture, null, 2)}\n\`\`\`\n\n`;
    }
    
    if (response.uiCode) {
      content += `## Interface de Usuário (${response.uiCode.framework})\n\`\`\`python\n${response.uiCode.code}\n\`\`\`\n\n`;
    }
    
    content += `---\n*Gerado automaticamente pelo Criador de Redes Neurais AI*`;
    
    return content;
  };

  const shareToGitHub = async (content: string) => {
    // Simular criação de Gist público
    const gistData = {
      description: `Projeto IA: ${prompt.substring(0, 50)}...`,
      public: options.privacy === 'public',
      files: {
        'README.md': { content },
        'train.py': { content: response.pythonCode }
      }
    };
    
    // Em uma implementação real, você faria uma chamada para a API do GitHub
    // Por enquanto, vamos simular
    await new Promise(resolve => setTimeout(resolve, 2000));
    return `https://gist.github.com/user/${Date.now()}`;
  };

  const shareToPastebin = async (content: string) => {
    // Simular upload para Pastebin
    await new Promise(resolve => setTimeout(resolve, 1500));
    return `https://pastebin.com/${Math.random().toString(36).substring(7)}`;
  };

  const generateLocalLink = (content: string) => {
    // Criar um link local usando localStorage
    const shareId = Date.now().toString();
    const shareData = {
      content,
      prompt,
      response,
      createdAt: Date.now(),
      expiresAt: Date.now() + (options.expirationDays * 24 * 60 * 60 * 1000),
      privacy: options.privacy
    };
    
    localStorage.setItem(`share_${shareId}`, JSON.stringify(shareData));
    return `${window.location.origin}?share=${shareId}`;
  };

  const generateEmailContent = (content: string) => {
    const subject = encodeURIComponent(`Projeto IA: ${prompt.substring(0, 30)}...`);
    const body = encodeURIComponent(content);
    return `mailto:?subject=${subject}&body=${body}`;
  };

  const handleShare = async () => {
    setIsSharing(true);
    setError(null);
    
    try {
      const content = generateShareableContent();
      let url: string;
      
      switch (options.shareMethod) {
        case 'gist':
          url = await shareToGitHub(content);
          break;
        case 'pastebin':
          url = await shareToPastebin(content);
          break;
        case 'email':
          url = generateEmailContent(content);
          window.location.href = url;
          return;
        default:
          url = generateLocalLink(content);
      }
      
      setShareUrl(url);
    } catch (err) {
      setError('Erro ao compartilhar o projeto. Tente novamente.');
    } finally {
      setIsSharing(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Mostrar feedback visual
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Compartilhar Projeto</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {!shareUrl ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Conteúdo a Compartilhar</h3>
              <div className="space-y-2">
                {[
                  { key: 'includeCode', label: 'Código Python' },
                  { key: 'includeExplanation', label: 'Explicação Detalhada' },
                  { key: 'includeArchitecture', label: 'Arquitetura da Rede' }
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={options[key as keyof ShareOptions] as boolean}
                      onChange={(e) => setOptions(prev => ({ ...prev, [key]: e.target.checked }))}
                      className="rounded border-gray-500 bg-gray-800 text-purple-600"
                    />
                    <span className="text-gray-300">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Método de Compartilhamento</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'link', label: 'Link Local', desc: 'Compartilhamento rápido' },
                  { value: 'gist', label: 'GitHub Gist', desc: 'Público no GitHub' },
                  { value: 'pastebin', label: 'Pastebin', desc: 'Serviço externo' },
                  { value: 'email', label: 'Email', desc: 'Enviar por email' }
                ].map(({ value, label, desc }) => (
                  <label key={value} className="cursor-pointer">
                    <input
                      type="radio"
                      name="shareMethod"
                      value={value}
                      checked={options.shareMethod === value}
                      onChange={(e) => setOptions(prev => ({ ...prev, shareMethod: e.target.value as any }))}
                      className="sr-only"
                    />
                    <div className={`p-3 border rounded-lg transition-all ${
                      options.shareMethod === value 
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

            {options.shareMethod !== 'email' && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Configurações de Privacidade</h3>
                <div className="space-y-3">
                  <select
                    value={options.privacy}
                    onChange={(e) => setOptions(prev => ({ ...prev, privacy: e.target.value as any }))}
                    className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg text-gray-200"
                  >
                    <option value="public">Público - Visível para todos</option>
                    <option value="unlisted">Não listado - Apenas com link</option>
                    <option value="private">Privado - Apenas você</option>
                  </select>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">
                      Expiração (dias)
                    </label>
                    <select
                      value={options.expirationDays}
                      onChange={(e) => setOptions(prev => ({ ...prev, expirationDays: parseInt(e.target.value) }))}
                      className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg text-gray-200"
                    >
                      <option value={1}>1 dia</option>
                      <option value={7}>7 dias</option>
                      <option value={30}>30 dias</option>
                      <option value={90}>90 dias</option>
                      <option value={365}>1 ano</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-900/50 border border-red-500 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleShare}
                disabled={isSharing}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-600 transition-colors flex items-center justify-center gap-2"
              >
                {isSharing ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Compartilhando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                    Compartilhar
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-900/20 border border-green-500 rounded-lg">
              <h3 className="text-green-400 font-semibold mb-2">✅ Projeto Compartilhado com Sucesso!</h3>
              <p className="text-gray-300 text-sm mb-3">Seu projeto está disponível no link abaixo:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 p-2 bg-gray-900 border border-gray-600 rounded text-gray-200 text-sm font-mono"
                />
                <button
                  onClick={() => copyToClipboard(shareUrl)}
                  className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                >
                  📋
                </button>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => window.open(shareUrl, '_blank')}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Abrir Link
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};