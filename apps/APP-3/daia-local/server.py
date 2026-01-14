"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║                    🧠 DAIA - Database AI Apprentice 🧠                       ║
║                                                                              ║
║              "O Modelo Local que Aprende com Seus Códigos"                  ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

Servidor FastAPI que:
1. Recebe códigos aprovados do AI Web Weaver
2. Gera embeddings vetoriais
3. Armazena em banco SQLite
4. Busca templates similares
5. (Opcional) Fine-tuna modelo local

Otimizado para rodar em i3 7ª geração com 8GB RAM.
"""

import os
import json
import hashlib
from datetime import datetime
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager

# Carrega variáveis de ambiente do .env
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn

from database.template_store import TemplateStore
from models.embedder import CodeEmbedder
from services.similarity import SimilaritySearch

# Brain endpoints (Gemini + Tool Calling)
try:
    from services.brain_endpoints import router as brain_router
    BRAIN_AVAILABLE = True
except ImportError as e:
    print(f"⚠️ Brain endpoints não disponíveis: {e}")
    BRAIN_AVAILABLE = False

# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURAÇÃO
# ═══════════════════════════════════════════════════════════════════════════════

class Config:
    HOST = os.getenv("DAIA_HOST", "0.0.0.0")
    PORT = int(os.getenv("DAIA_PORT", "8765"))
    DATABASE_PATH = os.getenv("DAIA_DB_PATH", "./database/templates.db")
    EMBEDDING_MODEL = os.getenv("DAIA_EMBEDDING_MODEL", "all-MiniLM-L6-v2")
    MAX_TEMPLATES = int(os.getenv("DAIA_MAX_TEMPLATES", "10000"))
    SIMILARITY_THRESHOLD = float(os.getenv("DAIA_SIMILARITY_THRESHOLD", "0.7"))

# ═══════════════════════════════════════════════════════════════════════════════
# MODELOS PYDANTIC
# ═══════════════════════════════════════════════════════════════════════════════

class LearnRequest(BaseModel):
    """Requisição para aprender um novo código"""
    code: str = Field(..., description="Código HTML/JS/CSS aprovado")
    prompt: str = Field(..., description="Prompt original do usuário")
    category: Optional[str] = Field(None, description="Categoria do template")
    score: Optional[int] = Field(None, ge=0, le=100, description="Score de qualidade")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)

class SearchRequest(BaseModel):
    """Requisição para buscar templates similares"""
    prompt: str = Field(..., description="Prompt para buscar similares")
    limit: int = Field(5, ge=1, le=20, description="Número máximo de resultados")
    category: Optional[str] = Field(None, description="Filtrar por categoria")
    min_score: Optional[int] = Field(None, ge=0, le=100)

class TemplateResponse(BaseModel):
    """Resposta com template"""
    id: str
    prompt: str
    code: str
    category: Optional[str]
    score: Optional[int]
    similarity: float
    created_at: str

class StatsResponse(BaseModel):
    """Estatísticas do banco"""
    total_templates: int
    categories: Dict[str, int]
    avg_score: float
    storage_size_mb: float
    last_learned: Optional[str]

class FineTuneRequest(BaseModel):
    """Requisição para fine-tuning"""
    model_name: str = Field("Qwen/Qwen2-0.5B", description="Modelo base")
    epochs: int = Field(3, ge=1, le=10)
    batch_size: int = Field(4, ge=1, le=16)
    learning_rate: float = Field(2e-5, ge=1e-6, le=1e-3)

# ═══════════════════════════════════════════════════════════════════════════════
# INICIALIZAÇÃO
# ═══════════════════════════════════════════════════════════════════════════════

# Instâncias globais
template_store: Optional[TemplateStore] = None
embedder: Optional[CodeEmbedder] = None
similarity_search: Optional[SimilaritySearch] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerencia ciclo de vida da aplicação"""
    global template_store, embedder, similarity_search
    
    print("🧠 DAIA - Iniciando...")
    
    # Criar diretórios
    os.makedirs("./database", exist_ok=True)
    os.makedirs("./models/cache", exist_ok=True)
    
    # Inicializar componentes
    print("📦 Carregando banco de templates...")
    template_store = TemplateStore(Config.DATABASE_PATH)
    await template_store.initialize()
    
    print(f"🔢 Carregando modelo de embeddings ({Config.EMBEDDING_MODEL})...")
    embedder = CodeEmbedder(Config.EMBEDDING_MODEL)
    
    print("🔍 Inicializando busca por similaridade...")
    similarity_search = SimilaritySearch(embedder, template_store)
    await similarity_search.build_index()
    
    stats = await template_store.get_stats()
    print(f"✅ DAIA pronto! {stats['total_templates']} templates carregados.")
    print(f"🌐 Servidor rodando em http://{Config.HOST}:{Config.PORT}")
    
    yield
    
    # Cleanup
    print("🛑 DAIA - Encerrando...")
    await template_store.close()

