"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                    DAIA - Template Store (SQLite)                            ║
║                                                                              ║
║              Armazenamento persistente de templates aprovados                ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

import os
import json
import aiosqlite
import numpy as np
from datetime import datetime
from typing import Optional, List, Dict, Any
from pathlib import Path


class TemplateStore:
    """
    Gerencia o armazenamento de templates em SQLite.
    
    Otimizado para:
    - Operações assíncronas (não bloqueia o servidor)
    - Baixo consumo de memória
    - Queries eficientes com índices
    """
    
    def __init__(self, db_path: str = "./database/templates.db"):
        self.db_path = db_path
        self.db: Optional[aiosqlite.Connection] = None
        
    async def initialize(self) -> None:
        """Inicializa o banco de dados e cria tabelas se necessário."""
        # Garante que o diretório existe
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
        
        self.db = await aiosqlite.connect(self.db_path)
        self.db.row_factory = aiosqlite.Row
        
        # Habilita WAL mode para melhor performance
        await self.db.execute("PRAGMA journal_mode=WAL")
        await self.db.execute("PRAGMA synchronous=NORMAL")
        await self.db.execute("PRAGMA cache_size=-64000")  # 64MB cache
        
        # Cria tabela de templates
        await self.db.execute("""
            CREATE TABLE IF NOT EXISTS templates (
                id TEXT PRIMARY KEY,
                prompt TEXT NOT NULL,
                code TEXT NOT NULL,
                embedding BLOB,
                category TEXT DEFAULT 'general',
                score INTEGER DEFAULT 0,
                metadata TEXT DEFAULT '{}',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)
        
        # Índices para queries frequentes
        await self.db.execute("""
            CREATE INDEX IF NOT EXISTS idx_templates_category 
            ON templates(category)
        """)
        await self.db.execute("""
            CREATE INDEX IF NOT EXISTS idx_templates_score 
            ON templates(score DESC)
        """)
        await self.db.execute("""
            CREATE INDEX IF NOT EXISTS idx_templates_created_at 
            ON templates(created_at DESC)
        """)
        
        await self.db.commit()
        print(f"✅ TemplateStore inicializado: {self.db_path}")
        
    async def close(self) -> None:
        """Fecha a conexão com o banco."""
        if self.db:
            await self.db.close()
            self.db = None
            
    async def save(
        self,
        template_id: str,
        prompt: str,
        code: str,
        embedding: np.ndarray,
        category: str = "general",
        score: Optional[int] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Salva um novo template no banco.
        
        Args:
            template_id: ID único do template
            prompt: Prompt original do usuário
            code: Código HTML/JS/CSS aprovado
            embedding: Vetor de embedding (numpy array)
            category: Categoria do template
            score: Score de qualidade (0-100)
            metadata: Metadados adicionais
            
        Returns:
            Dict com os dados do template salvo
        """
        now = datetime.utcnow().isoformat()
        
        # Converte embedding para bytes
        embedding_bytes = embedding.tobytes() if embedding is not None else None
        
        # Serializa metadata
        metadata_json = json.dumps(metadata or {})
        
        await self.db.execute("""
            INSERT INTO templates (id, prompt, code, embedding, category, score, metadata, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                prompt = excluded.prompt,
                code = excluded.code,
                embedding = excluded.embedding,
                category = excluded.category,
                score = excluded.score,
                metadata = excluded.metadata,
                updated_at = excluded.updated_at
        """, (template_id, prompt, code, embedding_bytes, category, score or 0, metadata_json, now, now))
        
        await self.db.commit()
        
        return {
            "id": template_id,
            "prompt": prompt,
            "code": code,
            "category": category,
            "score": score,
            "metadata": metadata or {},
            "created_at": now,
            "updated_at": now
        }
        
    async def get_by_id(self, template_id: str) -> Optional[Dict[str, Any]]:
        """Busca um template pelo ID."""
        async with self.db.execute(
            "SELECT * FROM templates WHERE id = ?",
            (template_id,)
        ) as cursor:
            row = await cursor.fetchone()
            
        if not row:
            return None
            
        return self._row_to_dict(row)
        
    async def list_all(
        self,
        limit: int = 50,
        offset: int = 0,
        category: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Lista templates com paginação."""
        query = "SELECT * FROM templates"
        params = []
        
        if category:
            query += " WHERE category = ?"
            params.append(category)
            
        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        async with self.db.execute(query, params) as cursor:
            rows = await cursor.fetchall()
            
        return [self._row_to_dict(row, include_embedding=False) for row in rows]
        
    async def delete(self, template_id: str) -> bool:
        """Remove um template."""
        cursor = await self.db.execute(
            "DELETE FROM templates WHERE id = ?",
            (template_id,)
        )
        await self.db.commit()
        return cursor.rowcount > 0
        
    async def get_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas do banco."""
        # Total de templates
        async with self.db.execute("SELECT COUNT(*) FROM templates") as cursor:
            total = (await cursor.fetchone())[0]
            
        # Templates por categoria
        async with self.db.execute(
            "SELECT category, COUNT(*) as count FROM templates GROUP BY category"
        ) as cursor:
            categories = {row[0]: row[1] for row in await cursor.fetchall()}
            
        # Score médio
        async with self.db.execute(
            "SELECT AVG(score) FROM templates WHERE score > 0"
        ) as cursor:
            avg_score = (await cursor.fetchone())[0] or 0
            
        # Último template
        async with self.db.execute(
            "SELECT created_at FROM templates ORDER BY created_at DESC LIMIT 1"
        ) as cursor:
            row = await cursor.fetchone()
            last_learned = row[0] if row else None
            
        # Tamanho do banco
        storage_size_mb = os.path.getsize(self.db_path) / (1024 * 1024) if os.path.exists(self.db_path) else 0
        
        return {
            "total_templates": total,
            "categories": categories,
            "avg_score": round(avg_score, 2),
            "storage_size_mb": round(storage_size_mb, 2),
            "last_learned": last_learned
        }
        
    async def get_categories(self) -> List[Dict[str, Any]]:
        """Lista todas as categorias com contagem."""
        async with self.db.execute(
            "SELECT category, COUNT(*) as count FROM templates GROUP BY category ORDER BY count DESC"
        ) as cursor:
            rows = await cursor.fetchall()
            
        return [{"name": row[0], "count": row[1]} for row in rows]
        
    async def get_all_embeddings(self) -> List[Dict[str, Any]]:
        """Retorna todos os IDs e embeddings para construir índice FAISS."""
        async with self.db.execute(
            "SELECT id, embedding FROM templates WHERE embedding IS NOT NULL"
        ) as cursor:
            rows = await cursor.fetchall()
            
        results = []
        for row in rows:
            if row[1]:
                embedding = np.frombuffer(row[1], dtype=np.float32)
                results.append({
                    "id": row[0],
                    "embedding": embedding
                })
                
        return results
        
    async def get_by_ids(self, ids: List[str]) -> List[Dict[str, Any]]:
        """Busca múltiplos templates por IDs."""
        if not ids:
            return []
            
        placeholders = ",".join(["?" for _ in ids])
        async with self.db.execute(
            f"SELECT * FROM templates WHERE id IN ({placeholders})",
            ids
        ) as cursor:
            rows = await cursor.fetchall()
            
        return [self._row_to_dict(row, include_embedding=False) for row in rows]
        
    async def export_for_training(
        self,
        category: Optional[str] = None,
        min_score: int = 0
    ) -> List[Dict[str, str]]:
        """
        Exporta templates em formato JSONL para fine-tuning.
        
        Formato:
        {"prompt": "...", "completion": "..."}
        """
        query = "SELECT prompt, code FROM templates WHERE score >= ?"
        params = [min_score]
        
        if category:
            query += " AND category = ?"
            params.append(category)
            
        async with self.db.execute(query, params) as cursor:
            rows = await cursor.fetchall()
            
        return [
            {
                "prompt": row[0],
                "completion": row[1]
            }
            for row in rows
        ]
        
    def _row_to_dict(
        self,
        row: aiosqlite.Row,
        include_embedding: bool = False
    ) -> Dict[str, Any]:
        """Converte uma row do SQLite para dicionário."""
        result = {
            "id": row["id"],
            "prompt": row["prompt"],
            "code": row["code"],
            "category": row["category"],
            "score": row["score"],
            "metadata": json.loads(row["metadata"]) if row["metadata"] else {},
            "created_at": row["created_at"],
            "updated_at": row["updated_at"]
        }
        
        if include_embedding and row["embedding"]:
            result["embedding"] = np.frombuffer(row["embedding"], dtype=np.float32)
            
        return result
