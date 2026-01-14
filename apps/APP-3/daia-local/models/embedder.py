"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                    DAIA - Code Embedder                                      ║
║                                                                              ║
║              Gerador de embeddings vetoriais para código                     ║
╚══════════════════════════════════════════════════════════════════════════════╝

Usa sentence-transformers para gerar embeddings de código.
Modelo padrão: all-MiniLM-L6-v2 (80MB, rápido, 384 dimensões)

Otimizado para i3 7ª geração:
- Modelo pequeno e eficiente
- Batch processing para múltiplos códigos
- Cache de embeddings
"""

import os
import re
import hashlib
import numpy as np
from typing import Optional, List, Dict, Any
from functools import lru_cache


class CodeEmbedder:
    """
    Gera embeddings vetoriais para código e prompts.
    
    Características:
    - Modelo leve (80MB) otimizado para CPU
    - 384 dimensões por embedding
    - Normalização L2 para similaridade cosseno
    - Pré-processamento de código
    """
    
    def __init__(
        self,
        model_name: str = "all-MiniLM-L6-v2",
        cache_dir: str = "./models/cache"
    ):
        self.model_name = model_name
        self.cache_dir = cache_dir
        self.model = None
        self.dimension = 384  # Dimensão do all-MiniLM-L6-v2
        
        # Garante que o diretório de cache existe
        os.makedirs(cache_dir, exist_ok=True)
        
        # Carrega o modelo
        self._load_model()
        
    def _load_model(self) -> None:
        """Carrega o modelo de embeddings."""
        try:
            from sentence_transformers import SentenceTransformer
            
            print(f"📦 Carregando modelo de embeddings: {self.model_name}")
            
            # Configura para usar CPU e cache local
            self.model = SentenceTransformer(
                self.model_name,
                cache_folder=self.cache_dir,
                device="cpu"
            )
            
            # Atualiza dimensão baseado no modelo carregado
            self.dimension = self.model.get_sentence_embedding_dimension()
            
            print(f"✅ Modelo carregado! Dimensão: {self.dimension}")
            
        except ImportError:
            print("⚠️ sentence-transformers não instalado. Usando embeddings aleatórios.")
            self.model = None
            
    def encode(
        self,
        code: str,
        prompt: Optional[str] = None,
        normalize: bool = True
    ) -> np.ndarray:
        """
        Gera embedding para código e prompt.
        
        Args:
            code: Código HTML/JS/CSS
            prompt: Prompt original (opcional)
            normalize: Se True, normaliza o vetor (L2)
            
        Returns:
            numpy array com embedding de 384 dimensões
        """
        # Pré-processa o código
        processed_code = self._preprocess_code(code)
        
        # Combina prompt e código
        if prompt:
            text = f"[PROMPT] {prompt}\n[CODE] {processed_code}"
        else:
            text = processed_code
            
        # Gera embedding
        if self.model is not None:
            embedding = self.model.encode(
                text,
                convert_to_numpy=True,
                normalize_embeddings=normalize,
                show_progress_bar=False
            )
        else:
            # Fallback: embedding baseado em hash (para testes)
            embedding = self._hash_embedding(text)
            if normalize:
                embedding = embedding / np.linalg.norm(embedding)
                
        return embedding.astype(np.float32)
        
    def encode_batch(
        self,
        texts: List[str],
        normalize: bool = True,
        batch_size: int = 32
    ) -> np.ndarray:
        """
        Gera embeddings para múltiplos textos.
        
        Args:
            texts: Lista de textos
            normalize: Se True, normaliza os vetores
            batch_size: Tamanho do batch (menor = menos RAM)
            
        Returns:
            numpy array (N x 384)
        """
        if self.model is not None:
            embeddings = self.model.encode(
                texts,
                convert_to_numpy=True,
                normalize_embeddings=normalize,
                batch_size=batch_size,
                show_progress_bar=len(texts) > 100
            )
        else:
            embeddings = np.array([self._hash_embedding(t) for t in texts])
            if normalize:
                norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
                embeddings = embeddings / norms
                
        return embeddings.astype(np.float32)
        
    def encode_query(self, query: str, normalize: bool = True) -> np.ndarray:
        """
        Gera embedding para uma query de busca.
        
        Otimizado para prompts curtos.
        """
        if self.model is not None:
            embedding = self.model.encode(
                query,
                convert_to_numpy=True,
                normalize_embeddings=normalize,
                show_progress_bar=False
            )
        else:
            embedding = self._hash_embedding(query)
            if normalize:
                embedding = embedding / np.linalg.norm(embedding)
                
        return embedding.astype(np.float32)
        
    def _preprocess_code(self, code: str) -> str:
        """
        Pré-processa código para melhor embedding.
        
        - Remove comentários excessivos
        - Normaliza espaços
        - Extrai estrutura semântica
        """
        # Remove comentários HTML
        code = re.sub(r'<!--.*?-->', '', code, flags=re.DOTALL)
        
        # Remove comentários JS de linha
        code = re.sub(r'//.*$', '', code, flags=re.MULTILINE)
        
        # Remove comentários JS de bloco
        code = re.sub(r'/\*.*?\*/', '', code, flags=re.DOTALL)
        
        # Normaliza espaços em branco
        code = re.sub(r'\s+', ' ', code)
        
        # Extrai tags HTML importantes
        tags = re.findall(r'<(\w+)[^>]*>', code)
        tag_summary = ' '.join(list(set(tags))[:50])  # Limita a 50 tags únicas
        
        # Extrai classes CSS
        classes = re.findall(r'class=["\']([^"\']+)["\']', code)
        all_classes = list(set(' '.join(classes).split()))
        class_summary = ' '.join(all_classes[:30])
        
        # Extrai IDs
        ids = re.findall(r'id=["\']([^"\']+)["\']', code)
        id_summary = ' '.join(list(set(ids))[:20])
        
        # Combina informações estruturais
        structural_info = f"[TAGS] {tag_summary} [CLASSES] {class_summary} [IDS] {id_summary}"
        
        # Limita tamanho do código (para não estourar memória)
        max_code_length = 5000
        if len(code) > max_code_length:
            code = code[:max_code_length] + "..."
            
        return f"{structural_info}\n{code}"
        
    def _hash_embedding(self, text: str) -> np.ndarray:
        """
        Gera embedding baseado em hash (fallback).
        
        Não é semanticamente significativo, mas permite
        o sistema funcionar sem o modelo de embeddings.
        """
        # Usa SHA256 para gerar bytes determinísticos
        hash_bytes = hashlib.sha256(text.encode()).digest()
        
        # Expande para 384 dimensões usando múltiplos hashes
        embeddings = []
        for i in range(12):  # 12 * 32 = 384
            h = hashlib.sha256(f"{text}_{i}".encode()).digest()
            embeddings.extend([b / 255.0 for b in h])
            
        return np.array(embeddings[:self.dimension], dtype=np.float32)
        
    def similarity(self, embedding1: np.ndarray, embedding2: np.ndarray) -> float:
        """
        Calcula similaridade cosseno entre dois embeddings.
        
        Assume que os embeddings já estão normalizados.
        """
        return float(np.dot(embedding1, embedding2))
        
    def get_dimension(self) -> int:
        """Retorna a dimensão dos embeddings."""
        return self.dimension