# ═══════════════════════════════════════════════════════════════════════════════
# APLICAÇÃO FASTAPI
# ═══════════════════════════════════════════════════════════════════════════════

app = FastAPI(
    title="DAIA - Database AI Apprentice",
    description="Modelo local que aprende com seus códigos aprovados",
    version="1.0.0",
    lifespan=lifespan
)

# CORS para integração com AI Web Weaver
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, restringir
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir router do Brain (Gemini + Tool Calling)
if BRAIN_AVAILABLE:
    app.include_router(brain_router)
    print("🧠 Brain endpoints habilitados (/brain/*)")

# ═══════════════════════════════════════════════════════════════════════════════
# ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/")
async def root():
    """Health check"""
    return {
        "service": "DAIA - Database AI Apprentice",
        "status": "online",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/health")
async def health():
    """Health check detalhado"""
    stats = await template_store.get_stats() if template_store else {}
    return {
        "status": "healthy",
        "components": {
            "database": "ok" if template_store else "error",
            "embedder": "ok" if embedder else "error",
            "similarity": "ok" if similarity_search else "error"
        },
        "stats": stats
    }

@app.post("/learn")
async def learn_template(request: LearnRequest, background_tasks: BackgroundTasks):
    """
    Aprende um novo código aprovado.
    
    Chamado quando o usuário dá like em um código no AI Web Weaver.
    """
    if not template_store or not embedder:
        raise HTTPException(status_code=503, detail="Serviço não inicializado")
    
    # Gerar ID único baseado no código
    code_hash = hashlib.sha256(request.code.encode()).hexdigest()[:16]
    template_id = f"tpl_{code_hash}"
    
    # Verificar se já existe
    existing = await template_store.get_by_id(template_id)
    if existing:
        return {
            "success": True,
            "message": "Template já existe",
            "template_id": template_id,
            "is_duplicate": True
        }
    
    # Gerar embedding
    embedding = embedder.encode(request.code, request.prompt)
    
    # Detectar categoria automaticamente se não fornecida
    category = request.category or detect_category(request.code, request.prompt)
    
    # Salvar template
    template = await template_store.save(
        template_id=template_id,
        prompt=request.prompt,
        code=request.code,
        embedding=embedding,
        category=category,
        score=request.score,
        metadata=request.metadata
    )
    
    # Atualizar índice em background
    background_tasks.add_task(similarity_search.add_to_index, template_id, embedding)
    
    return {
        "success": True,
        "message": "Template aprendido com sucesso!",
        "template_id": template_id,
        "category": category,
        "is_duplicate": False
    }

@app.post("/search", response_model=List[TemplateResponse])
async def search_templates(request: SearchRequest):
    """
    Busca templates similares ao prompt.
    
    Usado para encontrar exemplos relevantes antes de gerar novo código.
    """
    if not similarity_search:
        raise HTTPException(status_code=503, detail="Serviço não inicializado")
    
    results = await similarity_search.search(
        query=request.prompt,
        limit=request.limit,
        category=request.category,
        min_score=request.min_score
    )
    
    return [
        TemplateResponse(
            id=r["id"],
            prompt=r["prompt"],
            code=r["code"],
            category=r.get("category"),
            score=r.get("score"),
            similarity=r["similarity"],
            created_at=r["created_at"]
        )
        for r in results
    ]

@app.get("/templates")
async def list_templates(
    limit: int = 50,
    offset: int = 0,
    category: Optional[str] = None
):
    """Lista todos os templates salvos"""
    if not template_store:
        raise HTTPException(status_code=503, detail="Serviço não inicializado")
    
    templates = await template_store.list_all(
        limit=limit,
        offset=offset,
        category=category
    )
    
    return {
        "templates": templates,
        "total": len(templates),
        "limit": limit,
        "offset": offset
    }

@app.get("/templates/{template_id}")
async def get_template(template_id: str):
    """Obtém um template específico"""
    if not template_store:
        raise HTTPException(status_code=503, detail="Serviço não inicializado")
    
    template = await template_store.get_by_id(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template não encontrado")
    
    return template

@app.delete("/templates/{template_id}")
async def delete_template(template_id: str, background_tasks: BackgroundTasks):
    """Remove um template"""
    if not template_store:
        raise HTTPException(status_code=503, detail="Serviço não inicializado")
    
    success = await template_store.delete(template_id)
    if not success:
        raise HTTPException(status_code=404, detail="Template não encontrado")
    
    # Atualizar índice em background
    background_tasks.add_task(similarity_search.remove_from_index, template_id)
    
    return {"success": True, "message": "Template removido"}

@app.get("/stats", response_model=StatsResponse)
async def get_stats():
    """Estatísticas do banco de dados"""
    if not template_store:
        raise HTTPException(status_code=503, detail="Serviço não inicializado")
    
    stats = await template_store.get_stats()
    return StatsResponse(**stats)

@app.get("/categories")
async def list_categories():
    """Lista todas as categorias"""
    if not template_store:
        raise HTTPException(status_code=503, detail="Serviço não inicializado")
    
    categories = await template_store.get_categories()
    return {"categories": categories}

@app.post("/export")
async def export_templates(category: Optional[str] = None):
    """Exporta templates para fine-tuning"""
    if not template_store:
        raise HTTPException(status_code=503, detail="Serviço não inicializado")
    
    templates = await template_store.export_for_training(category=category)
    
    return {
        "format": "jsonl",
        "count": len(templates),
        "data": templates
    }

# ═══════════════════════════════════════════════════════════════════════════════
# FINE-TUNING (OPCIONAL)
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/finetune")
async def start_finetune(request: FineTuneRequest, background_tasks: BackgroundTasks):
    """
    Inicia fine-tuning do modelo local.
    
    ⚠️ Requer mais RAM e tempo. Use com cuidado em i3.
    """
    if not template_store:
        raise HTTPException(status_code=503, detail="Serviço não inicializado")
    
    stats = await template_store.get_stats()
    if stats["total_templates"] < 50:
        raise HTTPException(
            status_code=400,
            detail=f"Mínimo de 50 templates necessário. Atual: {stats['total_templates']}"
        )
    
    # Verificar se módulos de fine-tuning estão disponíveis
    try:
        from services.finetuner import FineTuner
    except ImportError:
        raise HTTPException(
            status_code=501,
            detail="Módulos de fine-tuning não instalados. Execute: pip install torch transformers peft"
        )
    
    # Iniciar em background
    background_tasks.add_task(
        run_finetune,
        request.model_name,
        request.epochs,
        request.batch_size,
        request.learning_rate
    )
    
    return {
        "success": True,
        "message": "Fine-tuning iniciado em background",
        "config": request.dict()
    }

@app.get("/finetune/status")
async def finetune_status():
    """Status do fine-tuning"""
    status_file = "./models/finetune_status.json"
    if os.path.exists(status_file):
        with open(status_file, "r") as f:
            return json.load(f)
    return {"status": "idle", "message": "Nenhum fine-tuning em andamento"}

# ═══════════════════════════════════════════════════════════════════════════════
# FUNÇÕES AUXILIARES
# ═══════════════════════════════════════════════════════════════════════════════

def detect_category(code: str, prompt: str) -> str:
    """Detecta categoria automaticamente baseado no código e prompt"""
    prompt_lower = prompt.lower()
    code_lower = code.lower()
    
    categories = {
        "dashboard": ["dashboard", "painel", "admin", "analytics", "métricas"],
        "ecommerce": ["loja", "carrinho", "produto", "checkout", "e-commerce", "shop"],
        "landing": ["landing", "hero", "cta", "call to action", "página inicial"],
        "form": ["formulário", "form", "cadastro", "registro", "login"],
        "game": ["game", "jogo", "canvas", "sprite", "score"],
        "fintech": ["banco", "pagamento", "pix", "transferência", "saldo"],
        "chat": ["chat", "mensagem", "conversa", "whatsapp"],
        "portfolio": ["portfolio", "portfólio", "projetos", "sobre mim"],
        "blog": ["blog", "artigo", "post", "notícia"]
    }
    
    for category, keywords in categories.items():
        for keyword in keywords:
            if keyword in prompt_lower or keyword in code_lower:
                return category
    
    return "general"

async def run_finetune(model_name: str, epochs: int, batch_size: int, lr: float):
    """Executa fine-tuning em background"""
    from services.finetuner import FineTuner
    
    finetuner = FineTuner(
        model_name=model_name,
        output_dir="./models/finetuned"
    )
    
    # Exportar dados de treinamento
    templates = await template_store.export_for_training()
    
    # Executar fine-tuning
    await finetuner.train(
        data=templates,
        epochs=epochs,
        batch_size=batch_size,
        learning_rate=lr
    )

# ═══════════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print("""
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║                    🧠 DAIA - Database AI Apprentice 🧠                       ║
║                                                                              ║
║              "O Modelo Local que Aprende com Seus Códigos"                  ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
    """)
    
    uvicorn.run(
        "server:app",
        host=Config.HOST,
        port=Config.PORT,
        reload=True,
        log_level="info"
    )
