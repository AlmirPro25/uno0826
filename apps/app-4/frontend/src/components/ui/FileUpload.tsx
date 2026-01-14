import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, File, Image, FileText, Film, Music, Archive, Check, AlertCircle } from 'lucide-react';
import { Button } from './shadcn/Button';
import { useToast } from './Toast';

interface UploadedFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
  url?: string;
}

interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in MB
  maxFiles?: number;
  onUpload?: (files: File[]) => Promise<string[]>;
  onRemove?: (fileId: string) => void;
  disabled?: boolean;
  className?: string;
}

export function FileUpload({
  accept = '*/*',
  multiple = true,
  maxSize = 10,
  maxFiles = 5,
  onUpload,
  onRemove,
  disabled = false,
  className = '',
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-5 h-5 text-blue-500" />;
    if (type.startsWith('video/')) return <Film className="w-5 h-5 text-purple-500" />;
    if (type.startsWith('audio/')) return <Music className="w-5 h-5 text-green-500" />;
    if (type.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    if (type.includes('zip') || type.includes('rar')) return <Archive className="w-5 h-5 text-yellow-500" />;
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize * 1024 * 1024) {
      return `Arquivo muito grande. Máximo: ${maxSize}MB`;
    }
    return null;
  };

  const handleFiles = useCallback(async (fileList: FileList) => {
    const newFiles: File[] = Array.from(fileList);
    
    if (files.length + newFiles.length > maxFiles) {
      toast.error(`Máximo de ${maxFiles} arquivos permitidos`);
      return;
    }

    const validFiles: UploadedFile[] = [];
    
    for (const file of newFiles) {
      const error = validateFile(file);
      const uploadedFile: UploadedFile = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        progress: 0,
        status: error ? 'error' : 'uploading',
        error: error || undefined,
      };
      validFiles.push(uploadedFile);
    }

    setFiles(prev => [...prev, ...validFiles]);

    // Simulate upload for valid files
    for (const uploadedFile of validFiles) {
      if (uploadedFile.status === 'error') continue;

      // Simulate progress
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setFiles(prev => prev.map(f => 
          f.id === uploadedFile.id ? { ...f, progress } : f
        ));
      }

      // Call onUpload if provided
      if (onUpload) {
        try {
          const urls = await onUpload([uploadedFile.file]);
          setFiles(prev => prev.map(f => 
            f.id === uploadedFile.id ? { ...f, status: 'success', url: urls[0] } : f
          ));
        } catch (error) {
          setFiles(prev => prev.map(f => 
            f.id === uploadedFile.id ? { ...f, status: 'error', error: 'Falha no upload' } : f
          ));
        }
      } else {
        setFiles(prev => prev.map(f => 
          f.id === uploadedFile.id ? { ...f, status: 'success' } : f
        ));
      }
    }
  }, [files.length, maxFiles, maxSize, onUpload, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  }, [disabled, handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    onRemove?.(fileId);
  };

  const openFilePicker = () => {
    inputRef.current?.click();
  };

  return (
    <div className={className}>
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFilePicker}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragging ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-300 dark:border-gray-700'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800'}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          disabled={disabled}
          className="hidden"
        />
        
        <Upload className={`w-10 h-10 mx-auto mb-4 ${isDragging ? 'text-primary-500' : 'text-gray-400'}`} />
        
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {isDragging ? 'Solte os arquivos aqui' : 'Arraste arquivos ou clique para selecionar'}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Máximo {maxSize}MB por arquivo • Até {maxFiles} arquivos
        </p>
      </div>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-2"
          >
            {files.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                {/* Icon */}
                <div className="p-2 bg-white dark:bg-gray-700 rounded-lg mr-3">
                  {getFileIcon(file.file.type)}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {file.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.file.size)}
                  </p>
                  
                  {/* Progress Bar */}
                  {file.status === 'uploading' && (
                    <div className="mt-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${file.progress}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Status */}
                <div className="ml-3">
                  {file.status === 'uploading' && (
                    <span className="text-xs text-gray-500">{file.progress}%</span>
                  )}
                  {file.status === 'success' && (
                    <Check className="w-5 h-5 text-green-500" />
                  )}
                  {file.status === 'error' && (
                    <div className="flex items-center text-red-500">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                  )}
                </div>

                {/* Remove Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(file.id);
                  }}
                  className="ml-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Image Preview Upload
interface ImageUploadProps {
  value?: string;
  onChange?: (url: string | null) => void;
  onUpload?: (file: File) => Promise<string>;
  maxSize?: number;
  aspectRatio?: string;
  className?: string;
}

export function ImageUpload({
  value,
  onChange,
  onUpload,
  maxSize = 5,
  aspectRatio = '1/1',
  className = '',
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`Imagem muito grande. Máximo: ${maxSize}MB`);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    if (onUpload) {
      setIsUploading(true);
      try {
        const url = await onUpload(file);
        onChange?.(url);
      } catch (error) {
        toast.error('Falha no upload da imagem');
        setPreview(value || null);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const removeImage = () => {
    setPreview(null);
    onChange?.(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className={`relative ${className}`} style={{ aspectRatio }}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {preview ? (
        <div className="relative w-full h-full rounded-lg overflow-hidden group">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => inputRef.current?.click()}
            >
              Alterar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={removeImage}
            >
              Remover
            </Button>
          </div>
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full h-full border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex flex-col items-center justify-center hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <Image className="w-8 h-8 text-gray-400 mb-2" />
          <span className="text-sm text-gray-500">Adicionar imagem</span>
        </button>
      )}
    </div>
  );
}
