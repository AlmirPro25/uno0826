/**
 * Diálogo para adicionar uma nova pessoa ao sistema
 */

import React, { useState, useRef } from 'react';
import { peopleService } from '../services/peopleService';

interface AddPersonDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPersonAdded?: (personId: number, name: string) => void;
  capturedImage?: Blob | null;
}

const AddPersonDialog: React.FC<AddPersonDialogProps> = ({
  isOpen,
  onClose,
  onPersonAdded,
  capturedImage
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [relationship, setRelationship] = useState('Amigo');
  const [imageFile, setImageFile] = useState<File | Blob | null>(capturedImage || null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Nome é obrigatório');
      return;
    }

    if (!imageFile) {
      setError('Imagem é obrigatória');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await peopleService.addPerson(
        name.trim(),
        imageFile,
        description.trim() || undefined,
        relationship
      );

      console.log('✅ Pessoa adicionada:', result);
      onPersonAdded?.(result.personId, name);
      handleClose();
    } catch (err: any) {
      console.error('Erro ao adicionar pessoa:', err);
      setError(err.message || 'Erro ao adicionar pessoa');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setRelationship('Amigo');
    setImageFile(null);
    setImagePreview(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4">
          👤 Adicionar Pessoa
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Imagem */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Foto *
            </label>
            {imagePreview || capturedImage ? (
              <div className="relative">
                <img
                  src={imagePreview || (capturedImage ? URL.createObjectURL(capturedImage) : '')}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-2 right-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg text-sm"
                >
                  Trocar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-48 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center hover:border-purple-500 transition-colors"
              >
                <span className="text-4xl mb-2">📷</span>
                <span className="text-gray-400">Clique para selecionar</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nome *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Almir"
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          {/* Relacionamento */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Relacionamento
            </label>
            <select
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="Usuário">Usuário (Eu)</option>
              <option value="Amigo">Amigo</option>
              <option value="Família">Família</option>
              <option value="Colega">Colega de Trabalho</option>
              <option value="Conhecido">Conhecido</option>
              <option value="Outro">Outro</option>
            </select>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Descrição (opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Desenvolvedor, gosta de IA..."
              rows={3}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          </div>

          {/* Erro */}
          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Salvando...' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPersonDialog;
