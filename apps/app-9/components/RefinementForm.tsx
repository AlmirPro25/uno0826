import React, { useState } from 'react';

interface RefinementFormProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
}

export const RefinementForm: React.FC<RefinementFormProps> = ({ onSubmit, isLoading }) => {
  const [refinementPrompt, setRefinementPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (refinementPrompt.trim() && !isLoading) {
      onSubmit(refinementPrompt);
      setRefinementPrompt('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="border-t border-gray-700 p-4 bg-gray-900/50 rounded-b-2xl">
      <form onSubmit={handleSubmit} className="space-y-3">
        <label htmlFor="refinement-prompt" className="block text-sm font-semibold text-gray-200">
          Refinar Projeto
        </label>
        <textarea
          id="refinement-prompt"
          value={refinementPrompt}
          onChange={(e) => setRefinementPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="ex: 'Adicione uma camada de dropout com taxa de 0.5 após a primeira camada densa.'"
          className="w-full h-24 p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 resize-none text-gray-200 placeholder-gray-500"
          disabled={isLoading}
        />
        <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">
                Pressione <span className="font-mono bg-gray-700 px-1.5 py-0.5 rounded">Cmd/Ctrl</span> + <span className="font-mono bg-gray-700 px-1.5 py-0.5 rounded">Enter</span> para refinar.
            </p>
            <button
                type="submit"
                disabled={isLoading || !refinementPrompt.trim()}
                className="px-4 py-2 font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500 transition-all duration-200"
            >
                {isLoading ? 'Refinando...' : 'Refinar IA'}
            </button>
        </div>
      </form>
    </div>
  );
};