"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                    DAIA - Similarity Search (FAISS)                          ║
║                                                                              ║
║              Busca por similaridade usando índice vetorial                   ║
╚══════════════════════════════════════════════════════════════════════════════╝

Usa FAISS (Facebook AI Similarity Search) para busca eficiente.
Otimizado para CPU com índice Flat (exato) para datasets pequenos.

Para datasets maiores (>10k), considerar IVF ou HNSW.
"""

import os
import numpy as np
from typing import Optional, List, Dict, Any
from pathlib import Path


class SimilaritySearch:
    """
    Busca por similaridade usando FAISS.
    
    Características:
    - Índice Flat para busca exata (melhor para <10k vetores)
    - Persistência do índice em disco
    - Atualização incremental
    - Otimizado para CPU
    """
    
    def __init__(
        self,
        embedder,  # CodeEmbedder
        template_store,  # TemplateStore
        index_path: str = "./database/faiss.index"
    ):
        self.embedder = embedder
        self.template_store = template_store
        self.index_path = index_path
        self.index = None
        self.id_map: List[str] = []  # Mapeia índice FAISS -> template_id
        self.dimension = embedder.get_dimension()
        
        # Tenta carregar FAISS
        self._init_faiss()
        
    def _init_faiss(self) -> None:
        """Inicializa FAISS."""
        try:
            import faiss
            self.faiss = faiss
            print("✅ FAISS carregado com sucesso")
        except ImportError:
            print("⚠️ FAISS não instalado. Usando busca linear.")
            self.faiss = None
            
    async def build_index(self) -> None:
        """
        Constrói o índice FAISS a partir dos templates existentes.
        """
        print("🔨 Construindo índice de similaridade...")
        
        # Busca todos os embeddings do banco
        templates = await self.template_store.get_all_embeddings()
        
        if not templates:
            print("📭 Nenhum template encontrado. Índice vazio.")
            self._create_empty_index()
            return
            
        # Extrai embeddings e IDs
        embeddings = np.array([t["embedding"] for t in templates], dtype=np.float32)
        self.id_map = [t["id"] for t in templates]
        
        # Cria índice FAISS
        if self.faiss is not None:
            # Índice Flat L2 (busca exata por distância euclidiana)
            # Para similaridade cosseno com vetores normalizados, L2 é equivalente
            self.index = self.faiss.IndexFlatIP(self.dimension)  # Inner Product = cosseno para vetores normalizados
            self.index.add(embeddings)
        else:
            # Fallback: armazena embeddings para busca linear
            self.embeddings_matrix = embeddings
            
        print(f"✅ Índice construído com {len(self.id_map)} templates")
        
        # Salva índice em disco
        self._save_index()
        
    def _create_empty_index(self) -> None:
        """Cria um índice vazio."""
        if self.faiss is not None:
            self.index = self.faiss.IndexFlatIP(self.dimension)
        else:
            self.embeddings_matrix = np.array([], dtype=np.float32).reshape(0, self.dimension)
        self.id_map = []
        
    def _save_index(self) -> None:
        """Salva o índice FAISS em disco."""
        if self.faiss is not None and self.index is not None:
            Path(self.index_path).parent.mkdir(parents=True, exist_ok=True)
            self.faiss.write_index(self.index, self.index_path)
            
            # Salva mapeamento de IDs
            id_map_path = self.index_path + ".ids"
            with open(id_map_path, "w") as f:
                f.write("\n".join(self.id_map))
                
            print(f"💾 Índice salvo em {self.index_path}")
            
    def _load_index(self) -> bool:
        """Carrega o índice FAISS do disco."""
        if self.faiss is None:
            return False
            
        if not os.path.exists(self.index_path):
            return False
            
        try:
            self.index = self.faiss.read_index(self.index_path)
            
            # Carrega mapeamento de IDs
            id_map_path = self.index_path + ".ids"
            if os.path.exists(id_map_path):
                with open(id_map_path, "r") as f:
                    self.id_map = f.read().strip().split("\n")
                    
            print(f"📂 Índice carregado: {len(self.id_map)} templates")
            return True
            
        except Exception as e:
            print(f"⚠️ Erro ao carregar índice: {e}")
            return False
            
    async def add_to_index(self, template_id: str, embedding: np.ndarray) -> None:
        """
        Adiciona um novo embedding ao índice.
        
        Args:
            template_id: ID do template
            embedding: Vetor de embedding
        """
        embedding = embedding.astype(np.float32).reshape(1, -1)
        
        if self.faiss is not None and self.index is not None:
            self.index.add(embedding)
        else:
            if hasattr(self, 'embeddings_matrix') and self.embeddings_matrix.size > 0:
                self.embeddings_matrix = np.vstack([self.embeddings_matrix, embedding])
            else:
                self.embeddings_matrix = embedding
                
        self.id_map.append(template_id)
        
        # Salva índice atualizado
        self._save_index()
        
    async def remove_from_index(self, template_id: str) -> None:
        """
        Remove um embedding do índice.
        
        Nota: FAISS não suporta remoção eficiente.
        Para datasets pequenos, reconstruímos o índice.
        """
        if template_id in self.id_map:
            # Reconstrói o índice sem o template removido
            await self.build_index()
            
    async def search(
        self,
        query: str,
        limit: int = 5,
        category: Optional[str] = None,
        min_score: Optional[int] = None,
        threshold: float = 0.5
    ) -> List[Dict[str, Any]]:
        """
        Busca templates similares ao query.
        
        Args:
            query: Prompt de busca
            limit: Número máximo de resultados
            category: Filtrar por categoria
            min_score: Score mínimo
            threshold: Similaridade mínima (0-1)
            
        Returns:
            Lista de templates com similaridade
        """
        if not self.id_map:
            return []
            
        # Gera embedding do query
        query_embedding = self.embedder.encode_query(query)
        query_embedding = query_embedding.reshape(1, -1)
        
        # Busca no índice
        if self.faiss is not None and self.index is not None:
            # Busca mais resultados para filtrar depois
            k = min(limit * 3, len(self.id_map))
            distances, indices = self.index.search(query_embedding, k)
            
            # Converte para lista de (id, similaridade)
            candidates = []
            for i, idx in enumerate(indices[0]):
                if idx >= 0 and idx < len(self.id_map):
                    similarity = float(distances[0][i])
                    if similarity >= threshold:
                        candidates.append((self.id_map[idx], similarity))
        else:
            # Busca linear (fallback)
            candidates = self._linear_search(query_embedding, threshold)
            
        if not candidates:
            return []
            
        # Busca templates completos
        template_ids = [c[0] for c in candidates]
        templates = await self.template_store.get_by_ids(template_ids)
        
        # Cria mapa de similaridade
        similarity_map = {c[0]: c[1] for c in candidates}
        
        # Filtra e ordena resultados
        results = []
        for template in templates:
            # Aplica filtros
            if category and template.get("category") != category:
                continue
            if min_score and template.get("score", 0) < min_score:
                continue
                
            template["similarity"] = similarity_map.get(template["id"], 0)
            results.append(template)
            
        # Ordena por similaridade
        results.sort(key=lambda x: x["similarity"], reverse=True)
        
        return results[:limit]
        
    def _linear_search(
        self,
        query_embedding: np.ndarray,
        threshold: float
    ) -> List[tuple]:
        """
        Busca linear (fallback quando FAISS não está disponível).
        """
        if not hasattr(self, 'embeddings_matrix') or self.embeddings_matrix.size == 0:
            return []
            
        # Calcula similaridade cosseno
        similarities = np.dot(self.embeddings_matrix, query_embedding.T).flatten()
        
        # Filtra por threshold
        candidates = []
        for i, sim in enumerate(similarities):
            if sim >= threshold:
                candidates.append((self.id_map[i], float(sim)))
                
        # Ordena por similaridade
        candidates.sort(key=lambda x: x[1], reverse=True)
        
        return candidates
        
    def get_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas do índice."""
        return {
            "total_vectors": len(self.id_map),
            "dimension": self.dimension,
            "index_type": "FAISS FlatIP" if self.faiss else "Linear",
            "index_path": self.index_path,
            "index_exists": os.path.exists(self.index_path)
        }
